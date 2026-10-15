"""Export typed, synthetic test settings on an ephemeral GitHub runner only."""

import json
import os
from pathlib import Path
from urllib.parse import quote, urlsplit

from praxis.settings import BootstrapSettings, Settings


def main() -> None:
    if os.environ.get("GITHUB_ACTIONS") != "true":
        raise RuntimeError("This fixture exporter is restricted to the ephemeral CI workspace")
    root = Path(__file__).resolve().parents[2]
    values = dict(line.split("=", 1) for line in (root / "backend/.env.public.example").read_text().splitlines() if line and not line.startswith("#"))
    name = os.environ["CI_DB_NAME"]
    host = os.environ["CI_DB_HOST"]
    if name != "praxis_qa" or host != "127.0.0.1":
        raise RuntimeError("Only the disposable loopback QA database is allowed")
    user = quote(os.environ["CI_DB_USER"], safe="")
    password = quote(os.environ["CI_DB_PASSWORD"], safe="")
    port = int(os.environ["CI_DB_PORT"])
    if not 1024 < port < 65536:
        raise RuntimeError("Invalid disposable QA port")
    values["PRAXIS_DATABASE_URL"] = f"postgresql://{user}:{password}@{host}:{port}/{name}"
    values["PRAXIS_MODEL_ID"] = os.environ["CI_MODEL_ID"]
    fields = set(Settings.model_fields) | set(BootstrapSettings.model_fields)
    environment = {key: value for key, value in values.items() if key.removeprefix("PRAXIS_").lower() in fields}
    Settings(
        **{
            key.removeprefix("PRAXIS_").lower(): json.loads(value) if key == "PRAXIS_ALLOWED_HOSTS" else value
            for key, value in environment.items()
            if key.removeprefix("PRAXIS_").lower() in Settings.model_fields
        }
    )
    BootstrapSettings(
        **{
            key.removeprefix("PRAXIS_").lower(): value
            for key, value in environment.items()
            if key.removeprefix("PRAXIS_").lower() in BootstrapSettings.model_fields
        }
    )
    if urlsplit(environment["PRAXIS_DATABASE_URL"]).path != "/praxis_qa":
        raise RuntimeError("Production database URLs are forbidden")
    if any("\n" in key + value or "\r" in key + value for key, value in environment.items()):
        raise RuntimeError("CI environment entries must be single-line")
    (root / values["PRAXIS_RUNTIME_DIR"]).mkdir(parents=True, exist_ok=True)
    with Path(os.environ["GITHUB_ENV"]).open("a") as handle:
        handle.write("\n".join(key + "=" + value for key, value in sorted(environment.items())) + "\n")
    print("Typed synthetic CI settings exported; disposable QA database only")


if __name__ == "__main__":
    main()
