# -*- coding: utf-8 -*-
"""Shared fixtures for backend tests.

Every test that touches the DB gets a fresh in-memory SQLite so tests
never interfere with each other or the real growth_os.db.
"""
import sqlite3
import sys
from pathlib import Path
from unittest.mock import patch

import pytest

BACKEND = Path(__file__).resolve().parent

# Ensure backend dir is on sys.path so bare `import db` works.
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

import db as _db_mod  # noqa: E402


@pytest.fixture()
def mem_db(tmp_path):
    """Yield a fresh SQLite DB (file-based in tmp_path) with schema applied.

    Patches ``db.DB_PATH`` and ``db.get_conn`` so all production code that
    calls ``get_conn()`` transparently uses this ephemeral database.
    """
    db_file = tmp_path / "test.db"

    def _get_conn():
        conn = sqlite3.connect(str(db_file))
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        return conn

    with patch.object(_db_mod, "DB_PATH", db_file), \
         patch.object(_db_mod, "get_conn", _get_conn):
        _db_mod.init_db(reset=True)
        yield _get_conn
