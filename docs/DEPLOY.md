# Growth OS · 部署指南

> Growth OS 由两个独立服务组成:前端(Next.js)和后端(FastAPI + SQLite)。默认配置会在空数据库启动时写入种子数据,便于本地开发和线上预览。

## 平台选择

| 部分 | 推荐 | 备选 | 说明 |
|---|---|---|---|
| 前端 | **Vercel** | Cloudflare Pages | Vercel 对 Next.js 支持最完整;Cloudflare Pages 可能需要额外适配 |
| 后端 | **Render** | Railway / Fly.io | 需要支持 Python Web 服务和文件系统;Cloudflare Workers 不适合直接运行 FastAPI/SQLite |

> CORS 已设为 `*`,前端和后端可分别部署在不同域名。

## 0. 准备 GitHub 仓库

```bash
# 新建一个空 GitHub 仓库后:
git remote add origin https://github.com/<你的用户名>/growth-os.git
git branch -M main
git push -u origin main
```
`.env` 和 SQLite 数据库文件已加入 `.gitignore`,不会上传到仓库。

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
5. 验证:浏览器打开 `https://<后端地址>/api/health` → `{"status":"ok"}`;空数据库首次启动会自动写入种子数据

## 2. 前端 → Vercel

1. Vercel → New Project → 导入同一个 GitHub 仓库
2. 设置:
   - **Root Directory**:`frontend`
   - Framework Preset:Next.js(自动识别)
3. **Environment Variables**:
   - `NEXT_PUBLIC_API_BASE` = `https://<后端地址>`(上面 Render 给的,不带末尾斜杠)
4. Deploy → 拿到 `https://growth-os.vercel.app`
5. 打开前端地址,注册新账号或使用种子账号登录

### 前端备选:Cloudflare Pages
- Pages → Create → 连接仓库 → Build command `npm run build`、Output `.next`。Next.js 16 在 Cloudflare Pages 上可能需要额外适配,建议优先使用 Vercel。

## 3. SQLite 注意事项

- Render/Railway 免费版文件系统通常不是持久磁盘。服务重新部署或重启后,SQLite 数据库文件可能被清空。
- 当前项目会在空数据库启动时自动写入种子数据,适合预览和轻量演示。
- 如果需要长期保存用户数据,可以接入 Turso/libSQL、PostgreSQL,或使用带持久磁盘的部署方案。

## 4. 本地运行

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
