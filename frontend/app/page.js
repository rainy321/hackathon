"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const diffStyle = { 高: "bg-red-100 text-red-700", 中: "bg-amber-100 text-amber-700", 低: "bg-emerald-100 text-emerald-700" };
const TONES = ["温暖朋友", "严格教练", "幽默伙伴"];
const FEEDBACK = {
  温暖朋友: {
    done: ["做到啦,很棒!今天又往前一步~", "完成一个就很厉害了,继续!", "稳稳的,给自己点个赞 👍"],
    miss: ["辛苦了,先休息,明天咱们把简单的先做。", "没关系,加班太累很正常,保住状态最重要。", "别自责,明天重新来过就好~"],
  },
  严格教练: {
    done: ["完成是应该的,别骄傲,明天继续保持。", "达标,但标准还能再提。", "算你过关,别松懈。"],
    miss: ["理由记下了,但连续性不能断,明天补上。", "没做完就是没做完,明天补回来。", "少找借口,明天先做这一件。"],
  },
  幽默伙伴: {
    done: ["恭喜你又战胜了拖延症(本次)。", "任务:已拿捏。沙发:已失宠。", "今天你是「自律」本人。"],
    miss: ["加班/累赢了,任务输了。明天扳回来。", "任务已原谅你,但记小本本了。", "没事,你只是给明天攒了波大的。"],
  },
};
const PRESETS = [
  { label: "✅顺利", done: true, quality: 5, note: "顺利完成", cls: "bg-emerald-600" },
  { label: "勉强", done: true, quality: 3, note: "勉强完成", cls: "bg-amber-500" },
  { label: "😵加班", done: false, quality: 2, note: "加班没做", cls: "bg-rose-500" },
  { label: "😵太累", done: false, quality: 1, note: "太累了", cls: "bg-slate-500" },
];

