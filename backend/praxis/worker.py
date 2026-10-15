"""PostgreSQL is the single durable workflow owner. Hermes is a bounded activity."""

import json
import logging
import signal
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from psycopg.types.json import Jsonb

from .contracts import BrainBlocked, BrainOutput
from .db import database
from .security import payload_hash
from .settings import brain_environment, get_settings

log = logging.getLogger("praxis.worker")


def emit(connection, task_id, kind, detail):
    connection.execute("INSERT INTO events(task_id,kind,detail) VALUES(%s,%s,%s)", (task_id, kind, Jsonb(detail)))


def claim():
    settings = get_settings()
    with database() as connection:
        # Expired planning leases are safe to retry: these activities have no external writes.
        expired = connection.execute(
            "UPDATE tasks SET status=CASE WHEN attempt>=%s THEN 'failed' ELSE 'queued' END,stage='recovered',error='Worker lease expired; read-only planning interrupted',lease_token=NULL,lease_until=NULL,updated_at=now() WHERE status='running' AND lease_until<now() RETURNING id,status",
            (settings.max_attempts,),
        ).fetchall()
        for expired_task in expired:
            emit(connection, expired_task["id"], "worker.recovered", {"status": expired_task["status"]})
        task = connection.execute("SELECT * FROM tasks WHERE status='queued' ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1").fetchone()
        if not task:
            return None
        token = uuid4()
        connection.execute(
            "UPDATE tasks SET status='running',stage='context',attempt=attempt+1,lease_token=%s,lease_until=now()+make_interval(secs=>%s),updated_at=now(),error=NULL WHERE id=%s",
            (token, settings.lease_seconds, task["id"]),
        )
        task["lease_token"] = token
        task["attempt"] += 1
        emit(
            connection,
            task["id"],
            "worker.claimed",
            {"attempt": task["attempt"], "trace_id": str(token), "hermes_revision": settings.hermes_revision, "model": settings.model_id},
        )
        return task


def heartbeat(task, stage=None):
    with database() as connection:
        connection.execute("INSERT INTO worker_heartbeats VALUES('primary',now()) ON CONFLICT(service) DO UPDATE SET updated_at=now()")
        current = connection.execute(
            "UPDATE tasks SET lease_until=now()+make_interval(secs=>%s),stage=COALESCE(%s,stage),updated_at=now() WHERE id=%s AND status='running' AND lease_token=%s RETURNING id",
            (get_settings().lease_seconds, stage, task["id"], task["lease_token"]),
        ).fetchone()
        return bool(current)


def invoke(task, role, context):
    settings = get_settings()
    if not heartbeat(task, role):
        raise InterruptedError("Task cancelled or execution lease lost")
    settings.runtime_dir.mkdir(parents=True, exist_ok=True)
    # A unique home contains no customer files outside this single bounded task context.
    with tempfile.TemporaryDirectory(prefix="hermes-", dir=settings.runtime_dir) as home:
        environment = brain_environment(settings)
        environment["HERMES_HOME"] = home
        with tempfile.TemporaryFile(mode="w+b") as output, tempfile.TemporaryFile(mode="w+b") as error:
            with subprocess.Popen(
                [sys.executable, "-m", "praxis.brain"], stdin=subprocess.PIPE, stdout=output, stderr=error, env=environment
            ) as process:
                try:
                    if process.stdin is None:
                        raise RuntimeError("Worker input pipe unavailable")
                    process.stdin.write(json.dumps({"role": role, "context": context}).encode())
                    process.stdin.close()
                    started = time.monotonic()
                    while process.poll() is None:
                        if time.monotonic() - started > settings.run_seconds or not heartbeat(task):
                            process.terminate()
                            try:
                                process.wait(timeout=settings.http_timeout_seconds)
                            except subprocess.TimeoutExpired:
                                process.kill()
                            raise TimeoutError("Role time budget exceeded or task cancelled")
                        time.sleep(settings.poll_seconds)
                    if process.returncode:
                        # Raw provider errors may contain document text; keep public error bounded/generic.
                        raise RuntimeError("Hermes activity failed; model/runtime health requires attention")
                    output.seek(0)
                    data = json.load(output)
                finally:
                    if process.poll() is None:
                        process.kill()
    with database() as connection:
        current = connection.execute(
            "SELECT id FROM tasks WHERE id=%s AND status='running' AND lease_token=%s FOR UPDATE", (task["id"], task["lease_token"])
        ).fetchone()
        if not current:
            raise InterruptedError("Task lease lost")
        emit(
            connection, task["id"], "agent.completed", {"role": role, "seconds": round(time.monotonic() - started, 2), "api_calls": data["api_calls"]}
        )
    return data["output"]


