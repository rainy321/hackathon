# Growth OS · 长期成长操作系统

> 把人生目标拆解为每日动作 + AI 反馈闭环:
> **设目标 → AI 拆解 → 每日任务 → 执行 → 记录行为 → 分析偏差 → 动态调整 → 循环**

## ✨ 产品介绍

> 让 AI 陪你从"短期打卡"走向"长期成长",把零散努力变成可实现的未来。

它解决用户在目标执行中普遍存在的"短期化、碎片化、难坚持"问题:通过 AI 自动拆解长期目标、动态规划任务并持续优化路径,帮助用户摆脱传统 Todo 工具的短视局限,真正实现习惯养成、能力提升与生活状态的可持续改善。

传统打卡软件的核心是"记录是否完成",本质是一个行为计数器,关注点停留在"今天做了没";而 Growth OS 是一个**以长期成长为导向的 AI Agent 系统**。区别体现在三个层面:

- **目标-任务-成长闭环**:每个任务都源于 AI 对长期目标(如"3 个月学会 Python")的结构化解构,自动生成阶段性里程碑与关键指标;任务完成不是终点,而是验证和修正成长路径的输入。
- **动态智能规划**:内置 AI 动态调整机制——当连续几天完成率偏低或用户主动触发时,AI 会重新规划后续任务排期、增减任务内容,使计划始终贴合当前状态,避免"计划赶不上变化"导致的放弃。
- **多维成长系统**:定位为 AI Companion,未来可接入日历、运动数据、学习平台,通过长期记忆和跨维度建模,评估整体生活状态的持续优化,而不仅是让某个复选框变绿。

> 所以,打卡只是本软件一个极小的记录反馈动作;**核心价值在于 AI 对长期目标的自主拆解、动态规划与成长路径的持续调优**——这正是与单纯打卡软件的本质分野。

---

## 🧱 技术栈

- 前端:Next.js 16 + React 19 + Tailwind v4
- 后端:FastAPI + SQLite(单 Agent,**4 个 Prompt 函数**,无多 Agent 框架)
- AI:智谱 GLM(OpenAI 兼容协议,无 key 时自动 Mock)

## 🚀 快速开始(本地运行)

```bash
# 1) 安装依赖
python -m pip install -r backend/requirements.txt
cd frontend
npm install          # npm 慢可换镜像: npm config set registry https://registry.npmmirror.com
cd ..

# 2) 配置 AI key
#    复制 backend/.env.example -> backend/.env,填上 GLM_API_KEY

# 3) 启动(开两个终端)
python -m uvicorn main:app --app-dir backend --port 8000   # 后端
cd frontend && npm run dev                                  # 前端,然后开 http://localhost:3000
```

**登录**:用演示账号 `林知远 / 123456`,或注册新账号。

## 🧭 核心功能

- **目标拆解**:输入长期目标后,AI 会拆解出阶段计划、关键能力与可执行任务。
- **每日规划**:根据当前目标阶段生成当天任务,让长期目标落到具体行动。
- **行为记录**:记录任务完成情况、执行质量和遇到的阻碍。
- **AI 复盘**:分析近期行为数据,识别完成率、阻碍和执行节奏上的偏差。
- **动态调整**:根据复盘结果调整任务难度、节奏和后续执行策略。
- **长期记忆**:把有价值的洞察沉淀下来,让系统随着使用逐渐更了解用户。

## 📁 项目结构

```
backend/     FastAPI:main(路由) crud db ai_adapter auth seed schema.sql .env(本地,不上传)
frontend/    Next.js:app/page.js(Dashboard) lib/api.js
prompts/     4 个 Prompt 文本(改 prompt 不动代码)
mock/        演示种子数据(3 用户/3 目标/84 任务/84 日志/15 记忆)
docs/        数据契约、部署指南
```

## 📄 License

MIT
