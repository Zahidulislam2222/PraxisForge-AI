"""A narrow, recorded dependency pin patch; Hermes execution code remains unchanged."""
import json
import sys
from pathlib import Path


def apply(target: Path) -> None:
    pins = json.loads(Path(__file__).with_name("dependency-pins.json").read_text())
    original = f'{pins["package"]}=={pins["from"]}'
    replacement = f'{pins["package"]}=={pins["to"]}'
    content = target.read_text()
    if content.count(original) != 1:
        raise RuntimeError("Pinned upstream dependency declaration changed; manual review required")
    target.write_text(content.replace(original, replacement, 1))


if __name__ == "__main__":
    apply(Path(sys.argv[1]))
