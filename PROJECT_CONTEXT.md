# 项目上下文 — VOID.DEV 个人博客框架

> 本文档用于让 AI 助手快速理解项目现状、架构和已完成的工作。

## 项目概述

这是一个**纯静态个人博客网站框架**，零构建依赖（无 npm、无 webpack、无框架），可直接部署到 GitHub Pages。

核心特性：
- 可切换的主题系统（内置赛博朋克 + 极简白两套主题）
- 管理后台（可视化编辑所有内容）
- 数据驱动（JSON 文件存储，localStorage 优先读取）
- 粒子背景、鼠标光晕、3D 卡片倾斜、滚动动画等交互效果
- 移动端适配

## 技术栈

- 纯 HTML / CSS / JavaScript（ES6+，无 TypeScript）
- CSS Custom Properties（设计令牌系统）
- Canvas 2D（粒子系统）
- IntersectionObserver（滚动动画）
- localStorage（后台数据持久化）
- GitHub Actions（自动部署）

## 文件结构

```
F:\personalblog\
├── index.html                          # 前台入口
├── admin/
│   ├── index.html                      # 后台入口
│   ├── admin.css                       # 后台样式
│   └── admin.js                        # 后台逻辑（事件委托式 CRUD）
├── js/
│   ├── core.js                         # 核心框架
│   ├── app.js                          # 前台入口（加载数据→加载主题→渲染→初始化交互）
│   ├── animations.js                   # 滚动动画、3D 倾斜、导航行为、移动端菜单
│   ├── particles.js                    # Canvas 粒子系统（class ParticleSystem）
│   ├── cursor.js                       # 鼠标跟随光晕（class CursorGlow）
│   └── router.js                       # 哈希路由（class Router）
├── themes/
│   ├── _template/                      # 主题开发模板（带详细注释）
│   │   ├── theme.css                   # CSS 模板（列出所有必须定义的变量）
│   │   └── template.js                 # JS 模板（render + renderArticle）
│   ├── cyberpunk/                      # 赛博朋克主题（暗色、毛玻璃、粒子、霓虹）
│   │   ├── theme.css
│   │   └── template.js
│   └── minimal/                        # 极简白主题（亮色、纯净、暖色调）
│       ├── theme.css
│       └── template.js
├── data/
│   ├── config.json                     # 统一配置（站点信息 + 主题选择 + 导航 + 社交）
│   ├── posts.json                      # 博客文章数据（3 篇示例）
│   └── projects.json                   # 项目作品数据（4 个示例）
├── .github/workflows/deploy.yml        # GitHub Actions 部署
├── README.md                           # 项目文档
├── CHANGELOG.md                        # 开发日志
└── PROJECT_CONTEXT.md                  # 本文件
```

## 核心架构详解

### 1. 数据层（core.js）

```
Core.getData(key, filePath)
  → 先读 localStorage
  → 没有则 fetch JSON 文件
  → 写入 localStorage 缓存
  → 返回数据

Core.saveData(key, data)
  → 写入 localStorage

Core.exportData() / Core.importData()
  → 批量导出/导入
```

localStorage 键名：
- `void_config` — 站点配置
- `void_posts` — 文章列表
- `void_projects` — 项目列表
- `void_custom_themes` — 自定义主题（含 CSS/JS 内容）

### 2. 主题引擎（core.js）

```
Core.loadTheme(themeId)
  → 从 THEMES 注册表查找主题
  → 动态创建 <link> 加载 theme.css
  → 动态创建 <script> 加载 template.js
  → 返回 themeId

Core.render(config, posts, projects)
  → 调用 window.THEMES[currentTheme].render()
  → 主题模板负责写入 #main-content 的 HTML

主题契约：
  window.THEMES.xxx = {
    render(config, posts, projects) { ... },  // 渲染首页
    renderArticle(post) { ... },               // 渲染文章详情
  }
```

主题注册表在 core.js 的 THEMES 对象中：
```js
const THEMES = {
  cyberpunk: { name, description, preview, css, js },
  minimal:   { name, description, preview, css, js },
};
```

### 3. 路由器（router.js）

```js
const router = new Router();
router
  .on('/', () => renderHome())
  .on('/post/:id', ({ id }) => renderArticle(id))
  .init();
```

基于 `window.location.hash`，支持参数提取（`:id`）。

### 4. 前台交互模块

| 模块 | 全局类/函数 | 说明 |
|------|------------|------|
| particles.js | `class ParticleSystem` | Canvas 粒子 + 连接线 + 鼠标斥力 |
| cursor.js | `class CursorGlow` | 500px 径向渐变，lerp 跟随鼠标 |
| animations.js | `initScrollReveal()` | IntersectionObserver 元素入场 |
| animations.js | `initSkillBars()` | 技能条动画（data-level 属性） |
| animations.js | `init3DTilt()` | 博客卡片鼠标透视变换 |
| animations.js | `initNavBehavior()` | 导航栏滚动隐藏/显示 |
| animations.js | `initMobileNav()` | 汉堡菜单切换 |
| animations.js | `initSmoothScroll()` | 锚点平滑滚动 |
| animations.js | `initLoader()` | 加载屏 0.6s 后淡出 |
| app.js | `initBlogCardClicks()` | 博客卡片点击跳转路由 |
| app.js | `initProjectFilters()` | 项目分类过滤 |

### 5. 后台管理（admin/）

