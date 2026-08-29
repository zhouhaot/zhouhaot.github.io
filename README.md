# zevth

基于 [Astro](https://astro.build) + [fuwari](https://github.com/saicaca/fuwari) 主题二次开发的个人博客。内容为纯 Markdown 文件，由 GitHub Actions 构建并部署到自有服务器。

## 特性

- 文章 / 标签 / 分类 / 归档 / 目录，内置 Pagefind 全文搜索
- RSS、sitemap、robots.txt 自动生成，SEO 友好
- KaTeX 公式、Expressive Code 代码高亮、GitHub Admonition
- 明暗模式切换，主题色可调
- 作品展示页（`/projects/`），Museum WebAR 预览（`/ar/`）

## 快速开始

环境要求：Node.js ≥ 20、pnpm ≥ 9。

```bash
pnpm install        # 安装依赖
pnpm dev            # 本地开发（http://localhost:4321）
pnpm build          # 构建到 dist/（含 pagefind 索引）
pnpm check          # astro check 类型检查
pnpm new-post -- my-post-slug   # 新建文章（草稿状态）
```

## 写作

见 [docs/WRITING.md](docs/WRITING.md)。核心约定：

- 文章：`src/content/posts/<slug>.md`，frontmatter 中 `draft: true` 为草稿，`false` 为发布
- 作品：`src/content/projects/<id>.md`
- 站点配置：`src/config.ts`（标题、导航、个人信息）、`astro.config.mjs`（域名）

## 目录结构

```
├── astro.config.mjs       # Astro 配置（site 域名、集成、markdown 插件）
├── src/
│   ├── config.ts          # 站点配置（标题/语言/导航/个人资料）
│   ├── content/
│   │   ├── posts/         # 文章（Markdown + frontmatter）
│   │   ├── projects/      # 作品项目
│   │   └── spec/          # 关于页等固定页面
│   ├── components/        # fuwari 组件（卡片、导航、搜索……）
│   ├── layouts/           # MainGridLayout 布局
│   ├── pages/             # 路由（首页/文章/归档/作品/关于/RSS/sitemap）
│   ├── styles/            # 样式与主题变量
│   └── i18n/              # 多语言文案
├── scripts/new-post.js    # 新建文章脚本
├── ar/                    # Museum WebAR 静态应用（构建后复制进 dist 一起发布）
└── .github/workflows/     # CI 与部署
```

## 部署

推送 `main` 分支后，GitHub Actions 自动：`astro build` → 把 `ar/` 复制进 `dist/` → rsync 到服务器。

服务器侧需要：

1. Nginx/Caddy 指向站点目录（如 `/var/www/blog`）
2. 仓库 Secrets：`SSH_HOST`、`SSH_USER`、`SSH_PORT`、`SSH_KEY`

详细说明见 `.github/workflows/deploy.yml`。

## Agent 协作

本仓库内置了面向 AI agent 的协作配置，见 [AGENTS.md](AGENTS.md)（博客运维手册 + 专家 agent 角色）。

## 许可

- 本站内容采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- 主题基座 fuwari：[MIT](LICENSE)
