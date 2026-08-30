# AGENTS.md — 博客运维手册

任何 agent 进入本项目，先读这份手册。

## 项目是什么

个人博客（品牌 zevth），基于 [Astro 5](https://astro.build) + [fuwari](https://github.com/saicaca/fuwari) 主题二次开发。
纯静态站点，内容全是 Git 仓库里的 Markdown，无后台系统。2026-08 从自研零构建框架迁移而来（旧框架在 git 历史 main 分支）。

- 仓库：`zhouhaot/zhouhaot.github.io`
- 域名：`https://zhouhaot.github.io`（配置在 `astro.config.mjs` 的 `site`）
- 部署目标：用户自有服务器（rsync），GitHub Pages 为备用
- `ar/` 目录：独立的 Museum WebAR 静态应用，不走 Astro 管线，部署时复制进 `dist/ar`

## 常用命令

```bash
pnpm install          # 安装依赖（Node ≥ 20，pnpm ≥ 9）
pnpm dev              # 本地预览 http://localhost:4321
pnpm build            # 构建 + pagefind 搜索索引 → dist/
pnpm check            # astro 类型检查
pnpm lint             # biome 检查并修复格式
pnpm new-post -- slug # 新建草稿文章
pnpm push-post -- f.md [--publish]  # AI 推送文章：校验→落盘→构建→git 推送当前分支
```

## 后台管理

`/admin/` 路径挂了 Sveltia CMS（Git 作为存储，配置在 `public/admin/config.yml`）。
OAuth 登录尚未配置（见 docs/WRITING.md「后台管理」），配置好前用 push-post 或 git 提交。

## 内容约定（写作的完整规范见 docs/WRITING.md）

| 内容 | 位置 | 要点 |
|------|------|------|
| 文章 | `src/content/posts/<slug>.md` | slug 即 URL 建后不改名；`draft: true` 草稿 / `false` 发布 |
| 作品 | `src/content/projects/<id>.md` | `order` 控制排序 |
| 关于页 | `src/content/spec/about.md` | 作者信息以此为准 |
| 站点配置 | `src/config.ts` | 标题/语言/导航/个人资料 |
| 域名 | `astro.config.mjs` | `site` 字段 |

Schema 定义在 `src/content/config.ts`。注意 `category` 等字段是 nullable（历史数据有 null）。

## 分工：项目内置专家 agent（.codex/agents/）

| 角色 | 什么时候找它 |
|------|--------------|
| `blog-architect` | 改主题样式、布局组件、schema、站点配置 |
| `content-writer` | 起草/修改文章与作品条目 |
| `release-pilot` | 构建部署、线上验证、回滚 |

角色详情与各自的操作约束见 `.codex/agents/*.toml`（Codex 中用 `/agent` 调用）。

## 环境陷阱（Windows 本机）

1. **git 代理失效**：全局代理指向 `127.0.0.1:33210` 但端口无服务。推 GitHub 一律用
   `git -c http.proxy= -c https.proxy= push <remote> <branch>`。
2. **node 不在 PATH**：部分 shell 里先 `export PATH="/d/node.js:$PATH"`。
3. **pnpm build 偶发崩溃**：`async.c` assertion 是 Node 24 Windows 原生模块偶发问题，重跑一次即可，不是代码错误。
4. pnpm 在无 TTY 环境可能拒绝清空 node_modules，加 `CI=true` 前缀。

## 部署

- `main` 分支 push → GitHub Actions（`.github/workflows/deploy.yml`）构建并 rsync 到服务器。
- 该 workflow 由仓库变量 `DEPLOY_SERVER == 'true'` 开关：**配置好 SSH secrets（SSH_HOST/SSH_USER/SSH_PORT/SSH_KEY）并验证服务器后再开启**。
- 服务器站点目录为 `/www/wwwroot/zevth.work`（宝塔面板，Nginx，SSL 由 acme.sh 自动续期）。

## 红线

- 未经用户确认不 push 到 main、不触发线上部署
- 不改 `src/content/posts/` 下已有文章的文件名（破坏外链）
- 不直接修改 `dist/` 与 `ar/`（ar 是外部构建产物，只增不删）
