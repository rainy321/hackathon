# -*- coding: utf-8 -*-
"""把 mock/*.txt 灌入 SQLite。
- log 没有 date → 从 task.date 带入;done 由 bool 转 0/1。
- `main()` reset 重建,可反复跑;`seed_demo_if_empty()` 仅在库为空时灌(部署自动用)。
"""
import json
from pathlib import Path
from db import init_db, get_conn, DB_PATH

ROOT = Path(__file__).resolve().parent.parent
MOCK = ROOT / "mock"


def load(name):
    return json.loads((MOCK / name).read_text(encoding="utf-8"))


def _insert_all(conn):
    users = load("mockDemoUsers.txt")
    goals = load("mockGoals.txt")
    tasks = load("mockTasks.txt")
    logs = load("mockLogs.txt")
    mems = load("mockMemory.txt")
    task_date = {t["id"]: t["date"] for t in tasks}

    def ins(table, cols, row):
        ph = ",".join("?" * len(cols))
        conn.execute(f"INSERT OR REPLACE INTO {table} ({','.join(cols)}) VALUES ({ph})",
                     [row.get(c) for c in cols])

    for u in users:
        ins("user", ["id", "name", "baseline"], u)
    for g in goals:
        ins("goal", ["id", "user_id", "title", "category", "time_horizon", "status"], g)
    for t in tasks:
        ins("task", ["id", "goal_id", "date", "content", "difficulty", "status"], t)
    for m in mems:
        ins("memory", ["id", "user_id", "insight_type", "content"], m)
    for l in logs:
        row = {"id": l["id"], "task_id": l["task_id"],
               "date": task_date.get(l["task_id"]),
               "done": 1 if l["done"] else 0,
               "quality": l["quality"], "notes": l["notes"]}
        ins("behavior_log", ["id", "task_id", "date", "done", "quality", "notes"], row)
    conn.commit()


def seed_demo_if_empty():
    """若库里没有用户,则灌入演示数据(部署后自动保证有内容)。返回是否灌了。"""
    with get_conn() as c:
        if c.execute("SELECT COUNT(*) FROM user").fetchone()[0] > 0:
            return False
    conn = get_conn()
    try:
        _insert_all(conn)
    finally:
        conn.close()
    return True


def main():
    init_db(reset=True)
    conn = get_conn()
    try:
        _insert_all(conn)
        counts = {t: conn.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
                  for t in ["user", "goal", "task", "behavior_log", "memory"]}
        fk_bad = conn.execute("PRAGMA foreign_key_check;").fetchall()
        log_no_date = conn.execute(
            "SELECT COUNT(*) FROM behavior_log WHERE date IS NULL").fetchone()[0]
    finally:
        conn.close()

    print("=== seed result ===")
    for k, v in counts.items():
        print(f"  {k}: {v}")
    print("  foreign_key_check bad rows:", len(fk_bad))
    print("  logs missing date:", log_no_date)
    print("  db:", DB_PATH)
    assert len(fk_bad) == 0 and log_no_date == 0
    print("SEED OK")


if __name__ == "__main__":
    main()
