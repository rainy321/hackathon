# -*- coding: utf-8 -*-
"""SQLite 连接与初始化。schema.sql 是表结构的唯一来源。"""
import sqlite3
from pathlib import Path

BASE = Path(__file__).resolve().parent
DB_PATH = BASE / "growth_os.db"
SCHEMA_PATH = BASE / "schema.sql"

# 建表顺序(正向);reset 时反向 DROP 以避开外键依赖
TABLES = ["user", "goal", "task", "behavior_log", "memory"]


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row          # 按列名取值,像字典
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def _existing_cols(conn, table):
    return {r[1] for r in conn.execute(f"PRAGMA table_info({table})").fetchall()}


def _migrate(conn):
    """轻量迁移:为旧库补列。新增列在这里登记。"""
    if "decomposition" not in _existing_cols(conn, "goal"):
        conn.execute("ALTER TABLE goal ADD COLUMN decomposition TEXT")
    if "tone" not in _existing_cols(conn, "user"):
        conn.execute("ALTER TABLE user ADD COLUMN tone TEXT DEFAULT '温暖朋友'")
    if "password" not in _existing_cols(conn, "user"):
        conn.execute("ALTER TABLE user ADD COLUMN password TEXT")


def init_db(reset=False):
    """建表(IF NOT EXISTS,安全)。reset=True 先 DROP 再建。每次都会跑迁移补列。"""
    schema = SCHEMA_PATH.read_text(encoding="utf-8")
    conn = get_conn()
    try:
        if reset:
            for t in reversed(TABLES):
                conn.execute(f"DROP TABLE IF EXISTS {t};")
        conn.executescript(schema)
        _migrate(conn)
        conn.commit()
    finally:
        conn.close()
    return DB_PATH


if __name__ == "__main__":
    print("init_db OK ->", init_db(reset=False))
