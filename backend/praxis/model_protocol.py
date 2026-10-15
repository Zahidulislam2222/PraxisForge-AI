"""Protocol paths owned by the Ollama local-provider adapter."""

import httpx

from .settings import Settings

OLLAMA_TAGS_PATH = "/api/tags"


def available(settings: Settings) -> bool:
    endpoint = settings.model_url.removesuffix("/").removesuffix("/v1") + OLLAMA_TAGS_PATH
    try:
        with httpx.Client(timeout=settings.http_timeout_seconds, follow_redirects=False, trust_env=False) as client:
            response = client.get(endpoint)
            response.raise_for_status()
            models = response.json().get("models", [])
            return any(model.get("name") == settings.model_id for model in models)
    except (httpx.HTTPError, ValueError, TypeError):
        return False
