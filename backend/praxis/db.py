"""Business state lives in PostgreSQL, never conversational memory."""

from collections.abc import Iterator
from contextlib import contextmanager
from typing import Any

import psycopg
from psycopg.rows import dict_row

from .settings import get_settings


@contextmanager
def database() -> Iterator[psycopg.Connection[dict[str, Any]]]:
    with psycopg.connect(get_settings().database_url.get_secret_value(), row_factory=dict_row) as connection:
        yield connection


def migrate() -> None:
    from pathlib import Path

    schema = Path(__file__).with_name("schema.sql").read_text()
    with database() as connection:
        connection.execute("SELECT pg_advisory_xact_lock(7350281)")
        connection.execute(schema)
