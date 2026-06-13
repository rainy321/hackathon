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

## 当前文件
- `build_excel.py` —— 生成 10-sheet 规划表(`Growth_OS_规划.xlsx`)
- `build_excel_team.py` —— 追加 4 个协作 sheet(加载原文件→追加→存盘;原文件被 Excel 占用时自动存为 `_新.xlsx`)
- `Growth_OS_规划.xlsx` —— 10 sheet 版
- `Growth_OS_规划_新.xlsx` —— **14 sheet 完整版,以此为准**

## 常用命令
- 重新生成规划表:先关闭 Excel,再依次 `python build_excel.py` → `python build_excel_team.py`
- 继续本目录会话:`Codex -c`;挑历史会话:`Codex -r`

## 环境备注
- Windows 11,Python 3.10.9,openpyxl 3.1.5
- 终端打印中文会显示成乱码(GBK 控制台),但写入文件的内容是正确 UTF-8;校验内容请用 `==` 比较,不要看屏幕
