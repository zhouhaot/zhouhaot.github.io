# 写作与发布指南

本站内容全部是 Git 仓库中的 Markdown 文件，没有后台系统。写作 → 预览 → 发布的完整流程都在本地完成。

## 快速开始

```bash
# 1. 新建一篇文章（默认为草稿状态）
pnpm new-post -- my-post-slug

# 2. 本地实时预览（草稿可见，仅用于写作时检查）
pnpm dev

# 3. 写完后，把 frontmatter 中的 draft 改为 false，然后提交
git add src/content/posts/my-post-slug.md
git commit -m "post: 我的文章标题"
git push
```

推送后 GitHub Actions 会自动构建并部署到服务器。

## 文件位置

| 内容 | 位置 |
|------|------|
| 文章 | `src/content/posts/<slug>.md` |
| 作品项目 | `src/content/projects/<id>.md` |
| 关于页 | `src/content/spec/about.md` |
| 站点配置（标题/导航/个人信息） | `src/config.ts` |
| 构建域名 | `astro.config.mjs` 的 `site` 字段 |

## Frontmatter 规范

```yaml
---
title: 文章标题            # 必填
published: 2026-08-30      # 必填，发布日期 YYYY-MM-DD
description: 一句话摘要     # 建议：列表页/SEO/摘要使用
image: ""                  # 可选：封面图，相对 /src 或以 / 开头相对 public
tags: [标签1, 标签2]        # 建议 2-4 个
category: tech             # 建议小写英文：tech / design / life
draft: true                # true=草稿（不对外发布），false=发布
lang: ""                   # 留空，继承站点语言 zh_CN
---
```

规则：

- 文件名即 URL slug，使用小写英文和连字符（如 `shader-art-with-webgl.md`），**建好后不要改名**，会破坏链接。
- 草稿写完想要发布时，只改 `draft: false`，不要改文件名。
- 正文是 Markdown，支持 KaTeX 公式、GitHub Admonition（`> [!NOTE]`）、代码高亮（Expressive Code）。

## 发布检查清单

1. `pnpm build` 本地构建无报错
2. `draft: false`
3. `description` 已填写（影响列表页和搜索摘要）
4. 预览确认标题层级、代码块、图片路径正确

## 后台管理（CMS）

站点内置 Sveltia CMS，访问 `<你的域名>/admin/`，可在网页上管理文章、作品和上传图片。
所有修改以 git commit 形式写回 GitHub 仓库，与本地 Markdown 文件完全等价。

首次使用需一次性配置 GitHub OAuth 登录（约 10 分钟）：

1. GitHub → Settings → Developer settings → OAuth Apps → 新建 OAuth App
   - Homepage URL：`https://<你的域名>`
   - Authorization callback URL：`https://<你的auth服务>/callback`
2. 部署 [sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth)（Cloudflare Worker，免费额度足够）
3. 取消 `public/admin/config.yml` 中 `base_url` 的注释，填入 auth 服务地址

配置前的替代方案：用下面的 AI 推送流程或直接 git 提交。

## AI 推送文章流程

任何 AI agent（或人）把写好的 Markdown 变成站内文章：

```bash
pnpm push-post -- 我的草稿.md             # 落盘为草稿 + 构建验证 + 提交推送当前分支
pnpm push-post -- 我的草稿.md --publish   # 直接发布（draft: false）
pnpm push-post -- 我的草稿.md --no-push   # 只落盘和构建，不动 git
```

脚本自动完成：frontmatter 校验（title/published 格式、发布前必须有 description、slug 命名规则）→
写入 `src/content/posts/<slug>.md` → `pnpm build` 验证 → git commit + push 当前分支。

注意：推送的是当前分支（如 astro-migration）；发布到线上需合并到 main 触发部署，
合并 main 属于敏感操作，AI agent 必须先获得用户确认。

## 作品页（projects）

`src/content/projects/` 下每个 `.md` 是一个项目卡片，frontmatter 字段：`title`、`description`、`tags`、`tech`、`link`（源码）、`demo`（在线演示）、`year`、`status`、`order`（排序，越小越靠前）。正文为项目详细介绍（Markdown）。
