# Growth OS — 项目说明

长期成长操作系统(LifeOS),黑客松项目。把人生目标拆解为每日动作 + AI 反馈闭环
(设目标 → AI 拆解 → 每日任务 → 执行 → 记录行为 → 分析偏差 → 动态调整 → 循环)。
**沟通用中文。**

## 技术栈与架构
- 前端 Next.js → API FastAPI → 核心引擎 → SQLite
- AI:LLM API,**单 Agent + 4 个 Prompt 函数**(非多 Agent 框架)
- 核心引擎:Goal Engine / Planner / Tracker / Memory / AI Adapter

## 关键约束(不要违反)
- **只用单 Agent + 4 个 Prompt 函数**:Goal Decomposer / Daily Planner / Behavior Analyst / System Adjuster
- **不要引入**:LangChain / AutoGen / CrewAI / 多 Agent 框架 / 向量数据库 / 知识图谱 / MCP
- MVP 优先级:P0 必做、P1 加分、P2 不做

## 数据模型(5 表)
`User / Goal / Task / BehaviorLog / Memory` —— 字段详见 `Growth_OS_规划_新.xlsx` 的「4·数据模型」sheet。

## 团队分工(2 人 / 48h)
- **Zack**:全部技术实现(全栈)
- **队友**:设计 + 产品 + 会用 Agent —— 负责 Prompt 工程、Mock/种子数据、UI 设计与文案、Demo 剧本/Pitch/README、用户测试
- 协作原则:数据契约先行;她造 Mock、Zack 写代码;Prompt 她写测、Zack 只接线

## 项目结构(MVP 已建成)
- `backend/` —— FastAPI 服务端
  - `main.py` 路由(5表CRUD + dashboard + AI 接口 + P0闭环 + 反馈系统)
  - `crud.py` 数据库操作 / `db.py` 连接+迁移 / `schema.sql` 建表
  - `ai_adapter.py` 单 Agent + 4 个 Prompt 函数(GLM OpenAI 兼容,带 Mock 兜底)
  - `seed.py` 把 `mock/*.txt` 灌库 / `test_ai.py` 验证 4 个 Prompt
  - `.env` GLM 配置(gitignored) / `growth_os.db` SQLite(gitignored)
- `frontend/` —— Next.js 16 + React 19 + Tailwind v4 客户端
  - `app/page.js` Dashboard(数据卡/维度/今日任务打卡/记忆面板/目标拆解/AI复盘&动态调整)
  - `lib/api.js` 后端 API 客户端
- `prompts/` 4 个 Prompt 文本(队友维护,改 prompt 不动代码)
- `mock/` 演示种子数据(3 用户/3 目标/84 任务/84 日志/15 记忆)
- `docs/` 数据契约 + 给 Zack/队友的任务说明书
- 规划表:`Growth_OS_规划_新.xlsx`(14 sheet 完整版,以此为准)

## 运行
- 灌演示数据:`python backend/seed.py`(reset 重建,可反复跑)
- 后端:`python -m uvicorn main:app --app-dir backend --port 8000 --reload`(文档 /docs)
- 前端:`cd frontend && npm run dev`(http://localhost:3000)
- AI 真模型需 `backend/.env` 里的 GLM key;没 key 自动 Mock,闭环照跑
- 重新生成规划表:关闭 Excel 后 `python build_excel.py` → `python build_excel_team.py`
- 继续本目录会话:`claude -c`;挑历史会话:`claude -r`

## 环境备注
- Windows 11,Python 3.10.9,openpyxl 3.1.5
- 终端打印中文会显示成乱码(GBK 控制台),但写入文件的内容是正确 UTF-8;校验内容请用 `==` 比较,不要看屏幕
