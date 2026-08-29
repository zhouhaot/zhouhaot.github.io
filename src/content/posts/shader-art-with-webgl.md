---
title: 用 WebGL 着色器创造数字艺术：从零开始的 Shader 编程之旅
published: 2025-12-15
description: 着色器（Shader）是 GPU 上运行的小程序，能在毫秒内为数百万像素计算颜色。本文带你从最简单的 fragment shader 开始，逐步创造出流动的渐变、有机的噪声纹理和赛博朋克风格的视觉特效。
tags: [WebGL, Creative Coding, GLSL]
category: tech
---

## 为什么学 Shader？

在这个 AI 生成一切的时代，手写 Shader 似乎是最后的「手工活」。但正是这种精确到像素的控制力，让你能创造出任何 AI 都无法预测的视觉效果。

## 你的第一个 Shader

```glsl
void mainImage(out vec4 fragCoord, in vec2 uv) {
    vec3 col = 0.5 + 0.5 * cos(iTime + uv.xyx + vec3(0, 2, 4));
    fragCoord = vec4(col, 1.0);
}
```

仅仅五行代码，就能在屏幕上渲染出流动的彩虹渐变。这就是 Shader 的魔力——用数学表达美。

## 噪声：有机感的秘密

Perlin 噪声和 Simplex 噪声是创造自然纹理的基石。云朵、大理石、火焰——这些都可以用噪声函数组合出来。

```glsl
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
```

## 实战：赛博朋克城市天际线

结合噪声、SDF（有符号距离场）和后期处理，我们可以创造出一个迷幻的赛博朋克城市轮廓...

> 「在像素的海洋里，每个数学公式都是一首诗。」

## 总结

Shader 编程的学习曲线陡峭，但回报巨大。建议从 Shadertoy 开始练习，每天写一个小 shader，三个月后你会发现自己看待视觉世界的方式完全不同了。
