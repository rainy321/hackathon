# -*- coding: utf-8 -*-
"""数据库操作。每个函数自带连接,返回 dict / list[dict]。"""
import json
from datetime import date, datetime, timedelta
from uuid import uuid4
import auth
from db import get_conn


def _rows(rows):
    return [dict(r) for r in rows]


def _safe(user_row):
    """返回不含 password 的用户 dict。"""
    u = dict(user_row)
    u.pop("password", None)
    return u


# ---------- user ----------
def list_users():
    with get_conn() as c:
        return [_safe(r) for r in c.execute("SELECT * FROM user ORDER BY id").fetchall()]


def get_user(uid):
    with get_conn() as c:
        r = c.execute("SELECT * FROM user WHERE id=?", (uid,)).fetchone()
        return _safe(r) if r else None


def create_user(uid, name, baseline):
    with get_conn() as c:
        c.execute("INSERT INTO user(id,name,baseline) VALUES(?,?,?)",
                  (uid, name, baseline))
        c.commit()
        r = c.execute("SELECT * FROM user WHERE id=?", (uid,)).fetchone()
        return _safe(r)


def register_user(name, baseline, password):
    """注册:用户名唯一,密码哈希存储。成功返回脱敏用户,重名返回 None。"""
    with get_conn() as c:
        if c.execute("SELECT 1 FROM user WHERE name=?", (name,)).fetchone():
            return None
    uid = "user_" + uuid4().hex[:8]
    with get_conn() as c:
        c.execute(
            "INSERT INTO user(id,name,baseline,tone,password) VALUES(?,?,?,?,?)",
            (uid, name, baseline, "温暖朋友", auth.hash_pw(password)))
        c.commit()
        r = c.execute("SELECT * FROM user WHERE id=?", (uid,)).fetchone()
        return _safe(r)


def login_user(name, password):
    with get_conn() as c:
        r = c.execute("SELECT * FROM user WHERE name=?", (name,)).fetchone()
    if not r or not auth.verify_pw(password, r["password"]):
        return None
    return _safe(r)


def ensure_demo_passwords(default="123456"):
    """给没有密码的旧用户(如种子数据)设默认密码,方便演示登录。"""
    with get_conn() as c:
        row = c.execute("SELECT COUNT(*) FROM user WHERE password IS NULL").fetchone()
        if row and row[0] > 0:
            c.execute("UPDATE user SET password=? WHERE password IS NULL",
                      (auth.hash_pw(default),))
            c.commit()


def update_user(uid, name=None, baseline=None, tone=None):
    with get_conn() as c:
        if name is not None:
            c.execute("UPDATE user SET name=? WHERE id=?", (name, uid))
        if baseline is not None:
            c.execute("UPDATE user SET baseline=? WHERE id=?", (baseline, uid))
        if tone is not None:
            c.execute("UPDATE user SET tone=? WHERE id=?", (tone, uid))
        c.commit()
        r = c.execute("SELECT * FROM user WHERE id=?", (uid,)).fetchone()
        return _safe(r) if r else None


# ---------- goal ----------
def list_goals(user_id=None):
    sql = "SELECT * FROM goal"
    p = []
    if user_id:
        sql += " WHERE user_id=?"
        p.append(user_id)
    sql += " ORDER BY id"
    with get_conn() as c:
        return _rows(c.execute(sql, p).fetchall())


def get_goal(gid):
    with get_conn() as c:
        r = c.execute("SELECT * FROM goal WHERE id=?", (gid,)).fetchone()
        return dict(r) if r else None


def create_goal(gid, user_id, title, category, time_horizon, status,
                decomposition=None):
    decomp_json = json.dumps(decomposition, ensure_ascii=False) if decomposition else None
    with get_conn() as c:
        c.execute(
            "INSERT INTO goal(id,user_id,title,category,time_horizon,status,decomposition) "
            "VALUES(?,?,?,?,?,?,?)",
            (gid, user_id, title, category, time_horizon, status, decomp_json),
        )
        c.commit()
        r = c.execute("SELECT * FROM goal WHERE id=?", (gid,)).fetchone()
        g = dict(r)
        if g.get("decomposition"):
            g["decomposition"] = json.loads(g["decomposition"])
        return g


def goal_decomposition(gid):
    """取出 goal 的拆解结果(已解析)。返回 (goal_dict, phases or None)。"""
    with get_conn() as c:
        r = c.execute("SELECT * FROM goal WHERE id=?", (gid,)).fetchone()
        if not r:
            return None, None
        g = dict(r)
    decomp = json.loads(g["decomposition"]) if g.get("decomposition") else None
    phases = decomp.get("phases") if decomp else None
    return g, phases


def plan_inputs(gid):
    """取规划所需:goal + 当前阶段(第一个)+ 用户 baseline。不在此处调 LLM。"""
    g, phases = goal_decomposition(gid)
    if not g or not phases:
        return None
    phase = phases[0]
    with get_conn() as c:
        u = c.execute("SELECT baseline FROM user WHERE id=?", (g["user_id"],)).fetchone()
    baseline = u["baseline"] if u else ""
    return {"goal": g, "phase": phase, "baseline": baseline}