**HTML 结构：**
- 左侧边栏（桌面） / 底部 Tab 栏（移动端）
- 6 个 Tab 页：设置、信息、文章、项目、主题、数据
- 统一使用 `page-head` + `card` 卡片布局

**JS 架构：**
- 所有列表项使用事件委托（`delegate()` 函数），通过 `data-action` + `data-index` 处理点击
- 表单使用 `data-*` 属性绑定 change 事件（非 inline onclick）
- 模态框用于文章/项目编辑

**后台数据流：**
```
用户编辑 → 修改内存中的 config/posts/projects 数组
→ 调用 setLocal(key, data) 写入 localStorage
→ 调用 renderXxxList() 重新渲染列表
→ 前台页面自动读取 localStorage 展示最新数据
```

**主题导入流程：**
```
用户上传 CSS + JS 文件
→ FileReader 读取内容
→ 创建 <style> 和 <script> 注入页面
→ 保存到 localStorage (void_custom_themes)
→ 渲染主题卡片供选择
```

### 6. config.json 数据结构

```json
{
  "theme": "cyberpunk",
  "site": { "title", "subtitle", "description", "url", "author", "logo" },
  "hero": { "greeting", "name", "tagline", "description", "cta", "cta2" },
  "about": {
    "avatar": "",
    "bio": ["段落1", "段落2"],
    "skills": [{ "name": "Frontend", "level": 95, "items": ["React", "Vue"] }],
    "experience": [{ "year": "2024-至今", "role": "...", "company": "...", "desc": "..." }]
  },
  "social": [{ "name": "GitHub", "url": "https://...", "icon": "github" }],
  "nav": [{ "label": "首页", "href": "#hero" }],
  "footer": "Crafted with passion & pixels."
}
```

### 7. posts.json 数据结构

```json
[{
  "id": "my-post-slug",
  "title": "文章标题",
  "date": "2025-12-15",
  "tags": ["WebGL", "Creative Coding"],
  "category": "tech",
  "excerpt": "摘要文字",
  "cover": "",
  "readTime": "12 min",
  "content": "## 标题\n\n正文 Markdown..."
}]
```

### 8. projects.json 数据结构

```json
[{
  "id": "project-slug",
  "title": "项目名",
  "description": "描述",
  "tags": ["Canvas"],
  "category": "frontend",
  "tech": ["Vanilla JS", "Canvas 2D"],
  "link": "https://github.com/...",
  "demo": "https://...",
  "year": "2025"
}]
```

## CSS 设计令牌系统

每个主题必须定义以下 CSS 变量（在 `:root` 中）：

**颜色：**
- `--color-primary`, `--color-primary-dim`, `--color-primary-glow`
- `--color-secondary`, `--color-secondary-dim`, `--color-secondary-glow`
- `--color-tertiary`, `--color-tertiary-glow`
- `--color-bg`, `--color-bg-elevated`, `--color-bg-card`, `--color-bg-glass`
- `--color-text`, `--color-text-secondary`, `--color-text-muted`
- `--color-border`, `--color-border-glow`

**字体：**
- `--font-display`, `--font-body`, `--font-mono`

**大小（流式 clamp）：**
- `--text-xs` ~ `--text-hero`
- `--space-xs` ~ `--space-section`
- `--radius-sm` ~ `--radius-full`

**效果：**
- `--shadow-glow-primary`, `--shadow-card`, `--shadow-elevated`
- `--glass-blur`, `--glass-border`

**动画：**
- `--duration-fast` ~ `--duration-reveal`
- `--ease-out-expo`, `--ease-smooth`, `--ease-spring`

**布局：**
- `--max-width`, `--max-width-narrow`, `--nav-height`

## 移动端适配策略

### 前台
- 768px 以下：导航链接变汉堡菜单，网格变单列，按钮全宽
- 480px 以下：进一步收紧间距，隐藏滚动提示

### 后台
- 768px 以下：侧边栏变底部 Tab 栏（6 图标均分），表单单列，模态框底部 sheet
- 所有按钮 min-height 44px（触控友好）
- 输入框 font-size 16px（防止 iOS 自动缩放）
- 预览链接在页面最底部，不挤占编辑空间

## 部署方式

GitHub Pages + GitHub Actions：
1. 推送代码到 main 分支
2. Actions 自动上传整个项目（纯静态，无需构建）
3. 仓库 Settings → Pages → Source 选 "GitHub Actions"
4. 访问 `https://<username>.github.io`

## 已知的开发约定

1. **事件委托**：后台所有列表项的编辑/删除按钮使用 `data-action` + `data-index`，通过 `delegate()` 函数处理，不使用 inline onclick
2. **主题注册**：新主题需在 `core.js` 的 THEMES 对象和 `admin.js` 的 THEMES 数组中同时注册
3. **数据优先级**：前台和后台都优先读 localStorage，JSON 文件作为初始默认值
4. **CSS 变量**：所有主题样式通过 CSS 变量定义，组件样式引用变量而非硬编码值
5. **Markdown 解析**：core.js 内置简易 Markdown 解析器（支持标题、粗体、斜体、代码块、引用、列表）

## 待开发方向

- 更多主题（如海洋、复古、日式等）
- 文章分类/标签筛选页面
- 搜索功能
- 暗色/亮色模式切换（单主题内）
- 图片懒加载
- RSS feed 生成
- 评论系统集成
