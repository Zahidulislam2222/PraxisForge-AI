"""Authenticated business control plane. Agents never authorize their own writes."""

import hmac
import secrets
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from uuid import UUID, uuid4

from fastapi import Depends, FastAPI, HTTPException, Request, Response
from psycopg.types.json import Jsonb
from starlette.middleware.trustedhost import TrustedHostMiddleware

from .contracts import Decision, DocumentInput, Login, TaskInput, WorkspaceInput
from .db import database, migrate
from .model_protocol import available
from .security import digest, password_hash, payload_hash, verify_password
from .settings import get_bootstrap_settings, get_settings

DUMMY_PASSWORD_HASH = password_hash(secrets.token_urlsafe(32))


def event(connection, task_id, kind, detail):
    connection.execute("INSERT INTO events(task_id,kind,detail) VALUES(%s,%s,%s)", (task_id, kind, Jsonb(detail)))


@asynccontextmanager
async def lifespan(_app):
    migrate()
    bootstrap = get_bootstrap_settings()
    with database() as connection:
        existing = connection.execute("SELECT id,password_hash FROM users WHERE email=%s", (bootstrap.admin_email.lower(),)).fetchone()
        if not existing:
            user_id, workspace_id = uuid4(), uuid4()
            connection.execute(
                "INSERT INTO users VALUES(%s,%s,%s)",
                (user_id, bootstrap.admin_email.lower(), password_hash(bootstrap.admin_password.get_secret_value())),
            )
            connection.execute("INSERT INTO workspaces(id,name) VALUES(%s,%s)", (workspace_id, bootstrap.workspace_name))
            connection.execute("INSERT INTO members VALUES(%s,%s,%s)", (user_id, workspace_id, "owner"))
        elif not verify_password(bootstrap.admin_password.get_secret_value(), existing["password_hash"]):
            connection.execute(
                "UPDATE users SET password_hash=%s WHERE id=%s", (password_hash(bootstrap.admin_password.get_secret_value()), existing["id"])
            )
            connection.execute("DELETE FROM sessions WHERE user_id=%s", (existing["id"],))
    yield


def authenticated(request: Request):
    settings = get_settings()
    token = request.cookies.get(settings.cookie_name, "")
    if not token:
        raise HTTPException(401, "Sign in required")
    with database() as connection:
        session = connection.execute(
            "SELECT s.*,u.email FROM sessions s JOIN users u ON u.id=s.user_id WHERE token_hash=%s AND expires_at>now()", (digest(token),)
        ).fetchone()
    if not session:
        raise HTTPException(401, "Session expired")
    if request.method not in {"GET", "HEAD", "OPTIONS"}:
        csrf = request.headers.get("x-csrf-token", "")
        if request.headers.get("origin") != settings.origin or not hmac.compare_digest(digest(csrf), session["csrf_hash"]):
            raise HTTPException(403, "Request origin or CSRF token invalid")
    return session


def membership(connection, user, workspace_id):
    if not connection.execute("SELECT role FROM members WHERE user_id=%s AND workspace_id=%s", (user["user_id"], workspace_id)).fetchone():
        raise HTTPException(404, "Workspace unavailable")


def task_for(connection, user, workspace_id, task_id, lock=False):
    membership(connection, user, workspace_id)
    query = "SELECT * FROM tasks WHERE id=%s AND workspace_id=%s"
    if lock:
        query += " FOR UPDATE"
    task = connection.execute(query, (task_id, workspace_id)).fetchone()
    if not task:
        raise HTTPException(404, "Task unavailable")
    return task


app = FastAPI(title="PraxisForge control plane", lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)
settings = get_settings()
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_hosts)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    if request.method in {"POST", "PUT", "PATCH"}:
        length = request.headers.get("content-length")
        if not length or not length.isdecimal() or int(length) > settings.max_http_body_bytes:
            return Response(status_code=413)
        if not request.headers.get("content-type", "").startswith("application/json"):
            return Response(status_code=415)
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


