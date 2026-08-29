---
title: Motion Design System
description: 为大型应用设计的动效规范系统。定义了缓动曲线、持续时间、编排规则的标准化方案，并提供了 React 和 Vue 的实现。
tags: [Motion, Design System, Animation]
tech: [TypeScript, React, Vue, Framer Motion]
link: https://github.com/username/motion-design-system
demo: 
year: 2024
status: 进行中
order: 3
---

## 问题

大型团队中，动效往往是最后才考虑的事情。每个开发者自己定义 duration 和 easing，导致产品动效风格不统一。

## 解决方案

定义一套动效设计令牌（Design Tokens），包括：

- 缓动曲线：ease-out-expo, ease-spring, ease-smooth 等
- 持续时间：fast(150ms), normal(300ms), slow(500ms)
- 编排规则：stagger 间隔、级联延迟

## 进度

- [x] Token 定义
- [x] React 实现
- [x] Vue 实现
- [ ] 文档站
- [ ] Figma 插件