function isoToday() { return new Date().toISOString().slice(0, 10); }
function addDay(iso, n) { const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
function dayDiff(a, b) { return Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function Card({ children, className = "" }) { return <div className={`rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-sm ${className}`}>{children}</div>; }
function Stat({ label, value, sub }) { return <Card><div className="text-sm text-[var(--muted)]">{label}</div><div className="mt-1 text-3xl font-semibold tracking-tight">{value}</div>{sub ? <div className="mt-1 text-xs text-[var(--muted)]">{sub}</div> : null}</Card>; }
function Bar({ label, rate }) { const p = Math.round((rate || 0) * 100); return <div><div className="mb-1 flex items-center justify-between text-sm"><span>{label}</span><span className="text-[var(--muted)]">{p}%</span></div><div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${p}%` }} /></div></div>; }

export default function Home() {
  // 登录态:挂载后从 localStorage 读,避免 SSR 不一致
  const [me, setMe] = useState(null);
  useEffect(() => { try { const s = localStorage.getItem("gos_me"); if (s) setMe(JSON.parse(s)); } catch (e) {} }, []);

  if (!me) return <LoginScreen onLogin={setMe} />;
  return <App me={me} setMe={setMe} />;
}

/* ---------------- 登录 / 注册页 ---------------- */
function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [baseline, setBaseline] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr(""); setBusy(true);
    try {
      const u = mode === "login"
        ? await api.login({ name: name.trim(), password })
        : await api.register({ name: name.trim(), baseline: baseline.trim(), password });
      localStorage.setItem("gos_me", JSON.stringify(u));
      onLogin(u);
    } catch (e) { setErr(String(e.message || e)); }
    setBusy(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-md">
        <h1 className="mb-1 text-3xl font-bold tracking-tight">Growth OS</h1>
        <p className="mb-6 text-sm text-[var(--muted)]">长期成长操作系统 · 你的成长伙伴</p>
        <Card>
          <div className="mb-4 flex gap-2">
            <button onClick={() => setMode("login")} className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${mode === "login" ? "bg-[var(--brand)] text-white" : "border border-[var(--line)]"}`}>登录</button>
            <button onClick={() => setMode("register")} className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${mode === "register" ? "bg-[var(--brand)] text-white" : "border border-[var(--line)]"}`}>注册</button>
          </div>
          <div className="space-y-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="用户名" className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm" />
            {mode === "register" ? (
              <input value={baseline} onChange={(e) => setBaseline(e.target.value)} placeholder="当前基础(身份、可投入时间、强弱项)" className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm" />
            ) : null}
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="密码" className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm" />
          </div>
          {err ? <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div> : null}
          <button onClick={submit} disabled={busy} className="mt-4 w-full rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">{busy ? "处理中…" : (mode === "login" ? "登录" : "注册并登录")}</button>
          <p className="mt-3 text-center text-xs text-[var(--muted)]">演示账号:林知远 / 123456(或注册新账号)</p>
        </Card>
      </div>
    </main>
  );
}

/* ---------------- 主应用 ---------------- */
function App({ me, setMe }) {
  const uid = me.id;
  const tone = me.tone || "温暖朋友";

  const [dash, setDash] = useState(null);
  const [mem, setMem] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [err, setErr] = useState("");
  const [companionMsg, setCompanionMsg] = useState("");

  const [realToday] = useState(isoToday);
  const [simDate, setSimDate] = useState(isoToday);
  const dayN = dayDiff(realToday, simDate) + 1;

  const [showProfile, setShowProfile] = useState(false);
  const [pBaseline, setPBaseline] = useState(me.baseline || "");
  const [pTone, setPTone] = useState(tone);

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

  const [analInsights, setAnalInsights] = useState([]);
  const [analMeta, setAnalMeta] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [adjustments, setAdjustments] = useState(null);
  const [adjusting, setAdjusting] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  function loadAll(id) {
    return Promise.all([api.dashboard(id), api.memory(id), api.tasks(id)])
      .then(([d, m, t]) => { setDash(d); setMem(m); setTasks(t); })
      .catch((e) => setErr(String(e.message || e)));
  }
  useEffect(() => { loadAll(uid); }, [uid]);

  const todays = tasks.filter((t) => t.date === simDate);

  async function onCheckin(t, preset) {
    try {
      await api.checkin(t.id, { done: preset.done, quality: preset.quality, notes: preset.note });
      setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: preset.done ? "completed" : "skipped" } : x)));
      setDash(await api.dashboard(uid));
      setCompanionMsg(pick(FEEDBACK[tone][preset.done ? "done" : "miss"]));
    } catch (e) { setErr(String(e.message || e)); }
  }
  async function onDeleteTask(t) { try { await api.deleteTask(t.id); await loadAll(uid); } catch (e) { setErr(String(e.message || e)); } }
  function startEdit(t) { setEditId(t.id); setEditContent(t.content); setEditDiff(t.difficulty || "中"); }
  async function onSaveEdit() { try { await api.updateTask(editId, { content: editContent, difficulty: editDiff }); setEditId(""); await loadAll(uid); } catch (e) { setErr(String(e.message || e)); } }
  async function onAddTask() {
    if (!newContent.trim()) return;
    try {
      let gid = createdGoalId;
      if (!gid) { const gs = await api.goals(uid); gid = gs[0]?.id; }
      if (!gid) { setErr("先创建一个目标,再新增任务"); return; }
      await api.addTask({ goal_id: gid, date: simDate, content: newContent.trim(), difficulty: newDiff });
      setNewContent(""); await loadAll(uid);
    } catch (e) { setErr(String(e.message || e)); }
  }
  async function onRegenerate() { if (!createdGoalId) return; setPlanning(true); try { await api.planToday(createdGoalId, simDate); await loadAll(uid); } catch (e) { setErr(String(e.message || e)); } setPlanning(false); }

  async function onDecompose() {
    setBusy(true); setErr(""); setDecomp(null); setCreatedGoalId("");
    try { const res = await api.createGoal({ user_id: uid, title: goal, time_horizon: horizon, category }); setDecomp(res.decomposition || null); setCreatedGoalId(res.id || ""); } catch (e) { setErr(String(e.message || e)); }
    setBusy(false);
  }
  async function onPlan() { if (!createdGoalId) return; setPlanning(true); setErr(""); try { await api.planToday(createdGoalId, simDate); await loadAll(uid); } catch (e) { setErr(String(e.message || e)); } setPlanning(false); }

  async function onAnalyze() { setAnalyzing(true); setErr(""); setAnalInsights([]); setAnalMeta(null); setAdjustments(null); setSaveMsg(""); try { const r = await api.analysis(uid); setAnalInsights(r.insights || []); setAnalMeta({ rate: r.completion_rate_7d, logs_count: r.logs_count }); } catch (e) { setErr(String(e.message || e)); } setAnalyzing(false); }
  async function onAdjust() { setAdjusting(true); setErr(""); setAdjustments(null); try { const r = await api.adjust(uid, analInsights); setAdjustments(r.adjustments || null); } catch (e) { setErr(String(e.message || e)); } setAdjusting(false); }
  async function onSaveInsights() { setErr(""); setSaveMsg(""); try { const r = await api.saveInsights(uid, analInsights); setSaveMsg("已保存 " + r.saved + " 条洞察到记忆"); setMem(await api.memory(uid)); } catch (e) { setErr(String(e.message || e)); } }

  function onFastForward() { setSimDate((d) => addDay(d, 1)); setAnalInsights([]); setAnalMeta(null); setAdjustments(null); setSaveMsg(""); setCompanionMsg(""); }
  function onLogout() { localStorage.removeItem("gos_me"); setMe(null); }

  async function onSaveProfile() {
    setErr("");
    try { const u = await api.updateUser(uid, { baseline: pBaseline, tone: pTone }); localStorage.setItem("gos_me", JSON.stringify(u)); setMe(u); setShowProfile(false); }
    catch (e) { setErr(String(e.message || e)); }
  }

  const pct = (n) => Math.round((n || 0) * 100);

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Growth OS<span className="ml-2 align-middle text-sm font-normal text-[var(--muted)]">Hi,{me.name} 👋</span></h1>
          <p className="text-sm text-[var(--muted)]">你的成长伙伴 · 当前语气:<b>{tone}</b></p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => { setShowProfile((v) => !v); setPBaseline(me.baseline || ""); setPTone(tone); }} className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm shadow-sm hover:bg-slate-50">✏️ 资料·语气</button>
          <button onClick={onLogout} className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm shadow-sm hover:bg-slate-50">退出登录</button>
        </div>
      </header>

      {showProfile ? (
        <Card className="mb-5">
          <h3 className="mb-3 text-sm font-semibold">编辑资料(基础会喂给 AI,语气决定陪伴风格)</h3>
          <textarea value={pBaseline} onChange={(e) => setPBaseline(e.target.value)} rows={2} placeholder="当前基础(身份、可投入时间、强弱项)" className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm" />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-[var(--muted)]">陪伴语气</span>
            {TONES.map((t) => (<button key={t} onClick={() => setPTone(t)} className={`rounded-lg px-3 py-1.5 text-sm ${pTone === t ? "bg-[var(--brand)] text-white" : "border border-[var(--line)] bg-white"}`}>{t}</button>))}
          </div>
          <button onClick={onSaveProfile} className="mt-3 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">保存</button>
        </Card>
      ) : null}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <div className="text-sm"><span className="font-semibold text-amber-800">🧪 演示模式</span><span className="ml-2 text-amber-700">模拟日期 <b>{simDate}</b>(第 {dayN} 天)</span></div>
        <button onClick={onFastForward} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">▶ 快进到第 {dayN + 1} 天</button>
      </div>

      {err ? <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{err}</div> : null}

      <section className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="完成率" value={dash ? `${pct(dash.completion_rate)}%` : "—"} sub={dash ? `${dash.done}/${dash.total} 项` : ""} />
        <Stat label="连续天数" value={dash ? dash.streak : "—"} sub="至少完成1项的连续日" />
        <Stat label="平均质量" value={dash ? dash.avg_quality : "—"} sub="5 分制" />
        <Stat label="近 7 天完成率" value={dash ? `${pct(dash.recent_7d.rate)}%` : "—"} sub={dash ? `${dash.recent_7d.done}/${dash.recent_7d.total}` : ""} />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="mb-4 text-base font-semibold">各维度进度</h2>
            <div className="space-y-3">
              {(dash?.categories || []).map((c) => (<Bar key={c.category} label={c.category} rate={c.rate} />))}
              {!(dash?.categories || []).length ? <p className="text-sm text-[var(--muted)]">暂无数据</p> : null}
            </div>
          </Card>

          <Card>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold">今日任务(第 {dayN} 天)<span className="ml-2 text-xs font-normal text-[var(--muted)]">{simDate}</span></h2>
              {createdGoalId ? <button onClick={onRegenerate} disabled={planning} className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs hover:bg-slate-50 disabled:opacity-50">🔄 换一批</button> : null}
            </div>
            {companionMsg ? <div className="mb-3 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-800">💬 {companionMsg}</div> : null}
            <ul className="space-y-2">
              {todays.map((t) => {
                const settled = t.status === "completed" || t.status === "skipped";
                const editing = editId === t.id;
                return (
                  <li key={t.id} className="rounded-xl border border-[var(--line)] px-3 py-2">
                    {editing ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <input value={editContent} onChange={(e) => setEditContent(e.target.value)} className="min-w-0 flex-1 rounded border border-[var(--line)] px-2 py-1 text-sm" />
                        <select value={editDiff} onChange={(e) => setEditDiff(e.target.value)} className="rounded border border-[var(--line)] px-2 py-1 text-sm"><option>低</option><option>中</option><option>高</option></select>
                        <button onClick={onSaveEdit} className="rounded bg-[var(--brand)] px-2 py-1 text-xs text-white">保存</button>
                        <button onClick={() => setEditId("")} className="rounded border border-[var(--line)] px-2 py-1 text-xs">取消</button>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className={`truncate text-sm ${t.status === "completed" ? "text-[var(--muted)] line-through" : ""} ${t.status === "skipped" ? "text-rose-400 line-through" : ""}`}>{t.content}</div>
                          <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[11px] ${diffStyle[t.difficulty] || "bg-slate-100 text-slate-600"}`}>{t.difficulty}</span>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          {settled ? (
                            <span className={`text-xs font-medium ${t.status === "completed" ? "text-emerald-600" : "text-rose-500"}`}>{t.status === "completed" ? "✅ 已完成" : "❌ 未完成"}</span>
                          ) : (
                            <div className="flex flex-wrap justify-end gap-1">{PRESETS.map((p) => (<button key={p.label} onClick={() => onCheckin(t, p)} className={`rounded px-2 py-1 text-[11px] font-medium text-white ${p.cls} hover:opacity-90`}>{p.label}</button>))}</div>
                          )}
                          <div className="flex gap-1">
                            <button onClick={() => startEdit(t)} className="text-xs text-[var(--muted)] hover:text-[var(--ink)]">✏️</button>
                            <button onClick={() => onDeleteTask(t)} className="text-xs text-[var(--muted)] hover:text-rose-500">🗑</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
              {!todays.length ? <p className="text-sm text-[var(--muted)]">这一天还没有任务 — 先「创建并拆解目标」→「生成今日任务」</p> : null}
            </ul>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--line)] pt-3">
              <input value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="➕ 加一个我自己想做的任务" className="min-w-0 flex-1 rounded-lg border border-[var(--line)] px-3 py-2 text-sm" />
              <select value={newDiff} onChange={(e) => setNewDiff(e.target.value)} className="rounded-lg border border-[var(--line)] px-2 py-2 text-sm"><option>低</option><option>中</option><option>高</option></select>
              <button onClick={onAddTask} className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:opacity-90">添加</button>
            </div>
          </Card>
        </div>

        <div>
          <Card className="h-full">
            <h2 className="mb-1 text-base font-semibold">系统记忆</h2>
            <p className="mb-4 text-xs text-[var(--muted)]">系统从你的行为中沉淀的洞察(越用越懂你)</p>
            <ul className="space-y-3">
              {mem.map((m) => (<li key={m.id} className="rounded-xl bg-indigo-50/60 px-3 py-2.5 text-sm"><div className="mb-0.5 text-xs font-medium text-indigo-700">{m.insight_type}</div><div>{m.content}</div></li>))}
              {!mem.length ? <p className="text-sm text-[var(--muted)]">暂无洞察</p> : null}
            </ul>
          </Card>
        </div>
      </div>

      <section className="mt-6">
        <Card>
          <h2 className="text-base font-semibold">🎯 目标拆解 → 生成今日任务</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">输入目标 → AI 拆成能力 + 3 阶段 → 一键生成【当前模拟日】任务(之后可编辑/删除/换一批)</p>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="目标" className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm md:col-span-2" />
            <input value={horizon} onChange={(e) => setHorizon(e.target.value)} placeholder="周期" className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm" />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"><option>学习</option><option>健康</option><option>行为</option><option>目标</option></select>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={onDecompose} disabled={busy} className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">{busy ? "AI 拆解中…" : "① 创建并拆解目标"}</button>
            {createdGoalId ? <button onClick={onPlan} disabled={planning} className="rounded-lg border border-[var(--brand)] px-4 py-2 text-sm font-medium text-[var(--brand)] hover:bg-indigo-50 disabled:opacity-50">{planning ? "生成中…" : `② 生成今日任务(${simDate})`}</button> : null}
          </div>
          {decomp ? (
            <div className="mt-5">
              {decomp.long_term_skills?.length ? <div className="mb-4 flex flex-wrap gap-2">{decomp.long_term_skills.map((s, i) => (<span key={i} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{s}</span>))}</div> : null}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {decomp.phases?.map((p, i) => (<div key={i} className="rounded-xl border border-[var(--line)] p-3"><div className="flex items-center justify-between"><div className="text-sm font-semibold">{p.name}</div><span className="text-xs text-[var(--muted)]">{p.duration}</span></div><ul className="mt-2 space-y-1.5">{p.tasks?.map((t, j) => (<li key={j} className="text-xs">· {t}</li>))}</ul></div>))}
              </div>
            </div>
          ) : null}
        </Card>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold">🔍 AI 行为复盘(近 7 天)</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">快进几天、用选项打卡后,让 AI 总结你的行为规律</p>
          <button onClick={onAnalyze} disabled={analyzing} className="mt-3 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">{analyzing ? "分析中…" : "分析近 7 天"}</button>
          {analMeta ? <div className="mt-3 text-xs text-[var(--muted)]">近 7 天完成率 <b>{pct(analMeta.rate)}%</b> · {analMeta.logs_count} 条记录</div> : null}
          <ul className="mt-3 space-y-2">
            {analInsights.map((it, i) => (<li key={i} className="rounded-xl bg-amber-50/70 px-3 py-2 text-sm"><div className="mb-0.5 text-xs font-medium text-amber-700">{it.insight_type}<span className="ml-1 text-amber-500">· 把握 {it.confidence ? Math.round(it.confidence * 100) : 0}%</span></div><div>{it.content}</div></li>))}
            {!analInsights.length && analMeta ? <li className="text-sm text-[var(--muted)]">数据太少,先快进几天多打卡</li> : null}
          </ul>
        </Card>
        <Card>
          <h2 className="text-base font-semibold">⚙️ 动态调整(系统改计划)</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">根据完成率与障碍,系统自动给出调整建议</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={onAdjust} disabled={adjusting || !analInsights.length} className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">{adjusting ? "生成中…" : "生成调整建议"}</button>
            <button onClick={onSaveInsights} disabled={!analInsights.length} className="rounded-lg border border-[var(--brand)] px-4 py-2 text-sm font-medium text-[var(--brand)] hover:bg-indigo-50 disabled:opacity-50">💾 保存洞察到记忆</button>
          </div>
          {saveMsg ? <div className="mt-2 text-xs text-emerald-600">{saveMsg}</div> : null}
          {adjustments ? (
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center gap-2"><span className="rounded bg-slate-100 px-2 py-0.5 text-xs">难度</span><b>{adjustments.difficulty_change}</b></div>
              {adjustments.tasks_to_reschedule?.length ? <div><div className="text-xs text-[var(--muted)]">建议延期 / 拆分的任务</div><ul className="mt-1 list-disc pl-5">{adjustments.tasks_to_reschedule.map((t, i) => (<li key={i}>{t}</li>))}</ul></div> : null}
              <div><div className="text-xs text-[var(--muted)]">执行策略</div><div>{adjustments.focus_strategy}</div></div>
              <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-[var(--muted)]">原因:{adjustments.reason}</div>
            </div>
          ) : null}
        </Card>
      </section>

      <footer className="mt-8 text-center text-xs text-[var(--muted)]">Growth OS · Next.js {`<->`} FastAPI {`<->`} SQLite · GLM</footer>
    </main>
  );
}
