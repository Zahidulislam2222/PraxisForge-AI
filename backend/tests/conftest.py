"""Real PostgreSQL integration fixtures. Refuse every database except the disposable QA name."""

from urllib.parse import urlsplit

import pytest
from fastapi.testclient import TestClient

from praxis.api import app
from praxis.db import database, migrate
from praxis.settings import get_bootstrap_settings, get_settings


@pytest.fixture
def client():
    settings = get_settings()
    if urlsplit(settings.database_url.get_secret_value()).path != "/praxis_qa":
        raise RuntimeError("Integration tests require the disposable praxis_qa database")
    migrate()
    with database() as connection:
        connection.execute("TRUNCATE users,workspaces,login_attempts CASCADE")
    with TestClient(app, base_url=settings.origin) as instance:
        yield instance


@pytest.fixture
def owner(client):
    settings = get_settings()
    bootstrap = get_bootstrap_settings()
    response = client.post(
        settings.api_prefix + "/login",
        headers={"origin": settings.origin},
        json={"email": bootstrap.admin_email, "password": bootstrap.admin_password.get_secret_value()},
    )
    assert response.status_code == 200
    session = client.get(settings.api_prefix + "/session").json()
    headers = {"origin": settings.origin, "x-csrf-token": session["csrf"]}
    path = settings.api_prefix + "/workspaces/" + session["workspaces"][0]["id"]
    return client, path, headers
