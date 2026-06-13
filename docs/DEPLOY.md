# Growth OS · 部署指南

> 两个独立服务:前端(Next.js)+ 后端(FastAPI + SQLite)。SQLite 是文件,免费云平台磁盘是临时的——已在启动时**自动灌演示数据**,所以全新部署一打开就有内容(但每次重新部署会重置,演示够用)。

## 平台选择(关键)

| 部分 | 推荐 | 备选 | 说明 |
|---|---|---|---|
| 前端 | **Vercel** | Cloudflare Pages | Next.js 在 Vercel 零配置;Cloudflare Pages 需 `@cloudflare/next-on-pages` |
| 后端 | **Render** | Railway / Fly.io | 必须能跑 Python 长驻进程 + 有文件系统。**Cloudflare Workers 不行**(跑不了 FastAPI/SQLite) |

> CORS 已设为 `*`,前端和后端可分别部署在不同域名。

## 0. 前置:推到 GitHub

```bash
# 仓库已 git init 并 commit。新建一个 GitHub 仓库(空,不要勾 README),然后:
git remote add origin https://github.com/<你的用户名>/growth-os.git
git branch -M main
git push -u origin main
```
`.env`(GLM key)和 `growth_os.db` 已 gitignore,不会上传。

## 1. 后端 → Render

1. Render → New → **Web Service** → 连接上面的 GitHub 仓库
2. 设置:
   - **Root Directory**:`backend`
   - **Runtime**:Python 3
   - **Build Command**:`pip install -r requirements.txt`
   - **Start Command**:`uvicorn main:app --host 0.0.0.0 --port $PORT`
3. **Environment Variables**(必填):
   - `GLM_API_KEY` = 你的智谱 key
   - `GLM_BASE_URL` = `https://open.bigmodel.cn/api/paas/v4`
   - `GLM_MODEL` = `glm-4-flash`(或 plus)
4. Create → 部署完拿到地址,如 `https://growth-os.onrender.com`
5. 验证:浏览器打开 `https://<后端地址>/api/health` → `{"status":"ok"}`;首次启动会自动灌演示数据 + 给种子用户补默认密码 `123456`

## 2. 前端 → Vercel

1. Vercel → New Project → 导入同一个 GitHub 仓库
2. 设置:
   - **Root Directory**:`frontend`
   - Framework Preset:Next.js(自动识别)
3. **Environment Variables**:
   - `NEXT_PUBLIC_API_BASE` = `https://<后端地址>`(上面 Render 给的,不带末尾斜杠)
4. Deploy → 拿到 `https://growth-os.vercel.app`
5. 打开 → 登录页 → 用 `林知远 / 123456` 登录,或注册新账号

### 前端备选:Cloudflare Pages
- Pages → Create → 连仓库 → Build command `npm run build`、Output `.next` → 需装 `@cloudflare/next-on-pages`(Next 16 兼容性需测)。**嫌麻烦就用 Vercel。**

## 3. SQLite 注意事项(实话)

- Render/Railway **免费版磁盘是临时的**:**重新部署/重启后数据库文件会被清空** → 启动时自动 re-seed 演示数据,所以"打开有内容"没问题;但你**演示时现场打卡的数据,重新部署后会丢**。
- 演示场景:够用(每次部署都是干净的演示数据)。
- 想持久(评委能改、数据保留):用 **Turso**(云 SQLite,免费,代码要小改:把 `sqlite3` 换成 `libsql`)或 Render 付费持久磁盘。48h 黑客松不建议折腾。

## 4. 本地一键(不部署也能演示)

```bash
# 后端
python -m uvicorn main:app --app-dir backend --port 8000
# 前端(另开终端)
cd frontend && npm run dev
# 打开 http://localhost:3000
```

## 环境变量速查

| 变量 | 哪 | 值 |
|---|---|---|
| `GLM_API_KEY` | 后端 Render | 智谱 key(不公开) |
| `GLM_BASE_URL` | 后端 Render | `https://open.bigmodel.cn/api/paas/v4` |
| `GLM_MODEL` | 后端 Render | `glm-4-flash` |
| `NEXT_PUBLIC_API_BASE` | 前端 Vercel | 后端公网地址 |
