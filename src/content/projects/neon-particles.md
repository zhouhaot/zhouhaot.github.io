---
title: Neon Particles
description: 一个基于 Canvas 2D 的高性能粒子系统，支持鼠标交互、颜色主题切换和实时参数调节。纯原生 JS 实现，零依赖，gzip 后仅 4KB。
tags: [Canvas, Animation, JavaScript]
tech: [Vanilla JS, Canvas 2D, CSS Custom Properties]
link: https://github.com/username/neon-particles
demo: https://username.github.io/neon-particles
year: 2025
status: 已完成
order: 0
---

## 背景

在探索 Canvas 动画的过程中，我发现大多数粒子库都过于臃肿。于是决定从零实现一个极致精简的粒子系统。

## 技术方案

使用 Canvas 2D API，通过 `requestAnimationFrame` 驱动动画循环。每个粒子包含位置、速度、半径和颜色属性，每帧更新位置并绘制。

## 亮点

- 粒子间连线：距离越近线条越粗，营造网络感
- 鼠标斥力场：鼠标附近的粒子会被推开
- 性能优化：空间分区减少 O(n²) 碰撞检测

## 未来计划

- 支持 WebGL 渲染后端
- 添加粒子形状（三角形、六边形）
- 支持粒子间碰撞物理
