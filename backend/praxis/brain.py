"""One bounded isolated Hermes role invocation; stdin/stdout are structured contracts."""

import contextlib
import json
import sys
from typing import Any

from .settings import BrainSettings


def main() -> None:
    settings = BrainSettings()
    request = json.load(sys.stdin)
    # Import only after process-local HERMES_HOME/environment are set by the worker.
    from run_agent import AIAgent

    prompts = json.loads(settings.prompts_file.read_text())
    role = request["role"]
    if role not in prompts:
        raise ValueError("Unknown role")
    # Hermes logs must never corrupt the result protocol.
    with contextlib.redirect_stdout(sys.stderr):
        overrides: dict[str, Any] = {"temperature": settings.temperature, "reasoning_effort": "medium" if settings.thinking else "none"}
        if role == "operator":
            overrides["response_format"] = {"type": "json_object"}
        agent = AIAgent(
            base_url=settings.model_url,
            api_key=settings.provider_key.get_secret_value(),
            provider=settings.provider,
            model=settings.model_id,
            enabled_toolsets=[],
            disabled_toolsets=["all"],
            max_iterations=settings.max_iterations,
            max_tokens=settings.max_model_tokens,
            run_budget_seconds=settings.run_seconds,
            quiet_mode=True,
            skip_context_files=True,
            load_soul_identity=False,
            skip_memory=True,
            skip_background_review=True,
            fallback_model=None,
            save_trajectories=False,
            reasoning_config={"enabled": False},
            request_overrides=overrides,
        )
        if agent.tools:
            raise RuntimeError("Tool-free execution contract violated")
        try:
            result = agent.run_conversation(request["context"], system_message=prompts[role])
        finally:
            agent.close()
    if result.get("error") or result.get("interrupted") or result.get("partial") or result.get("completed") is False:
        raise RuntimeError("Hermes role did not complete")
    text = result.get("final_response")
    if not isinstance(text, str) or not text.strip():
        raise RuntimeError("Hermes role returned no output")
    json.dump({"output": text, "api_calls": result.get("api_calls", 0), "role": role}, sys.stdout)


if __name__ == "__main__":
    main()