@app.get(settings.api_prefix + "/health")
def health():
    with database() as connection:
        connection.execute("SELECT 1")
    return {"status": "ok"}


@app.post(settings.api_prefix + "/login")
def login(data: Login, request: Request, response: Response):
    if request.headers.get("origin") != settings.origin:
        raise HTTPException(403, "Request origin invalid")
    key = digest(data.email.lower() + "|" + (request.client.host if request.client else "unknown"))
    with database() as connection:
        connection.execute("SELECT pg_advisory_xact_lock(hashtext(%s))", (key,))
        attempts_row = connection.execute(
            "SELECT count(*) AS count FROM login_attempts WHERE key=%s AND happened_at>now()-make_interval(secs=>%s)",
            (key, settings.login_window_seconds),
        ).fetchone()
        if attempts_row is None:
            raise RuntimeError("Login counter unavailable")
        attempts = attempts_row["count"]
        if attempts >= settings.login_max_attempts:
            raise HTTPException(429, "Too many attempts; try later")
        connection.execute("INSERT INTO login_attempts(key) VALUES(%s)", (key,))
        user = connection.execute("SELECT * FROM users WHERE email=%s", (data.email.lower(),)).fetchone()
        dummy = DUMMY_PASSWORD_HASH if not user else user["password_hash"]
        valid = verify_password(data.password, dummy)
    if not user or not valid:
        raise HTTPException(401, "Email or password incorrect")
    token, csrf = secrets.token_urlsafe(32), secrets.token_urlsafe(32)
    with database() as connection:
        connection.execute("DELETE FROM sessions WHERE expires_at<=now()")
        connection.execute("DELETE FROM login_attempts WHERE happened_at<now()-make_interval(secs=>%s)", (settings.login_window_seconds,))
        connection.execute(
            "INSERT INTO sessions VALUES(%s,%s,%s,now()+make_interval(secs=>%s))", (digest(token), user["id"], digest(csrf), settings.session_seconds)
        )
    response.set_cookie(
        settings.cookie_name, token, max_age=settings.session_seconds, httponly=True, secure=settings.cookie_secure, samesite="strict", path="/"
    )
    response.set_cookie(
        settings.csrf_cookie_name, csrf, max_age=settings.session_seconds, httponly=True, secure=settings.cookie_secure, samesite="strict", path="/"
    )
    return {"email": user["email"], "csrf": csrf}


@app.get(settings.api_prefix + "/session")
def session(request: Request, user=Depends(authenticated)):
    with database() as connection:
        spaces = connection.execute(
            "SELECT w.id,w.name,m.role FROM workspaces w JOIN members m ON m.workspace_id=w.id WHERE m.user_id=%s ORDER BY w.created_at",
            (user["user_id"],),
        ).fetchall()
    return {"email": user["email"], "workspaces": spaces, "csrf": request.cookies.get(settings.csrf_cookie_name, "")}


@app.post(settings.api_prefix + "/logout")
def logout(response: Response, user=Depends(authenticated)):
    with database() as connection:
        connection.execute("DELETE FROM sessions WHERE token_hash=%s", (user["token_hash"],))
    response.delete_cookie(settings.cookie_name, path="/", secure=settings.cookie_secure, httponly=True, samesite="strict")
    response.delete_cookie(settings.csrf_cookie_name, path="/", secure=settings.cookie_secure, httponly=True, samesite="strict")
    return {"status": "signed_out"}


@app.post(settings.api_prefix + "/workspaces", status_code=201)
def create_workspace(data: WorkspaceInput, user=Depends(authenticated)):
    workspace_id = uuid4()
    with database() as connection:
        connection.execute("INSERT INTO workspaces(id,name) VALUES(%s,%s)", (workspace_id, data.name))
        connection.execute("INSERT INTO members VALUES(%s,%s,%s)", (user["user_id"], workspace_id, "owner"))
    return {"id": workspace_id, "name": data.name}


