# VOID.DEV — 个人博客框架

可扩展、可维护的个人博客系统。内置管理后台、主题引擎、数据驱动架构。纯静态实现，一键部署到 GitHub Pages。

## ✨ 特性

- 🎨 **可切换主题** — 赛博朋克 / 极简白，支持自定义主题导入
- 🔧 **管理后台** — 可视化编辑所有内容，无需改代码
- 📝 **数据驱动** — JSON 文件存储，后台编辑 or 手动修改均可
- 🚀 **零构建部署** — 推送到 GitHub 即自动部署

## 📁 项目结构

```
personalblog/
├── index.html                     # 前台入口
├── admin/                         # 管理后台
│   ├── index.html
│   ├── admin.css
│   └── admin.js
├── js/
│   ├── core.js                    # 核心框架（数据层 + 主题引擎）
│   ├── app.js                     # 前台应用入口
│   ├── animations.js              # 滚动动画、3D 倾斜
│   ├── particles.js               # 粒子系统
│   ├── cursor.js                  # 鼠标光晕
│   └── router.js                  # 哈希路由
├── themes/
│   ├── _template/                 # 主题开发模板
│   │   ├── theme.css              # CSS 模板（带详细注释）
│   │   └── template.js            # JS 模板（带 API 文档）
│   ├── cyberpunk/                 # 赛博朋克主题
│   └── minimal/                   # 极简白主题
├── data/
│   ├── config.json                # 统一配置
│   ├── posts.json                 # 文章数据
│   └── projects.json              # 项目数据
└── .github/workflows/deploy.yml
```

## 🚀 本地运行

```bash
cd personalblog
python -m http.server 8080
```

- 前台：http://localhost:8080
- 后台：http://localhost:8080/admin/

## 🔧 管理后台

访问 `/admin/` 进入后台：

| 功能 | 说明 |
|------|------|
| ⚙️ 站点设置 | 标题、Logo、描述、导航、社交链接、Hero 区 |
| 👤 个人信息 | 简介、技能、工作经历 |
| 📝 文章管理 | 新建/编辑/删除文章（Markdown） |
| 🎯 项目管理 | 新建/编辑/删除项目 |
| 🎨 主题切换 | 选择内置主题 + 导入自定义主题 |
| 💾 数据管理 | 导出/导入 JSON、重置、生成部署文件 |

## 🎨 主题开发指南

### 快速开始

1. 复制模板目录：
```bash
cp -r themes/_template themes/mytheme
```

2. 修改 `themes/mytheme/template.js` 第一行的 ID：
```js
window.THEMES.mytheme = {  // 改成你的主题 ID
```

3. 在后台「主题」标签页导入你的 CSS 和 JS 文件

4. 选择你的主题 → 保存 → 刷新前台查看效果

### 主题文件说明

每个主题包含两个文件：

#### `theme.css` — 样式定义

定义所有视觉属性。**必须**包含以下 CSS 变量：

| 类别 | 变量 | 说明 |
|------|------|------|
| **颜色** | `--color-primary` | 主色调 |
| | `--color-secondary` | 辅助色 |
| | `--color-tertiary` | 第三色 |
| | `--color-bg` | 页面背景 |
| | `--color-bg-elevated` | 提升层背景 |
| | `--color-bg-glass` | 毛玻璃背景 |
| | `--color-text` | 主文字颜色 |
| | `--color-text-secondary` | 次要文字 |
| | `--color-text-muted` | 弱化文字 |
| | `--color-border` | 边框颜色 |
| **字体** | `--font-display` | 标题字体 |
| | `--font-body` | 正文字体 |
| | `--font-mono` | 代码字体 |
| **大小** | `--text-xs` ~ `--text-hero` | 流式字体大小 |
| **间距** | `--space-xs` ~ `--space-section` | 流式间距 |
| **圆角** | `--radius-sm` ~ `--radius-full` | 圆角梯度 |
| **阴影** | `--shadow-glow-primary` | 主色发光 |
| | `--shadow-card` | 卡片阴影 |
| **毛玻璃** | `--glass-blur` | 模糊半径 |
| | `--glass-border` | 玻璃边框 |
| **动画** | `--duration-fast` ~ `--duration-reveal` | 时长 |
| | `--ease-out-expo`, `--ease-smooth` | 缓动曲线 |
| **布局** | `--max-width` | 最大宽度 |
| | `--nav-height` | 导航栏高度 |

#### `template.js` — HTML 模板

负责将数据渲染为 HTML。必须实现：

```js
window.THEMES.mytheme = {
  render(config, posts, projects) {
    // 渲染首页，写入 #main-content
  },
  renderArticle(post) {
    // 渲染文章详情，写入 #article-view
  },
};
```

**可用的全局工具函数：**
- `Core.formatDate(dateStr)` — 格式化日期为中文
- `Core.parseMarkdown(md)` — 简易 Markdown 转 HTML

**HTML 结构约定：**

模板必须包含以下 `id` 的 section（用于导航和动画）：
- `#hero` — 首屏
- `#about` — 关于
- `#blog` — 博客列表
- `#projects` — 项目
- `#contact` — 联系

博客卡片必须有 `data-post-id` 属性（用于路由跳转）：
```html
<article class="blog-card" data-post-id="my-post">
```

项目卡片必须有 `data-category` 属性（用于过滤）：
```html
<article class="project-card" data-category="frontend">
```

### 可以修改的方面

| 方面 | 在哪里改 | 示例 |
|------|----------|------|
| **配色方案** | `theme.css` :root | 换 `--color-primary` 等变量 |
| **字体搭配** | `theme.css` :root | 换 `--font-display`、`--font-body` |
| **圆角风格** | `theme.css` :root | 大圆角 vs 直角 vs 混合 |
| **间距节奏** | `theme.css` :root | 紧凑 vs 宽松 |
| **动画效果** | `theme.css` | 入场动画、hover 效果、过渡时长 |
| **背景效果** | `theme.css` body | 纯色、渐变、纹理、噪点 |
| **卡片样式** | `theme.css` .blog-card | 毛玻璃、纯色、边框、阴影 |
| **导航栏** | `template.js` + `theme.css` | 透明、固定、侧边栏 |
| **Hero 区** | `template.js` + `theme.css` | 全屏、分屏、居中、左对齐 |
| **布局结构** | `template.js` | 单栏、双栏、网格、瀑布流 |
| **额外动效** | `theme.css` + `template.js` | 粒子、光标、视差、打字机 |
| **粒子系统** | `template.js` render 中初始化 | 修改粒子数量、颜色、交互方式 |
| **暗色/亮色** | `theme.css` :root | 整体调性 |

### 示例：创建一个「海洋」主题

```bash
# 1. 复制模板
cp -r themes/_template themes/ocean

# 2. 修改 template.js 中的 ID
# window.THEMES.ocean = { ... }

# 3. 修改 theme.css 配色
# --color-primary: oklch(65% 0.2 200);  /* 蓝色 */
# --color-secondary: oklch(60% 0.15 180); /* 青色 */
# --color-bg: oklch(12% 0.02 240);       /* 深蓝背景 */

# 4. 在后台导入 theme.css 和 template.js
# 5. 选择「海洋」主题，保存
```

## 🌐 部署

```bash
git init && git add . && git commit -m "feat: init blog"
git branch -M main
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

进入仓库 → Settings → Pages → Source 选择 **GitHub Actions**

## 📜 License

MIT
