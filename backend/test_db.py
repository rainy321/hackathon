# -*- coding: utf-8 -*-
"""Unit tests for db.py — connection, schema init, and migration."""
import sqlite3
from pathlib import Path
from unittest.mock import patch

import db


class TestGetConn:
    def test_returns_connection_with_row_factory(self, tmp_path):
        db_file = tmp_path / "t.db"
        with patch.object(db, "DB_PATH", db_file):
            conn = db.get_conn()
            assert conn.row_factory is sqlite3.Row
            conn.close()

    def test_foreign_keys_enabled(self, tmp_path):
        db_file = tmp_path / "t.db"
        with patch.object(db, "DB_PATH", db_file):
            conn = db.get_conn()
            fk = conn.execute("PRAGMA foreign_keys").fetchone()[0]
            assert fk == 1
            conn.close()


class TestInitDb:
    def test_creates_all_tables(self, tmp_path):
        db_file = tmp_path / "t.db"
        with patch.object(db, "DB_PATH", db_file):
            db.init_db(reset=False)
            conn = db.get_conn()
            tables = {r[0] for r in conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table'").fetchall()}
            conn.close()
        for t in db.TABLES:
            assert t in tables

    def test_reset_recreates_tables(self, tmp_path):
        db_file = tmp_path / "t.db"
        with patch.object(db, "DB_PATH", db_file):
            db.init_db(reset=False)
            conn = db.get_conn()
            conn.execute("INSERT INTO user(id,name,baseline) VALUES('u1','A','')")
            conn.commit()
            conn.close()

            db.init_db(reset=True)
            conn = db.get_conn()
            count = conn.execute("SELECT COUNT(*) FROM user").fetchone()[0]
            conn.close()
        assert count == 0

    def test_idempotent(self, tmp_path):
        db_file = tmp_path / "t.db"
        with patch.object(db, "DB_PATH", db_file):
            db.init_db(reset=False)
            db.init_db(reset=False)  # second call should not error


class TestMigrate:
    def test_adds_missing_columns(self, tmp_path):
        """Simulate an old schema missing columns, then verify migration adds them."""
        db_file = tmp_path / "t.db"
        conn = sqlite3.connect(str(db_file))
        conn.execute("CREATE TABLE user (id TEXT PRIMARY KEY, name TEXT, baseline TEXT)")
        conn.execute("CREATE TABLE goal (id TEXT PRIMARY KEY, user_id TEXT, "
                     "title TEXT, category TEXT, time_horizon TEXT, status TEXT)")
        conn.execute("CREATE TABLE task (id TEXT PRIMARY KEY, goal_id TEXT, "
                     "date TEXT, content TEXT, difficulty TEXT, status TEXT)")
        conn.execute("CREATE TABLE behavior_log (id TEXT PRIMARY KEY, task_id TEXT, "
                     "date TEXT, done INTEGER, quality INTEGER, notes TEXT)")
        conn.execute("CREATE TABLE memory (id TEXT PRIMARY KEY, user_id TEXT, "
                     "insight_type TEXT, content TEXT)")
        conn.commit()
        conn.close()

        with patch.object(db, "DB_PATH", db_file):
            db.init_db(reset=False)
            conn = db.get_conn()
            user_cols = db._existing_cols(conn, "user")
            goal_cols = db._existing_cols(conn, "goal")
            conn.close()

        assert "tone" in user_cols
        assert "password" in user_cols
        assert "decomposition" in goal_cols
        assert "created_at" in goal_cols
