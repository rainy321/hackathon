"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Brain,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flame,
  Flower2,
  Leaf,
  ListChecks,
  MessageCircle,
  Moon,
  Sparkles,
  Sprout,
  Star,
  Target,
  TrendingUp,
  Trophy,
  UserRound,
} from "lucide-react";
import { useGrowth } from "./providers";
import { api } from "@/lib/api";
import { Bar, BotanicalAccent, Card, EmptyState, PageHeader, SectionTitle, Stat, Tag } from "./ui";

const pct = (n) => Math.round((n || 0) * 100);
const TIMELINE = [
  ["设定", "目标与基础状态"],
  ["拆解", "阶段与能力"],
  ["今日", "可执行动作"],
  ["记录", "质量与阻碍"],
  ["复盘", "偏差洞察"],
  ["调整", "新计划写回"],
];

export default function Overview() {
  const { me, dash, mem, tasks, simDate, dayN, tone } = useGrowth();
  const uid = me?.id || "";
  const [doneCount, setDoneCount] = useState(0);
  useEffect(() => {
    if (!uid) return;
    api.goals(uid).then((gs) => setDoneCount((gs || []).filter((g) => g.status === "done").length)).catch((e) => console.error("Failed to load goals count:", e));
  }, [uid]);
  const todays = tasks.filter((t) => t.date === simDate);
  const doneToday = todays.filter((t) => t.status === "completed").length;
  const skippedToday = todays.filter((t) => t.status === "skipped").length;
  const pendingToday = Math.max(0, todays.length - doneToday - skippedToday);
  const completion = dash?.completion_rate || 0;
  const categories = dash?.categories || [];
  const recent = dash?.recent_7d || { done: 0, total: 0, rate: 0 };
  const quietHint = pendingToday
    ? `今天还剩 ${pendingToday} 个动作,先挑最轻的一件。`
    : "今天的执行已经收束,适合做一次轻复盘。";

  return (
    <>
      <PageHeader
        kicker="Forest dashboard"
        title={`${me?.name || ""} 的森林书房`}
        desc={`第 ${dayN} 天 · ${simDate} · ${tone}。把长期成长放进一个安静、温暖、可执行的个人仪表盘。`}
        right={
          <Link href="/tasks" className="inline-flex items-center justify-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(127,163,107,0.25)] transition hover:bg-[#72965e]">
            进入今日任务
            <ArrowRight size={16} />
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card tone="soft" className="relative min-h-[310px] overflow-hidden">
          <BotanicalAccent className="absolute -right-10 -top-9 h-40 w-48 opacity-60" />
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_180px] lg:items-center">
            <div>
              <div className="mb-5 flex flex-wrap gap-2">
                <Tag tone="accent">森林书房模式</Tag>
                <Tag tone="neutral">{tone}</Tag>
                <Tag tone={pendingToday ? "warn" : "accent"}>{pendingToday ? `${pendingToday} 个动作待完成` : "今日已安定"}</Tag>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#e8efdc] text-accent shadow-[var(--shadow-pressed)]">
                  <UserRound size={24} />
                </span>
                <div>
                  <div className="text-3xl font-bold leading-tight tracking-tight text-ink">{me?.name || "成长者"}</div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-text2">
                    <CalendarDays size={15} className="text-accent" />
                    {simDate}
                  </div>
                </div>
              </div>

              <p className="mt-6 max-w-2xl text-sm leading-7 text-text2">
                {quietHint} 系统会把真实完成情况、疲惫原因和节奏变化沉淀成记忆,再反过来调整后面的计划。
              </p>

              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  ["今日任务", todays.length, ListChecks],
                  ["已完成", doneToday, CheckCircle2],
                  ["被跳过", skippedToday, Moon],
                ].map(([label, value, Icon]) => (
                  <div key={label} className="rounded-lg border border-line/70 bg-card/60 px-3 py-3 shadow-[var(--shadow-pressed)]">
                    <Icon size={16} className="text-accent" />
                    <div className="mt-2 text-2xl font-bold text-ink">{value}</div>
                    <div className="text-xs text-muted">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-full p-2" style={{ background: `conic-gradient(#7fa36b ${pct(completion)}%, #e8ddc8 0)` }}>
              <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-white/70 bg-card/85 shadow-[var(--shadow-pressed)]">
                <span className="text-4xl font-bold tracking-tight text-ink">{pct(completion)}%</span>
                <span className="mt-1 text-xs font-semibold text-muted">总完成率</span>
              </div>
            </div>
          </div>
        </Card>

        <Card tone="accent" className="relative overflow-hidden">
          <Leaf size={86} className="absolute -right-4 -top-5 text-accent/10" />
          <SectionTitle icon={Brain} title="AI 助手" desc="把行为里的信号翻译成更温柔的下一步。" />
          <div className="rounded-lg border border-accent/15 bg-card/65 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accentsoft text-accent">
                <MessageCircle size={18} />
              </span>
              <div>
                <div className="text-sm font-bold text-ink">今天的建议</div>
                <p className="mt-1 text-sm leading-6 text-text2">
                  {pendingToday ? "先完成一个低难度动作,保留连续性比硬撑更重要。" : "状态不错,可以保存一次洞察,让系统更懂你的节奏。"}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link href="/review" className="rounded-lg border border-line/70 bg-card/55 px-4 py-3 text-sm font-semibold text-ink transition hover:border-accent/35 hover:text-accent">
              去复盘
            </Link>
            <Link href="/tasks" className="rounded-lg border border-line/70 bg-card/55 px-4 py-3 text-sm font-semibold text-ink transition hover:border-accent/35 hover:text-accent">
              去执行
            </Link>
          </div>
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="完成率" value={dash ? `${pct(dash.completion_rate)}%` : "-"} sub={dash ? `累计 ${dash.done}/${dash.total}` : "等待数据"} icon={Target} />
        <Stat label="连续天数" value={dash ? dash.streak : "-"} sub="至少完成一项" icon={Flame} tone="warn" />
        <Stat label="平均质量" value={dash ? dash.avg_quality : "-"} sub="5 分制评分" icon={Star} tone="info" />
        <Stat label="近 7 天" value={dash ? `${pct(recent.rate)}%` : "-"} sub={dash ? `${recent.done}/${recent.total} 条记录` : "等待打卡"} icon={TrendingUp} />
      </div>

      <Link href="/achievements" className="mt-5 flex items-center gap-4 rounded-lg border border-warn/25 bg-warnsoft p-5 shadow-[var(--shadow-card)] transition hover:border-warn/45">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-warn text-white shadow-[var(--shadow-pressed)]"><Trophy size={22} /></span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-ink">成就墙 · 已完成 {doneCount} 个目标</div>
          <div className="text-xs leading-5 text-text2">每一个完成的目标都收在这里,点开看看你的成长里程碑</div>
        </div>
        <ArrowRight size={18} className="shrink-0 text-warn" />
      </Link>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <SectionTitle icon={ListChecks} title="今日清单" desc="保留轻盈明确的下一步。" />
          <div className="space-y-0">
            {todays.slice(0, 5).map((t) => {
              const settled = t.status === "completed" || t.status === "skipped";
              return (
                <div key={t.id} className="flex items-start gap-3 border-t border-line/75 py-3 first:border-t-0 first:pt-0">
                  <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${t.status === "completed" ? "border-accent bg-accent text-white" : t.status === "skipped" ? "border-danger bg-dangersoft text-danger" : "border-line bg-card text-muted"}`}>
                    {t.status === "completed" ? <CheckCircle2 size={14} /> : <Clock3 size={13} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm leading-6 ${settled ? "text-muted line-through" : "text-ink"}`}>{t.content}</div>
                    <div className="mt-1">
                      <Tag tone={t.difficulty === "高" ? "danger" : t.difficulty === "中" ? "warn" : "accent"}>{t.difficulty || "中"}</Tag>
                    </div>
                  </div>
                </div>
              );
            })}
            {!todays.length ? <EmptyState icon={Flower2} title="今天还没有任务" desc="去任务页生成今天的动作,这里会变成安静的执行清单。" /> : null}
          </div>
        </Card>

        <Card tone="soft">
          <SectionTitle icon={Sprout} title="成长时间轴" desc="从目标到记忆,每一步都慢慢落地。" />
          <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
            {TIMELINE.map(([title, desc], i) => (
              <div key={title} className="relative rounded-lg border border-line/70 bg-card/55 px-3 py-3">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-accentsoft text-xs font-bold text-accent">{i + 1}</div>
                <div className="text-sm font-bold text-ink">{title}</div>
                <div className="mt-1 text-xs leading-5 text-muted">{desc}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <SectionTitle icon={TrendingUp} title="维度进度" desc="用柔和的进度条观察执行稳定度。" />
          <div className="space-y-4">
            {categories.map((c) => <Bar key={c.category} label={c.category} rate={c.rate} />)}
            {!categories.length ? <EmptyState icon={Leaf} title="暂无维度数据" desc="先创建目标并完成一次打卡,进度会自动出现在这里。" /> : null}
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <BotanicalAccent className="absolute -bottom-12 -right-12 h-40 w-48 rotate-[-18deg] opacity-35" />
          <SectionTitle icon={Sparkles} title="系统记忆" desc="从行为里沉淀出的长期节奏。" />
          <div className="relative z-10 space-y-3">
            {(mem || []).slice(0, 4).map((m) => (
              <div key={m.id} className="border-t border-line/75 pt-3 first:border-t-0 first:pt-0">
                <Tag tone="accent">{m.insight_type}</Tag>
                <div className="mt-2 text-sm leading-6 text-text2">{m.content}</div>
              </div>
            ))}
            {!(mem || []).length ? <EmptyState icon={Sparkles} title="还没有系统记忆" desc="完成几天打卡并保存洞察后,这里会开始增长。" /> : null}
          </div>
        </Card>
      </div>
    </>
  );
}
