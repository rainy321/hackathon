"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sprout, LayoutDashboard, ListChecks, Brain, LogOut, Bot, Leaf } from "lucide-react";
import { useGrowth } from "./providers";
import { api } from "@/lib/api";
import { TONES } from "./shared";

/* ============ 登录 / 注册 ============ */
function LoginScreen() {
  const { login } = useGrowth();
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
      login(u);
    } catch (e) { setErr(String(e.message || e)); }
    setBusy(false);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5">
      <Sprout size={120} className="pointer-events-none absolute -left-6 -top-6 text-accent2/20" />
      <Leaf size={90} className="pointer-events-none absolute bottom-8 right-10 text-accent2/20" />
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-white"><Sprout size={22} /></span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">Growth OS</h1>
            <p className="text-xs text-text2">长期成长操作系统</p>
          </div>
        </div>
        <div className="rounded-lg border border-line bg-card p-6 shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
          <div className="mb-5 flex gap-1 rounded-md bg-paper p-1">
            {["login", "register"].map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition ${mode === m ? "bg-card text-ink shadow-sm" : "text-muted"}`}>
                {m === "login" ? "登录" : "注册"}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            <Field label="用户名" value={name} onChange={setName} />
            {mode === "register" && <Field label="当前基础" value={baseline} onChange={setBaseline} placeholder="身份 / 可投入时间 / 强弱项" />}
            <Field label="密码" value={password} onChange={setPassword} type="password" />
          </div>
          {err && <div className="mt-3 text-sm text-[#f44336]">{err}</div>}
          <button onClick={submit} disabled={busy}
            className="mt-5 w-full rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#43a047] disabled:opacity-50">
            {busy ? "处理中…" : mode === "login" ? "登 录" : "注册并登录"}
          </button>
          <p className="mt-4 text-center text-xs text-muted">演示账号 · 林知远 / 123456</p>
        </div>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-text2">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} type={type} placeholder={placeholder}
        className="w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent/50 focus:bg-card" />
    </label>
  );
}

/* ============ 资料弹窗 ============ */
function ProfileModal({ onClose }) {
  const { me, updateMe, tone } = useGrowth();
  const [baseline, setBaseline] = useState(me?.baseline || "");
  const [t, setT] = useState(tone);
  const [err, setErr] = useState("");
  async function save() {
    try { const u = await api.updateUser(me.id, { baseline, tone: t }); updateMe(u); onClose(); }
    catch (e) { setErr(String(e.message || e)); }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-5" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg border border-line bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-bold text-ink">编辑资料</h3>
        <p className="mt-1 text-xs text-text2">基础会喂给 AI,语气决定陪伴风格</p>
        <textarea value={baseline} onChange={(e) => setBaseline(e.target.value)} rows={3}
          placeholder="身份 / 可投入时间 / 强弱项"
          className="mt-4 w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:bg-card" />
        <div className="mt-4">
          <div className="mb-2 text-xs text-text2">陪伴语气</div>
          <div className="flex flex-wrap gap-2">
            {TONES.map((x) => (
              <button key={x} onClick={() => setT(x)}
                className={`rounded-md px-3 py-1.5 text-sm transition ${t === x ? "bg-accent text-white" : "border border-line text-muted hover:text-ink"}`}>{x}</button>
            ))}
          </div>
        </div>
        {err && <div className="mt-3 text-sm text-[#f44336]">{err}</div>}
        <button onClick={save} className="mt-5 w-full rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#43a047]">保 存</button>
      </div>
    </div>
  );
}

/* ============ 陪伴小人 + 对话 ============ */
function Companion() {
  const { compOpen, messages, toggleCompanion, sendCompanion, tone } = useGrowth();
  const [text, setText] = useState("");
  return (
    <>
      <button onClick={toggleCompanion} aria-label="陪伴伙伴"
        className={`fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition ${compOpen ? "bg-accent text-white" : "border border-line bg-card text-accent hover:scale-105"}`}>
        <Bot size={24} />
      </button>
      {compOpen && (
        <div className="fixed bottom-24 right-6 z-40 flex h-96 w-80 flex-col overflow-hidden rounded-lg border border-line bg-card shadow-xl">
          <div className="flex items-center gap-2 border-b border-line bg-accentsoft px-4 py-3">
            <Bot size={20} className="text-accent" />
            <div>
              <div className="text-sm font-bold text-ink">成长伙伴</div>
              <div className="text-[11px] text-text2">语气 · {tone}</div>
            </div>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto bg-paper px-4 py-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.role === "user" ? "bg-accent text-white" : "border border-line bg-card text-ink"}`}>{m.text}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t border-line p-2">
            <input value={text} onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { sendCompanion(text); setText(""); } }}
              placeholder="跟伙伴说点什么…"
              className="flex-1 rounded-md border border-line bg-paper px-3 py-2 text-sm outline-none focus:bg-card" />
            <button onClick={() => { sendCompanion(text); setText(""); }} className="rounded-md bg-accent px-3 py-2 text-sm text-white">发送</button>
          </div>
        </div>
      )}
    </>
  );
}

/* ============ 左侧栏 + 外壳 ============ */
const NAV = [
  { href: "/", label: "总览", icon: LayoutDashboard },
  { href: "/tasks", label: "今日任务", icon: ListChecks },
  { href: "/review", label: "AI 复盘", icon: Brain },
];

export default function Shell({ children }) {
  const { me, logout } = useGrowth();
  const [profile, setProfile] = useState(false);
  const path = usePathname();

  if (!me) return <LoginScreen />;

  return (
    <div className="flex min-h-screen">
      {/* 左侧栏 */}
      <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-line bg-card">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white"><Sprout size={18} /></span>
          <span className="text-base font-bold tracking-tight text-ink">Growth OS</span>
        </div>

        <button onClick={() => setProfile(true)} className="mx-3 mb-4 flex items-center gap-3 rounded-md bg-paper px-3 py-2.5 text-left transition hover:bg-accentsoft">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">{(me.name || "?").slice(0, 1)}</span>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-ink">{me.name}</div>
            <div className="text-[11px] text-muted">点击编辑资料</div>
          </div>
        </button>

        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((n) => {
            const active = path === n.href;
            const Icon = n.icon;
            return (
              <Link key={n.href} href={n.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition ${active ? "bg-accentsoft font-semibold text-accent" : "text-text2 hover:bg-paper hover:text-ink"}`}>
                <Icon size={18} strokeWidth={active ? 2.4 : 2} /> {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 px-5 py-3 text-accent2/50">
          <Leaf size={16} /><Leaf size={12} /><Sprout size={14} />
        </div>
        <div className="border-t border-line px-3 py-3">
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted transition hover:bg-paper hover:text-ink">
            <LogOut size={18} /> 退出登录
          </button>
        </div>
      </aside>

      {/* 主内容 */}
      <main className="flex-1 px-8 py-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>

      <Companion />
      {profile && <ProfileModal onClose={() => setProfile(false)} />}
    </div>
  );
}
