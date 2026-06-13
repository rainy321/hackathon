# -*- coding: utf-8 -*-
"""快速验证 AI Adapter:4 个 Prompt 函数各打一次(真实模式)或走 Mock。"""
import ai_adapter as ai

cfg = ai.get_config()
mode = "MOCK" if (cfg["mock"] or not cfg["api_key"]) else f"REAL model={cfg['model']}"
print("mode:", mode)

# 1) 目标拆解
out = ai.goal_decomposer("考研上岸", "3个月", "每天能学4小时")
print("goal_decomposer  -> skills:", len(out.get("long_term_skills", [])),
      "| phases:", len(out.get("phases", [])))

# 2) 每日计划
out = ai.daily_planner("g1", "基础夯实",
                       [{"content": "背单词", "done": False}], "每天4小时")
print("daily_planner    -> tasks:", len(out.get("tasks", [])))

# 3) 行为分析
out = ai.behavior_analyst([
    {"date": "2026-06-08", "done": True, "quality": 4, "notes": "上午很顺"},
    {"date": "2026-06-09", "done": False, "quality": 2, "notes": "加班没做"},
    {"date": "2026-06-10", "done": False, "quality": 1, "notes": "太累了"},
    {"date": "2026-06-11", "done": True, "quality": 3, "notes": "晚上补回来了"},
])
print("behavior_analyst -> insights:", len(out.get("insights", [])))

# 4) 动态调整
out = ai.system_adjuster(
    0.6,
    [{"insight_type": "障碍识别", "content": "加班导致晚间高难任务失败", "confidence": 0.9}],
    ["复习第三章并整理笔记", "完成40道强化题", "晚间复盘90分钟"])
adj = out.get("adjustments", {})
print("system_adjuster  -> difficulty_change:", adj.get("difficulty_change"),
      "| reschedule:", len(adj.get("tasks_to_reschedule", [])))

print("ALL AI FUNCTIONS OK")
