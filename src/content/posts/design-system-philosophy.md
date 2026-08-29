---
title: 设计系统不是组件库：我理解的 Design System 哲学
published: 2025-11-28
description: 很多团队把 Design System 等同于一套 UI 组件库。但真正的设计系统是一套关于「如何做决策」的语言——从颜色间距到动效节奏，从组件 API 到文档规范，它是团队共识的代码化表达。
tags: [设计系统, 前端架构, Design]
category: design
---

## 误解：Design System = 组件库

打开很多团队的「设计系统」仓库，你会看到一堆 Button、Input、Modal 组件。这些当然重要，但它们只是设计系统的冰山一角。

## 设计系统的三层结构

### 1. 设计令牌（Design Tokens）

最底层是设计决策的原子化表达：

```css
:root {
  --color-primary: oklch(65% 0.25 250);
  --space-md: clamp(1rem, 0.92rem + 0.4vw, 1.25rem);
  --duration-fast: 150ms;
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
}
```

这些 token 不属于任何组件，但所有组件都依赖它们。

### 2. 模式语言（Pattern Language）

如何处理表单验证的错误状态？什么时候用 Toast 而不是 Modal？分页和无限滚动怎么选？这些模式是团队的「默契」。

### 3. 组件实现（Components）

最后才是具体的组件代码。它应该是前两层的自然产物。

## 好的设计系统像方言

一个好的设计系统让团队成员能用简短的术语精确表达复杂的设计意图：

> 「这个表单的错误反馈用 inline-validate 模式，token 用 --color-danger-500，动效用 --ease-spring。」

三句话，零歧义。

## 总结

不要急于写组件。先把设计决策梳理清楚，用 token 固化下来，用模式语言建立共识。组件只是这些决策的最终表达。
