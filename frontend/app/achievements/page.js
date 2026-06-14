"use client";

import { useEffect, useState } from "react";
import { Trophy, Flame, Star, CheckCircle2, Sprout, CalendarDays, Sparkles } from "lucide-react";
import { useGrowth } from "../providers";
import { api } from "@/lib/api";
import { Bar, Card, PageHeader, EmptyState, Tag } from "../ui";

// 行为里程碑:自动从打卡数据点亮(不用手动)
const MILESTONES = [
  { icon: Sprout, label: "种下第一颗种子", desc: "完成第一个任务", cur: (d) => d.done, goal: 1 },
  { icon: Flame, label: "三天不熄", desc: "连续完成 3 天", cur: (d) => d.streak, goal: 3 },
  { icon: Flame, label: "一周不间断", desc: "连续完成 7 天", cur: (d) => d.streak, goal: 7 },
  { icon: CheckCircle2, label: "十件小事", desc: "累计完成 10 个任务", cur: (d) => d.done, goal: 10 },
  { icon: Star, label: "五十次坚持", desc: "累计完成 50 个任务", cur: (d) => d.done, goal: 50 },
  { icon: Trophy, label: "第一个里程碑", desc: "完成 1 个长期目标", cur: (d, dg) => dg, goal: 1 },
  { icon: CalendarDays, label: "坚持一周", desc: "在系统里待满 7 天", cur: (d, dg, dayN) => dayN, goal: 7 },
  { icon: Sparkles, label: "满月成长", desc: "在系统里待满 30 天", cur: (d, dg, dayN) => dayN, goal: 30 },
];

export default function AchievementsPage() {
  const { uid, dash, dayN } = useGrowth();
  const [done, setDone] = useState([]);

  useEffect(() => {
    if (!uid) return;
    api.goals(uid).then((gs) => setDone((gs || []).filter((g) => g.status === "done"))).catch(() => {});
  }, [uid]);

  const d = { done: dash?.done || 0, streak: dash?.streak || 0 };
  const earned = MILESTONES.filter((m) => m.cur(d, done.length, dayN) >= m.goal).length;

  return (
    <>
      <PageHeader
        kicker="Achievements"
        title="成就墙"
        desc={`已点亮 ${earned}/${MILESTONES.length} 个里程碑 · 已完成 ${done.length} 个目标`}
      />

      {/* 行为里程碑(自动点亮) */}
      <Card tone="soft">
        <div className="mb-4 text-sm font-bold text-ink">成长里程碑 · 自动点亮</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MILESTONES.map((m) => {
            const cur = m.cur(d, done.length, dayN);
            const got = cur >= m.goal;
            const rate = Math.min(1, cur / m.goal);
            const Icon = m.icon;
            return (
              <div key={m.label} className={`rounded-lg border p-4 ${got ? "border-accent/30 bg-accentsoft" : "border-line bg-card/50 opacity-80"}`}>
                <div className="flex items-center gap-2">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${got ? "bg-accent text-white" : "bg-paper text-muted"}`}>
                    <Icon size={17} />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-ink">{m.label}</div>
                    <div className="text-[11px] leading-4 text-text2">{m.desc}</div>
                  </div>
                </div>
                <div className="mt-3">
                  {got ? (
                    <Tag tone="accent">已达成 ✓</Tag>
                  ) : (
                    <>
                      <Bar label={`${Math.min(cur, m.goal)}/${m.goal}`} rate={rate} />
                      <div className="mt-1 text-[11px] text-muted">还差 {Math.max(0, m.goal - cur)}</div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 已完成的目标 */}
      <div className="mt-5">
        <div className="mb-3 text-sm font-bold text-ink">已完成的目标</div>
        {done.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {done.map((g) => {
              let dp = null;
              try { dp = typeof g.decomposition === "string" ? JSON.parse(g.decomposition) : g.decomposition; } catch (e) {}
              return (
                <Card key={g.id} tone="accent">
                  <Trophy size={22} className="mb-3 text-warn" />
                  <div className="text-sm font-bold text-ink">{g.title}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {g.category ? <Tag tone="accent">{g.category}</Tag> : null}
                    {g.time_horizon ? <Tag tone="neutral">{g.time_horizon}</Tag> : null}
                    {dp?.phases?.length ? <Tag tone="info">{dp.phases.length} 阶段</Tag> : null}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={Trophy} title="还没有完成的目标" desc="目标到期会自动完成,或在目标池点 ✓;完成后会出现在这里。" />
        )}
      </div>
    </>
  );
}
