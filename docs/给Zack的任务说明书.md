# Growth OS · 给你的任务说明书(技术 / 全栈 · 你)

> 这是你的实现路线。**全部代码你一个人写**,但分工能让你轻松:
> 队友用 AI 助手并行产出 Prompt / Mock / 设计 / Demo,你只负责"把管道跑通 + 把她的东西接进来"。
> 她交付的文件,你都能直接消费,几乎不用自己从零造内容。

---

## 0. 你的角色(一句话)

你是**全栈实现负责人**。架构、数据库、所有 API、4 个 Prompt 的接线、前端、联调修 Bug——全是你。
但你**只写"管道",不写 Prompt 内容**(内容归她),所以工作量可控。

## 1. 工作总原则

1. **先定契约再写码**:开工 2h 内跟队友对齐数据模型字段,然后照着建库建表。
2. **消费她的产物,不要自己重造**:Prompt 从文件读、Mock 直接喂前端、设计照着做。
3. **让她能并行**:你先把空路由返回她的 Mock,前端和后端就能各自往前跑。
4. **44h 前冻结功能**:最后 4 小时只修 Bug + 彩排,绝不加新功能。
5. 早 / 中 / 晚 各 10 分钟跟队友对齐。

---

## 2. 建议的项目结构(一开始就建好)

```
hackathon/
├── backend/                 # FastAPI
│   ├── main.py              # 启动 + 路由挂载
│   ├── db.py                # SQLite 连接 + 初始化
│   ├── models.py            # 5 张表
│   ├── schemas.py           # Pydantic 入参/出参
│   ├── ai_adapter.py        # ★ 读她的 prompt 文件 + 调 LLM
│   ├── prompts/             # ← 队友的 .txt 放这里
│   └── routes/              # goals.py tasks.py analysis.py ...
├── frontend/                # Next.js
│   └── app/                 # dashboard / checkin / memory 页面
├── mock/                    # ← 队友的 .json 放这里
├── design/                  # ← 队友的设计放这里
├── docs/                    # ← 队友的文档放这里
└── growth_os.db             # SQLite 文件
```

## 3. ★ AI Adapter 接线模式(让她改 Prompt 你不动代码)

```python
# backend/ai_adapter.py
from pathlib import Path
PROMPTS_DIR = Path(__file__).parent / "prompts"

def load_prompt(name):              # name = "01_goal_decomposer"
    return (PROMPTS_DIR / f"{name}.txt").read_text(encoding="utf-8")

def call_llm(prompt_name, variables):
    prompt = load_prompt(prompt_name).format(**variables)
    resp = llm.chat(prompt, response_format="json")  # 强制 JSON
    return parse_json(resp)                          # try/except 解析
```
- **关键**:Prompt 内容从 `prompts/*.txt` 读,队友迭代 Prompt 你一行都不用改。
- 强制 JSON 输出 + try/except,前端才稳。

---

## 4. 你的任务主线(按阶段 + 验收)

### 阶段 0(0–4h)对齐 + 起骨架
- [ ] 跟队友对齐 5 表字段 → 建数据库 + `models.py`
- [ ] FastAPI 起骨架,挂空路由
- [ ] Next.js 起骨架,路由就绪
- [ ] **空路由先返回队友的 Mock JSON**(让前端立刻能开发)
- **验收**:5 表建好、前后端能启动、`GET /api/dashboard` 能吐出她的 mock。

### 阶段 1(4–12h)核心 CRUD + AI Adapter
- [ ] 全部 CRUD:goals / tasks / behavior_log / memory
- [ ] `ai_adapter.py`:统一 LLM 调用 + 4 个 prompt 函数,从她的 txt 读
- **验收**:CRUD 跑通、AI Adapter 能加载她的 prompt 并返回结构化 JSON。
- **交接点**:12h 末,她的 Prompt 必须到位 → 你接线。

### 阶段 2(12–24h)打通主流程闭环(P0)
- [ ] `POST /api/goals` → Goal Decomposer → 存拆解
- [ ] `POST /api/tasks/today` → Daily Planner → 生成今日任务
- [ ] `POST /api/tasks/{id}/checkin` → 写 BehaviorLog
- [ ] 前端:目标输入页 → 每日任务页 → 打卡页(先吃 Mock,后切真)
- **验收**:用户能走完"设目标 → 看今日任务 → 打卡"完整流程。

### 阶段 3(24–34h)反馈系统
- [ ] `GET /api/analysis` → Behavior Analyst(读最近 7 天)
- [ ] `POST /api/adjust` → System Adjuster(改计划)
- [ ] 把分析结论写入 Memory 表(复利系统)
- **验收**:连续打卡后,系统能给出分析 + 调整建议。

### 阶段 4(34–44h)UI 落地 + 修 Bug
- [ ] 照队友设计做 Dashboard / 趋势图 / 记忆面板(系统感!)
- [ ] 前端从 Mock 全面切真 API
- [ ] 按队友 `docs/bugs.md` 优先级修(P0→P1→P2)
- **验收**:UI 有系统感、P0/P1 Bug 清零。

### 阶段 5(44–48h)联调 + 部署 + 彩排
- [ ] 端到端联调、性能、稳定
- [ ] 部署可演示环境(本地稳定即可 / Vercel+Render)
- [ ] **联合彩排**:她讲 Demo,你按剧本操作
- **验收**:演示动线一次跑通、无 P0 崩溃。

---

## 5. 消费队友产物的对照表(从你的视角)

| 她的产物 | 你怎么用 | 何时 |
|---|---|---|
| `prompts/*.txt` | `ai_adapter.py` 读文件调用;她改你不动代码 | 接线(12h) |
| `mock/*.json` | 开发期空路由/前端先吃假数据;演示前切真 | 全程 |
| `design/` | 照着做界面 | UI 落地(24h+) |
| `docs/bugs.md` | 按优先级修 | 44h 前 |
| `docs/demo_script.md` | 彩排时你按剧本操作 | 48h |

## 6. 你的并行清单(永远不卡)
- 她 Prompt 没好 → 你做 CRUD + 前端骨架,路由先返回 Mock
- 她设计没出 → 你做页面纯逻辑/样式骨架
- 她在整理 Bug → 你做反馈系统 / 联调 / 部署
- 都就绪 → 你做性能、稳定性、彩排

## 7. 坑提醒(踩过/容易踩)
- **终端中文乱码**:GBK 控制台问题,文件内容是对的;校验用 `==` 比较,别看屏幕。
- **AI 输出必须强制 JSON + try/except**,否则前端动不动崩。
- **别手写 Prompt 内容**——那是她的活,你只做"加载文件 + 调用"。
- **SQLite 字段一开始就想全**,中途加列很烦;对齐时就定死。
- **演示用固定的种子数据**(她的 `demo_users.json`),别临场随机,容易翻车。
- **44h 冻结功能**,留 4 小时给 Bug + 彩排。

## 8. 开干前跟队友对齐一次(30 分钟)
- 确认 5 表字段(你给她最终版)。
- 确认 4 个 Prompt 各自的"输入/输出 JSON 结构"(你才能解析)。
- 建共享文档做单一信息源;建好 `prompts/ mock/ design/ docs/` 目录并约定命名。

---

_配套文件:`给队友的任务说明书.md`(她的路线)、`Growth_OS_规划_新.xlsx`(14 sheet 完整规划)、根目录 `CLAUDE.md`(项目约定,每次自动加载)。_
