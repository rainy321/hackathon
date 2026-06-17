"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { addDay, dayDiff, isoToday, companionGreeting, companionReply } from "./shared";

const GrowthCtx = createContext(null);
export const useGrowth = () => useContext(GrowthCtx);

export function GrowthProvider({ children }) {
  const [me, setMe] = useState(null);
  const [simDate, setSimDate] = useState(isoToday);
  const [dash, setDash] = useState(null);
  const [mem, setMem] = useState([]);
  const [tasks, setTasks] = useState([]);

  // 陪伴小人
  const [compOpen, setCompOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newlyCompleted, setNewlyCompleted] = useState([]);
  const [globalError, setGlobalError] = useState("");

  const uid = me?.id || "";
  const tone = me?.tone || "温暖朋友";
  const dayN = dayDiff(isoToday(), simDate) + 1;

  // 挂载后读登录态（SSR 安全）
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const s = localStorage.getItem("gos_me");
        if (s) setMe(JSON.parse(s));
        const sd = localStorage.getItem("gos_sim");
        if (sd) setSimDate(sd);
      } catch (e) {
        console.error("Failed to restore session from localStorage:", e);
        localStorage.removeItem("gos_me");
        localStorage.removeItem("gos_sim");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const loadAll = useCallback((id) => {
    if (!id) return;
    return Promise.all([api.dashboard(id), api.memory(id), api.tasks(id)])
      .then(([d, m, t]) => { setDash(d); setMem(m); setTasks(t); setGlobalError(""); })
      .catch((e) => {
        console.error("Failed to load dashboard data:", e);
        setGlobalError("数据加载失败,请检查后端是否启动");
      });
  }, []);

  // 进入或快进到新一天 → 检查到期目标自动完成（刚完成的用于弹窗）+ 刷新数据
  useEffect(() => {
    if (!uid) return;
    api.checkDue(uid, simDate)
      .then((r) => { if (r && r.newly_completed && r.newly_completed.length) setNewlyCompleted(r.newly_completed); })
      .catch((e) => console.error("Failed to check due goals:", e));
    loadAll(uid);
  }, [uid, simDate, loadAll]);

  function clearCelebration() { setNewlyCompleted([]); }

  useEffect(() => { if (uid) loadAll(uid); }, [uid, loadAll]);

  const refreshDash = useCallback(() => uid ? api.dashboard(uid).then(setDash).catch((e) => console.error("Failed to refresh dashboard:", e)) : null, [uid]);

  function login(u) { localStorage.setItem("gos_me", JSON.stringify(u)); setMe(u); }
  function logout() { localStorage.removeItem("gos_me"); setMe(null); setCompOpen(false); setMessages([]); }
  function updateMe(u) { localStorage.setItem("gos_me", JSON.stringify(u)); setMe(u); }

  function fastForward() {
    setSimDate((d) => {
      const nd = addDay(d, 1);
      localStorage.setItem("gos_sim", nd);
      return nd;
    });
  }

  // 陪伴对话
  function toggleCompanion() {
    setCompOpen((o) => {
      const no = !o;
      if (no && messages.length === 0) {
        setMessages([{ role: "bot", text: companionGreeting(tone, me?.name || "", dayN) }]);
      }
      return no;
    });
  }
  function sendCompanion(text) {
    const t = (text || "").trim();
    if (!t) return;
    setMessages((m) => [...m, { role: "user", text: t }]);
    setTimeout(() => {
      setMessages((m) => [...m, { role: "bot", text: companionReply(t, tone, dash) }]);
    }, 350);
  }

  const value = {
    me, uid, tone, dayN, simDate,
    dash, mem, tasks, setTasks, loadAll, refreshDash,
    login, logout, updateMe, fastForward,
    compOpen, messages, toggleCompanion, sendCompanion,
    newlyCompleted, clearCelebration,
    globalError, setGlobalError,
  };

  return <GrowthCtx.Provider value={value}>{children}</GrowthCtx.Provider>;
}
