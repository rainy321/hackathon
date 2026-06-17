# -*- coding: utf-8 -*-
"""Growth OS API(FastAPI)。
启动:  uvicorn main:app --app-dir backend --reload --port 8000
文档:  http://localhost:8000/docs
"""
from contextlib import asynccontextmanager
from datetime import date
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Query, Body

import db
import crud
import schemas
import ai_adapter
import seed

from fastapi.middleware.cors import CORSMiddleware


def _get_or_404(getter, pk, label):
    """Call getter(pk); raise 404 if None."""
    obj = getter(pk)
    if not obj:
        raise HTTPException(404, f"{label} not found")
    return obj


@asynccontextmanager
async def lifespan(app):
    # 建表 IF NOT EXISTS + 迁移补列;幂等,每次启动都安全执行
    db.init_db()
    seed.seed_demo_if_empty()        # 空库(如全新部署)自动灌演示数据
    crud.ensure_demo_passwords()     # 无密码用户补默认密码 123456,方便演示登录
    yield


app = FastAPI(title="Growth OS API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"name": "Growth OS API", "status": "ok", "docs": "/docs"}


@app.get("/api/health")
def health():
    return {"status": "ok"}


# ---------------- users ----------------
@app.get("/api/users")
def api_users():
    return crud.list_users()


@app.post("/api/auth/register")
def api_register(p: dict = Body(...)):
    name = (p.get("name") or "").strip()
    if not name or not p.get("password"):
        raise HTTPException(400, "需要用户名和密码")
    u = crud.register_user(name, p.get("baseline") or "", p.get("password"))
    if not u:
        raise HTTPException(409, "该用户名已被占用")
    return u


@app.post("/api/auth/login")
def api_login(p: dict = Body(...)):
    u = crud.login_user((p.get("name") or "").strip(), p.get("password") or "")
    if not u:
        raise HTTPException(401, "用户名或密码错误")
    return u


@app.post("/api/users")
def api_create_user(body: schemas.UserCreate):
    uid = f"user_{uuid4().hex[:8]}"
    return crud.create_user(uid, body.name, body.baseline or "")


@app.put("/api/users/{uid}")
def api_update_user(uid: str, p: dict = Body(...)):
    """更新用户资料:baseline / tone / name。"""
    return _get_or_404(
        lambda pk: crud.update_user(pk, p.get("name"), p.get("baseline"), p.get("tone")),
        uid, "user")


@app.get("/api/users/{uid}")
def api_user(uid: str):
    return _get_or_404(crud.get_user, uid, "user")


# ---------------- goals ----------------
@app.get("/api/goals")
def api_goals(user_id: str | None = Query(None)):
    return crud.list_goals(user_id)


@app.get("/api/goals/{gid}")
def api_goal(gid: str):
    return _get_or_404(crud.get_goal, gid, "goal")


@app.delete("/api/goals/{gid}")
def api_delete_goal(gid: str):
    """删除目标(及其任务/日志),从每日生成池子移除。"""
    crud.delete_goal(gid)
    return {"deleted": True}


@app.post("/api/goals/{gid}/complete")
def api_complete_goal(gid: str):
    """标记目标完成(移入成就池,不再每天生成)。"""
    return _get_or_404(crud.complete_goal, gid, "goal")


@app.post("/api/goals/check-due")
def api_check_due(p: dict = Body(...)):
    """检查并自动完成到期目标,返回本次刚完成的(前端用于弹窗提醒)。"""
    newly = crud.complete_due_goals(p.get("user_id"),
                                    p.get("date") or date.today().isoformat())
    return {"newly_completed": newly}


@app.post("/api/goals")
def api_create_goal(body: schemas.GoalCreate):
    """创建目标 → 自动调 Goal Decomposer → 拆解结果存进 goal.decomposition。"""
    gid = f"goal_{uuid4().hex[:8]}"
    user = crud.get_user(body.user_id)
    baseline = (user or {}).get("baseline", "")
    # 把类别带进 AI(让不同类别拆解有差异);存库的标题保持干净
    ai_goal = f"{body.title}（类别:{body.category}）" if body.category else body.title
    decomp = ai_adapter.goal_decomposer(ai_goal, body.time_horizon or "", baseline)
    return crud.create_goal(gid, body.user_id, body.title, body.category,
                            body.time_horizon, body.status, decomp,
                            start_date=body.start_date)


@app.post("/api/goals/{gid}/plan")
def api_plan_goal(gid: str, p: dict = Body(default={})):
    """根据目标拆解的【第一阶段】调 Daily Planner → 生成任务入库。
    body 可带 date(YYYY-MM-DD),用于演示模式的模拟日期;缺省用真实今天。"""
    info = crud.plan_inputs(gid)
    if not info:
        raise HTTPException(400, "目标不存在或尚未拆解,无法生成任务")
    plan = ai_adapter.daily_planner(
        gid, info["phase"].get("name", ""), [], info["baseline"],
        goal=info["goal"]["title"],
        phase_tasks=info["phase"].get("tasks", []))
    day = p.get("date") or date.today().isoformat()
    tasks = crud.insert_tasks(gid, plan.get("tasks", []), day)
    return {"goal_id": gid, "phase": info["phase"].get("name", ""),
            "date": day, "tasks": tasks}


# ---------------- tasks ----------------
@app.get("/api/tasks")
def api_tasks(
    goal_id: str | None = Query(None),
    date: str | None = Query(None),
    user_id: str | None = Query(None),
):
    return crud.list_tasks(goal_id, date, user_id)


@app.get("/api/tasks/{tid}")
def api_task(tid: str):
    return _get_or_404(crud.get_task, tid, "task")


@app.post("/api/tasks/{tid}/checkin")
def api_checkin(tid: str, body: schemas.CheckIn):
    log = crud.checkin(tid, body.done, body.quality, body.notes)
    if log is None:
        raise HTTPException(404, "task not found")
    return log


@app.post("/api/tasks")
def api_create_task(p: dict = Body(...)):
    """用户新增自己的任务。"""
    gid = p.get("goal_id")
    if not gid or not crud.get_goal(gid):
        raise HTTPException(400, "需要有效的 goal_id")
    return crud.create_task(gid, p.get("date") or date.today().isoformat(),
                            p.get("content", ""), p.get("difficulty", "中"))


@app.put("/api/tasks/{tid}")
def api_update_task(tid: str, p: dict = Body(...)):
    return _get_or_404(
        lambda pk: crud.update_task(pk, p.get("content"), p.get("difficulty"), p.get("status")),
        tid, "task")


@app.delete("/api/tasks/{tid}")
def api_delete_task(tid: str):
    return {"deleted": crud.delete_task(tid)}


# ---------------- behavior logs ----------------
@app.get("/api/logs")
def api_logs(
    task_id: str | None = Query(None),
    user_id: str | None = Query(None),
):
    return crud.list_logs(task_id, user_id)


# ---------------- memory ----------------
@app.get("/api/memory")
def api_memory(user_id: str | None = Query(None)):
    return crud.list_memory(user_id)


# ---------------- 反馈系统:分析 / 调整 / 沉淀 ----------------
@app.get("/api/analysis")
def api_analysis(user_id: str = Query(...)):
    """近 7 天行为 → Behavior Analyst → 规律/障碍/洞察。"""
    logs, rate = crud.recent_logs(user_id)
    if not logs:
        return {"completion_rate_7d": 0, "logs_count": 0, "insights": []}
    res = ai_adapter.behavior_analyst(logs)
    return {"completion_rate_7d": rate, "logs_count": len(logs),
            "insights": res.get("insights", [])}


@app.post("/api/adjust")
def api_adjust(user_id: str = Query(...), p: dict = Body(default={})):
    """完成率 + 洞察 + 当前任务 → System Adjuster → 动态调整建议。"""
    logs, rate = crud.recent_logs(user_id)
    insights = p.get("insights")
    if insights is None:
        insights = (ai_adapter.behavior_analyst(logs).get("insights", [])
                    if logs else [])
    current = crud.current_pending_tasks(user_id)
    res = ai_adapter.system_adjuster(rate, insights, current)
    return {"completion_rate_7d": rate, "current_tasks": current,
            "adjustments": res.get("adjustments", res)}


@app.post("/api/analysis/save")
def api_save_analysis(user_id: str = Query(...), p: dict = Body(...)):
    """把分析洞察写入 memory(复利沉淀)。"""
    insights = p.get("insights", [])
    for ins in insights:
        crud.add_memory(user_id, ins.get("insight_type", "洞察"),
                        ins.get("content", ""))
    return {"saved": len(insights)}


# ---------------- dashboard ----------------
@app.get("/api/dashboard")
def api_dashboard(user_id: str = Query(...)):
    d = crud.dashboard(user_id)
    if d is None:
        raise HTTPException(404, "user not found")
    return d


# ---------------- AI(4 个 Prompt 函数)----------------
@app.post("/api/ai/decompose")
def ai_decompose(p: dict = Body(...)):
    return ai_adapter.goal_decomposer(
        p.get("goal", ""), p.get("time_horizon", ""), p.get("user_baseline", ""))


@app.post("/api/ai/plan")
def ai_plan(p: dict = Body(...)):
    return ai_adapter.daily_planner(
        p.get("goal_id", ""), p.get("phase", ""),
        p.get("yesterday_tasks", []), p.get("user_baseline", ""))


@app.post("/api/ai/analyze")
def ai_analyze(p: dict = Body(...)):
    return ai_adapter.behavior_analyst(p.get("logs", []))


@app.post("/api/ai/adjust")
def ai_adjust(p: dict = Body(...)):
    return ai_adapter.system_adjuster(
        p.get("completion_rate_7d", 0), p.get("insights", []),
        p.get("current_tasks", []))
