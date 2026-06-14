"use client";

import { useState } from "react";
import {
  ArrowRight,
  Brain,
  CalendarClock,
  CheckCircle2,
  Circle,
  Clock3,
  Pencil,
  Plus,
  RefreshCw,
  Route,
  Sparkles,
  Sprout,
  Target,
  Trash2,
  XCircle,
} from "lucide-react";
import { useGrowth } from "../providers";
import { api } from "@/lib/api";
import { Bar, BotanicalAccent, Btn, Card, EmptyState, PageHeader, SectionTitle, Tag } from "../ui";
import { FEEDBACK, PRESETS, pick } from "../shared";

const diffTone = { 高: "danger", 中: "warn", 低: "accent" };

function TaskStatusIcon({ status }) {
  if (status === "completed") return <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-accent" />;
  if (status === "skipped") return <XCircle size={19} className="mt-0.5 shrink-0 text-danger" />;
  return <Circle size={19} className="mt-0.5 shrink-0 text-muted" />;
}

export default function TasksPage() {
  const { uid, tasks, setTasks, simDate, dayN, fastForward, refreshDash, loadAll, tone } = useGrowth();

  const [goal, setGoal] = useState("");
  const [horizon, setHorizon] = useState("3个月");
  const [category, setCategory] = useState("健康");
  const [decomp, setDecomp] = useState(null);
  const [createdGoalId, setCreatedGoalId] = useState("");
  const [busy, setBusy] = useState(false);
  const [planning, setPlanning] = useState(false);

  const [editId, setEditId] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editDiff, setEditDiff] = useState("中");
  const [newContent, setNewContent] = useState("");
  const [newDiff, setNewDiff] = useState("中");

  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");

  const todays = tasks.filter((t) => t.date === simDate);
  const doneToday = todays.filter((t) => t.status === "completed").length;
  const settledToday = todays.filter((t) => t.status === "completed" || t.status === "skipped").length;
  const todayRate = todays.length ? doneToday / todays.length : 0;

  async function onCheckin(t, p) {
    try {
      await api.checkin(t.id, { done: p.done, quality: p.quality, notes: p.note });
      setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: p.done ? "completed" : "skipped" } : x)));
      refreshDash();
      setToast(pick(FEEDBACK[tone][p.done ? "done" : "miss"]));
      setTimeout(() => setToast(""), 4000);
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  async function onDeleteTask(t) {
    try {
      await api.deleteTask(t.id);
      await loadAll(uid);
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  function startEdit(t) {
    setEditId(t.id);
    setEditContent(t.content);
    setEditDiff(t.difficulty || "中");
  }

  async function onSaveEdit() {
    try {
      await api.updateTask(editId, { content: editContent, difficulty: editDiff });
      setEditId("");
      await loadAll(uid);
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  async function onAddTask() {
    if (!newContent.trim()) return;
    try {
      let gid = createdGoalId;
      if (!gid) {
        const gs = await api.goals(uid);
        gid = gs[0]?.id;
      }
      if (!gid) {
        setErr("先创建一个目标,再添加任务");
        return;
      }
      await api.addTask({ goal_id: gid, date: simDate, content: newContent.trim(), difficulty: newDiff });
      setNewContent("");
      await loadAll(uid);
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  async function onRegenerate() {
    if (!createdGoalId) return;
    setPlanning(true);
    try {
      await api.planToday(createdGoalId, simDate);
      await loadAll(uid);
    } catch (e) {
      setErr(String(e.message || e));
    }
    setPlanning(false);
  }

  async function onDecompose() {
    setBusy(true);
    setErr("");
    setDecomp(null);
    setCreatedGoalId("");
    try {
      const r = await api.createGoal({ user_id: uid, title: goal, time_horizon: horizon, category });
      setDecomp(r.decomposition || null);
      setCreatedGoalId(r.id || "");
    } catch (e) {
      setErr(String(e.message || e));
    }
    setBusy(false);
  }

  async function onPlan() {
    if (!createdGoalId) return;
    setPlanning(true);
    setErr("");
    try {
      await api.planToday(createdGoalId, simDate);
      await loadAll(uid);
    } catch (e) {
      setErr(String(e.message || e));
    }
    setPlanning(false);
  }

  return (
    <>
      <PageHeader
        kicker="Daily execution"
        title="今日任务"
        desc={`第 ${dayN} 天 · ${simDate}。先执行,再记录真实阻碍,后面 AI 才能调得准。`}
        right={
          <Btn variant="outline" onClick={fastForward}>
            <CalendarClock size={15} />
            快进到第 {dayN + 1} 天
          </Btn>
        }
      />

      {toast ? <div className="mb-4 rounded-md border border-accent/20 bg-accentsoft px-4 py-2.5 text-sm font-semibold text-ink">{toast}</div> : null}
      {err ? <div className="mb-4 rounded-md border border-danger/20 bg-dangersoft px-4 py-2.5 text-sm font-semibold text-danger">{err}</div> : null}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.25fr_0.85fr]">
        <div className="space-y-5">
          <Card className="relative overflow-hidden">
            <BotanicalAccent className="absolute -right-16 -top-14 h-44 w-52 opacity-20" />
            <SectionTitle
              icon={Route}
              title="今日执行栈"
              desc="每条任务都可以一键记录状态,系统会把完成质量和原因带入复盘。"
              right={createdGoalId ? (
                <Btn variant="ghost" size="sm" onClick={onRegenerate} disabled={planning}>
                  <RefreshCw size={14} />
                  换一批
                </Btn>
              ) : null}
            />

            <div className="mb-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <Bar label={`完成 ${doneToday}/${todays.length || 0}`} rate={todayRate} />
              <div className="flex gap-2">
                <Tag tone="accent">{settledToday} 已记录</Tag>
                <Tag tone={todays.length - settledToday ? "warn" : "neutral"}>{Math.max(0, todays.length - settledToday)} 待记录</Tag>
              </div>
            </div>

            <ul className="space-y-0">
              {todays.map((t) => {
                const settled = t.status === "completed" || t.status === "skipped";
                const editing = editId === t.id;
                return (
                  <li key={t.id} className="border-t border-line py-4 first:border-t-0 first:pt-0">
                    {editing ? (
                      <div className="grid gap-2 md:grid-cols-[1fr_92px_auto_auto]">
                        <input
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-w-0 rounded-md border border-line bg-paper px-3 py-2 text-sm outline-none transition focus:border-accent/50 focus:bg-card"
                        />
                        <select value={editDiff} onChange={(e) => setEditDiff(e.target.value)} className="rounded-md border border-line bg-paper px-3 py-2 text-sm">
                          <option>低</option>
                          <option>中</option>
                          <option>高</option>
                        </select>
                        <Btn onClick={onSaveEdit} size="sm">保存</Btn>
                        <Btn variant="quiet" onClick={() => setEditId("")} size="sm">取消</Btn>
                      </div>
                    ) : (
                      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                        <div className="flex min-w-0 items-start gap-3">
                          <TaskStatusIcon status={t.status} />
                          <div className="min-w-0">
                            <div className={`text-sm leading-6 text-ink ${settled ? "text-text2 line-through" : ""}`}>{t.content}</div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <Tag tone={diffTone[t.difficulty] || "neutral"}>难度 {t.difficulty || "中"}</Tag>
                              {t.status === "completed" ? <Tag tone="accent">已完成</Tag> : null}
                              {t.status === "skipped" ? <Tag tone="danger">已跳过</Tag> : null}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
                          {!settled ? (
                            <div className="flex flex-wrap gap-1.5">
                              {PRESETS.map((p) => (
                                <button
                                  key={p.label}
                                  onClick={() => onCheckin(t, p)}
                                  className={`rounded-md px-2.5 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 ${p.cls}`}
                                >
                                  {p.label}
                                </button>
                              ))}
                            </div>
                          ) : null}
                          <button onClick={() => startEdit(t)} aria-label="编辑任务" className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-muted transition hover:text-accent">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => onDeleteTask(t)} aria-label="删除任务" className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-muted transition hover:text-danger">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {!todays.length ? (
              <EmptyState
                icon={Clock3}
                title="这一天还没有任务"
                desc="先在右侧创建目标并生成今日任务,也可以在下方手动补充。"
              />
            ) : null}

            <div className="mt-5 border-t border-line pt-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
                <Plus size={16} className="text-accent" />
                手动补充任务
              </div>
              <div className="grid gap-2 md:grid-cols-[1fr_92px_auto]">
                <input
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onAddTask()}
                  placeholder="加一个今天确实要做的动作"
                  className="min-w-0 rounded-md border border-line bg-paper px-3 py-2.5 text-sm outline-none transition focus:border-accent/50 focus:bg-card"
                />
                <select value={newDiff} onChange={(e) => setNewDiff(e.target.value)} className="rounded-md border border-line bg-paper px-3 py-2.5 text-sm">
                  <option>低</option>
                  <option>中</option>
                  <option>高</option>
                </select>
                <Btn variant="outline" onClick={onAddTask}>
                  <Plus size={15} />
                  添加
                </Btn>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card tone="accent" className="relative overflow-hidden xl:sticky xl:top-8">
            <BotanicalAccent className="absolute -bottom-12 -right-14 h-44 w-52 rotate-[-18deg] opacity-30" />
            <SectionTitle icon={Target} title="目标拆解" desc="输入长期目标,让 AI 拆出阶段与今天可执行的动作。" />

            <div className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-text2">目标</span>
                <input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="输入你的目标,例如:3个月考研上岸" className="w-full rounded-md border border-line bg-card px-3 py-2.5 text-sm outline-none transition focus:border-accent/50" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-text2">周期</span>
                  <input value={horizon} onChange={(e) => setHorizon(e.target.value)} placeholder="3个月" className="w-full rounded-md border border-line bg-card px-3 py-2.5 text-sm outline-none transition focus:border-accent/50" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-text2">类别</span>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-md border border-line bg-card px-3 py-2.5 text-sm">
                    <option>学习</option>
                    <option>健康</option>
                    <option>行为</option>
                    <option>目标</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Btn onClick={onDecompose} disabled={busy}>
                <Sparkles size={15} />
                {busy ? "拆解中..." : "创建并拆解"}
              </Btn>
              <Btn variant="outline" onClick={onPlan} disabled={planning || !createdGoalId}>
                <ArrowRight size={15} />
                {planning ? "生成中..." : "生成今日任务"}
              </Btn>
            </div>

            {decomp ? (
              <div className="mt-5 border-t border-accent/20 pt-5">
                {decomp.long_term_skills?.length > 0 ? (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {decomp.long_term_skills.map((s, i) => <Tag key={i} tone="accent">{s}</Tag>)}
                  </div>
                ) : null}

                <div className="space-y-4">
                  {decomp.phases?.map((p, i) => (
                    <div key={i} className="border-l-2 border-accent/30 pl-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-bold text-ink">{p.name}</div>
                        <Tag tone="neutral">{p.duration}</Tag>
                      </div>
                      <ul className="mt-2 space-y-1.5">
                        {p.tasks?.map((t, j) => <li key={j} className="text-xs leading-5 text-text2">- {t}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-md border border-dashed border-accent/30 bg-card/70 px-4 py-4 text-xs leading-6 text-text2">
                拆解结果会在这里显示。先看阶段,再生成今天的动作。
              </div>
            )}
          </Card>

          <Card tone="soft">
            <SectionTitle icon={Brain} title="演示节奏" desc="连续快进并打卡几天,复盘页会更容易看出偏差。" />
            <div className="space-y-3 text-sm leading-6 text-text2">
              <div className="flex gap-3">
                <Tag tone="accent">1</Tag>
                创建目标并生成今日任务
              </div>
              <div className="flex gap-3">
                <Tag tone="warn">2</Tag>
                故意记录几次加班或太累
              </div>
              <div className="flex gap-3">
                <Tag tone="info">3</Tag>
                去 AI 复盘页生成调整建议
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