@app.get(settings.api_prefix + "/workspaces/{workspace_id}/documents")
def documents(workspace_id: UUID, user=Depends(authenticated)):
    with database() as connection:
        membership(connection, user, workspace_id)
        return connection.execute(
            "SELECT id,title,source,version,content_hash,created_at,content FROM documents WHERE workspace_id=%s AND active ORDER BY created_at DESC",
            (workspace_id,),
        ).fetchall()


@app.post(settings.api_prefix + "/workspaces/{workspace_id}/documents", status_code=201)
def add_document(workspace_id: UUID, data: DocumentInput, user=Depends(authenticated)):
    if len(data.content) > settings.max_document_chars:
        raise HTTPException(422, "Document exceeds configured limit")
    document_id = uuid4()
    with database() as connection:
        membership(connection, user, workspace_id)
        # Serialize versioning and dedup within this workspace/title.
        connection.execute("SELECT pg_advisory_xact_lock(hashtext(%s))", (str(workspace_id) + data.title,))
        existing = connection.execute(
            "SELECT id,version,content_hash FROM documents WHERE workspace_id=%s AND title=%s AND active ORDER BY version DESC LIMIT 1",
            (workspace_id, data.title),
        ).fetchone()
        if existing and existing["content_hash"] == digest(data.content):
            return {"id": existing["id"], "version": existing["version"], "duplicate": True}
        latest = connection.execute(
            "SELECT COALESCE(max(version),0) AS version FROM documents WHERE workspace_id=%s AND title=%s", (workspace_id, data.title)
        ).fetchone()
        if latest is None:
            raise RuntimeError("Document version unavailable")
        version = latest["version"] + 1
        connection.execute("UPDATE documents SET active=false WHERE workspace_id=%s AND title=%s", (workspace_id, data.title))
        connection.execute(
            "INSERT INTO documents(id,workspace_id,title,content,source,version,content_hash) VALUES(%s,%s,%s,%s,%s,%s,%s)",
            (document_id, workspace_id, data.title, data.content, data.source, version, digest(data.content)),
        )
    return {"id": document_id, "version": version}


@app.delete(settings.api_prefix + "/workspaces/{workspace_id}/documents/{document_id}")
def delete_document(workspace_id: UUID, document_id: UUID, user=Depends(authenticated)):
    with database() as connection:
        membership(connection, user, workspace_id)
        if not connection.execute(
            "UPDATE documents SET active=false,content='' WHERE id=%s AND workspace_id=%s RETURNING id", (document_id, workspace_id)
        ).fetchone():
            raise HTTPException(404, "Document unavailable")
    return {"status": "deleted_from_retrieval"}


@app.post(settings.api_prefix + "/workspaces/{workspace_id}/tasks", status_code=202)
def create_task(workspace_id: UUID, data: TaskInput, request: Request, user=Depends(authenticated)):
    key = request.headers.get("idempotency-key", "")
    if not 8 <= len(key) <= 120 or len(data.request) > settings.max_request_chars:
        raise HTTPException(422, "Valid idempotency key and bounded request required")
    payload = data.model_dump(mode="json")
    fingerprint = payload_hash(payload)
    task_id = uuid4()
    with database() as connection:
        membership(connection, user, workspace_id)
        connection.execute("SELECT pg_advisory_xact_lock(hashtext(%s))", (str(workspace_id),))
        existing = connection.execute("SELECT id,input_hash FROM tasks WHERE workspace_id=%s AND idempotency_key=%s", (workspace_id, key)).fetchone()
        if existing:
            if existing["input_hash"] != fingerprint:
                raise HTTPException(409, "Idempotency key used for different input")
            return {"id": existing["id"], "replayed": True}
        selected = connection.execute(
            "SELECT id FROM documents WHERE workspace_id=%s AND id=ANY(%s) AND active", (workspace_id, data.document_ids)
        ).fetchall()
        if {r["id"] for r in selected} != set(data.document_ids):
            raise HTTPException(404, "Selected evidence unavailable")
        queued_row = connection.execute(
            "SELECT count(*) AS count FROM tasks WHERE workspace_id=%s AND status IN ('queued','running')", (workspace_id,)
        ).fetchone()
        if queued_row is None:
            raise RuntimeError("Queue counter unavailable")
        queued = queued_row["count"]
        if queued >= settings.queue_limit:
            raise HTTPException(429, "Workspace queue is full")
        connection.execute(
            "INSERT INTO tasks(id,workspace_id,owner_id,idempotency_key,input_hash,request,status) VALUES(%s,%s,%s,%s,%s,%s,'queued')",
            (task_id, workspace_id, user["user_id"], key, fingerprint, Jsonb(payload)),
        )
        event(connection, task_id, "task.queued", {"input_hash": fingerprint})
    return {"id": task_id, "status": "queued"}


