"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
    <main className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Growth OS</h1>
          <p className="mt-2 text-sm text-muted">长期成长操作系统 · 你的成长伙伴</p>
        </div>
        <div className="rounded-2xl border border-line bg-card p-6">
          <div className="mb-5 flex gap-1 rounded-xl bg-paper p-1">
            {["login", "register"].map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${mode === m ? "bg-card text-ink shadow-sm" : "text-muted"}`}>
                {m === "login" ? "登录" : "注册"}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            <Field label="用户名" value={name} onChange={setName} />
            {mode === "register" && <Field label="当前基础" value={baseline} onChange={setBaseline} placeholder="身份 / 可投入时间 / 强弱项" />}
            <Field label="密码" value={password} onChange={setPassword} type="password" />
          </div>
          {err && <div className="mt-3 text-sm text-rose-600">{err}</div>}
          <button onClick={submit} disabled={busy}
            className="mt-5 w-full rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white transition hover:bg-inksoft disabled:opacity-50">
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
      <span className="mb-1.5 block text-xs text-muted">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} type={type} placeholder={placeholder}
        className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none transition focus:border-ink/30 focus:bg-card" />
    </label>
  );
}

/* ============ 资料弹窗(语气可调)============ */
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
      <div className="w-full max-w-md rounded-2xl border border-line bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-ink">编辑资料</h3>
        <p className="mt-1 text-xs text-muted">基础会喂给 AI,语气决定陪伴风格</p>
        <textarea value={baseline} onChange={(e) => setBaseline(e.target.value)} rows={3}
          placeholder="身份 / 可投入时间 / 强弱项"
          className="mt-4 w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:bg-card" />
        <div className="mt-4">
          <div className="mb-2 text-xs text-muted">陪伴语气</div>
          <div className="flex flex-wrap gap-2">
            {TONES.map((x) => (
              <button key={x} onClick={() => setT(x)}
                className={`rounded-xl px-3 py-1.5 text-sm transition ${t === x ? "bg-ink text-white" : "border border-line text-muted hover:text-ink"}`}>{x}</button>
            ))}
          </div>
        </div>
        {err && <div className="mt-3 text-sm text-rose-600">{err}</div>}
        <button onClick={save} className="mt-5 w-full rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-inksoft">保 存</button>
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
        className={`fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full text-2xl shadow-lg transition ${compOpen ? "bg-accent text-white" : "border border-line bg-card text-accent hover:scale-105"}`}>
        🤖
      </button>
      {compOpen && (
        <div className="fixed bottom-24 right-6 z-40 flex h-96 w-80 flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-xl">
          <div className="flex items-center gap-2 border-b border-line px-4 py-3">
            <span className="text-lg">🤖</span>
            <div>
              <div className="text-sm font-semibold text-ink">成长伙伴</div>
              <div className="text-[11px] text-muted">语气 · {tone}</div>
            </div>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto bg-paper px-4 py-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-ink text-white" : "bg-card border border-line text-ink"}`}>{m.text}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t border-line p-2">
            <input value={text} onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { sendCompanion(text); setText(""); } }}
              placeholder="跟伙伴说点什么…"
              className="flex-1 rounded-xl border border-line bg-paper px-3 py-2 text-sm outline-none focus:bg-card" />
            <button onClick={() => { sendCompanion(text); setText(""); }} className="rounded-xl bg-ink px-3 py-2 text-sm text-white">发送</button>
          </div>
        </div>
      )}
    </>
  );
}

/* ============ 导航 + 外壳 ============ */
const NAV = [
  { href: "/", label: "总览" },
  { href: "/tasks", label: "今日任务" },
  { href: "/review", label: "AI 复盘" },
];

export default function Shell({ children }) {
  const { me, logout } = useGrowth();
  const [profile, setProfile] = useState(false);
  const path = usePathname();

  if (!me) return <LoginScreen />;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg">🌱</span>
            <span className="text-base font-semibold tracking-tight text-ink">Growth OS</span>
          </Link>
          <nav className="flex items-center gap-1">
            {NAV.map((n) => {
              const active = path === n.href;
              return (
                <Link key={n.href} href={n.href}
                  className={`rounded-lg px-3 py-1.5 text-sm transition ${active ? "font-semibold text-accent" : "text-muted hover:text-ink"}`}>
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={() => setProfile(true)} className="flex items-center gap-2 rounded-lg border border-line bg-card px-2.5 py-1.5 text-sm text-inksoft hover:text-ink">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs text-white">{(me.name || "?").slice(0, 1)}</span>
              <span className="hidden sm:inline">{me.name}</span>
            </button>
            <button onClick={logout} className="rounded-lg px-2 py-1.5 text-sm text-muted hover:text-ink">退出</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>

      <Companion />
      {profile && <ProfileModal onClose={() => setProfile(false)} />}
    </div>
  );
}
