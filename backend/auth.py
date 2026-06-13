# -*- coding: utf-8 -*-
"""轻量密码哈希(纯 stdlib)。salt$sha256"""
import hashlib
import secrets


def hash_pw(pw):
    salt = secrets.token_hex(8)
    h = hashlib.sha256((salt + (pw or "")).encode("utf-8")).hexdigest()
    return f"{salt}${h}"


def verify_pw(pw, stored):
    if not stored or "$" not in stored:
        return False
    salt, h = stored.split("$", 1)
    return hashlib.sha256((salt + (pw or "")).encode("utf-8")).hexdigest() == h