@app.get(settings.api_prefix + "/workspaces/{workspace_id}/tasks")
def tasks(workspace_id: UUID, user=Depends(authenticated)):
    with database() as connection:
        membership(connection, user, workspace_id)
        return connection.execute(
            "SELECT id,status,stage,attempt,request,error,created_at,updated_at FROM tasks WHERE workspace_id=%s ORDER BY created_at DESC LIMIT %s",
            (workspace_id, settings.history_limit),
        ).fetchall()


@app.get(settings.api_prefix + "/workspaces/{workspace_id}/tasks/{task_id}")
def task_detail(workspace_id: UUID, task_id: UUID, user=Depends(authenticated)):
    with database() as connection:
        task = task_for(connection, user, workspace_id, task_id)
        task.pop("lease_token", None)
        task["events"] = connection.execute("SELECT kind,detail,created_at FROM events WHERE task_id=%s ORDER BY id", (task_id,)).fetchall()
        task["approval"] = connection.execute(
            "SELECT payload,payload_hash,expires_at,decision FROM approvals WHERE task_id=%s AND workspace_id=%s", (task_id, workspace_id)
        ).fetchone()
        task["receipt"] = connection.execute("SELECT * FROM receipts WHERE task_id=%s AND workspace_id=%s", (task_id, workspace_id)).fetchone()
        return task


@app.post(settings.api_prefix + "/workspaces/{workspace_id}/tasks/{task_id}/cancel")
def cancel(workspace_id: UUID, task_id: UUID, user=Depends(authenticated)):
    with database() as connection:
        task = task_for(connection, user, workspace_id, task_id, lock=True)
        if task["owner_id"] != user["user_id"]:
            raise HTTPException(403, "Only the task owner may cancel this workflow")
        if task["status"] not in {"queued", "running", "approval"}:
            raise HTTPException(409, "Task already settled")
        connection.execute("UPDATE tasks SET status='cancelled',stage='cancelled',lease_token=NULL,lease_until=NULL,updated_at=now() WHERE id=%s", (task_id,))
        event(connection, task_id, "task.cancelled", {})
    return {"status": "cancelled"}


