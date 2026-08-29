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

## 作品页（projects）

`src/content/projects/` 下每个 `.md` 是一个项目卡片，frontmatter 字段：`title`、`description`、`tags`、`tech`、`link`（源码）、`demo`（在线演示）、`year`、`status`、`order`（排序，越小越靠前）。正文为项目详细介绍（Markdown）。
