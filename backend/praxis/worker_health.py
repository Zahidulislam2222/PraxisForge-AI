from .db import database
from .settings import get_settings

if __name__ == "__main__":
    with database() as connection:
        row = connection.execute(
            "SELECT updated_at>now()-make_interval(secs=>%s) AS healthy FROM worker_heartbeats WHERE service='primary'",
            (get_settings().lease_seconds,),
        ).fetchone()
        if not row or not row["healthy"]:
            raise RuntimeError("Worker heartbeat unavailable")
