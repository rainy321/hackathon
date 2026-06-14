// 后端 API 客户端。
// - 设了 NEXT_PUBLIC_API_BASE 就用它(Vercel 指向 Render 等);
// - 没设就用同源(Netlify 上走 /api 代理到 Render,无需手动配环境变量)。
// - 本地开发在 frontend/.env.local 里设 NEXT_PUBLIC_API_BASE=http://localhost:8000
const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

async function request(path, { method = "GET", body } = {}) {
  let r;
  try {
    r = await fetch(BASE + path, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new Error(`连接后端失败,请确认 FastAPI 已启动: ${BASE}`);
  }
  if (!r.ok) {
    let detail = String(r.status);
    try {
      detail = (await r.json()).detail || detail;
    } catch (e) {}
    throw new Error(detail);
  }
  return r.json();
}

export const api = {
  users: () => request("/api/users"),
  dashboard: (uid) => request("/api/dashboard?user_id=" + uid),
  tasks: (uid) => request("/api/tasks?user_id=" + uid),
  goals: (uid) => request("/api/goals?user_id=" + uid),
  memory: (uid) => request("/api/memory?user_id=" + uid),
  checkin: (tid, body) => request("/api/tasks/" + tid + "/checkin", { method: "POST", body }),
  decompose: (body) => request("/api/ai/decompose", { method: "POST", body }),
  createGoal: (body) => request("/api/goals", { method: "POST", body }),
  deleteGoal: (gid) => request("/api/goals/" + gid, { method: "DELETE" }),
  completeGoal: (gid) => request("/api/goals/" + gid + "/complete", { method: "POST" }),
  checkDue: (uid, date) => request("/api/goals/check-due", { method: "POST", body: { user_id: uid, date } }),
  planToday: (gid, date) =>
    request("/api/goals/" + gid + "/plan", { method: "POST", body: date ? { date } : {} }),
  createUser: (body) => request("/api/users", { method: "POST", body }),
  updateUser: (uid, body) => request("/api/users/" + uid, { method: "PUT", body }),
  addTask: (body) => request("/api/tasks", { method: "POST", body }),
  updateTask: (tid, body) => request("/api/tasks/" + tid, { method: "PUT", body }),
  deleteTask: (tid) => request("/api/tasks/" + tid, { method: "DELETE" }),
  analysis: (uid) => request("/api/analysis?user_id=" + uid),
  adjust: (uid, insights) => request("/api/adjust?user_id=" + uid, { method: "POST", body: { insights } }),
  saveInsights: (uid, insights) =>
    request("/api/analysis/save?user_id=" + uid, { method: "POST", body: { insights } }),
  register: (body) => request("/api/auth/register", { method: "POST", body }),
  login: (body) => request("/api/auth/login", { method: "POST", body }),
};
