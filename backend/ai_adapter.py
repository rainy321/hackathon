# -*- coding: utf-8 -*-
"""AI Adapter:单 Agent + 4 个 Prompt 函数。
- Prompt 文本从 ../prompts/*.txt 读取(队友维护,改 prompt 不动代码)。
- 调用模式:system=Prompt 全文,user=输入 JSON。Prompt 本身要求只输出合法 JSON。
- 配置走 backend/.env(见数据契约)。没 key 或 AI_MOCK=1 时走 Mock,整个闭环可离线跑。
"""
import json
import os
import re
import urllib.request
import urllib.error
from pathlib import Path

BACKEND = Path(__file__).resolve().parent
PROMPTS_DIR = BACKEND.parent / "prompts"
ENV_FILE = BACKEND / ".env"

DEFAULT_BASE_URL = "https://open.bigmodel.cn/api/paas/v4"
DEFAULT_MODEL = "glm-4-flashx"   # flash 比 flashx 慢约 4 倍,用 flashx 避免代理超时 504


# ---------------- 配置 ----------------
def _load_env_file():
    env = {}
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def get_config():
    # 真实环境变量优先于 .env 文件
    e = {**_load_env_file(), **os.environ}
    return {
        "api_key": e.get("GLM_API_KEY", ""),
        "base_url": e.get("GLM_BASE_URL", DEFAULT_BASE_URL),
        "model": e.get("GLM_MODEL", DEFAULT_MODEL),
        "mock": e.get("AI_MOCK", "").lower() in ("1", "true", "yes"),
    }


# ---------------- prompt 加载 ----------------
def load_prompt(name):
    """name 如 '01_goal_decomposer' -> 读 prompts/01_goal_decomposer.txt"""
    p = PROMPTS_DIR / f"{name}.txt"
    return p.read_text(encoding="utf-8")


# ---------------- LLM 调用(OpenAI 兼容) ----------------
def call_llm(messages, model=None, temperature=0.7, timeout=40):
    cfg = get_config()
    url = cfg["base_url"].rstrip("/") + "/chat/completions"
    payload = {
        "model": model or cfg["model"],
        "messages": messages,
        "temperature": temperature,
    }
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        url, data=data,
        headers={"Authorization": "Bearer " + cfg["api_key"],
                 "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")
        raise RuntimeError(f"LLM HTTP {e.code}: {detail}") from None
    return body["choices"][0]["message"]["content"]


def parse_json_text(text):
    """从模型输出里稳健提取 JSON(去代码围栏、抓首个对象/数组)。"""
    text = (text or "").strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\n?", "", text)
        text = re.sub(r"\n?```$", "", text).strip()
    try:
        return json.loads(text)
    except Exception:
        pass
    m = re.search(r"(\{.*\}|\[.*\])", text, re.S)
    if m:
        return json.loads(m.group(1))
    raise ValueError("无法从 LLM 输出中解析 JSON")


# ---------------- 内核:统一执行 ----------------
def _run(prompt_name, input_dict, mock_fn):
    cfg = get_config()
    if cfg["mock"] or not cfg["api_key"]:
        return mock_fn()
    messages = [
        {"role": "system", "content": load_prompt(prompt_name)},
        {"role": "user", "content": json.dumps(input_dict, ensure_ascii=False)},
    ]
    try:
        text = call_llm(messages, model=cfg["model"])
        return parse_json_text(text)
    except Exception as e:
        # 黑客松演示优先保证闭环不断:真实 LLM 失败时退回结构化 Mock。
        print(f"[ai_adapter] {prompt_name} fallback to mock: {type(e).__name__}: {e}")
        return mock_fn()


# ---------------- 4 个 Prompt 函数 ----------------
def goal_decomposer(goal, time_horizon, user_baseline):
    return _run("01_goal_decomposer",
                {"goal": goal, "time_horizon": time_horizon,
                 "user_baseline": user_baseline}, _mock_goal)


def daily_planner(goal_id, phase, yesterday_tasks, user_baseline,
                  goal=None, phase_tasks=None):
    data = {"goal_id": goal_id, "phase": phase,
            "yesterday_tasks": yesterday_tasks,
            "user_baseline": user_baseline}
    # 把目标标题和当前阶段的参考任务带进去,否则规划会跑偏(只凭 baseline)
    if goal:
        data["goal"] = goal
    if phase_tasks:
        data["phase_tasks"] = phase_tasks
    return _run("02_daily_planner", data, _mock_planner)


def behavior_analyst(logs):
    """logs: [{date, done, quality, notes}, ...]"""
    return _run("03_behavior_analyst", {"logs": logs}, _mock_analyst)


def system_adjuster(completion_rate_7d, insights, current_tasks):
    return _run("04_system_adjuster",
                {"completion_rate_7d": completion_rate_7d,
                 "insights": insights,
                 "current_tasks": current_tasks}, _mock_adjuster)


# ---------------- Mock 兜底(结构严格匹配各 Prompt 输出契约) ----------------
def _mock_goal():
    return {
        "long_term_skills": ["自律执行", "专项能力", "复盘迭代"],
        "phases": [
            {"name": "起步", "duration": "4周",
             "tasks": ["每天1个核心动作并打卡", "每天复盘5分钟"]},
            {"name": "强化", "duration": "4周",
             "tasks": ["每天2个核心动作", "每周1次阶段小结"]},
            {"name": "冲刺", "duration": "4周",
             "tasks": ["每天高强度执行", "每周完整模拟1次"]},
        ],
    }


def _mock_planner():
    return {"tasks": [
        {"content": "（mock）完成1个核心任务并订正", "difficulty": "中", "estimated_minutes": 45},
        {"content": "（mock）复习昨日薄弱点10分钟", "difficulty": "低", "estimated_minutes": 15},
        {"content": "（mock）晚间复盘当天执行情况", "difficulty": "低", "estimated_minutes": 20},
    ]}


def _mock_analyst():
    return {"insights": [
        {"insight_type": "障碍识别", "content": "（mock）未完成多与疲劳/加班相关，非目标不清。",
         "confidence": 0.85},
        {"insight_type": "高效时段", "content": "（mock）上午完成质量更高，建议核心任务前置。",
         "confidence": 0.7},
    ]}


def _mock_adjuster():
    return {"adjustments": {
        "tasks_to_reschedule": ["（mock）高难晚间任务"],
        "difficulty_change": "降低",
        "focus_strategy": "（mock）今天保留1个核心任务，其余压缩到30分钟内。",
        "reason": "（mock）近7天完成率偏低，优先保连续性。"}}
