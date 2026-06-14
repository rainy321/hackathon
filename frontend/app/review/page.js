"use client";

import { useEffect, useState } from "react";
import { Sparkles, SlidersHorizontal, Save, Lightbulb } from "lucide-react";
import { useGrowth } from "../providers";
import { api } from "@/lib/api";
import { Card, PageHeader, Btn } from "../ui";

const pct = (n) => Math.round((n || 0) * 100);

export default function ReviewPage() {
  const { uid, simDate, tone, loadAll } = useGrowth();
  const [analInsights, setAnalInsights] = useState([]);
  const [analMeta, setAnalMeta] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [adjustments, setAdjustments] = useState(null);
  const [adjusting, setAdjusting] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => { setAnalInsights([]); setAnalMeta(null); setAdjustments(null); setSaveMsg(""); }, [simDate]);

  async function onAnalyze() {
    setAnalyzing(true); setErr(""); setAnalInsights([]); setAnalMeta(null); setAdjustments(null); setSaveMsg("");
    try { const r = await api.analysis(uid); setAnalInsights(r.insights || []); setAnalMeta({ rate: r.completion_rate_7d, logs_count: r.logs_count }); }
    catch (e) { setErr(String(e.message || e)); }
    setAnalyzing(false);
  }
  async function onAdjust() {
    setAdjusting(true); setErr(""); setAdjustments(null);
    try { const r = await api.adjust(uid, analInsights); setAdjustments(r.adjustments || null); }
    catch (e) { setErr(String(e.message || e)); }
    setAdjusting(false);
  }
  async function onSave() {
    setErr(""); setSaveMsg("");
    try { const r = await api.saveInsights(uid, analInsights); setSaveMsg(`已保存 ${r.saved} 条洞察到记忆`); await loadAll(uid); }
    catch (e) { setErr(String(e.message || e)); }
  }

  return (
    <>
      <PageHeader title="AI 复盘 & 动态调整" desc={`语气 ${tone} · 系统会根据你近 7 天的行为,反过来改你的计划`} />

      {err && <div className="mb-4 rounded-md border border-[#ffcdd2] bg-[#ffebee] px-4 py-2.5 text-sm text-[#f44336]">{err}</div>}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2 text-sm font-bold text-ink"><Sparkles size={16} className="text-accent" /> 行为复盘(近 7 天)</div>
          <p className="mt-1 text-xs text-text2">快进几天、用选项打卡后,让 AI 总结规律与障碍</p>
          <Btn onClick={onAnalyze} disabled={analyzing} className="mt-4">{analyzing ? "分析中…" : "分析近 7 天"}</Btn>
          {analMeta && <div className="mt-4 text-xs text-text2">完成率 <b className="text-ink">{pct(analMeta.rate)}%</b> · {analMeta.logs_count} 条记录</div>}
          <ul className="mt-4 space-y-2.5">
            {analInsights.map((it, i) => (
              <li key={i} className="rounded-md border border-line bg-paper px-4 py-3">
                <div className="mb-0.5 flex items-center gap-1.5 text-[11px] font-medium text-accent"><Lightbulb size={12} /> {it.insight_type}<span className="ml-1 text-muted">· 把握 {it.confidence ? Math.round(it.confidence * 100) : 0}%</span></div>
                <div className="text-sm text-text2">{it.content}</div>
              </li>
            ))}
            {!analInsights.length && analMeta && <li className="text-sm text-text2">数据太少,先快进几天多打卡</li>}
          </ul>
        </Card>

        <Card>
          <div className="flex items-center gap-2 text-sm font-bold text-ink"><SlidersHorizontal size={16} className="text-accent" /> 动态调整(系统改计划)</div>
          <p className="mt-1 text-xs text-text2">根据完成率与障碍,自动给出调整建议</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Btn onClick={onAdjust} disabled={adjusting || !analInsights.length}>{adjusting ? "生成中…" : "生成调整建议"}</Btn>
            <Btn variant="outline" onClick={onSave} disabled={!analInsights.length}><Save size={15} /> 保存洞察到记忆</Btn>
          </div>
          {saveMsg && <div className="mt-3 text-sm text-accent">{saveMsg}</div>}
          {adjustments && (
            <div className="mt-5 space-y-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="rounded bg-accentsoft px-2 py-0.5 text-xs text-accent">难度</span>
                <b className="text-ink">{adjustments.difficulty_change}</b>
              </div>
              {adjustments.tasks_to_reschedule?.length > 0 && (
                <div>
                  <div className="mb-1 text-xs text-text2">建议延期 / 拆分</div>
                  <ul className="space-y-1">{adjustments.tasks_to_reschedule.map((t, i) => <li key={i} className="rounded-md bg-paper px-3 py-1.5 text-text2">· {t}</li>)}</ul>
                </div>
              )}
              <div><div className="mb-1 text-xs text-text2">执行策略</div><div className="text-text2">{adjustments.focus_strategy}</div></div>
              <div className="rounded-md bg-paper px-4 py-2.5 text-xs text-muted">原因:{adjustments.reason}</div>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
