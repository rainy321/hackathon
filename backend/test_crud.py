# -*- coding: utf-8 -*-
"""Unit tests for crud.py — all DB-backed business logic.

Each test receives a fresh ephemeral DB via the ``mem_db`` fixture
(see conftest.py), so tests are fully isolated.
"""
import json

import crud
import auth


# ====================== helpers =======================
def _make_user(mem_db, uid="u1", name="Alice", baseline="beginner"):
    conn = mem_db()
    conn.execute("INSERT INTO user(id,name,baseline) VALUES(?,?,?)",
                 (uid, name, baseline))
    conn.commit()
    conn.close()


def _make_goal(mem_db, gid="g1", uid="u1", title="Learn Python",
               category="学习", time_horizon="3个月", status="active",
               decomp=None, start_date="2026-01-01"):
    conn = mem_db()
    d = json.dumps(decomp, ensure_ascii=False) if decomp else None
    conn.execute(
        "INSERT INTO goal(id,user_id,title,category,time_horizon,status,decomposition,created_at) "
        "VALUES(?,?,?,?,?,?,?,?)",
        (gid, uid, title, category, time_horizon, status, d, start_date))
    conn.commit()
    conn.close()


def _make_task(mem_db, tid="t1", gid="g1", date="2026-06-10",
               content="Read chapter 1", difficulty="中", status="pending"):
    conn = mem_db()
    conn.execute(
        "INSERT INTO task(id,goal_id,date,content,difficulty,status) VALUES(?,?,?,?,?,?)",
        (tid, gid, date, content, difficulty, status))
    conn.commit()
    conn.close()


def _make_log(mem_db, lid="l1", tid="t1", date="2026-06-10",
              done=1, quality=4, notes="good"):
    conn = mem_db()
    conn.execute(
        "INSERT INTO behavior_log(id,task_id,date,done,quality,notes) VALUES(?,?,?,?,?,?)",
        (lid, tid, date, done, quality, notes))
    conn.commit()
    conn.close()


# ====================== _rows / _safe =======================
class TestHelpers:
    def test_safe_strips_password(self, mem_db):
        _make_user(mem_db)
        conn = mem_db()
        conn.execute("UPDATE user SET password='secret' WHERE id='u1'")
        conn.commit()
        row = conn.execute("SELECT * FROM user WHERE id='u1'").fetchone()
        conn.close()
        safe = crud._safe(row)
        assert "password" not in safe
        assert safe["name"] == "Alice"


# ====================== user CRUD =======================
class TestUserCRUD:
    def test_list_users(self, mem_db):
        _make_user(mem_db, "u1", "Alice")
        _make_user(mem_db, "u2", "Bob")
        users = crud.list_users()
        assert len(users) == 2
        assert all("password" not in u for u in users)

    def test_get_user_exists(self, mem_db):
        _make_user(mem_db)
        u = crud.get_user("u1")
        assert u["name"] == "Alice"

    def test_get_user_not_found(self, mem_db):
        assert crud.get_user("nope") is None

    def test_create_user(self, mem_db):
        u = crud.create_user("u1", "Carol", "intermediate")
        assert u["id"] == "u1"
        assert u["name"] == "Carol"

    def test_register_user(self, mem_db):
        u = crud.register_user("Dave", "new", "pass123")
        assert u is not None
        assert u["name"] == "Dave"
        assert "password" not in u

    def test_register_duplicate_name(self, mem_db):
        crud.register_user("Same", "", "pw")
        assert crud.register_user("Same", "", "pw2") is None

    def test_login_user_success(self, mem_db):
        crud.register_user("Eve", "", "mypass")
        u = crud.login_user("Eve", "mypass")
        assert u is not None
        assert u["name"] == "Eve"

    def test_login_user_wrong_password(self, mem_db):
        crud.register_user("Eve", "", "mypass")
        assert crud.login_user("Eve", "wrong") is None

    def test_login_user_nonexistent(self, mem_db):
        assert crud.login_user("ghost", "pw") is None

    def test_update_user(self, mem_db):
        _make_user(mem_db)
        u = crud.update_user("u1", name="Alice2", baseline="adv", tone="严格教练")
        assert u["name"] == "Alice2"
        assert u["baseline"] == "adv"
        assert u["tone"] == "严格教练"

    def test_update_user_not_found(self, mem_db):
        assert crud.update_user("nope", name="X") is None

    def test_ensure_demo_passwords(self, mem_db):
        _make_user(mem_db)
        crud.ensure_demo_passwords("demo")
        u = crud.login_user("Alice", "demo")
        assert u is not None


