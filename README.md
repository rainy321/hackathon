# Growth OS · 长期成长操作系统

> 把人生目标拆解为每日动作 + AI 反馈闭环:
> **设目标 → AI 拆解 → 每日任务 → 执行 → 记录行为 → 分析偏差 → 动态调整 → 循环**

<!-- ============================================================
     📌 给队友(产品/设计):
     下面「✨ 产品介绍」这一段是给你写的——项目的痛点、亮点、
     差异化("系统会反过来改计划")、目标用户,直接编辑本文件即可。
     其余技术部分(运行步骤、项目结构)已就绪,不用改。
     你还负责:UI 设计/文案、Prompt 调优(prompts/)、Mock 演示数据(mock/)、
     Pitch / Demo 剧本。改完 git push 即可。
============================================================ -->

## ✨ 产品介绍

> _（队友填:一句话价值主张 + 解决什么问题 + 为什么不是又一个打卡 App）_

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
#    复制 backend/.env.example -> backend/.env,把 GLM_API_KEY 填上(找开发同学私要)

# 3) 启动(开两个终端)
python -m uvicorn main:app --app-dir backend --port 8000   # 后端
cd frontend && npm run dev                                  # 前端,然后开 http://localhost:3000
```

**登录**:用演示账号 `林知远 / 123456`,或注册新账号。

## 🧪 演示动线(几分钟演完"系统会学习、会改计划")

1. 登录 → 创建一个目标(如"3个月学会高尔夫")→ ①创建并拆解(AI 出 3 阶段)→ ②生成今日任务
2. 今日任务用选项一键打卡(`✅顺利 / 勉强 / 😵加班 / 😵太累`),故意让某些任务常因"加班/累"没做
3. 点「▶ 快进到下一天」→ 生成任务 → 打卡 …… 连做 4~5 天
4. 「🔍 AI 行为复盘」→ AI 看到加班/累反复 → 输出洞察
5. 「⚙️ 动态调整」→ 系统自动降难度、延期任务、给执行策略
6. 「💾 保存洞察到记忆」→ 记忆增长,体现"越用越懂你"

## 📁 项目结构

```
backend/     FastAPI:main(路由) crud db ai_adapter auth seed schema.sql .env(本地,不上传)
frontend/    Next.js:app/page.js(Dashboard) lib/api.js
prompts/     4 个 Prompt 文本(改 prompt 不动代码)
mock/        演示种子数据(3 用户/3 目标/84 任务/84 日志/15 记忆)
docs/        数据契约、部署指南
```

## 🔧 队友怎么改(不用碰代码)

- **调 Prompt**:直接编辑 `prompts/0X_*.txt`,保存即生效(后端重启),无需改代码
- **换演示数据**:改 `mock/*.txt`(合法 JSON),然后 `python backend/seed.py` 重新灌库
- **陪伴语气**:在 App 里「✏️ 资料·语气」切换(温暖朋友 / 严格教练 / 幽默伙伴)
- **写产品介绍**:直接编辑本 `README.md` 的「✨ 产品介绍」段落

## 📝 协作分工

- **Zack(技术)**:全部代码实现(全栈)
- **队友(设计/产品)**:Prompt 工程、Mock 数据、UI 设计与文案、README 产品介绍、Pitch / Demo 剧本、用户测试

## 📄 License

MIT
