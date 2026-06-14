"use client";

import { useState } from "react";
import { useGrowth } from "../providers";
import { api } from "@/lib/api";
import { Card, PageHeader, Btn } from "../ui";
import { diffStyle, PRESETS, FEEDBACK, pick } from "../shared";

export default function TasksPage() {
  const { me, uid, tasks, setTasks, simDate, dayN, fastForward, refreshDash, loadAll, tone } = useGrowth();

  const [goal, setGoal] = useState("3个月学会高尔夫");
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

  async function onCheckin(t, p) {
    try {
      await api.checkin(t.id, { done: p.done, quality: p.quality, notes: p.note });
      setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: p.done ? "completed" : "skipped" } : x)));
      refreshDash();
      setToast(pick(FEEDBACK[tone][p.done ? "done" : "miss"]));
      setTimeout(() => setToast(""), 4000);
    } catch (e) { setErr(String(e.message || e)); }
  }
  async function onDeleteTask(t) { try { await api.deleteTask(t.id); await loadAll(uid); } catch (e) { setErr(String(e.message || e)); } }
  function startEdit(t) { setEditId(t.id); setEditContent(t.content); setEditDiff(t.difficulty || "中"); }
  async function onSaveEdit() { try { await api.updateTask(editId, { content: editContent, difficulty: editDiff }); setEditId(""); await loadAll(uid); } catch (e) { setErr(String(e.message || e)); } }
  async function onAddTask() {
    if (!newContent.trim()) return;
    try {
      let gid = createdGoalId; if (!gid) { const gs = await api.goals(uid); gid = gs[0]?.id; }
      if (!gid) { setErr("先在下面创建一个目标"); return; }
      await api.addTask({ goal_id: gid, date: simDate, content: newContent.trim(), difficulty: newDiff });
      setNewContent(""); await loadAll(uid);
    } catch (e) { setErr(String(e.message || e)); }
  }
  async function onRegenerate() { if (!createdGoalId) return; setPlanning(true); try { await api.planToday(createdGoalId, simDate); await loadAll(uid); } catch (e) { setErr(String(e.message || e)); } setPlanning(false); }
  async function onDecompose() { setBusy(true); setErr(""); setDecomp(null); setCreatedGoalId(""); try { const r = await api.createGoal({ user_id: uid, title: goal, time_horizon: horizon, category }); setDecomp(r.decomposition || null); setCreatedGoalId(r.id || ""); } catch (e) { setErr(String(e.message || e)); } setBusy(false); }
  async function onPlan() { if (!createdGoalId) return; setPlanning(true); setErr(""); try { await api.planToday(createdGoalId, simDate); await loadAll(uid); } catch (e) { setErr(String(e.message || e)); } setPlanning(false); }

  return (
    <>
      <PageHeader title="今日任务" desc={`第 ${dayN} 天 · ${simDate} · 用选项一键打卡,快进几天让系统看出规律`} />

      {/* 演示快进 */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-card px-5 py-3.5">
        <div className="text-sm text-inksoft">🧪 模拟日期 <b className="text-ink">{simDate}</b>(第 {dayN} 天)</div>
        <Btn variant="outline" onClick={fastForward}>▶ 快进到第 {dayN + 1} 天</Btn>
      </div>

      {toast && <div className="mb-4 rounded-xl border border-accent/20 bg-accentsoft px-4 py-2.5 text-sm text-ink">💬 {toast}</div>}
      {err && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{err}</div>}

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm font-semibold text-ink">今天的任务</div>
          {createdGoalId && <Btn variant="ghost" onClick={onRegenerate} disabled={planning} className="!px-2 !py-1 text-xs">🔄 换一批</Btn>}
        </div>
        <ul className="space-y-2.5">
          {todays.map((t) => {
            const settled = t.status === "completed" || t.status === "skipped";
            const editing = editId === t.id;
            return (
              <li key={t.id} className="rounded-xl border border-line px-4 py-3">
                {editing ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input value={editContent} onChange={(e) => setEditContent(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-line bg-paper px-2.5 py-1.5 text-sm outline-none focus:bg-card" />
                    <select value={editDiff} onChange={(e) => setEditDiff(e.target.value)} className="rounded-lg border border-line bg-paper px-2 py-1.5 text-sm"><option>低</option><option>中</option><option>高</option></select>
                    <Btn onClick={onSaveEdit} className="!px-3 !py-1.5">保存</Btn>
                    <Btn variant="outline" onClick={() => setEditId("")} className="!px-3 !py-1.5">取消</Btn>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className={`text-sm ${t.status === "completed" ? "text-muted line-through" : ""} ${t.status === "skipped" ? "text-rose-400 line-through" : ""} text-ink`}>{t.content}</div>
                      <span className={`mt-1.5 inline-block rounded-md px-1.5 py-0.5 text-[11px] ${diffStyle[t.difficulty] || "bg-paper text-muted"}`}>{t.difficulty}</span>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      {settled ? (
                        <span className={`text-xs font-medium ${t.status === "completed" ? "text-emerald-600" : "text-rose-500"}`}>{t.status === "completed" ? "✓ 已完成" : "✕ 未完成"}</span>
                      ) : (
                        <div className="flex flex-wrap justify-end gap-1">
                          {PRESETS.map((p) => (
                            <button key={p.label} onClick={() => onCheckin(t, p)} className={`rounded-lg px-2 py-1 text-[11px] font-medium text-white transition hover:opacity-90 ${p.cls}`}>{p.label}</button>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 text-[11px] text-muted">
                        <button onClick={() => startEdit(t)} className="hover:text-ink">编辑</button>
                        <button onClick={() => onDeleteTask(t)} className="hover:text-rose-500">删除</button>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
          {!todays.length && <p className="py-4 text-center text-sm text-muted">这一天还没有任务 — 先在下面创建目标并生成</p>}
        </ul>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <input value={newContent} onChange={(e) => setNewContent(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onAddTask()} placeholder="加一个我自己想做的任务" className="min-w-0 flex-1 rounded-xl border border-line bg-paper px-3 py-2 text-sm outline-none focus:bg-card" />
          <select value={newDiff} onChange={(e) => setNewDiff(e.target.value)} className="rounded-xl border border-line bg-paper px-2 py-2 text-sm"><option>低</option><option>中</option><option>高</option></select>
          <Btn variant="outline" onClick={onAddTask} className="!px-3">添加</Btn>
        </div>
      </Card>

      {/* 目标拆解 */}
      <Card className="mt-6">
        <div className="text-sm font-semibold text-ink">目标拆解 → 生成今日任务</div>
        <p className="mt-1 text-xs text-muted">输入目标,AI 拆成能力 + 3 阶段,一键生成今天的任务</p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="目标" className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:bg-card md:col-span-2" />
          <input value={horizon} onChange={(e) => setHorizon(e.target.value)} placeholder="周期" className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:bg-card" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm"><option>学习</option><option>健康</option><option>行为</option><option>目标</option></select>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Btn onClick={onDecompose} disabled={busy}>{busy ? "AI 拆解中…" : "① 创建并拆解"}</Btn>
          {createdGoalId && <Btn variant="outline" onClick={onPlan} disabled={planning}>{planning ? "生成中…" : `② 生成今日任务(${simDate})`}</Btn>}
        </div>
        {decomp && (
          <div className="mt-5">
            {decomp.long_term_skills?.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">{decomp.long_term_skills.map((s, i) => <span key={i} className="rounded-full border border-line bg-paper px-3 py-1 text-xs text-inksoft">{s}</span>)}</div>
            )}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {decomp.phases?.map((p, i) => (
                <div key={i} className="rounded-xl border border-line p-4">
                  <div className="flex items-center justify-between"><div className="text-sm font-medium text-ink">{p.name}</div><span className="text-[11px] text-muted">{p.duration}</span></div>
                  <ul className="mt-2 space-y-1.5">{p.tasks?.map((t, j) => <li key={j} className="text-xs text-inksoft">· {t}</li>)}</ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
