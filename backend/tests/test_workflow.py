import json
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from uuid import uuid4

import pytest
from psycopg.types.json import Jsonb

from praxis import worker
from praxis.db import database
from praxis.security import password_hash
from praxis.settings import get_bootstrap_settings, get_settings


def document(owner, title="Meeting notes"):
    client, path, headers = owner
    result = client.post(
        path + "/documents",
        headers=headers,
        json={
            "title": title,
            "content": "Morgan requested a revised direction on Friday. Alex owns the proposal and will collect client feedback before the workshop.",
            "source": "Authorized meeting transcript",
        },
    )
    assert result.status_code == 201
    return result.json()["id"]


def task(owner, source_id=None, key=None):
    client, path, headers = owner
    data = {
        "request": "Prepare a source-backed client follow-up draft and record the open commitments.",
        "client": "Synthetic test client",
        "recipient": "morgan@example.test",
        "account": "internal-drafts",
        "document_ids": [source_id or document(owner)],
    }
    response = client.post(path + "/tasks", headers={**headers, "idempotency-key": key or str(uuid4())}, json=data)
    assert response.status_code == 202
    return response.json()["id"], data


def proposal(owner, monkeypatch):
    task_id, data = task(owner)

    def fake_invoke(_task, role, _context):
        if role != "operator":
            return "Review the requested commitments using permitted evidence."
        return json.dumps(
            {
                "status": "ready",
                "summary": "Alex owns a revised proposal due Friday; client feedback follows.",
                "subject": "Your revised proposal",
                "body": "Hello Morgan, Alex will prepare the revised proposal on Friday and collect your feedback before the workshop. This is a draft for review.",
                "commitments": ["Alex will prepare the revised proposal on Friday."],
                "source_ids": data["document_ids"],
            }
        )

    monkeypatch.setattr(worker, "invoke", fake_invoke)
    claimed = worker.claim()
    assert str(claimed["id"]) == task_id
    worker.execute(claimed)
    client, path, headers = owner
    detail = client.get(path + "/tasks/" + task_id).json()
    assert detail["status"] == "approval"
    return task_id, detail["approval"]["payload_hash"]


def test_anonymous_and_csrf(client, owner):
    _, path, headers = owner
    from fastapi.testclient import TestClient

    from praxis.api import app

    with TestClient(app, base_url=get_settings().origin) as anonymous:
        assert anonymous.get(path + "/documents").status_code == 401
        assert (
            anonymous.post(
                "/api/login", headers={"origin": "https://attacker.example.test"}, json={"email": "test@example.test", "password": "test-password"}
            ).status_code
            == 403
        )
    assert (
        client.post(
            path + "/documents",
            headers={"origin": get_settings().origin},
            json={"title": "test", "content": "A sufficiently long test document.", "source": "test"},
        ).status_code
        == 403
    )
    assert client.get("/api/session").status_code == 200


def test_document_versions_and_dedup(owner):
    client, path, headers = owner
    first = document(owner)
    second = document(owner)
    assert second == first
    response = client.post(
        path + "/documents",
        headers=headers,
        json={
            "title": "Meeting notes",
            "content": "Corrected transcript: the proposal is due Monday, not Friday.",
            "source": "Corrected authorized notes",
        },
    )
    assert response.json()["version"] == 2
    visible = client.get(path + "/documents").json()
    assert len(visible) == 1 and visible[0]["id"] != first


def test_workspace_access_and_foreign_evidence(owner):
    client, path, headers = owner
    with database() as connection:
        user_id, space_id = uuid4(), uuid4()
        connection.execute("INSERT INTO users VALUES(%s,%s,%s)", (user_id, "other@example.test", password_hash("test-password-for-another-owner")))
        connection.execute("INSERT INTO workspaces(id,name) VALUES(%s,%s)", (space_id, "Other owner"))
        connection.execute("INSERT INTO members VALUES(%s,%s,%s)", (user_id, space_id, "owner"))
        foreign = uuid4()
        connection.execute(
            "INSERT INTO documents(id,workspace_id,title,content,source,version,content_hash) VALUES(%s,%s,%s,%s,%s,%s,%s)",
            (foreign, space_id, "Private", "Other owner's private evidence", "test", 1, "test-hash"),
        )
    assert client.get("/api/workspaces/" + str(space_id) + "/documents").status_code == 404
    source = document(owner)
    task_id, data = task(owner, source)
    data["document_ids"] = [str(foreign)]
    assert client.post(path + "/tasks", headers={**headers, "idempotency-key": str(uuid4())}, json=data).status_code == 404
    assert client.get("/api/workspaces/" + str(space_id) + "/tasks/" + task_id).status_code == 404