# ====================== goal CRUD =======================
class TestGoalCRUD:
    def test_list_goals_all(self, mem_db):
        _make_user(mem_db)
        _make_goal(mem_db, "g1")
        _make_goal(mem_db, "g2", title="Stay Fit")
        goals = crud.list_goals()
        assert len(goals) == 2

    def test_list_goals_by_user(self, mem_db):
        _make_user(mem_db, "u1")
        _make_user(mem_db, "u2", "Bob")
        _make_goal(mem_db, "g1", "u1")
        _make_goal(mem_db, "g2", "u2")
        assert len(crud.list_goals("u1")) == 1

    def test_get_goal(self, mem_db):
        _make_user(mem_db)
        _make_goal(mem_db)
        g = crud.get_goal("g1")
        assert g["title"] == "Learn Python"

    def test_get_goal_not_found(self, mem_db):
        assert crud.get_goal("nope") is None

    def test_create_goal_with_decomposition(self, mem_db):
        _make_user(mem_db)
        decomp = {"phases": [{"name": "A"}]}
        g = crud.create_goal("g1", "u1", "Goal", "学习", "1个月", "active", decomp)
        assert g["decomposition"]["phases"][0]["name"] == "A"

    def test_delete_goal_cascades(self, mem_db):
        _make_user(mem_db)
        _make_goal(mem_db)
        _make_task(mem_db)
        _make_log(mem_db)
        crud.delete_goal("g1")
        assert crud.get_goal("g1") is None
        assert crud.get_task("t1") is None

    def test_complete_goal(self, mem_db):
        _make_user(mem_db)
        _make_goal(mem_db)
        g = crud.complete_goal("g1")
        assert g["status"] == "done"

    def test_complete_goal_not_found(self, mem_db):
        assert crud.complete_goal("nope") is None


# ====================== horizon / days-left =======================
class TestHorizonAndDaysLeft:
    def test_horizon_to_days_months(self):
        assert crud.horizon_to_days("3个月") == 90

    def test_horizon_to_days_weeks(self):
        assert crud.horizon_to_days("2周") == 14

    def test_horizon_to_days_year(self):
        assert crud.horizon_to_days("1年") == 365

    def test_horizon_to_days_english(self):
        assert crud.horizon_to_days("2 months") == 60
        assert crud.horizon_to_days("1 week") == 7

    def test_horizon_to_days_none(self):
        assert crud.horizon_to_days(None) == 30
        assert crud.horizon_to_days("") == 30

    def test_goal_days_left(self, mem_db):
        _make_user(mem_db)
        _make_goal(mem_db, start_date="2026-06-01", time_horizon="1个月")
        g = crud.get_goal("g1")
        left = crud.goal_days_left(g, "2026-06-15")
        assert left == 16  # start(Jun 1) + 30 days = Jul 1; Jul 1 - Jun 15 = 16

    def test_goal_days_left_no_start(self, mem_db):
        _make_user(mem_db)
        _make_goal(mem_db, start_date=None)
        g = crud.get_goal("g1")
        assert crud.goal_days_left(g, "2026-06-15") is None


class TestCompleteDueGoals:
    def test_completes_overdue_goals(self, mem_db):
        _make_user(mem_db)
        _make_goal(mem_db, start_date="2026-01-01", time_horizon="1个月")
        newly = crud.complete_due_goals("u1", "2026-06-01")
        assert len(newly) == 1
        g = crud.get_goal("g1")
        assert g["status"] == "done"

    def test_does_not_complete_active_goal(self, mem_db):
        _make_user(mem_db)
        _make_goal(mem_db, start_date="2026-06-01", time_horizon="3个月")
        newly = crud.complete_due_goals("u1", "2026-06-15")
        assert len(newly) == 0


