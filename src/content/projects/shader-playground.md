---
title: Shader Playground
description: 一个在线 Shader 编辑器，支持实时预览、语法高亮和社区分享。使用 WebGL 2.0 渲染，支持 GLSL ES 3.0 语法。
tags: [WebGL, Editor, Creative]
tech: [React, WebGL 2.0, Monaco Editor, Firebase]
link: https://github.com/username/shader-playground
demo: https://shader-playground.vercel.app
year: 2024
status: 已完成
order: 2
---

## 起因

Shadertoy 是学习 Shader 的好地方，但它的编辑体验一般。我想做一个更现代的替代品。

## 功能

- 实时预览：代码修改立即反映到画布
- 语法高亮：基于 Monaco Editor
- 社区分享：作品保存到 Firebase
- 多 Pass 支持：可以链接多个 Shader

## 技术栈

- React + TypeScript
- Monaco Editor（VS Code 同款编辑器）
- WebGL 2.0 渲染
- Firebase Realtime Database