@app.post(settings.api_prefix + "/workspaces/{workspace_id}/tasks/{task_id}/decision")
def decide(workspace_id: UUID, task_id: UUID, data: Decision, user=Depends(authenticated)):
    with database() as connection:
        task = task_for(connection, user, workspace_id, task_id, lock=True)
        approval = connection.execute("SELECT * FROM approvals WHERE task_id=%s AND workspace_id=%s FOR UPDATE", (task_id, workspace_id)).fetchone()
        if task["status"] != "approval" or not approval or approval["decision"]:
            raise HTTPException(409, "No pending approval; replay refused")
        if task["owner_id"] != user["user_id"]:
            raise HTTPException(403, "Only the task owner may decide this action")
        envelope = approval["payload"]
        if (
            envelope.get("actor_id") != str(user["user_id"])
            or envelope.get("workspace_id") != str(workspace_id)
            or envelope.get("task_id") != str(task_id)
        ):
            raise HTTPException(409, "Approval identity binding changed")
        if envelope.get("expires_at") != approval["expires_at"].isoformat():
            raise HTTPException(409, "Approval expiry binding changed")
        expected = payload_hash(approval["payload"])
        if not hmac.compare_digest(expected, data.payload_hash) or not hmac.compare_digest(expected, approval["payload_hash"]):
            raise HTTPException(409, "Approved action changed")
        decision = "approved" if data.decision == "approve" else "rejected"
        connection.execute("UPDATE approvals SET decision=%s,actor_id=%s,decided_at=now() WHERE task_id=%s", (decision, user["user_id"], task_id))
        if data.decision == "reject":
            connection.execute("UPDATE tasks SET status='rejected',stage='rejected',updated_at=now() WHERE id=%s", (task_id,))
            event(connection, task_id, "approval.rejected", {"actor": str(user["user_id"])})
            return {"status": "rejected"}
        if approval["expires_at"] <= datetime.now(timezone.utc):
            raise HTTPException(409, "Approval expired; submit a new task")
        source_ids = approval["payload"]["source_ids"]
        current = connection.execute(
            "SELECT id,content_hash FROM documents WHERE workspace_id=%s AND id=ANY(%s::uuid[]) AND active FOR SHARE", (workspace_id, source_ids)
        ).fetchall()
        if {str(r["id"]): r["content_hash"] for r in current} != approval["payload"]["source_hashes"]:
            raise HTTPException(409, "Evidence changed or deleted; approval invalidated")
        action = approval["payload"]
        if action["account"] != "internal-drafts" or action["operation"] != "record_draft_and_commitments":
            raise HTTPException(403, "Connector operation unavailable")
        receipt_id = uuid4()
        for item in action["commitments"]:
            connection.execute(
                "INSERT INTO commitments(id,task_id,workspace_id,description,source_ids) VALUES(%s,%s,%s,%s,%s)",
                (uuid4(), task_id, workspace_id, item, Jsonb(source_ids)),
            )
        connection.execute(
            "INSERT INTO receipts VALUES(%s,%s,%s,%s,%s,%s,%s,now())",
            (
                receipt_id,
                task_id,
                workspace_id,
                action["operation"],
                expected,
                "Internal draft and commitments committed atomically; no external message sent",
                Jsonb(action),
            ),
        )
        connection.execute(
            "INSERT INTO episodes(id,workspace_id,task_id,summary,source_ids) VALUES(%s,%s,%s,%s,%s)",
            (uuid4(), workspace_id, task_id, task["result"]["summary"], Jsonb(source_ids)),
        )
        connection.execute("UPDATE tasks SET status='completed',stage='verified',updated_at=now() WHERE id=%s", (task_id,))
        event(connection, task_id, "action.verified", {"receipt_id": str(receipt_id), "payload_hash": expected, "destination": "internal"})
    return {"status": "completed", "receipt_id": receipt_id}


@app.get(settings.api_prefix + "/workspaces/{workspace_id}/memory")
def memory(workspace_id: UUID, user=Depends(authenticated)):
    with database() as connection:
        membership(connection, user, workspace_id)
        return {
            "episodes": connection.execute(
                "SELECT * FROM episodes WHERE workspace_id=%s ORDER BY created_at DESC LIMIT %s", (workspace_id, settings.history_limit)
            ).fetchall(),
            "commitments": connection.execute(
                "SELECT * FROM commitments WHERE workspace_id=%s ORDER BY created_at DESC LIMIT %s", (workspace_id, settings.history_limit)
            ).fetchall(),
        }


@app.get(settings.api_prefix + "/capabilities")
def capabilities(user=Depends(authenticated)):
    return {
        "engine": "Nous Hermes Agent",
        "revision": settings.hermes_revision,
        "model": settings.model_id,
        "local_only": True,
        "model_available": available(settings),
        "limits": {"requestChars": settings.max_request_chars, "documentChars": settings.max_document_chars},
        "roles": ["coordinator", "researcher", "operator"],
        "connectors": {
            "internal-drafts": "operational",
            "gmail": "not configured",
            "drive": "not configured",
            "telegram": "not configured",
            "external-crm": "not configured",
        },
    }
