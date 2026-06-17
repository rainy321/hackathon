# -*- coding: utf-8 -*-
"""Unit tests for auth.py — password hashing and verification."""
import auth


class TestHashPw:
    def test_returns_salt_dollar_hash_format(self):
        result = auth.hash_pw("secret")
        assert "$" in result
        salt, digest = result.split("$", 1)
        assert len(salt) == 16  # token_hex(8) -> 16 hex chars
        assert len(digest) == 64  # sha256 hex digest

    def test_different_calls_produce_different_salts(self):
        a = auth.hash_pw("same")
        b = auth.hash_pw("same")
        assert a != b  # different salt each time

    def test_empty_password(self):
        result = auth.hash_pw("")
        assert "$" in result

    def test_none_password(self):
        result = auth.hash_pw(None)
        assert "$" in result


class TestVerifyPw:
    def test_correct_password_returns_true(self):
        stored = auth.hash_pw("hello")
        assert auth.verify_pw("hello", stored) is True

    def test_wrong_password_returns_false(self):
        stored = auth.hash_pw("hello")
        assert auth.verify_pw("world", stored) is False

    def test_empty_stored_returns_false(self):
        assert auth.verify_pw("x", "") is False
        assert auth.verify_pw("x", None) is False

    def test_no_dollar_in_stored_returns_false(self):
        assert auth.verify_pw("x", "nodollarsign") is False

    def test_unicode_password(self):
        stored = auth.hash_pw("密码测试")
        assert auth.verify_pw("密码测试", stored) is True
        assert auth.verify_pw("wrong", stored) is False