def insert_tasks(gid, tasks, date_str):
    """把 Daily Planner 的任务写入 task 表(同日 pending 先清,避免重复规划)。"""
    created = []
    with get_conn() as c:
        c.execute(
            "DELETE FROM task WHERE goal_id=? AND date=? AND status='pending'",
            (gid, date_str))
        for t in tasks:
            tid = "task_" + uuid4().hex[:10]
            c.execute(
                "INSERT INTO task(id,goal_id,date,content,difficulty,status) "
                "VALUES(?,?,?,?,?,?)",
                (tid, gid, date_str, t.get("content"), t.get("difficulty"), "pending"))
            created.append({"id": tid, "goal_id": gid, "date": date_str,
                            "content": t.get("content"),
                            "difficulty": t.get("difficulty"), "status": "pending"})
        c.commit()
    return created


# ---------- task ----------
def list_tasks(goal_id=None, date=None, user_id=None):
    sql = "SELECT t.* FROM task t"
    joins, where, p = "", [], []
    if user_id:
        joins += " JOIN goal g ON t.goal_id=g.id"
        where.append("g.user_id=?")
        p.append(user_id)
    if goal_id:
        where.append("t.goal_id=?")
        p.append(goal_id)
    if date:
        where.append("t.date=?")
        p.append(date)
    if where:
        sql += joins + " WHERE " + " AND ".join(where)
    sql += " ORDER BY t.date, t.id"
    with get_conn() as c:
        return _rows(c.execute(sql, p).fetchall())


def get_task(tid):
    with get_conn() as c:
        r = c.execute("SELECT * FROM task WHERE id=?", (tid,)).fetchone()
        return dict(r) if r else None


def create_task(gid, date_str, content, difficulty="中"):
    """用户自己新增一个任务。"""
    tid = "task_" + uuid4().hex[:10]
    with get_conn() as c:
        c.execute(
            "INSERT INTO task(id,goal_id,date,content,difficulty,status) "
            "VALUES(?,?,?,?,?,?)",
            (tid, gid, date_str, content, difficulty, "pending"))
        c.commit()
        r = c.execute("SELECT * FROM task WHERE id=?", (tid,)).fetchone()
        return dict(r)


def update_task(tid, content=None, difficulty=None, status=None):
    with get_conn() as c:
        if content is not None:
            c.execute("UPDATE task SET content=? WHERE id=?", (content, tid))
        if difficulty is not None:
            c.execute("UPDATE task SET difficulty=? WHERE id=?", (difficulty, tid))
        if status is not None:
            c.execute("UPDATE task SET status=? WHERE id=?", (status, tid))
        c.commit()
        r = c.execute("SELECT * FROM task WHERE id=?", (tid,)).fetchone()
        return dict(r) if r else None


def delete_task(tid):
    """删除任务及其行为日志。"""
    with get_conn() as c:
        c.execute("DELETE FROM behavior_log WHERE task_id=?", (tid,))
        c.execute("DELETE FROM task WHERE id=?", (tid,))
        c.commit()
        return c.total_changes


# ---------- behavior_log ----------
def list_logs(task_id=None, user_id=None):
    sql = "SELECT l.* FROM behavior_log l"
    joins, where, p = "", [], []
    if user_id:
        joins += " JOIN task t ON l.task_id=t.id JOIN goal g ON t.goal_id=g.id"
        where.append("g.user_id=?")
        p.append(user_id)
    if task_id:
        where.append("l.task_id=?")
        p.append(task_id)
    if where:
        sql += joins + " WHERE " + " AND ".join(where)
    sql += " ORDER BY l.date, l.id"
    with get_conn() as c:
        return _rows(c.execute(sql, p).fetchall())


def checkin(task_id, done, quality, notes):
    """打卡:对某任务 upsert 一条 behavior_log。done(bool)->0/1,date 取自 task。"""
    with get_conn() as c:
        t = c.execute("SELECT date FROM task WHERE id=?", (task_id,)).fetchone()
        if not t:
            return None
        done_i = 1 if done else 0
        existing = c.execute(
            "SELECT id FROM behavior_log WHERE task_id=?", (task_id,)).fetchone()
        if existing:
            c.execute(
                "UPDATE behavior_log SET done=?, quality=?, notes=?, "
                "date=COALESCE(date,?) WHERE task_id=?",
                (done_i, quality, notes, t["date"], task_id))
        else:
            lid = "log_" + task_id.replace("task_", "")
            c.execute(
                "INSERT INTO behavior_log(id,task_id,date,done,quality,notes) "
                "VALUES(?,?,?,?,?,?)",
                (lid, task_id, t["date"], done_i, quality, notes))
        # 打卡同步更新任务状态:done=完成,not done=跳过(都已处理,不再显示按钮)
        c.execute("UPDATE task SET status=? WHERE id=?",
                  ("completed" if done else "skipped", task_id))
        c.commit()
        r = c.execute(
            "SELECT * FROM behavior_log WHERE task_id=?", (task_id,)).fetchone()
        return dict(r)


