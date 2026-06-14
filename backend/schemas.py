# -*- coding: utf-8 -*-
"""Pydantic 入参/出参模型。字段对齐 docs/数据契约.md。"""
from typing import Optional
from pydantic import BaseModel, Field


class User(BaseModel):
    id: str
    name: str
    baseline: Optional[str] = None


class UserCreate(BaseModel):
    name: str
    baseline: Optional[str] = None


class Goal(BaseModel):
    id: str
    user_id: str
    title: str
    category: Optional[str] = None
    time_horizon: Optional[str] = None
    status: str = "active"


class GoalCreate(BaseModel):
    user_id: str
    title: str
    category: Optional[str] = None
    time_horizon: Optional[str] = None
    status: str = "active"
    start_date: Optional[str] = None


class Task(BaseModel):
    id: str
    goal_id: str
    date: Optional[str] = None
    content: str
    difficulty: Optional[str] = None          # 低/中/高
    status: str = "pending"                    # pending/completed/skipped


class CheckIn(BaseModel):
    done: bool
    quality: int = Field(ge=1, le=5)
    notes: Optional[str] = None


class BehaviorLog(BaseModel):
    id: str
    task_id: str
    date: Optional[str] = None
    done: int                                  # 0/1
    quality: Optional[int] = None
    notes: Optional[str] = None


class Memory(BaseModel):
    id: str
    user_id: str
    insight_type: Optional[str] = None
    content: Optional[str] = None
