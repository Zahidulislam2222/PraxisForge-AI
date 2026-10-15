"""The only runtime environment boundary."""

from functools import lru_cache
from pathlib import Path
from urllib.parse import urlsplit

from pydantic import Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="PRAXIS_", env_file=None, extra="ignore", hide_input_in_errors=True)
    database_url: SecretStr
    origin: str
    allowed_hosts: list[str]
    model_url: str
    model_id: str
    hermes_revision: str
    runtime_dir: Path
    prompts_file: Path
    api_host: str
    api_port: int = Field(ge=1024, le=65535)
    api_prefix: str
    cookie_name: str
    csrf_cookie_name: str
    cookie_secure: bool = True
    session_seconds: int = Field(ge=60, le=86400)
    login_window_seconds: int = Field(ge=60)
    login_max_attempts: int = Field(ge=1, le=100)
    max_http_body_bytes: int = Field(ge=1000, le=1048576)
    max_document_chars: int = Field(ge=100, le=100000)
    max_request_chars: int = Field(ge=100, le=10000)
    context_chars: int = Field(ge=1000, le=20000)
    retrieval_limit: int = Field(ge=1, le=10)
    history_limit: int = Field(ge=1, le=500)
    queue_limit: int = Field(ge=1, le=100)
    lease_seconds: int = Field(ge=60)
    poll_seconds: float = Field(gt=0)
    max_attempts: int = Field(ge=1, le=5)
    run_seconds: int = Field(ge=30)
    max_model_tokens: int = Field(ge=100, le=4000)
    max_iterations: int = Field(ge=1, le=10)
    approval_seconds: int = Field(ge=60, le=86400)
    http_timeout_seconds: int = Field(ge=1, le=120)
    thinking: bool
    temperature: float = Field(ge=0, le=1)
    provider: str
    provider_key: SecretStr

    @model_validator(mode="after")
    def local_only(self) -> "Settings":
        url = urlsplit(self.model_url)
        # Deployment networking is the enforcement boundary; no external provider fallback.
        if url.scheme != "http" or url.hostname not in {"model", "127.0.0.1", "localhost"}:
            raise ValueError("Only the isolated local model service is permitted")
        if self.provider != "custom" or not self.model_id or not self.hermes_revision:
            raise ValueError("Explicit custom provider, model and pinned Hermes revision required")
        if self.cookie_secure and not self.origin.startswith("https://"):
            raise ValueError("Secure deployment requires HTTPS origin")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


class BrainSettings(BaseSettings):
    """Non-business credentials only; subprocesses never receive the control-plane DSN."""

    model_config = SettingsConfigDict(env_prefix="PRAXIS_", env_file=None, extra="ignore", hide_input_in_errors=True)
    model_url: str
    model_id: str
    provider: str
    provider_key: SecretStr
    prompts_file: Path
    run_seconds: int
    max_iterations: int
    max_model_tokens: int
    thinking: bool
    temperature: float


def brain_environment(settings: Settings) -> dict[str, str]:
    names = set(BrainSettings.model_fields) - {"provider_key"}
    values = settings.model_dump(mode="json", include=names)
    environment = {"PRAXIS_" + key.upper(): str(value) for key, value in values.items()}
    environment["PRAXIS_PROVIDER_KEY"] = settings.provider_key.get_secret_value()
    return environment


class BootstrapSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="PRAXIS_", env_file=None, extra="ignore", hide_input_in_errors=True)
    admin_email: str
    admin_password: SecretStr
    workspace_name: str

    @field_validator("admin_password")
    @classmethod
    def password_length(cls, value: SecretStr) -> SecretStr:
        if len(value.get_secret_value()) < 16:
            raise ValueError("Owner password must contain at least16 characters")
        return value


def get_bootstrap_settings() -> BootstrapSettings:
    return BootstrapSettings()


class DeploymentSettings(BaseSettings):
    """Compose values are separately owned and never injected wholesale into API/worker processes."""

    model_config = SettingsConfigDict(env_prefix="", env_file=None, extra="ignore", hide_input_in_errors=True)
    praxis_core_image: str
    praxis_db_image: str
    praxis_model_image: str
    praxis_image: str
    praxis_edge_login_per_minute: int = Field(ge=1, le=120)
    praxis_edge_login_burst: int = Field(ge=1, le=20)
    praxis_port: int = Field(ge=1024, le=65535)
    praxis_release_dir: str
    praxis_subnet: str
    praxis_private_subnet: str
    postgres_user: str
    postgres_password: SecretStr
    postgres_db: str
    app_db_user: str
    app_db_password: SecretStr
    ollama_host: str
    ollama_num_parallel: int = Field(ge=1, le=1)
    ollama_max_loaded_models: int = Field(ge=1, le=1)
    ollama_keep_alive: str