# ====================== goal decomposition / plan inputs =======================
class TestGoalDecomposition:
    def test_returns_phases(self, mem_db):
        _make_user(mem_db)
        decomp = {"phases": [{"name": "Phase1", "tasks": ["a", "b"]}]}
        _make_goal(mem_db, decomp=decomp)
        g, phases = crud.goal_decomposition("g1")
        assert len(phases) == 1
        assert phases[0]["name"] == "Phase1"

    def test_no_decomposition(self, mem_db):
        _make_user(mem_db)
        _make_goal(mem_db)
        g, phases = crud.goal_decomposition("g1")
        assert phases is None

    def test_not_found(self, mem_db):
        g, phases = crud.goal_decomposition("nope")
        assert g is None

    def test_plan_inputs(self, mem_db):
        _make_user(mem_db, baseline="beginner")
        decomp = {"phases": [{"name": "P1", "tasks": ["t"]}]}
        _make_goal(mem_db, decomp=decomp)
        info = crud.plan_inputs("g1")
        assert info["phase"]["name"] == "P1"
        assert info["baseline"] == "beginner"

    def test_plan_inputs_no_decomp(self, mem_db):
        _make_user(mem_db)
        _make_goal(mem_db)
        assert crud.plan_inputs("g1") is None


# ====================== task CRUD =======================
class TestTaskCRUD:
    def test_list_tasks_by_goal(self, mem_db):
        _make_user(mem_db)
        _make_goal(mem_db)
        _make_task(mem_db, "t1")
        _make_task(mem_db, "t2", content="Review notes")
        tasks = crud.list_tasks(goal_id="g1")
        assert len(tasks) == 2

    def test_list_tasks_by_date(self, mem_db):
        _make_user(mem_db)
        _make_goal(mem_db)
        _make_task(mem_db, "t1", date="2026-06-10")
        _make_task(mem_db, "t2", date="2026-06-11")
        tasks = crud.list_tasks(date="2026-06-10")
        assert len(tasks) == 1

    def test_list_tasks_by_user(self, mem_db):
        _make_user(mem_db, "u1")
        _make_user(mem_db, "u2", "Bob")
        _make_goal(mem_db, "g1", "u1")
        _make_goal(mem_db, "g2", "u2", title="Fit")
        _make_task(mem_db, "t1", gid="g1")
        _make_task(mem_db, "t2", gid="g2")
        tasks = crud.list_tasks(user_id="u1")
        assert len(tasks) == 1

    def test_get_task(self, mem_db):
        _make_user(mem_db)
        _make_goal(mem_db)
        _make_task(mem_db)
        t = crud.get_task("t1")
        assert t["content"] == "Read chapter 1"

    def test_create_task(self, mem_db):
        _make_user(mem_db)
        _make_goal(mem_db)
        t = crud.create_task("g1", "2026-06-10", "New task", "高")
        assert t["content"] == "New task"
        assert t["difficulty"] == "高"

    def test_update_task(self, mem_db):
        _make_user(mem_db)
        _make_goal(mem_db)
        _make_task(mem_db)
        t = crud.update_task("t1", content="Updated", status="completed")
        assert t["content"] == "Updated"
        assert t["status"] == "completed"

    def test_update_task_not_found(self, mem_db):
        assert crud.update_task("nope") is None

    def test_delete_task(self, mem_db):
        _make_user(mem_db)
        _make_goal(mem_db)
        _make_task(mem_db)
        _make_log(mem_db)
        crud.delete_task("t1")
        assert crud.get_task("t1") is None

    def test_insert_tasks(self, mem_db):
        _make_user(mem_db)
        _make_goal(mem_db)
        tasks = [{"content": "A", "difficulty": "低"},
                 {"content": "B", "difficulty": "高"}]
        created = crud.insert_tasks("g1", tasks, "2026-06-10")
        assert len(created) == 2
        assert created[0]["status"] == "pending"

    def test_insert_tasks_replaces_pending(self, mem_db):
        _make_user(mem_db)
        _make_goal(mem_db)
        _make_task(mem_db, date="2026-06-10")  # existing pending
        tasks = [{"content": "New", "difficulty": "低"}]
        created = crud.insert_tasks("g1", tasks, "2026-06-10")
        assert len(created) == 1
        all_tasks = crud.list_tasks(goal_id="g1", date="2026-06-10")
        assert len(all_tasks) == 1


