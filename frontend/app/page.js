"use client";

import Link from "next/link";
import { Target, Flame, Star, TrendingUp, ListChecks, Brain, Sprout, Leaf } from "lucide-react";
import { useGrowth } from "./providers";
import { Card, PageHeader, Stat, Bar } from "./ui";

const pct = (n) => Math.round((n || 0) * 100);
const LOOP = ["设目标", "拆解", "每日任务", "打卡", "分析", "调整", "记忆"];

export default function Overview() {
  const { me, dash, mem, tasks, simDate, dayN, tone } = useGrowth();
  const todays = tasks.filter((t) => t.date === simDate);

  return (
    <>
      <PageHeader
        title="成长总览"
        desc={`Hi ${me?.name || ""},第 ${dayN} 天 · 陪伴语气 ${tone} · 一起慢慢变好`}
      />

      {/* 统计卡(带线性图标) */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="完成率" value={dash ? `${pct(dash.completion_rate)}%` : "—"} sub={dash ? `目标 ${dash.done}/${dash.total}` : ""} icon={Target} />
        <Stat label="连续天数" value={dash ? dash.streak : "—"} sub="至少完成一项" icon={Flame} />
        <Stat label="平均质量" value={dash ? dash.avg_quality : "—"} sub="5 分制" icon={Star} />
        <Stat label="近 7 天" value={dash ? `${pct(dash.recent_7d.rate)}%` : "—"} sub={dash ? `${dash.recent_7d.done}/${dash.recent_7d.total}` : ""} icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* 中栏 */}
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <div className="mb-4 text-sm font-bold text-ink">各维度进度</div>
            <div className="space-y-4">
              {(dash?.categories || []).map((c) => <Bar key={c.category} label={c.category} rate={c.rate} />)}
              {!(dash?.categories || []).length && <p className="text-sm text-text2">暂无数据,先去今日任务创建目标</p>}
            </div>
          </Card>

          {/* 推荐卡(模板的浅绿底) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link href="/tasks" className="group flex items-center gap-3 rounded-lg border border-accentsoft bg-accentsoft p-4 transition hover:shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-card text-accent"><ListChecks size={20} /></span>
              <div>
                <div className="text-sm font-semibold text-ink">今日任务</div>
                <div className="text-xs text-text2">去完成今天的 {todays.length} 个任务</div>
              </div>
            </Link>
            <Link href="/review" className="group flex items-center gap-3 rounded-lg border border-accentsoft bg-accentsoft p-4 transition hover:shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-card text-accent"><Brain size={20} /></span>
              <div>
                <div className="text-sm font-semibold text-ink">AI 复盘</div>
                <div className="text-xs text-text2">让系统分析并调整你的计划</div>
              </div>
            </Link>
          </div>
        </div>

        {/* 右栏 */}
        <div className="space-y-5">
          <Card>
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-ink"><Sprout size={16} className="text-accent" /> 成长闭环</div>
            <div className="flex flex-wrap items-center gap-1 text-[11px] text-text2">
              {LOOP.map((s, i) => (
                <span key={s} className="flex items-center gap-1">
                  <span className="rounded bg-accentsoft px-1.5 py-0.5 text-accent">{s}</span>
                  {i < LOOP.length - 1 && <span className="text-muted">→</span>}
                </span>
              ))}
              <span className="ml-1 text-accent2">↺</span>
            </div>
          </Card>

          <Card className="relative">
            <Leaf size={48} className="pointer-events-none absolute -right-2 -top-2 text-accent2/15" />
            <div className="mb-1 text-sm font-bold text-ink">系统记忆</div>
            <p className="mb-3 text-xs text-text2">从你的行为中沉淀的洞察</p>
            <ul className="space-y-2.5">
              {(mem || []).slice(0, 5).map((m) => (
                <li key={m.id} className="rounded-md border border-line bg-paper px-3 py-2">
                  <div className="mb-0.5 text-[11px] font-medium text-accent">{m.insight_type}</div>
                  <div className="text-xs text-text2">{m.content}</div>
                </li>
              ))}
              {!(mem || []).length && <li className="text-sm text-text2">暂无洞察</li>}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