def test_submission_idempotency(owner):
    client, path, headers = owner
    key = str(uuid4())
    task_id, data = task(owner, key=key)
    replay = client.post(path + "/tasks", headers={**headers, "idempotency-key": key}, json=data)
    assert replay.json()["id"] == task_id and replay.json()["replayed"]
    data["client"] = "Different client"
    assert client.post(path + "/tasks", headers={**headers, "idempotency-key": key}, json=data).status_code == 409
    assert len(client.get(path + "/tasks").json()) == 1


def test_leases_recover_and_account_for_every_task(owner):
    client, path, _ = owner
    ids = [task(owner)[0] for _ in range(4)]
    claimed = worker.claim()
    with database() as connection:
        connection.execute("UPDATE tasks SET lease_until=now()-interval '1 second' WHERE id=%s", (claimed["id"],))
    recovered = worker.claim()
    assert recovered["id"] == claimed["id"] and recovered["attempt"] == 2
    with database() as connection:
        connection.execute("UPDATE tasks SET lease_until=now()-interval '1 second' WHERE id=%s", (claimed["id"],))
    worker.claim()
    results = client.get(path + "/tasks").json()
    assert {r["id"] for r in results} == set(ids)
    assert next(r for r in results if r["id"] == str(claimed["id"]))["status"] == "failed"


def test_cancel_fences_worker(owner):
    client, path, headers = owner
    task_id, _ = task(owner)
    claimed = worker.claim()
    assert client.post(path + "/tasks/" + task_id + "/cancel", headers=headers, json={}).status_code == 200
    assert not worker.heartbeat(claimed)
    worker.settle(claimed, "queued", "late result")
    cancelled = client.get(path + "/tasks/" + task_id).json()
    assert cancelled["status"] == "cancelled" and cancelled["stage"] == "cancelled"


def test_approval_tamper_and_replay(owner, monkeypatch):
    client, path, headers = owner
    task_id, fingerprint = proposal(owner, monkeypatch)
    endpoint = path + "/tasks/" + task_id + "/decision"
    assert client.post(endpoint, headers=headers, json={"decision": "approve", "payload_hash": "0" * 64}).status_code == 409
    with database() as connection:
        action = connection.execute("SELECT payload FROM approvals WHERE task_id=%s", (task_id,)).fetchone()["payload"]
        action["recipient"] = "changed@example.test"
        connection.execute("UPDATE approvals SET payload=%s WHERE task_id=%s", (Jsonb(action), task_id))
    assert client.post(endpoint, headers=headers, json={"decision": "approve", "payload_hash": fingerprint}).status_code == 409
    assert client.get(path + "/tasks/" + task_id).json()["receipt"] is None


def test_approval_exactly_one_transaction_under_concurrency(owner, monkeypatch):
    client, path, headers = owner
    task_id, fingerprint = proposal(owner, monkeypatch)

    def decide():
        return client.post(
            path + "/tasks/" + task_id + "/decision", headers=headers, json={"decision": "approve", "payload_hash": fingerprint}
        ).status_code

    with ThreadPoolExecutor(max_workers=2) as pool:
        statuses = list(pool.map(lambda _: decide(), range(2)))
    assert sorted(statuses) == [200, 409]
    detail = client.get(path + "/tasks/" + task_id).json()
    assert detail["status"] == "completed" and detail["receipt"]["artifact"]["account"] == "internal-drafts"
    assert detail["stage"] == "verified"
    memory = client.get(path + "/memory").json()
    assert len(memory["episodes"]) == 1 and len(memory["commitments"]) == 1