def execute(task):
    settings = get_settings()
    request = task["request"]
    with database() as connection:
        documents = connection.execute(
            "SELECT id,title,content,source,version,content_hash FROM documents WHERE workspace_id=%s AND active AND id=ANY(%s::uuid[]) ORDER BY ts_rank(to_tsvector('english',title || ' ' || content),plainto_tsquery('english',%s)) DESC,id LIMIT %s",
            (task["workspace_id"], request["document_ids"], request["request"], settings.retrieval_limit),
        ).fetchall()
    if not documents:
        settle(task, "blocked", "No accessible active evidence remains")
        return
    per_document = settings.context_chars // len(documents)
    evidence = [
        {"id": str(d["id"]), "title": d["title"], "source": d["source"], "version": d["version"], "content": d["content"][:per_document]}
        for d in documents
    ]
    context = json.dumps({"request": request["request"], "client": request["client"], "evidence": evidence}, ensure_ascii=False)
    plan = invoke(task, "coordinator", context)
    research = invoke(task, "researcher", context + "\nCoordinator proposal (not evidence):\n" + plan)
    output = invoke(task, "operator", context + "\nEvidence review (not new evidence):\n" + research)
    parsed = output.strip()
    if parsed.startswith("```"):
        lines = parsed.splitlines()
        parsed = "\n".join(lines[1:-1])
    decoded = json.loads(parsed)
    if isinstance(decoded, dict) and decoded.get("status") == "blocked":
        blocked = BrainBlocked.model_validate(decoded)
        settle(task, "blocked", blocked.reason)
        return
    result = BrainOutput.model_validate(decoded)
    known = {str(d["id"]): d["content_hash"] for d in documents}
    cited = {str(i) for i in result.source_ids}
    if not cited.issubset(known):
        raise ValueError("Model cited sources outside permitted evidence")
    expiry = datetime.now(timezone.utc) + timedelta(seconds=settings.approval_seconds)
    action = {
        "workspace_id": str(task["workspace_id"]),
        "actor_id": str(task["owner_id"]),
        "expires_at": expiry.isoformat(),
        "task_id": str(task["id"]),
        "account": request["account"],
        "recipient": request["recipient"],
        "operation": "record_draft_and_commitments",
        "subject": result.subject,
        "body": result.body,
        "commitments": result.commitments,
        "source_ids": sorted(cited),
        "source_hashes": {key: known[key] for key in sorted(cited)},
    }
    fingerprint = payload_hash(action)
    with database() as connection:
        current = connection.execute(
            "SELECT id FROM tasks WHERE id=%s AND status='running' AND lease_token=%s FOR UPDATE", (task["id"], task["lease_token"])
        ).fetchone()
        if not current:
            raise InterruptedError("Task cancelled or lease lost before proposal")
        connection.execute(
            "INSERT INTO approvals(task_id,workspace_id,payload,payload_hash,expires_at) VALUES(%s,%s,%s,%s,%s)",
            (task["id"], task["workspace_id"], Jsonb(action), fingerprint, expiry),
        )
        connection.execute(
            "UPDATE tasks SET status='approval',stage='awaiting_review',result=%s,lease_token=NULL,lease_until=NULL,updated_at=now() WHERE id=%s",
            (Jsonb(result.model_dump(mode="json")), task["id"]),
        )
        emit(connection, task["id"], "approval.requested", {"payload_hash": fingerprint, "source_ids": sorted(cited)})


def settle(task, status, error):
    with database() as connection:
        changed = connection.execute(
            "UPDATE tasks SET status=%s,error=%s,lease_token=NULL,lease_until=NULL,updated_at=now() WHERE id=%s AND status='running' AND lease_token=%s RETURNING id",
            (status, error, task["id"], task["lease_token"]),
        ).fetchone()
        if changed:
            emit(connection, task["id"], "task." + status, {"reason": error})


def main():
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    stopping = False

    def stop(_signum, _frame):
        nonlocal stopping
        stopping = True

    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    while not stopping:
        try:
            with database() as connection:
                connection.execute("INSERT INTO worker_heartbeats VALUES('primary',now()) ON CONFLICT(service) DO UPDATE SET updated_at=now()")
            task = claim()
            if not task:
                time.sleep(get_settings().poll_seconds)
                continue
            try:
                execute(task)
            except InterruptedError:
                log.info("Lease lost or cancelled: %s", task["id"])
            except Exception as error:
                # Full exception text is deliberately not logged; it may include customer/provider data.
                retry = task["attempt"] < get_settings().max_attempts and isinstance(error, (TimeoutError, RuntimeError))
                settle(task, "queued" if retry else "failed", "Planning failed: " + type(error).__name__)
                log.info("Planning attempt failed: task=%s type=%s", task["id"], type(error).__name__)
        except Exception as error:
            log.error("Worker unavailable: %s", type(error).__name__)
            time.sleep(get_settings().poll_seconds)


if __name__ == "__main__":
    main()