# ====================== checkin / behavior_log =======================
class TestCheckin:
    def test_checkin_creates_log(self, mem_db):
        _make_user(mem_db)
        _make_goal(mem_db)
        _make_task(mem_db)
        log = crud.checkin("t1", True, 4, "Great")
        assert log["done"] == 1
        assert log["quality"] == 4
        assert log["notes"] == "Great"

    def test_checkin_updates_task_status(self, mem_db):
        _make_user(mem_db)
        _make_goal(mem_db)
        _make_task(mem_db)
        crud.checkin("t1", True, 5, "")
        t = crud.get_task("t1")
        assert t["status"] == "completed"

    def test_checkin_skip(self, mem_db):
        _make_user(mem_db)
        _make_goal(mem_db)
        _make_task(mem_db)
        crud.checkin("t1", False, 2, "tired")
        t = crud.get_task("t1")
        assert t["status"] == "skipped"

    def test_checkin_upsert(self, mem_db):
        _make_user(mem_db)
        _make_goal(mem_db)
        _make_task(mem_db)
        crud.checkin("t1", True, 3, "first")
        log = crud.checkin("t1", False, 1, "updated")
        assert log["done"] == 0
        assert log["notes"] == "updated"

    def test_checkin_task_not_found(self, mem_db):
        assert crud.checkin("nope", True, 3, "") is None

    def test_list_logs(self, mem_db):
        _make_user(mem_db)
        _make_goal(mem_db)
        _make_task(mem_db)
        _make_log(mem_db)
        logs = crud.list_logs(task_id="t1")
        assert len(logs) == 1

    def test_list_logs_by_user(self, mem_db):
        _make_user(mem_db)
        _make_goal(mem_db)
        _make_task(mem_db)
        _make_log(mem_db)
        logs = crud.list_logs(user_id="u1")
        assert len(logs) == 1


# ====================== memory =======================
class TestMemory:
    def test_add_and_list_memory(self, mem_db):
        _make_user(mem_db)
        crud.add_memory("u1", "洞察", "Some insight")
        mems = crud.list_memory("u1")
        assert len(mems) == 1
        assert mems[0]["content"] == "Some insight"

    def test_list_memory_all(self, mem_db):
        _make_user(mem_db, "u1")
        _make_user(mem_db, "u2", "Bob")
        crud.add_memory("u1", "x", "a")
        crud.add_memory("u2", "y", "b")
        assert len(crud.list_memory()) == 2


# ====================== recent_logs =======================
class TestRecentLogs:
    def test_recent_logs_with_data(self, mem_db):
        _make_user(mem_db)
        _make_goal(mem_db)
        for i in range(10):
            d = f"2026-06-{10+i:02d}"
            tid = f"t{i}"
            _make_task(mem_db, tid, date=d)
            _make_log(mem_db, f"l{i}", tid, date=d, done=1 if i % 2 == 0 else 0)
        logs, rate = crud.recent_logs("u1", days=7)
        assert len(logs) > 0
        assert 0 <= rate <= 1

    def test_recent_logs_empty(self, mem_db):
        _make_user(mem_db)
        logs, rate = crud.recent_logs("u1")
        assert logs == []
        assert rate == 0.0


class TestCurrentPendingTasks:
    def test_returns_pending_content(self, mem_db):
        _make_user(mem_db)
        _make_goal(mem_db)
        _make_task(mem_db, "t1", status="pending", content="A")
        _make_task(mem_db, "t2", status="completed", content="B")
        pending = crud.current_pending_tasks("u1")
        assert "A" in pending
        assert "B" not in pending


# ====================== dashboard / streak =======================
class TestStreak:
    def test_streak_consecutive(self):
        dates = ["2026-06-08", "2026-06-09", "2026-06-10"]
        assert crud._streak(dates) == 3

    def test_streak_gap(self):
        dates = ["2026-06-08", "2026-06-10"]
        assert crud._streak(dates) == 1

    def test_streak_empty(self):
        assert crud._streak([]) == 0

    def test_streak_single(self):
        assert crud._streak(["2026-06-10"]) == 1


class TestDashboard:
    def test_dashboard_with_data(self, mem_db):
        _make_user(mem_db)
        _make_goal(mem_db)
        for i in range(5):
            d = f"2026-06-{10+i:02d}"
            tid = f"t{i}"
            _make_task(mem_db, tid, date=d)
            _make_log(mem_db, f"l{i}", tid, date=d,
                      done=1 if i < 3 else 0, quality=i+1)
        dash = crud.dashboard("u1")
        assert dash["total"] == 5
        assert dash["done"] == 3
        assert dash["streak"] >= 1
        assert "categories" in dash
        assert "recent_7d" in dash

    def test_dashboard_no_logs(self, mem_db):
        _make_user(mem_db)
        dash = crud.dashboard("u1")
        assert dash["total"] == 0
        assert dash["streak"] == 0

    def test_dashboard_user_not_found(self, mem_db):
        assert crud.dashboard("nope") is None