def test_expired_and_changed_evidence_invalidates_approval(owner, monkeypatch):
    client, path, headers = owner
    task_id, fingerprint = proposal(owner, monkeypatch)
    source = client.get(path + "/tasks/" + task_id).json()["request"]["document_ids"][0]
    assert client.delete(path + "/documents/" + source, headers=headers).status_code == 200
    assert (
        client.post(path + "/tasks/" + task_id + "/decision", headers=headers, json={"decision": "approve", "payload_hash": fingerprint}).status_code
        == 409
    )
    from praxis import api

    class FutureClock:
        @staticmethod
        def now(_timezone):
            return datetime.now(timezone.utc) + timedelta(hours=2)

    monkeypatch.setattr(api, "datetime", FutureClock)
    response = client.post(path + "/tasks/" + task_id + "/decision", headers=headers, json={"decision": "approve", "payload_hash": fingerprint})
    assert response.status_code == 409 and "expired" in response.json()["detail"]


def test_rejection_prevents_execution(owner, monkeypatch):
    client, path, headers = owner
    task_id, fingerprint = proposal(owner, monkeypatch)
    endpoint = path + "/tasks/" + task_id + "/decision"
    assert client.post(endpoint, headers=headers, json={"decision": "reject", "payload_hash": fingerprint}).status_code == 200
    assert client.post(endpoint, headers=headers, json={"decision": "approve", "payload_hash": fingerprint}).status_code == 409
    assert client.get(path + "/tasks/" + task_id).json()["receipt"] is None


def test_transaction_rolls_back_if_receipt_event_fails(owner, monkeypatch):
    from praxis import api

    client, path, headers = owner
    task_id, fingerprint = proposal(owner, monkeypatch)

    def fail_event(*_args):
        raise RuntimeError("Injected event failure")

    monkeypatch.setattr(api, "event", fail_event)
    with pytest.raises(RuntimeError, match="Injected"):
        client.post(path + "/tasks/" + task_id + "/decision", headers=headers, json={"decision": "approve", "payload_hash": fingerprint})
    detail = client.get(path + "/tasks/" + task_id).json()
    assert detail["status"] == "approval" and detail["receipt"] is None and detail["approval"]["decision"] is None


def test_insufficient_evidence_blocks_without_approval(owner, monkeypatch):
    client, path, _ = owner
    task_id, _ = task(owner)
    monkeypatch.setattr(
        worker,
        "invoke",
        lambda _task, role, _context: json.dumps({"status": "blocked", "reason": "The selected notes do not identify the requested invoice amount."})
        if role == "operator"
        else "Missing invoice evidence.",
    )
    worker.execute(worker.claim())
    detail = client.get(path + "/tasks/" + task_id).json()
    assert detail["status"] == "blocked" and detail["approval"] is None and detail["receipt"] is None


def test_other_member_cannot_decide_owner_action(owner, monkeypatch):
    client, path, headers = owner
    task_id, fingerprint = proposal(owner, monkeypatch)
    member_id = uuid4()
    with database() as connection:
        connection.execute("INSERT INTO users VALUES(%s,%s,%s)", (member_id, "member@example.test", password_hash("test-member-password-for-qa")))
        connection.execute("INSERT INTO members VALUES(%s,%s,%s)", (member_id, path.split("/")[-1], "member"))
    login = client.post(
        "/api/login", headers={"origin": get_settings().origin}, json={"email": "member@example.test", "password": "test-member-password-for-qa"}
    )
    assert login.status_code == 200
    response = client.post(
        path + "/tasks/" + task_id + "/decision",
        headers={"origin": get_settings().origin, "x-csrf-token": login.json()["csrf"]},
        json={"decision": "approve", "payload_hash": fingerprint},
    )
    assert response.status_code == 403
    assert client.get(path + "/tasks/" + task_id).json()["receipt"] is None


@pytest.mark.parametrize("invalidate", ["expiry", "evidence"])
def test_invalidated_action_can_still_be_rejected(owner, monkeypatch, invalidate):
    client, path, headers = owner
    task_id, fingerprint = proposal(owner, monkeypatch)
    with database() as connection:
        if invalidate == "expiry":
            from praxis import api

            class FutureClock:
                @staticmethod
                def now(_timezone):
                    return datetime.now(timezone.utc) + timedelta(hours=2)

            monkeypatch.setattr(api, "datetime", FutureClock)
        else:
            connection.execute("UPDATE documents SET active=false WHERE workspace_id=%s", (path.split("/")[-1],))
    assert (
        client.post(path + "/tasks/" + task_id + "/decision", headers=headers, json={"decision": "reject", "payload_hash": fingerprint}).status_code
        == 200
    )
    rejected = client.get(path + "/tasks/" + task_id).json()
    assert rejected["status"] == "rejected" and rejected["stage"] == "rejected"


