"use client";

import Link from "next/link";
import { useGrowth } from "./providers";
import { Card, PageHeader, Stat, Bar } from "./ui";

const pct = (n) => Math.round((n || 0) * 100);

export default function Overview() {
  const { me, dash, mem, dayN, tone } = useGrowth();

  return (
    <>
      <PageHeader
        title="成长总览"
        desc={`Hi ${me?.name || ""},第 ${dayN} 天 · 陪伴语气 ${tone} · 一切都在慢慢变好`}
      />

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="完成率" value={dash ? `${pct(dash.completion_rate)}%` : "—"} sub={dash ? `${dash.done}/${dash.total} 项任务` : ""} />
        <Stat label="连续天数" value={dash ? dash.streak : "—"} sub="至少完成一项的连续日" />
        <Stat label="平均质量" value={dash ? dash.avg_quality : "—"} sub="5 分制" />
        <Stat label="近 7 天" value={dash ? `${pct(dash.recent_7d.rate)}%` : "—"} sub={dash ? `${dash.recent_7d.done}/${dash.recent_7d.total}` : ""} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="mb-5 text-sm font-semibold text-ink">各维度进度</div>
            <div className="space-y-4">
              {(dash?.categories || []).map((c) => (
                <Bar key={c.category} label={c.category} rate={c.rate} />
              ))}
              {!(dash?.categories || []).length ? <p className="text-sm text-muted">暂无数据,先去今日任务里创建目标</p> : null}
            </div>
            <Link href="/tasks" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-accent hover:gap-2 transition-all">
              去今日任务 →
            </Link>
          </Card>

          <Card className="flex flex-wrap items-center justify-between gap-3 bg-accentsoft">
            <div>
              <div className="text-sm font-semibold text-ink">想看看系统怎么帮你调整?</div>
              <div className="text-xs text-muted">让 AI 复盘近 7 天行为,给出动态调整建议</div>
            </div>
            <Link href="/review" className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90">AI 复盘</Link>
          </Card>
        </div>

        <Card className="h-fit">
          <div className="mb-1 text-sm font-semibold text-ink">系统记忆</div>
          <p className="mb-4 text-xs text-muted">从你的行为中沉淀的洞察,越用越懂你</p>
          <ul className="space-y-3">
            {(mem || []).slice(0, 6).map((m) => (
              <li key={m.id} className="rounded-xl border border-line bg-paper px-3 py-2.5">
                <div className="mb-0.5 text-[11px] font-medium text-accent">{m.insight_type}</div>
                <div className="text-sm text-inksoft">{m.content}</div>
              </li>
            ))}
            {!(mem || []).length ? <li className="text-sm text-muted">暂无洞察</li> : null}
          </ul>
        </Card>
      </div>
    </>
  );
}
