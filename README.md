# Campus Quest · 校园悬赏平台

游戏风校园悬赏站：账号系统、校区阵营隔离、大世界跨区任务、金币结算、图片凭证、三套主题（复古街机 / 海贼王式悬赏令 / 现代简约）。

## 阵营系统
- 注册时选择校区阵营（东山/西山/南湖/北湖），不可更改
- 发布悬赏可选范围：**本校区**（仅同阵营可见）或 **大世界**（全服可见可接）
- 未登录游客只能看到大世界任务；凭证仅交易双方可见

## 目录结构
```
index.html            前端单页（GitHub Pages 直接托管）
backend/server.js     零依赖 Node 后端（账号 / 任务 / 结算 API）
backend/package.json  后端启动配置
.github/workflows/    GitHub Pages 自动部署
```

## 一、部署前端（GitHub Pages）
1. 新建 GitHub 仓库，把本文件夹内容推到 `main` 分支（`index.html` 必须在仓库根目录）。
2. 仓库 → **Settings → Pages → Source 选 "GitHub Actions"**。
3. 每次 push 到 main，工作流自动发布到 `https://你的用户名.github.io/仓库名/`。

## 二、部署后端（Render，免费）
1. [render.com](https://render.com) → **New → Web Service** → 连接该仓库。
2. 配置：
   - Root Directory：`backend`
   - Runtime：Node
   - Build Command：（留空，零依赖无需安装）
   - Start Command：`node server.js`
3. 部署完成后得到地址，如 `https://campus-quest-xxxx.onrender.com`。

> 免费实例会休眠，首次访问可能慢 30 秒，属正常现象。

## 三、前后端对接
打开网站 → 页脚点 **「⚙ 服务器设置」** → 粘贴 Render 地址 → 保存刷新。
之后即可注册账号、发布悬赏、接单、交付凭证、确认结算，数据全服共享。

不设置服务器则默认进入**离线试玩模式**（数据存本机浏览器）。

## API 一览
| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /api/register | 注册（初始 100 金币） |
| POST | /api/login | 登录 |
| GET | /api/me | 当前用户 |
| GET | /api/quests | 任务列表（凭证仅发布者/接取者可见） |
| POST | /api/quests | 发布悬赏（扣金币） |
| POST | /api/quests/:id/accept | 接取任务 |
| POST | /api/quests/:id/submit | 提交交付凭证（文字 + 图片，前端自动压缩） |
| POST | /api/quests/:id/cancel | 接取者取消任务，任务重新开放 |
| POST | /api/quests/:id/confirm | 发布者确认 → 金币结算 |
| GET | /api/rank | 排行榜 |

## 本地开发
```bash
node backend/server.js        # 后端 @ http://localhost:3000
# 浏览器打开 index.html，页脚「⚙ 服务器设置」填 http://localhost:3000
```