def test_delete_and_approval_serialize_on_evidence(owner, monkeypatch):
    from threading import Event

    from praxis import api

    client, path, headers = owner
    task_id, fingerprint = proposal(owner, monkeypatch)
    source_id = client.get(path + "/tasks/" + task_id).json()["request"]["document_ids"][0]
    reached, release = Event(), Event()
    original = api.event

    def pause_at_receipt(connection, selected, kind, detail):
        if kind == "action.verified":
            reached.set()
            if not release.wait(5):
                raise RuntimeError("QA concurrency synchronization timed out")
        original(connection, selected, kind, detail)

    monkeypatch.setattr(api, "event", pause_at_receipt)
    with ThreadPoolExecutor(max_workers=2) as pool:
        approval = pool.submit(
            client.post, path + "/tasks/" + task_id + "/decision", headers=headers, json={"decision": "approve", "payload_hash": fingerprint}
        )
        assert reached.wait(5)
        deletion = pool.submit(client.delete, path + "/documents/" + source_id, headers=headers)
        # The task transaction owns FOR SHARE until commit. PostgreSQL confirms a conflicting updater cannot acquire it.
        with database() as connection:
            connection.execute("SET LOCAL lock_timeout='100ms'")
            with pytest.raises(Exception, match="lock timeout"):
                connection.execute("SELECT id FROM documents WHERE id=%s FOR UPDATE", (source_id,))
            connection.rollback()
        release.set()
        assert approval.result(timeout=10).status_code == 200
        assert deletion.result(timeout=10).status_code == 200
    assert client.get(path + "/tasks/" + task_id).json()["status"] == "completed"


def test_approval_expiry_is_part_of_hash_binding(owner, monkeypatch):
    client, path, headers = owner
    task_id, fingerprint = proposal(owner, monkeypatch)
    with database() as connection:
        connection.execute("UPDATE approvals SET expires_at=expires_at+interval '1 hour' WHERE task_id=%s", (task_id,))
    response = client.post(path + "/tasks/" + task_id + "/decision", headers=headers, json={"decision": "approve", "payload_hash": fingerprint})
    assert response.status_code == 409 and "binding" in response.json()["detail"]


def test_versions_do_not_reset_after_deletion(owner):
    client, path, headers = owner
    source_id = document(owner)
    assert client.delete(path + "/documents/" + source_id, headers=headers).status_code == 200
    new_id = document(owner)
    versions = client.get(path + "/documents").json()
    assert new_id != source_id and versions[0]["version"] == 2


def test_configured_owner_rotation_revokes_sessions(owner, monkeypatch):
    from fastapi.testclient import TestClient
    from pydantic import SecretStr

    from praxis import api

    client, _, _ = owner
    old = get_settings()
    bootstrap = get_bootstrap_settings()
    changed = bootstrap.model_copy(update={"admin_password": SecretStr("test-rotated-owner-password-for-qa")})
    monkeypatch.setattr(api, "get_bootstrap_settings", lambda: changed)
    with TestClient(api.app, base_url=old.origin):
        assert client.get("/api/session").status_code == 401
        login = client.post(
            "/api/login", headers={"origin": old.origin}, json={"email": bootstrap.admin_email, "password": "test-rotated-owner-password-for-qa"}
        )
        assert login.status_code == 200


def test_long_activity_keeps_service_heartbeat_fresh(owner):
    task(owner)
    claimed = worker.claim()
    with database() as connection:
        connection.execute(
            "INSERT INTO worker_heartbeats VALUES('primary',now()-interval '1 hour') ON CONFLICT(service) DO UPDATE SET updated_at=now()-interval '1 hour'"
        )
    assert worker.heartbeat(claimed, "operator")
    with database() as connection:
        row = connection.execute("SELECT updated_at>now()-interval '10 seconds' AS healthy FROM worker_heartbeats WHERE service='primary'").fetchone()
        assert row["healthy"]
