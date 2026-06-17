# -*- coding: utf-8 -*-
"""Integration tests for main.py API routes using FastAPI TestClient.

Uses the same ``mem_db`` fixture so every test starts with a clean DB.
AI calls are forced to mock mode.
"""
import json
import sqlite3
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

import db as _db_mod
import ai_adapter
import main


@pytest.fixture()
def client(tmp_path):
    """Yield a TestClient wired to an ephemeral DB and mock AI."""
    db_file = tmp_path / "api_test.db"

    def _get_conn():
        conn = sqlite3.connect(str(db_file))
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        return conn

    with patch.object(_db_mod, "DB_PATH", db_file), \
         patch.object(_db_mod, "get_conn", _get_conn), \
         patch.dict("os.environ", {"AI_MOCK": "1"}, clear=False):
        _db_mod.init_db(reset=True)
        with TestClient(main.app, raise_server_exceptions=False) as c:
            yield c


# ====================== root / health =======================
class TestHealth:
    def test_root(self, client):
        r = client.get("/")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    def test_health(self, client):
        r = client.get("/api/health")
        assert r.status_code == 200


# ====================== users =======================
class TestUsersAPI:
    def test_register_and_login(self, client):
        r = client.post("/api/auth/register",
                        json={"name": "Test", "password": "pw"})
        assert r.status_code == 200
        uid = r.json()["id"]

        r = client.post("/api/auth/login",
                        json={"name": "Test", "password": "pw"})
        assert r.status_code == 200
        assert r.json()["id"] == uid

    def test_register_missing_fields(self, client):
        r = client.post("/api/auth/register", json={"name": ""})
        assert r.status_code == 400

    def test_register_duplicate(self, client):
        client.post("/api/auth/register",
                    json={"name": "Dup", "password": "pw"})
        r = client.post("/api/auth/register",
                        json={"name": "Dup", "password": "pw2"})
        assert r.status_code == 409

    def test_login_wrong_password(self, client):
        client.post("/api/auth/register",
                    json={"name": "X", "password": "pw"})
        r = client.post("/api/auth/login",
                        json={"name": "X", "password": "wrong"})
        assert r.status_code == 401

    def test_create_user_legacy(self, client):
        r = client.post("/api/users",
                        json={"name": "Legacy", "baseline": "b"})
        assert r.status_code == 200
        assert r.json()["name"] == "Legacy"

    def test_list_users(self, client):
        client.post("/api/auth/register",
                    json={"name": "A", "password": "pw"})
        r = client.get("/api/users")
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_get_user(self, client):
        reg = client.post("/api/auth/register",
                          json={"name": "U", "password": "pw"}).json()
        r = client.get(f"/api/users/{reg['id']}")
        assert r.status_code == 200
        assert r.json()["name"] == "U"

    def test_get_user_404(self, client):
        r = client.get("/api/users/nope")
        assert r.status_code == 404

    def test_update_user(self, client):
        reg = client.post("/api/auth/register",
                          json={"name": "Up", "password": "pw"}).json()
        r = client.put(f"/api/users/{reg['id']}",
                       json={"name": "Updated"})
        assert r.status_code == 200
        assert r.json()["name"] == "Updated"

    def test_update_user_404(self, client):
        r = client.put("/api/users/nope", json={"name": "X"})
        assert r.status_code == 404


