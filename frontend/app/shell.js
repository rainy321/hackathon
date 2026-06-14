"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  Brain,
  CalendarDays,
  ChevronRight,
  LayoutDashboard,
  Leaf,
  ListChecks,
  LogOut,
  MessageCircle,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Sprout,
  UserRound,
} from "lucide-react";
import { useGrowth } from "./providers";
import { api } from "@/lib/api";
import { TONES } from "./shared";
import { BotanicalAccent, Btn, Tag } from "./ui";

const NAV = [
  { href: "/", label: "总览", icon: LayoutDashboard },
  { href: "/tasks", label: "今日任务", icon: ListChecks },
  { href: "/review", label: "AI 复盘", icon: Brain },
];

function Field({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-text2">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        className="w-full rounded-md border border-line/90 bg-card/65 px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent/50 focus:bg-card"
      />
    </label>
  );
}

function LoginScreen() {
  const { login } = useGrowth();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [baseline, setBaseline] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr("");
    setBusy(true);
    try {
      const u = mode === "login"
        ? await api.login({ name: name.trim(), password })
        : await api.register({ name: name.trim(), baseline: baseline.trim(), password });
      login(u);
    } catch (e) {
      setErr(String(e.message || e));
    }
    setBusy(false);
  }

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1fr_420px]">
        <section className="relative hidden overflow-hidden rounded-lg border border-line/80 bg-[rgba(255,250,242,0.72)] p-8 shadow-[var(--shadow-soft)] backdrop-blur-xl lg:block">
          <BotanicalAccent className="absolute -bottom-10 -right-12 h-48 w-56 rotate-[-12deg] opacity-45" />
          <div className="absolute right-8 top-8 flex items-center gap-2 text-accent2/40">
            <Leaf size={26} />
            <Sprout size={20} />
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-white">
              <Sprout size={22} />
            </span>
            <div>
              <div className="text-xl font-bold tracking-tight text-ink">Growth OS</div>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Life execution loop</div>
            </div>
          </div>

          <h1 className="mt-10 max-w-xl text-4xl font-bold leading-tight tracking-tight text-ink">
            把长期目标变成每天能执行、会被系统修正的成长路径
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-text2">
            目标、计划、行为、复盘、调整、记忆放在同一个工作台里。演示时可以快进几天，让系统看见偏差并自动收缩计划。
          </p>

          <div className="mt-8 grid grid-cols-7 gap-1.5">
            {["目标", "拆解", "计划", "执行", "记录", "分析", "调整"].map((x, i) => (
              <div key={x} className={`rounded-md px-2 py-2 text-center text-xs font-semibold ${i < 4 ? "bg-accentsoft text-accent" : "bg-paper text-text2"}`}>
                {x}
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-lg border border-line/80 bg-card/60 p-5 shadow-[var(--shadow-pressed)]">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-ink">
                <ShieldCheck size={17} className="text-accent" />
                今日作战板
              </div>
              <Tag tone="info">Demo ready</Tag>
            </div>
            <div className="space-y-3">
              {[
                ["长期目标", "3个月学会高尔夫"],
                ["今日动作", "握杆练习 20 分钟 · 推杆 30 球 · 复盘视频"],
                ["系统判断", "晚间任务过重，建议把高强度练习移到周末"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4 border-t border-line pt-3 first:border-t-0 first:pt-0">
                  <span className="shrink-0 text-xs font-semibold text-muted">{label}</span>
                  <span className="text-right text-sm leading-6 text-ink">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-line/80 bg-[rgba(255,250,242,0.78)] p-6 shadow-[var(--shadow-soft)] backdrop-blur-xl">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-white">
              <Sprout size={22} />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink">Growth OS</h1>
              <p className="text-xs text-text2">长期成长操作系统</p>
            </div>
          </div>

          <div className="mb-6">
            <div className="text-2xl font-bold tracking-tight text-ink">{mode === "login" ? "欢迎回来" : "创建成长档案"}</div>
            <p className="mt-2 text-sm leading-6 text-text2">
              {mode === "login" ? "继续今天的目标闭环。" : "写下基础状态，系统会用它安排更贴身的任务。"}
            </p>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-1 rounded-md bg-paper/70 p-1">
            {[
              ["login", "登录"],
              ["register", "注册"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`rounded px-3 py-2 text-sm font-semibold transition ${mode === key ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <Field label="用户名" value={name} onChange={setName} />
            {mode === "register" ? (
              <Field label="当前基础" value={baseline} onChange={setBaseline} placeholder="身份 / 可投入时间 / 强弱项" />
            ) : null}
            <Field label="密码" value={password} onChange={setPassword} type="password" />
          </div>

          {err ? <div className="mt-3 rounded-md bg-dangersoft px-3 py-2 text-sm text-danger">{err}</div> : null}

          <Btn onClick={submit} disabled={busy} size="lg" className="mt-5 w-full">
            {busy ? "处理中..." : mode === "login" ? "登录" : "注册并登录"}
          </Btn>
          <div className="mt-4 rounded-md bg-paper px-3 py-2 text-center text-xs text-muted">
            演示账号: 林知远 / 123456
          </div>
        </section>
      </div>
    </main>
  );
}

function ProfileModal({ onClose }) {
  const { me, updateMe, tone } = useGrowth();
  const [baseline, setBaseline] = useState(me?.baseline || "");
  const [t, setT] = useState(tone);
  const [err, setErr] = useState("");

  async function save() {
    try {
      const u = await api.updateUser(me.id, { baseline, tone: t });
      updateMe(u);
      onClose();
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#4a463f]/30 px-5 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg border border-line/80 bg-[rgba(255,250,242,0.9)] p-6 shadow-2xl backdrop-blur-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-ink">编辑资料</h3>
            <p className="mt-1 text-xs leading-5 text-text2">基础状态会进入 AI 规划上下文。</p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accentsoft text-accent">
            <Settings size={17} />
          </span>
        </div>

        <label className="mt-5 block">
          <span className="mb-1.5 block text-xs font-semibold text-text2">当前基础</span>
          <textarea
            value={baseline}
            onChange={(e) => setBaseline(e.target.value)}
            rows={4}
            placeholder="身份 / 可投入时间 / 强弱项"
            className="w-full rounded-md border border-line/90 bg-card/65 px-3 py-2.5 text-sm leading-6 outline-none transition focus:border-accent/50 focus:bg-card"
          />
        </label>

        <div className="mt-4">
          <div className="mb-2 text-xs font-semibold text-text2">陪伴语气</div>
          <div className="grid grid-cols-3 gap-2">
            {TONES.map((x) => (
              <button
                key={x}
                onClick={() => setT(x)}
                className={`rounded-md border px-2 py-2 text-sm font-semibold transition ${t === x ? "border-accent bg-accent text-white" : "border-line bg-card/65 text-text2 hover:text-ink"}`}
              >
                {x}
              </button>
            ))}
          </div>
        </div>

        {err ? <div className="mt-3 rounded-md bg-dangersoft px-3 py-2 text-sm text-danger">{err}</div> : null}

        <div className="mt-5 flex justify-end gap-2">
          <Btn variant="quiet" onClick={onClose}>取消</Btn>
          <Btn onClick={save}>保存</Btn>
        </div>
      </div>
    </div>
  );
}

function Companion() {
  const { compOpen, messages, toggleCompanion, sendCompanion, tone } = useGrowth();
  const [text, setText] = useState("");

  function submit() {
    sendCompanion(text);
    setText("");
  }

  return (
    <>
      <button
        onClick={toggleCompanion}
        aria-label="成长伙伴"
        className={`fixed bottom-20 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition lg:bottom-6 lg:right-6 ${compOpen ? "bg-accent text-white" : "border border-line/80 bg-card/85 text-accent backdrop-blur-xl hover:scale-105"}`}
      >
        {compOpen ? <MessageCircle size={24} /> : <Bot size={24} />}
      </button>

      {compOpen ? (
        <div className="fixed bottom-36 right-5 z-40 flex h-[420px] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-lg border border-line/80 bg-[rgba(255,250,242,0.9)] shadow-2xl backdrop-blur-xl lg:bottom-24 lg:right-6 lg:w-[22rem]">
          <div className="flex items-center justify-between border-b border-line/80 bg-accentsoft/80 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-card text-accent">
                <Bot size={19} />
              </span>
              <div>
                <div className="text-sm font-bold text-ink">成长伙伴</div>
                <div className="text-[11px] text-text2">语气: {tone}</div>
              </div>
            </div>
            <Sparkles size={16} className="text-accent" />
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto bg-paper/55 px-4 py-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[82%] rounded-lg px-3 py-2 text-sm leading-6 ${m.role === "user" ? "bg-accent text-white" : "border border-line/80 bg-card/75 text-ink"}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 border-t border-line/80 p-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              placeholder="跟伙伴说点什么..."
              className="min-w-0 flex-1 rounded-md border border-line/90 bg-card/65 px-3 py-2 text-sm outline-none transition focus:border-accent/50 focus:bg-card"
            />
            <button onClick={submit} aria-label="发送" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent text-white">
              <Send size={16} />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function NavLink({ item, active }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${active ? "bg-accentsoft text-accent" : "text-text2 hover:bg-paper hover:text-ink"}`}
    >
      <Icon size={18} strokeWidth={active ? 2.4 : 2} />
      <span>{item.label}</span>
    </Link>
  );
}

function MobileNav({ path }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-[rgba(255,250,242,0.86)] px-2 py-2 shadow-[0_-8px_24px_rgba(84,74,58,0.1)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-3 gap-1">
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = path === n.href;
          return (
            <Link key={n.href} href={n.href} className={`flex flex-col items-center gap-1 rounded-md px-2 py-2 text-[11px] font-semibold ${active ? "bg-accentsoft text-accent" : "text-muted"}`}>
              <Icon size={18} />
              <span>{n.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function Shell({ children }) {
  const { me, logout, simDate, dayN, tone } = useGrowth();
  const [profile, setProfile] = useState(false);
  const path = usePathname();

  if (!me) return <LoginScreen />;

  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-line/70 bg-[rgba(255,250,242,0.7)] shadow-[var(--shadow-card)] backdrop-blur-xl lg:flex">
        <div className="px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-white">
              <Sprout size={20} />
            </span>
            <div>
              <div className="text-lg font-bold tracking-tight text-ink">Growth OS</div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">Daily growth cockpit</div>
            </div>
          </div>
        </div>

        <button onClick={() => setProfile(true)} className="mx-4 mb-4 flex items-center gap-3 rounded-lg border border-line/80 bg-card/55 px-3 py-3 text-left transition hover:border-accent/30 hover:bg-accentsoft/80">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent text-sm font-bold text-white">
            {(me.name || "?").slice(0, 1)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-ink">{me.name}</div>
            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
              <UserRound size={12} />
              {tone}
            </div>
          </div>
          <ChevronRight size={16} className="text-muted" />
        </button>

        <div className="mx-4 mb-5 rounded-lg border border-accent/15 bg-accentsoft/80 px-3 py-3 shadow-[var(--shadow-pressed)]">
          <div className="flex items-center gap-2 text-xs font-semibold text-accent">
            <CalendarDays size={14} />
            模拟第 {dayN} 天
          </div>
          <div className="mt-1 text-sm font-bold text-ink">{simDate}</div>
        </div>

        <nav className="flex-1 space-y-1 px-4">
          {NAV.map((n) => <NavLink key={n.href} item={n} active={path === n.href} />)}
        </nav>

        <div className="relative mx-4 mb-4 overflow-hidden rounded-lg border border-line/80 bg-card/50 p-3">
          <BotanicalAccent className="absolute -bottom-10 -right-12 h-28 w-36 rotate-[-18deg] opacity-25" />
          <div className="relative z-10 flex items-center gap-2 text-xs font-bold text-ink">
            <Sparkles size={14} className="text-accent" />
            单 Agent · 4 Prompt
          </div>
          <div className="relative z-10 mt-2 grid grid-cols-2 gap-1.5 text-[11px] font-semibold text-text2">
            {["拆解", "计划", "分析", "调整"].map((x) => <span key={x} className="rounded bg-paper/70 px-2 py-1 text-center">{x}</span>)}
          </div>
        </div>

        <div className="border-t border-line/70 px-4 py-3">
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-muted transition hover:bg-paper hover:text-ink">
            <LogOut size={18} />
            退出登录
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line/70 bg-[rgba(245,238,223,0.78)] px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white">
            <Sprout size={18} />
          </span>
          <div>
            <div className="text-sm font-bold text-ink">Growth OS</div>
            <div className="text-[11px] text-muted">第 {dayN} 天 · {simDate}</div>
          </div>
        </div>
        <button onClick={() => setProfile(true)} className="flex h-9 w-9 items-center justify-center rounded-md border border-line/80 bg-card/75 text-accent">
          <Settings size={17} />
        </button>
      </header>

      <main className="flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>

      <Companion />
      <MobileNav path={path} />
      {profile ? <ProfileModal onClose={() => setProfile(false)} /> : null}
    </div>
  );
}
