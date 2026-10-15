"""Assemble a fresh, verified public Docker context without executing upstream code."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import stat
import tarfile
import tempfile
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE_NAME = "hermes-pinned.tar.gz"  # Dockerfile input protocol.
MANIFEST_NAME = "build-manifest.json"
PUBLIC_DIRECTORIES = frozenset({"praxis", "data", "patches", "tests"})
PUBLIC_FILES = frozenset({"Dockerfile", "requirements.lock", ".env.public.example", ".dockerignore"})
PUBLIC_SOURCE_SUFFIXES = frozenset({".py", ".sql", ".json"})


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def digest(path: Path) -> str:
    with path.open("rb") as handle:
        return hashlib.file_digest(handle, "sha256").hexdigest()


def no_symlinks(path: Path, boundary: Path) -> None:
    require(path.is_relative_to(boundary), "Path must remain inside its public boundary")
    for entry in (boundary, *reversed(path.relative_to(boundary).parents), path.relative_to(boundary)):
        check = entry if entry.is_absolute() else boundary / entry
        if check.exists() or check.is_symlink():
            require(not check.is_symlink(), "Symlinks are forbidden in public build inputs/output")


@dataclass(frozen=True)
class BuildConfig:
    archiveBaseUrl: str
    downloadTimeoutSeconds: int
    maxArchiveBytes: int
    maxExpandedBytes: int
    maxArchiveMembers: int
    outputDirectory: str
    sourceDirectories: list[str]
    sourceFiles: list[str]
    sourceSuffixes: list[str]

    def validate(self) -> None:
        url = urlsplit(self.archiveBaseUrl)
        require(
            url.scheme == "https"
            and url.netloc == "codeload.github.com"
            and url.path == "/NousResearch/hermes-agent/tar.gz/"
            and not url.query
            and not url.fragment,
            "Only the official Hermes archive origin is permitted",
        )
        for value in (self.downloadTimeoutSeconds, self.maxArchiveBytes, self.maxExpandedBytes, self.maxArchiveMembers):
            require(type(value) is int and value > 0, "Build resource limits must be positive integers")
        relative = PurePosixPath(self.outputDirectory)
        require(
            not relative.is_absolute()
            and len(relative.parts) >= 2
            and relative.parts[0] == "build"
            and all(part not in {".", ".."} for part in relative.parts)
            and "\\" not in self.outputDirectory,
            "Output must be a fresh ignored build/ subdirectory",
        )
        require(
            set(self.sourceDirectories) == PUBLIC_DIRECTORIES
            and len(self.sourceDirectories) == len(PUBLIC_DIRECTORIES)
            and set(self.sourceFiles) == PUBLIC_FILES
            and len(self.sourceFiles) == len(PUBLIC_FILES),
            "Build inputs must be exactly the public backend allowlist",
        )
        require(bool(self.sourceSuffixes) and set(self.sourceSuffixes) <= PUBLIC_SOURCE_SUFFIXES, "Invalid public source suffix inventory")


def load_configuration(root: Path) -> tuple[BuildConfig, dict]:
    config = BuildConfig(**json.loads((root / "config/core-build.json").read_text()))
    config.validate()
    runtime = json.loads((root / "config/core-runtime.json").read_text())
    require(bool(re.fullmatch(r"[a-f0-9]{40}", runtime["hermesRevision"])), "Hermes revision must be a full commit")
    require(bool(re.fullmatch(r"[a-f0-9]{64}", runtime["archiveSha256"])), "Archive SHA256 is required")
    require(bool(re.fullmatch(r"python@sha256:[a-f0-9]{64}", runtime["pythonImage"])), "Python base image must be digest pinned")
    return config, runtime


def validate_archive(path: Path, config: BuildConfig, runtime: dict) -> None:
    require(not path.is_symlink() and stat.S_ISREG(path.stat().st_mode), "Archive must be a regular file")
    require(path.stat().st_size <= config.maxArchiveBytes and digest(path) == runtime["archiveSha256"], "Pinned archive checksum/size mismatch")
    root_name = "hermes-agent-" + runtime["hermesRevision"]
    count = expanded = 0
    with tarfile.open(path, "r|gz") as archive:
        for member in archive:
            count += 1
            expanded += member.size
            name = PurePosixPath(member.name)
            require(
                not name.is_absolute() and bool(name.parts) and name.parts[0] == root_name and ".." not in name.parts and "\\" not in member.name,
                "Archive path/revision mismatch",
            )
            require(member.isfile() or member.isdir(), "Archive links and special files are forbidden")
            require(count <= config.maxArchiveMembers and expanded <= config.maxExpandedBytes, "Archive expansion exceeds configured limits")
    require(count > 1, "Archive must contain the pinned Hermes source tree")


def public_inputs(root: Path, config: BuildConfig) -> dict[str, Path]:
    backend = root / "backend"
    result = {}
    for name in config.sourceFiles:
        path = backend / name
        no_symlinks(path, backend)
        require(path.is_file(), "Required public backend file missing")
        result[".env.example" if name == ".env.public.example" else name] = path
    for name in config.sourceDirectories:
        directory = backend / name
        no_symlinks(directory, backend)
        require(directory.is_dir(), "Required public backend directory missing")
        for path in sorted(directory.rglob("*")):
            no_symlinks(path, backend)
            if "__pycache__" in path.parts:
                continue
            if path.is_dir():
                continue
            require(path.is_file() and path.suffix in config.sourceSuffixes, "Unexpected file in public backend source tree")
            result[path.relative_to(backend).as_posix()] = path
    return result


def download(destination: Path, config: BuildConfig, runtime: dict) -> None:
    # httpx is already pinned in the backend dependency lock. Cached-archive
    # preparation remains usable without third-party imports or network access.
    import httpx

    with httpx.stream(
        "GET",
        config.archiveBaseUrl + runtime["hermesRevision"],
        timeout=config.downloadTimeoutSeconds,
        follow_redirects=False,
        verify=True,
        trust_env=False,
        headers={"Accept": "application/gzip"},
    ) as response:
        require(response.status_code == 200, "Official pinned archive download failed; redirects are refused")
        received = 0
        with destination.open("xb") as handle:
            for block in response.iter_bytes(1024 * 1024):
                received += len(block)
                require(received <= config.maxArchiveBytes, "Archive download exceeds configured limit")
                handle.write(block)


def prepare(root: Path, archive: Path | None = None) -> dict:
    config, runtime = load_configuration(root)
    inputs = public_inputs(root, config)
    output = root / config.outputDirectory
    no_symlinks(output, root)
    require(not output.exists(), "Preserve existing context; choose a fresh configured output directory")
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="core-archive-", dir=output.parent) as temporary:
        downloaded = Path(temporary) / ARCHIVE_NAME
        if archive is None:
            download(downloaded, config, runtime)
            archive = downloaded
        validate_archive(archive, config, runtime)
        # Exclusive mkdir refuses a concurrent output creator. No source/env
        # discovery outside the explicit backend allowlist takes place.
        output.mkdir()
        for relative, source in sorted(inputs.items()):
            destination = output / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, destination)
        shutil.copyfile(archive, output / ARCHIVE_NAME)
        files = {path.relative_to(output).as_posix(): digest(path) for path in sorted(output.rglob("*")) if path.is_file()}
        require(
            all(files[name] == digest(source) for name, source in inputs.items()) and files[ARCHIVE_NAME] == runtime["archiveSha256"],
            "Build context source/archive parity failed",
        )
        proof = {
            "hermesRevision": runtime["hermesRevision"],
            "archiveSha256": runtime["archiveSha256"],
            "buildArguments": {"PYTHON_IMAGE": runtime["pythonImage"]},
            "files": files,
        }
        with (output / MANIFEST_NAME).open("x") as handle:
            json.dump(proof, handle, indent=2, sort_keys=True)
            handle.write("\n")
    return proof


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=Path, help="Optional already downloaded official archive; exact configured SHA required")
    args = parser.parse_args()
    proof = prepare(ROOT, args.archive)
    print(json.dumps({"prepared": True, "publicFiles": len(proof["files"]), "hermesRevision": proof["hermesRevision"], "imageBuilt": False}))


if __name__ == "__main__":
    try:
        main()
    except (ValueError, OSError, tarfile.TarError) as error:
        print("Build preparation refused:", type(error).__name__)
        raise SystemExit(1) from None
