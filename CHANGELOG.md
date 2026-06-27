# 开发日志

## 2026-06-16

### 1. 项目初始化

创建个人博客框架，纯静态 HTML/CSS/JS 实现，零构建依赖。

**技术选型：**
- 纯原生 HTML/CSS/JS，无框架依赖
- Hash 路由实现 SPA 式导航
- Canvas 2D 粒子系统
- IntersectionObserver 滚动动画
- CSS Custom Properties 主题变量

**初始文件结构：**
```
index.html, css/, js/, data/, .github/workflows/
```

### 2. 架构重构 — 可扩展框架

将单一主题博客重构为可扩展的框架架构。

**核心改动：**
- 新增 `js/core.js` — 数据层（localStorage 优先 + JSON 回退）+ 主题引擎
- 新增 `themes/` 目录 — 每个主题包含 `theme.css` + `template.js`
- 新增 `admin/` — 管理后台（CRUD 全部内容）
- 统一配置文件 `data/config.json`（合并原 site.json）

**主题系统设计：**
- 主题契约：注册到 `window.THEMES`，实现 `render()` 和 `renderArticle()`
- CSS 变量标准化（颜色、字体、间距、动画共 30+ 变量）
- 动态加载主题 CSS + JS，支持运行时切换
- 内置两个主题：cyberpunk（暗色毛玻璃）、minimal（亮色纯净）

**管理后台功能：**
| 模块 | 功能 |
|------|------|
| 站点设置 | 标题、Logo、描述、导航、社交链接、Hero 区 |
| 个人信息 | 简介、技能、工作经历 |
| 文章管理 | 新建/编辑/删除，Markdown 编辑 |
| 项目管理 | 新建/编辑/删除 |
| 主题切换 | 内置主题选择 + 自定义主题导入 |
| 数据管理 | 导出/导入 JSON、重置、生成部署文件 |

### 3. Bug 修复

**前端空白页问题：**
- 原因：重构时 `initBlogCardClicks` 和 `initProjectFilters` 两个函数定义被意外删除
- 症状：`ReferenceError` 导致整个 JS 停止执行
- 修复：将两个函数补回 `app.js`

**后台删除按钮无效：**
- 原因：inline `onclick` 在 IIFE 闭包中作用域问题
- 修复：改用 `data-action` + `data-index` 属性，通过事件委托（`delegate()`）处理

### 4. 主题导入功能

后台主题标签页新增导入功能：
- 上传 CSS + JS 文件即可导入自定义主题
- 导入后自动注入页面，可立即选择使用
- 自定义主题保存在 localStorage，支持删除
- 新增 `themes/_template/` 开发模板（带详细注释）

### 5. 移动端适配

**前台（两个主题）：**
- Hero 区按钮全宽居中
- 博客卡片封面高度自适应
- 过滤按钮缩小间距
- 文章详情页减小侧边距
- 代码块缩小字号
- 480px 以下进一步收紧

**后台：**
- 侧边栏 → 底部 Tab 栏（6 图标均分）
- 所有页面统一 `page-head` + `card` 卡片布局
- 表单行自动堆叠为单列
- 输入框 16px 防止 iOS 自动缩放
- 编辑行全宽堆叠
- 模态框底部 sheet 样式，适配安全区
- 按钮最小高度 44px 触控友好
- 预览链接移至页面最底部，不挤占编辑空间
- 顶部品牌栏移除，界面干净

### 最终文件结构

```
personalblog/
├── index.html
├── admin/
│   ├── index.html
│   ├── admin.css
│   └── admin.js
├── js/
│   ├── core.js          # 数据层 + 主题引擎
│   ├── app.js           # 前台入口
│   ├── animations.js    # 滚动动画、3D 倾斜
│   ├── particles.js     # 粒子系统
│   ├── cursor.js        # 鼠标光晕
│   └── router.js        # 哈希路由
├── themes/
│   ├── _template/       # 主题开发模板
│   ├── cyberpunk/       # 赛博朋克主题
│   └── minimal/         # 极简白主题
├── data/
│   ├── config.json
│   ├── posts.json
│   └── projects.json
├── .github/workflows/deploy.yml
├── README.md
└── CHANGELOG.md
```

## 2026-06-17

### 6. 后台登录系统

新增 SHA-256 哈希密码认证，防误触访问后台。

**AuthManager 模块（admin/admin.js）：**
- `AuthManager._hash(password)` — 浏览器原生 `crypto.subtle.digest` SHA-256
- `AuthManager.check(password)` — 哈希比对验证
- `AuthManager.login(remember)` — sessionStorage（默认）或 localStorage（记住会话）
- `AuthManager.logout()` — 清除登录状态
- `AuthManager.changePassword(old, new)` — 修改密码并持久化哈希
- `AuthManager.init()` — 启动时检查登录状态

**安全说明：**
- 默认密码 `admin123`，以 SHA-256 哈希存储，代码中无明文密码
- 纯前端登录仅防误触，不能防止有意绕过（用户可直接改 localStorage）

**后台账户管理：**
- 设置 tab 新增"账户安全"卡片，支持修改密码
- 侧边栏底部新增"退出登录"按钮

### 7. 登录界面视觉

暗色毛玻璃登录卡片，与后台风格统一：
- 全屏居中毛玻璃卡片，cyan→magenta 渐变 Logo
- 输入框 focus 发光边框 + 轻微光晕
- 登录失败 shake 动画
- "记住本次会话"复选框
- 移动端自适应

### 8. 登录安全加固

- 暴力破解防护：连续 5 次失败后锁定 30 秒
- 修改密码后自动退出登录，要求重新验证
