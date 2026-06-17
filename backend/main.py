# -*- coding: utf-8 -*-
"""Growth OS API(FastAPI)。
启动:  uvicorn main:app --app-dir backend --reload --port 8000
文档:  http://localhost:8000/docs
"""
from contextlib import asynccontextmanager
from datetime import date
from uuid import uuid4

import os

from fastapi import FastAPI, Depends, HTTPException, Query, Body, Request
from fastapi.responses import JSONResponse

import db
import crud
import schemas
import ai_adapter
import seed
import auth as auth_module

from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan(app):
    # 建表 IF NOT EXISTS + 迁移补列;幂等,每次启动都安全执行
    db.init_db()
    seed.seed_demo_if_empty()        # 空库(如全新部署)自动灌演示数据
    crud.ensure_demo_passwords()     # 无密码用户补默认密码 123456,方便演示登录
    yield


_is_production = os.getenv("RENDER", "") != "" or os.getenv("ENV", "") == "production"

app = FastAPI(
    title="Growth OS API",
    version="0.1.0",
    lifespan=lifespan,
    docs_url=None if _is_production else "/docs",
    redoc_url=None if _is_production else "/redoc",
)

_allowed_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------- Auth dependency ----------------
def get_current_user(request: Request):
    """Extract and validate token from Authorization header."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(401, "未登录:缺少有效的 Authorization header")
    token = auth_header[7:]
    user_id = auth_module.verify_token(token)
    if not user_id:
        raise HTTPException(401, "登录已过期,请重新登录")
    user = crud.get_user(user_id)
    if not user:
        raise HTTPException(401, "用户不存在")
    return user


# ---------------- Public endpoints ----------------
@app.get("/")
def root():
    return {"name": "Growth OS API", "status": "ok"}


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/auth/register")
def api_register(p: dict = Body(...)):
    name = (p.get("name") or "").strip()
    password = p.get("password") or ""
    if not name or not password:
        raise HTTPException(400, "需要用户名和密码")
    if len(name) > 50:
        raise HTTPException(400, "用户名过长(最多50字符)")
    if len(password) < 6:
        raise HTTPException(400, "密码至少6位")
    u = crud.register_user(name, (p.get("baseline") or "")[:500], password)
    if not u:
        raise HTTPException(409, "该用户名已被占用")
    token = auth_module.create_token(u["id"])
    return {**u, "token": token}


@app.post("/api/auth/login")
def api_login(p: dict = Body(...)):
    u = crud.login_user((p.get("name") or "").strip(), p.get("password") or "")
    if not u:
        raise HTTPException(401, "用户名或密码错误")
    token = auth_module.create_token(u["id"])
    return {**u, "token": token}


# ---------------- Protected endpoints (require auth) ----------------
@app.get("/api/users")
def api_users(me: dict = Depends(get_current_user)):
    """List users (authenticated only)."""
    return crud.list_users()


@app.post("/api/users")
def api_create_user(body: schemas.UserCreate, me: dict = Depends(get_current_user)):
    uid = f"user_{uuid4().hex[:8]}"
    return crud.create_user(uid, body.name, body.baseline or "")


@app.put("/api/users/{uid}")
def api_update_user(uid: str, p: dict = Body(...), me: dict = Depends(get_current_user)):
    """更新用户资料:baseline / tone / name。只能改自己的。"""
    if me["id"] != uid:
        raise HTTPException(403, "只能修改自己的资料")
    name = p.get("name")
    baseline = p.get("baseline")
    tone = p.get("tone")
    if name is not None and len(name) > 50:
        raise HTTPException(400, "用户名过长")
    if baseline is not None and len(baseline) > 500:
        raise HTTPException(400, "基础描述过长")
    if tone is not None and len(tone) > 20:
        raise HTTPException(400, "语气标签过长")
    u = crud.update_user(uid, name, baseline, tone)
    if not u:
        raise HTTPException(404, "user not found")
    return u


@app.get("/api/users/{uid}")
def api_user(uid: str, me: dict = Depends(get_current_user)):
    u = crud.get_user(uid)
    if not u:
        raise HTTPException(404, "user not found")
    return u


# ---------------- goals ----------------
@app.get("/api/goals")
def api_goals(user_id: str | None = Query(None), me: dict = Depends(get_current_user)):
    return crud.list_goals(user_id)


@app.get("/api/goals/{gid}")
def api_goal(gid: str, me: dict = Depends(get_current_user)):
    g = crud.get_goal(gid)
    if not g:
        raise HTTPException(404, "goal not found")
    return g


@app.delete("/api/goals/{gid}")
def api_delete_goal(gid: str, me: dict = Depends(get_current_user)):
    """删除目标(及其任务/日志),从每日生成池子移除。"""
    crud.delete_goal(gid)
    return {"deleted": True}


@app.post("/api/goals/{gid}/complete")
def api_complete_goal(gid: str, me: dict = Depends(get_current_user)):
    """标记目标完成(移入成就池,不再每天生成)。"""
    g = crud.complete_goal(gid)
    if not g:
        raise HTTPException(404, "goal not found")
    return g


@app.post("/api/goals/check-due")
def api_check_due(p: dict = Body(...), me: dict = Depends(get_current_user)):
    """检查并自动完成到期目标,返回本次刚完成的(前端用于弹窗提醒)。"""
    newly = crud.complete_due_goals(me["id"],
                                    p.get("date") or date.today().isoformat())
    return {"newly_completed": newly}


@app.post("/api/goals")
def api_create_goal(body: schemas.GoalCreate, me: dict = Depends(get_current_user)):
    """创建目标 → 自动调 Goal Decomposer → 拆解结果存进 goal.decomposition。"""
    gid = f"goal_{uuid4().hex[:8]}"
    user = crud.get_user(body.user_id)
    baseline = (user or {}).get("baseline", "")
    ai_goal = f"{body.title}（类别:{body.category}）" if body.category else body.title
    decomp = ai_adapter.goal_decomposer(ai_goal, body.time_horizon or "", baseline)
    return crud.create_goal(gid, body.user_id, body.title, body.category,
                            body.time_horizon, body.status, decomp,
                            start_date=body.start_date)


@app.post("/api/goals/{gid}/plan")
def api_plan_goal(gid: str, p: dict = Body(default={}), me: dict = Depends(get_current_user)):
    """根据目标拆解的【第一阶段】调 Daily Planner → 生成任务入库。"""
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
    me: dict = Depends(get_current_user),
):
    return crud.list_tasks(goal_id, date, user_id)


@app.get("/api/tasks/{tid}")
def api_task(tid: str, me: dict = Depends(get_current_user)):
    t = crud.get_task(tid)
    if not t:
        raise HTTPException(404, "task not found")
    return t


@app.post("/api/tasks/{tid}/checkin")
def api_checkin(tid: str, body: schemas.CheckIn, me: dict = Depends(get_current_user)):
    log = crud.checkin(tid, body.done, body.quality, body.notes)
    if log is None:
        raise HTTPException(404, "task not found")
    return log


@app.post("/api/tasks")
def api_create_task(p: dict = Body(...), me: dict = Depends(get_current_user)):
    """用户新增自己的任务。"""
    gid = p.get("goal_id")
    if not gid or not crud.get_goal(gid):
        raise HTTPException(400, "需要有效的 goal_id")
    content = (p.get("content") or "")[:500]
    difficulty = p.get("difficulty", "中")
    if difficulty not in ("低", "中", "高"):
        difficulty = "中"
    return crud.create_task(gid, p.get("date") or date.today().isoformat(),
                            content, difficulty)


@app.put("/api/tasks/{tid}")
def api_update_task(tid: str, p: dict = Body(...), me: dict = Depends(get_current_user)):
    content = p.get("content")
    if content is not None and len(content) > 500:
        raise HTTPException(400, "任务内容过长")
    difficulty = p.get("difficulty")
    if difficulty is not None and difficulty not in ("低", "中", "高"):
        raise HTTPException(400, "难度必须为 低/中/高")
    status = p.get("status")
    if status is not None and status not in ("pending", "completed", "skipped"):
        raise HTTPException(400, "状态无效")
    t = crud.update_task(tid, content, difficulty, status)
    if not t:
        raise HTTPException(404, "task not found")
    return t


@app.delete("/api/tasks/{tid}")
def api_delete_task(tid: str, me: dict = Depends(get_current_user)):
    return {"deleted": crud.delete_task(tid)}


# ---------------- behavior logs ----------------
@app.get("/api/logs")
def api_logs(
    task_id: str | None = Query(None),
    user_id: str | None = Query(None),
    me: dict = Depends(get_current_user),
):
    return crud.list_logs(task_id, user_id)


# ---------------- memory ----------------
@app.get("/api/memory")
def api_memory(user_id: str | None = Query(None), me: dict = Depends(get_current_user)):
    return crud.list_memory(user_id)


# ---------------- 反馈系统:分析 / 调整 / 沉淀 ----------------
@app.get("/api/analysis")
def api_analysis(user_id: str = Query(...), me: dict = Depends(get_current_user)):
    """近 7 天行为 → Behavior Analyst → 规律/障碍/洞察。"""
    logs, rate = crud.recent_logs(user_id)
    if not logs:
        return {"completion_rate_7d": 0, "logs_count": 0, "insights": []}
    res = ai_adapter.behavior_analyst(logs)
    return {"completion_rate_7d": rate, "logs_count": len(logs),
            "insights": res.get("insights", [])}


@app.post("/api/adjust")
def api_adjust(user_id: str = Query(...), p: dict = Body(default={}),
              me: dict = Depends(get_current_user)):
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
def api_save_analysis(user_id: str = Query(...), p: dict = Body(...),
                     me: dict = Depends(get_current_user)):
    """把分析洞察写入 memory(复利沉淀)。"""
    insights = p.get("insights", [])
    if len(insights) > 50:
        raise HTTPException(400, "单次最多保存50条洞察")
    for ins in insights:
        crud.add_memory(user_id, (ins.get("insight_type") or "洞察")[:50],
                        (ins.get("content") or "")[:1000])
    return {"saved": len(insights)}


# ---------------- dashboard ----------------
@app.get("/api/dashboard")
def api_dashboard(user_id: str = Query(...), me: dict = Depends(get_current_user)):
    d = crud.dashboard(user_id)
    if d is None:
        raise HTTPException(404, "user not found")
    return d


# ---------------- AI(4 个 Prompt 函数)----------------
@app.post("/api/ai/decompose")
def ai_decompose(p: dict = Body(...), me: dict = Depends(get_current_user)):
    return ai_adapter.goal_decomposer(
        p.get("goal", ""), p.get("time_horizon", ""), p.get("user_baseline", ""))


@app.post("/api/ai/plan")
def ai_plan(p: dict = Body(...), me: dict = Depends(get_current_user)):
    return ai_adapter.daily_planner(
        p.get("goal_id", ""), p.get("phase", ""),
        p.get("yesterday_tasks", []), p.get("user_baseline", ""))


@app.post("/api/ai/analyze")
def ai_analyze(p: dict = Body(...), me: dict = Depends(get_current_user)):
    return ai_adapter.behavior_analyst(p.get("logs", []))


@app.post("/api/ai/adjust")
def ai_adjust(p: dict = Body(...), me: dict = Depends(get_current_user)):
    return ai_adapter.system_adjuster(
        p.get("completion_rate_7d", 0), p.get("insights", []),
        p.get("current_tasks", []))
