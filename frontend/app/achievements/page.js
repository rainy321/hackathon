"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { useGrowth } from "../providers";
import { api } from "@/lib/api";
import { Card, PageHeader, EmptyState, Tag } from "../ui";

export default function AchievementsPage() {
  const { uid } = useGrowth();
  const [done, setDone] = useState([]);

  useEffect(() => {
    if (!uid) return;
    api.goals(uid).then((gs) => setDone((gs || []).filter((g) => g.status === "done"))).catch(() => {});
  }, [uid]);

  return (
    <>
      <PageHeader
        kicker="Achievements"
        title="成就墙"
        desc={`已完成 ${done.length} 个目标 · 每一个都是实打实的成长里程碑`}
      />

      {done.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {done.map((g) => {
            let d = null;
            try { d = typeof g.decomposition === "string" ? JSON.parse(g.decomposition) : g.decomposition; } catch (e) {}
            return (
              <Card key={g.id} tone="accent" className="relative">
                <Trophy size={22} className="mb-3 text-warn" />
                <div className="text-sm font-bold text-ink">{g.title}</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {g.category ? <Tag tone="accent">{g.category}</Tag> : null}
                  {g.time_horizon ? <Tag tone="neutral">{g.time_horizon}</Tag> : null}
                  {d?.phases?.length ? <Tag tone="info">{d.phases.length} 阶段</Tag> : null}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Trophy}
          title="还没有完成的目标"
          desc="去「今日任务」把一个目标点 ✓ 完成,它就会出现在这面成就墙上。"
        />
      )}
    </>
  );
}