# ====================== goals =======================
class TestGoalsAPI:
    def _register(self, client):
        return client.post("/api/auth/register",
                           json={"name": "G", "password": "pw"}).json()

    def test_create_goal(self, client):
        u = self._register(client)
        r = client.post("/api/goals",
                        json={"user_id": u["id"], "title": "Test Goal",
                              "category": "学习", "time_horizon": "1个月"})
        assert r.status_code == 200
        assert r.json()["title"] == "Test Goal"

    def test_list_goals(self, client):
        u = self._register(client)
        client.post("/api/goals",
                    json={"user_id": u["id"], "title": "G1"})
        r = client.get("/api/goals", params={"user_id": u["id"]})
        assert r.status_code == 200
        assert len(r.json()) == 1

    def test_get_goal(self, client):
        u = self._register(client)
        g = client.post("/api/goals",
                        json={"user_id": u["id"], "title": "G1"}).json()
        r = client.get(f"/api/goals/{g['id']}")
        assert r.status_code == 200

    def test_get_goal_404(self, client):
        r = client.get("/api/goals/nope")
        assert r.status_code == 404

    def test_delete_goal(self, client):
        u = self._register(client)
        g = client.post("/api/goals",
                        json={"user_id": u["id"], "title": "Del"}).json()
        r = client.delete(f"/api/goals/{g['id']}")
        assert r.status_code == 200
        assert r.json()["deleted"] is True

    def test_complete_goal(self, client):
        u = self._register(client)
        g = client.post("/api/goals",
                        json={"user_id": u["id"], "title": "C"}).json()
        r = client.post(f"/api/goals/{g['id']}/complete")
        assert r.status_code == 200
        assert r.json()["status"] == "done"

    def test_complete_goal_404(self, client):
        r = client.post("/api/goals/nope/complete")
        assert r.status_code == 404

    def test_plan_goal(self, client):
        u = self._register(client)
        g = client.post("/api/goals",
                        json={"user_id": u["id"], "title": "Plan"}).json()
        r = client.post(f"/api/goals/{g['id']}/plan", json={})
        assert r.status_code == 200
        assert "tasks" in r.json()

    def test_plan_goal_no_decomp(self, client):
        """Goal without decomposition should return 400."""
        u = self._register(client)
        # Insert a goal manually without decomposition
        from db import get_conn
        conn = get_conn()
        conn.execute(
            "INSERT INTO goal(id,user_id,title,status) VALUES(?,?,?,?)",
            ("g_raw", u["id"], "Raw", "active"))
        conn.commit()
        conn.close()
        r = client.post("/api/goals/g_raw/plan", json={})
        assert r.status_code == 400

    def test_check_due(self, client):
        u = self._register(client)
        r = client.post("/api/goals/check-due",
                        json={"user_id": u["id"], "date": "2026-06-01"})
        assert r.status_code == 200
        assert "newly_completed" in r.json()


# ====================== tasks =======================
class TestTasksAPI:
    def _setup(self, client):
        u = client.post("/api/auth/register",
                        json={"name": "T", "password": "pw"}).json()
        g = client.post("/api/goals",
                        json={"user_id": u["id"], "title": "TG"}).json()
        return u, g

    def test_create_task(self, client):
        u, g = self._setup(client)
        r = client.post("/api/tasks",
                        json={"goal_id": g["id"], "content": "Do X",
                              "date": "2026-06-10"})
        assert r.status_code == 200
        assert r.json()["content"] == "Do X"

    def test_create_task_no_goal(self, client):
        r = client.post("/api/tasks",
                        json={"goal_id": "nope", "content": "X"})
        assert r.status_code == 400

    def test_list_tasks(self, client):
        u, g = self._setup(client)
        client.post("/api/tasks",
                    json={"goal_id": g["id"], "content": "A"})
        r = client.get("/api/tasks", params={"goal_id": g["id"]})
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_get_task(self, client):
        u, g = self._setup(client)
        t = client.post("/api/tasks",
                        json={"goal_id": g["id"], "content": "B"}).json()
        r = client.get(f"/api/tasks/{t['id']}")
        assert r.status_code == 200

    def test_get_task_404(self, client):
        r = client.get("/api/tasks/nope")
        assert r.status_code == 404

    def test_update_task(self, client):
        u, g = self._setup(client)
        t = client.post("/api/tasks",
                        json={"goal_id": g["id"], "content": "C"}).json()
        r = client.put(f"/api/tasks/{t['id']}",
                       json={"content": "Updated"})
        assert r.status_code == 200
        assert r.json()["content"] == "Updated"

    def test_update_task_404(self, client):
        r = client.put("/api/tasks/nope", json={"content": "X"})
        assert r.status_code == 404

    def test_delete_task(self, client):
        u, g = self._setup(client)
        t = client.post("/api/tasks",
                        json={"goal_id": g["id"], "content": "D"}).json()
        r = client.delete(f"/api/tasks/{t['id']}")
        assert r.status_code == 200

    def test_checkin(self, client):
        u, g = self._setup(client)
        t = client.post("/api/tasks",
                        json={"goal_id": g["id"], "content": "E",
                              "date": "2026-06-10"}).json()
        r = client.post(f"/api/tasks/{t['id']}/checkin",
                        json={"done": True, "quality": 4, "notes": "ok"})
        assert r.status_code == 200
        assert r.json()["done"] == 1

    def test_checkin_404(self, client):
        r = client.post("/api/tasks/nope/checkin",
                        json={"done": True, "quality": 3})
        assert r.status_code == 404


