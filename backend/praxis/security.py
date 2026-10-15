"""Opaque session credentials, timing-safe verification and canonical approval hashes."""

import hashlib
import hmac
import json
import secrets


def digest(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def payload_hash(value: dict) -> str:
    return digest(json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False))


def password_hash(password: str) -> str:
    salt = secrets.token_hex(16)
    key = hashlib.scrypt(password.encode(), salt=salt.encode(), n=16384, r=8, p=1).hex()
    return salt + ":" + key


def verify_password(password: str, stored: str) -> bool:
    salt, expected = stored.split(":", 1)
    actual = hashlib.scrypt(password.encode(), salt=salt.encode(), n=16384, r=8, p=1).hex()
    return hmac.compare_digest(actual, expected)