# ---------- memory ----------
def list_memory(user_id=None):
    sql = "SELECT * FROM memory"
    p = []
    if user_id:
        sql += " WHERE user_id=?"
        p.append(user_id)
    sql += " ORDER BY id DESC"
    with get_conn() as c:
        return _rows(c.execute(sql, p).fetchall())


# ---------- 反馈系统:分析 / 调整 / 记忆 ----------
def recent_logs(user_id, days=7):
    """取用户最近 days 天(以数据中最大日期为基准)的行为日志。
    返回 (logs_for_analyst, completion_rate)。done 转为 bool 给 Prompt。"""
    with get_conn() as c:
        rows = _rows(c.execute(
            "SELECT l.date, l.done, l.quality, l.notes "
            "FROM behavior_log l "
            "JOIN task t ON l.task_id=t.id "
            "JOIN goal g ON t.goal_id=g.id "
            "WHERE g.user_id=? AND l.date IS NOT NULL "
            "ORDER BY l.date", (user_id,)).fetchall())
    if not rows:
        return [], 0.0
    ds = sorted({datetime.strptime(r["date"], "%Y-%m-%d").date()
                 for r in rows if r["date"]})
    maxd = ds[-1]
    lo = maxd - timedelta(days=days - 1)
    recent = [r for r in rows
              if r["date"] and datetime.strptime(r["date"], "%Y-%m-%d").date() >= lo]
    done = sum(1 for r in recent if r["done"])
    rate = round(done / len(recent), 2) if recent else 0.0
    out = [{"date": r["date"], "done": bool(r["done"]),
            "quality": r["quality"], "notes": r["notes"]} for r in recent]
    return out, rate


def current_pending_tasks(user_id, limit=10):
    """当前未完成任务的内容列表(给 System Adjuster 当 current_tasks)。"""
    with get_conn() as c:
        rows = c.execute(
            "SELECT t.content FROM task t JOIN goal g ON t.goal_id=g.id "
            "WHERE g.user_id=? AND t.status='pending' "
            "ORDER BY t.date DESC LIMIT ?", (user_id, limit)).fetchall()
    return [r["content"] for r in rows]


def add_memory(user_id, insight_type, content):
    mid = "mem_" + uuid4().hex[:10]
    with get_conn() as c:
        c.execute(
            "INSERT INTO memory(id,user_id,insight_type,content) VALUES(?,?,?,?)",
            (mid, user_id, insight_type, content))
        c.commit()
    return mid


# ---------- dashboard 聚合 ----------
def _streak(done_dates):
    """从最近一个 done 的日期往回数连续日历天数(每天至少完成1项)。"""
    if not done_dates:
        return 0
    days = sorted({datetime.strptime(d, "%Y-%m-%d").date()
                   for d in done_dates if d})
    if not days:
        return 0
    cur = days[-1]
    streak = 0
    for d in reversed(days):
        if d == cur:
            streak += 1
            cur = cur - timedelta(days=1)
        elif d < cur:
            break
    return streak


def dashboard(user_id):
    with get_conn() as c:
        user = c.execute("SELECT * FROM user WHERE id=?", (user_id,)).fetchone()
        if not user:
            return None
        rows = _rows(c.execute(
            "SELECT l.done, l.quality, l.date, g.category "
            "FROM behavior_log l "
            "JOIN task t ON l.task_id=t.id "
            "JOIN goal g ON t.goal_id=g.id "
            "WHERE g.user_id=?", (user_id,)).fetchall())

    user = _safe(user)
    total = len(rows)
    if total == 0:
        return {"user": user, "completion_rate": 0, "streak": 0,
                "total": 0, "done": 0, "avg_quality": 0,
                "categories": [], "recent_7d": {"rate": 0, "done": 0, "total": 0}}

    done = sum(r["done"] for r in rows)
    qs = [r["quality"] for r in rows if r["quality"] is not None]
    avg_q = round(sum(qs) / len(qs), 2) if qs else 0
    done_dates = [r["date"] for r in rows if r["done"]]

    cat = {}
    for r in rows:
        key = r["category"] or "其他"
        cat.setdefault(key, {"done": 0, "total": 0})
        cat[key]["total"] += 1
        cat[key]["done"] += r["done"]
    categories = [{"category": k, "rate": round(v["done"] / v["total"], 2),
                   "done": v["done"], "total": v["total"]} for k, v in cat.items()]

    all_days = [datetime.strptime(r["date"], "%Y-%m-%d").date()
                for r in rows if r["date"]]
    maxd = max(all_days)
    lo = maxd - timedelta(days=6)
    rec = [r for r in rows
           if r["date"] and datetime.strptime(r["date"], "%Y-%m-%d").date() >= lo]
    r_done = sum(r["done"] for r in rec)

    return {
        "user": user,
        "completion_rate": round(done / total, 2),
        "streak": _streak(done_dates),
        "total": total,
        "done": done,
        "avg_quality": avg_q,
        "categories": categories,
        "recent_7d": {"rate": round(r_done / len(rec), 2) if rec else 0,
                      "done": r_done, "total": len(rec),
                      "to": maxd.isoformat()},
    }