# ====================== logs / memory =======================
class TestLogsAndMemoryAPI:
    def test_list_logs(self, client):
        r = client.get("/api/logs")
        assert r.status_code == 200

    def test_list_memory(self, client):
        r = client.get("/api/memory")
        assert r.status_code == 200


# ====================== analysis / adjust / save =======================
class TestAnalysisAPI:
    def _setup_with_logs(self, client):
        u = client.post("/api/auth/register",
                        json={"name": "An", "password": "pw"}).json()
        g = client.post("/api/goals",
                        json={"user_id": u["id"], "title": "AG"}).json()
        for i in range(3):
            t = client.post("/api/tasks",
                            json={"goal_id": g["id"], "content": f"T{i}",
                                  "date": f"2026-06-{10+i:02d}"}).json()
            client.post(f"/api/tasks/{t['id']}/checkin",
                        json={"done": True, "quality": 3, "notes": "ok"})
        return u

    def test_analysis_no_logs(self, client):
        u = client.post("/api/auth/register",
                        json={"name": "Empty", "password": "pw"}).json()
        r = client.get("/api/analysis", params={"user_id": u["id"]})
        assert r.status_code == 200
        assert r.json()["logs_count"] == 0

    def test_analysis_with_logs(self, client):
        u = self._setup_with_logs(client)
        r = client.get("/api/analysis", params={"user_id": u["id"]})
        assert r.status_code == 200
        assert r.json()["logs_count"] > 0
        assert "insights" in r.json()

    def test_adjust(self, client):
        u = self._setup_with_logs(client)
        r = client.post("/api/adjust",
                        params={"user_id": u["id"]},
                        json={})
        assert r.status_code == 200
        assert "adjustments" in r.json()

    def test_save_analysis(self, client):
        u = client.post("/api/auth/register",
                        json={"name": "Sav", "password": "pw"}).json()
        r = client.post("/api/analysis/save",
                        params={"user_id": u["id"]},
                        json={"insights": [{"insight_type": "x", "content": "y"}]})
        assert r.status_code == 200
        assert r.json()["saved"] == 1


# ====================== dashboard =======================
class TestDashboardAPI:
    def test_dashboard_empty(self, client):
        u = client.post("/api/auth/register",
                        json={"name": "Dash", "password": "pw"}).json()
        r = client.get("/api/dashboard", params={"user_id": u["id"]})
        assert r.status_code == 200
        assert r.json()["total"] == 0

    def test_dashboard_404(self, client):
        r = client.get("/api/dashboard", params={"user_id": "nope"})
        assert r.status_code == 404


# ====================== AI direct endpoints =======================
class TestAIEndpoints:
    def test_decompose(self, client):
        r = client.post("/api/ai/decompose",
                        json={"goal": "Test", "time_horizon": "1m"})
        assert r.status_code == 200
        assert "phases" in r.json()

    def test_plan(self, client):
        r = client.post("/api/ai/plan",
                        json={"goal_id": "g1", "phase": "P1"})
        assert r.status_code == 200
        assert "tasks" in r.json()

    def test_analyze(self, client):
        r = client.post("/api/ai/analyze",
                        json={"logs": [{"done": True}]})
        assert r.status_code == 200
        assert "insights" in r.json()

    def test_adjust_endpoint(self, client):
        r = client.post("/api/ai/adjust",
                        json={"completion_rate_7d": 0.5})
        assert r.status_code == 200
        assert "adjustments" in r.json()
