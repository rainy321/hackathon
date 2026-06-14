# Growth OS — 项目说明

长期成长操作系统(LifeOS),黑客松项目。把人生目标拆解为每日动作 + AI 反馈闭环
(设目标 → AI 拆解 → 每日任务 → 执行 → 记录行为 → 分析偏差 → 动态调整 → 循环)。
**沟通用中文。**

## 技术栈
- 前端:Next.js 16 + React 19 + Tailwind v4 + lucide-react(线性图标)
- 后端:FastAPI + SQLite(stdlib `sqlite3`,无 ORM)
- AI:智谱 GLM(OpenAI 兼容协议),**单 Agent + 4 个 Prompt 函数**;无 key 自动 Mock,闭环照跑
- 部署:前端 Vercel / 后端 Render

## 关键约束(不要违反)
- **只用单 Agent + 4 个 Prompt 函数**:Goal Decomposer / Daily Planner / Behavior Analyst / System Adjuster
- **不要引入**:LangChain / AutoGen / CrewAI / 多 Agent 框架 / 向量数据库 / 知识图谱 / MCP
- Prompt 是纯文本(`prompts/*.txt`),**改 prompt 不动代码**
- UI 风格:米白底 `#f8f5f0` + 白卡 + 绿系强调 `#4caf50` + lucide 线性图标

## 项目结构(MVP 已建成)
- `backend/` FastAPI 服务端
  - `main.py` 路由 / `crud.py` 数据库操作 / `db.py` 连接+迁移 / `schema.sql` 建表
  - `ai_adapter.py` 单 Agent + 4 个 Prompt 函数(调 GLM,带 Mock 兜底)
  - `auth.py` 密码哈希(salt+sha256) / `seed.py` 灌演示数据 / `schemas.py` / `test_ai.py`
  - `.env` GLM 配置(gitignored) / `growth_os.db` SQLite(gitignored)
- `frontend/` Next.js 客户端
  - `app/layout.js` `app/shell.js`(左侧栏 + 陪伴小人 + 登录门禁) `app/providers.js`(全局状态) `app/ui.js`(Card/Stat/Btn/Bar) `app/shared.js`(常量+工具)
  - 页面:`app/page.js`(总览) `app/tasks/page.js`(今日任务) `app/review/page.js`(AI 复盘)
  - `lib/api.js` 后端 API 客户端
- `prompts/` 4 个 Prompt 文本
- `mock/` 演示种子数据(3 用户/3 目标/84 任务/84 日志/15 记忆)
- `docs/` 数据契约、部署指南、路演技术实现
- `render.yaml` Render Blueprint(后端一键部署)

## 数据模型(5 表,详见 `schema.sql` 与 `docs/数据契约.md`)
`user`(含 `tone` 陪伴语气、`password` 哈希) · `goal`(含 `decomposition` 拆解 JSON) · `task` · `behavior_log` · `memory`

## 核心功能
- **登录/注册**:轻量密码哈希,会话存 localStorage;演示账号 `林知远 / 123456`
- **演示模式**:模拟日期 +「快进到下一天」(不用真等几天)
- **闭环**:创建目标 → AI 拆解 → 生成今日任务 → 打卡(一键选项) → AI 复盘(近 7 天) → 动态调整 → 写入记忆
- **掌控力**:任务可编辑/删除/新增/换一批;资料(基础 + 语气)可改
- **陪伴小人 🤖**:右下角,点击对话,按当前语气回应

## 运行
- 灌演示数据:`python backend/seed.py`(reset 重建,可反复跑)
- 后端:`python -m uvicorn main:app --app-dir backend --port 8000 --reload`(文档 /docs)
- 前端:`cd frontend && npm install && npm run dev`(http://localhost:3000)
- AI 真 key:复制 `backend/.env.example` → `backend/.env`,填 `GLM_API_KEY`;没 key 自动 Mock

## 部署
- 前端 Vercel:Root Directory `frontend`,环境变量 `NEXT_PUBLIC_API_BASE` = 后端地址
- 后端 Render:Root `backend`,Start `uvicorn main:app --host 0.0.0.0 --port $PORT`,环境变量 `GLM_API_KEY` / `GLM_BASE_URL` / `GLM_MODEL`
- ⚠️ Render 免费版磁盘临时:**重新部署/休眠唤醒会清空 DB**(启动自动 re-seed 3 个种子用户);演示固定用 `林知远 / 123456`

## 环境备注
- Windows 11,Python 3.10.9,Node 24
- 终端打印中文会显示成乱码(GBK 控制台),但文件内容是正确 UTF-8;校验内容请用 `==` 比较,不要看屏幕
- 继续本目录会话:`claude -c`;挑历史会话:`claude -r`
