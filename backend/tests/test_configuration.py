from pathlib import Path

import pytest
from pydantic import ValidationError

from praxis.settings import BootstrapSettings, DeploymentSettings, Settings, brain_environment, get_settings


def test_brain_does_not_receive_business_credentials():
    environment = brain_environment(get_settings())
    assert not any(key in environment for key in ["PRAXIS_DATABASE_URL", "PRAXIS_ADMIN_PASSWORD", "PRAXIS_ADMIN_EMAIL"])
    assert set(environment) == {
        "PRAXIS_" + name.upper()
        for name in [
            "model_url",
            "model_id",
            "provider",
            "provider_key",
            "prompts_file",
            "run_seconds",
            "max_iterations",
            "max_model_tokens",
            "temperature",
            "thinking",
        ]
    }


def test_external_inference_is_refused():
    values = get_settings().model_dump()
    values["model_url"] = "https://provider.example.test/v1"
    with pytest.raises(ValidationError, match="local model"):
        Settings(**values)


def test_environment_inventory_and_secret_regression():
    example = Path("/app/.env.example") if Path("/app/.env.example").exists() else Path("backend/.env.example")
    content = example.read_text()
    for name in set(Settings.model_fields) | set(BootstrapSettings.model_fields):
        assert "PRAXIS_" + name.upper() + "=" in content
    for name in DeploymentSettings.model_fields:
        assert name.upper() + "=" in content
    for file in Path(__file__).parents[1].joinpath("praxis").glob("*.py"):
        source = file.read_text()
        assert "sk-or-v1-" not in source and "BEGIN PRIVATE KEY" not in source
        if file.name != "settings.py":
            assert "os.getenv" not in source and "os.environ" not in source
