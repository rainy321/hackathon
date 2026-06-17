# -*- coding: utf-8 -*-
"""轻量密码哈希 + 会话令牌(纯 stdlib)。salt$sha256"""
import hashlib
import hmac
import os
import secrets
import time

# Token signing key: use env var in production, random per-process for dev
_TOKEN_SECRET = os.getenv("TOKEN_SECRET", secrets.token_hex(32))
_TOKEN_TTL = int(os.getenv("TOKEN_TTL", "86400"))  # 24h default


def hash_pw(pw):
    salt = secrets.token_hex(8)
    h = hashlib.sha256((salt + (pw or "")).encode("utf-8")).hexdigest()
    return f"{salt}${h}"


def verify_pw(pw, stored):
    if not stored or "$" not in stored:
        return False
    salt, h = stored.split("$", 1)
    return hashlib.sha256((salt + (pw or "")).encode("utf-8")).hexdigest() == h


def create_token(user_id: str) -> str:
    """Create a lightweight signed token: user_id.expiry.signature"""
    expiry = str(int(time.time()) + _TOKEN_TTL)
    payload = f"{user_id}.{expiry}"
    sig = hmac.new(_TOKEN_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()[:32]
    return f"{payload}.{sig}"


def verify_token(token: str):
    """Verify token and return user_id or None."""
    if not token:
        return None
    parts = token.split(".")
    if len(parts) != 3:
        return None
    user_id, expiry_str, sig = parts
    payload = f"{user_id}.{expiry_str}"
    expected = hmac.new(_TOKEN_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()[:32]
    if not hmac.compare_digest(sig, expected):
        return None
    try:
        if int(expiry_str) < int(time.time()):
            return None
    except ValueError:
        return None
    return user_id
