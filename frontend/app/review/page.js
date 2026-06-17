"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Gauge,
  Lightbulb,
  Save,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useGrowth } from "../providers";
import { api } from "@/lib/api";
import { Bar, BotanicalAccent, Btn, Card, EmptyState, ErrorBanner, PageHeader, SectionTitle, Tag } from "../ui";
import { pct } from "../shared";

export default function ReviewPage() {
  const { uid, simDate, tone, loadAll } = useGrowth();
  const [analInsights, setAnalInsights] = useState([]);
  const [analMeta, setAnalMeta] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [adjustments, setAdjustments] = useState(null);
  const [adjusting, setAdjusting] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAnalInsights([]);
      setAnalMeta(null);
      setAdjustments(null);
      setSaveMsg("");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [simDate]);

  async function onAnalyze() {
    setAnalyzing(true);
    setErr("");
    setAnalInsights([]);
    setAnalMeta(null);
    setAdjustments(null);
    setSaveMsg("");
    try {
      const r = await api.analysis(uid);
      setAnalInsights(r.insights || []);
      setAnalMeta({ rate: r.completion_rate_7d, logs_count: r.logs_count });
    } catch (e) {
      setErr(String(e.message || e));
    }
    setAnalyzing(false);
  }

  async function onAdjust() {
    setAdjusting(true);
    setErr("");
    setAdjustments(null);
    try {
      const r = await api.adjust(uid, analInsights);
      setAdjustments(r.adjustments || null);
    } catch (e) {
      setErr(String(e.message || e));
    }
    setAdjusting(false);
  }

  async function onSave() {
    setErr("");
    setSaveMsg("");
    try {
      const r = await api.saveInsights(uid, analInsights);
      setSaveMsg(`已保存 ${r.saved} 条洞察到记忆`);
      await loadAll(uid);
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  return (
    <>
      <PageHeader
        kicker="AI review loop"
        title="AI 复盘 & 动态调整"
        desc={`当前日期 ${simDate} · 语气 ${tone}。这里读取近 7 天行为,把真实阻碍转成新的计划策略。`}
      />

      <ErrorBanner message={err} />

      <Card tone="info" className="relative mb-5 overflow-hidden">
        <BotanicalAccent className="absolute -bottom-14 -right-12 h-44 w-52 rotate-[-16deg] opacity-25" />
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-ink">
              <Brain size={17} className="text-info" />
              复盘闭环
            </div>
            <p className="mt-1 text-xs leading-5 text-text2">行为数据先变成洞察,洞察再变成调整建议,最后写回长期记忆。</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
            {[
              ["1", "分析"],
              ["2", "调整"],
              ["3", "记忆"],
            ].map(([n, label]) => (
              <div key={label} className="rounded-md bg-card px-4 py-2 text-ink">
                <div className="text-accent">{n}</div>
                <div>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card className="relative overflow-hidden">
          <BotanicalAccent className="absolute -right-16 -top-14 h-44 w-52 opacity-20" />
          <SectionTitle
            icon={Sparkles}
            title="行为复盘"
            desc="分析近 7 天完成率、质量和记录原因。"
            right={
              <Btn onClick={onAnalyze} disabled={analyzing}>
                <TrendingUp size={15} />
                {analyzing ? "分析中..." : "分析近 7 天"}
              </Btn>
            }
          />

          {analMeta ? (
            <div className="mb-5 grid gap-4 sm:grid-cols-[1fr_120px] sm:items-end">
              <Bar label="近 7 天完成率" rate={analMeta.rate} />
              <div className="rounded-md bg-paper px-3 py-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">
                  <Gauge size={13} />
                  行为记录
                </div>
                <div className="mt-1 text-2xl font-bold text-ink">{analMeta.logs_count}</div>
              </div>
            </div>
          ) : null}

          <div className="space-y-0">
            {analInsights.map((it, i) => (
              <div key={i} className="border-t border-line py-4 first:border-t-0 first:pt-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag tone="accent">{it.insight_type}</Tag>
                  <Tag tone="neutral">把握 {it.confidence ? Math.round(it.confidence * 100) : 0}%</Tag>
                </div>
                <div className="mt-2 flex gap-2 text-sm leading-6 text-text2">
                  <Lightbulb size={15} className="mt-1 shrink-0 text-warn" />
                  <span>{it.content}</span>
                </div>
              </div>
            ))}
          </div>

          {!analInsights.length ? (
            <EmptyState
              icon={Lightbulb}
              title={analMeta ? "数据太少" : "还没有生成洞察"}
              desc={analMeta ? "先快进几天并多做几次打卡,AI 会更容易看出规律。" : "点击分析近 7 天后,洞察会出现在这里。"}
            />
          ) : null}
        </Card>

        <Card tone="accent" className="relative overflow-hidden">
          <BotanicalAccent className="absolute -bottom-14 -right-14 h-44 w-52 rotate-[-18deg] opacity-30" />
          <SectionTitle
            icon={SlidersHorizontal}
            title="动态调整"
            desc="根据洞察降低或提高难度,重排任务,给出新的执行策略。"
          />

          <div className="mb-5 grid gap-2 sm:grid-cols-2">
            <Btn onClick={onAdjust} disabled={adjusting || !analInsights.length}>
              <ArrowRight size={15} />
              {adjusting ? "生成中..." : "生成调整建议"}
            </Btn>
            <Btn variant="outline" onClick={onSave} disabled={!analInsights.length}>
              <Save size={15} />
              保存洞察到记忆
            </Btn>
          </div>

          {saveMsg ? (
            <div className="mb-4 flex items-center gap-2 rounded-md bg-card px-3 py-2 text-sm font-semibold text-accent">
              <CheckCircle2 size={16} />
              {saveMsg}
            </div>
          ) : null}

          {adjustments ? (
            <div className="space-y-5">
              <div className="border-t border-accent/20 pt-4 first:border-t-0 first:pt-0">
                <Tag tone="warn">难度变化</Tag>
                <div className="mt-2 text-lg font-bold text-ink">{adjustments.difficulty_change}</div>
              </div>

              {adjustments.tasks_to_reschedule?.length > 0 ? (
                <div className="border-t border-accent/20 pt-4">
                  <div className="mb-3 text-xs font-semibold text-text2">建议延期或拆分</div>
                  <ul className="space-y-2">
                    {adjustments.tasks_to_reschedule.map((t, i) => (
                      <li key={i} className="flex gap-2 text-sm leading-6 text-text2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="border-t border-accent/20 pt-4">
                <div className="mb-2 text-xs font-semibold text-text2">执行策略</div>
                <div className="text-sm leading-6 text-ink">{adjustments.focus_strategy}</div>
              </div>

              <div className="rounded-md bg-card px-4 py-3 text-xs leading-6 text-text2">
                <span className="font-semibold text-ink">调整原因: </span>
                {adjustments.reason}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={SlidersHorizontal}
              title="等待调整建议"
              desc="先生成行为洞察,再让系统把偏差转成下一步计划。"
            />
          )}
        </Card>
      </div>
    </>
  );
}
