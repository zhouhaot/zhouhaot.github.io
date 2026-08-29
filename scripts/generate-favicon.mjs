/*
 * zevth favicon 生成脚本
 * 用法: node scripts/generate-favicon.mjs
 * 生成 public/favicon/ 下的 light/dark 两套 32/128/180/192 PNG
 * 图形为矢量绘制的几何 "z" 字标（不依赖系统字体），主题色 hue 250
 */

import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const SIZES = [32, 128, 180, 192];

const zMark = (stroke) =>
	`<path d="M156 180 H356 L156 332 H356" fill="none" stroke="${stroke}" stroke-width="54" stroke-linecap="round" stroke-linejoin="round"/>`;

const svg = {
	light: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8b5cf6"/>
      <stop offset="1" stop-color="#6366f1"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  ${zMark("#ffffff")}
</svg>`,
	dark: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#312e81"/>
      <stop offset="1" stop-color="#1e1b4b"/>
    </linearGradient>
    <linearGradient id="z" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#a78bfa"/>
      <stop offset="1" stop-color="#818cf8"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  ${zMark("url(#z)")}
</svg>`,
};

await mkdir("public/favicon", { recursive: true });
for (const [variant, source] of Object.entries(svg)) {
	for (const size of SIZES) {
		const out = `public/favicon/favicon-${variant}-${size}.png`;
		await sharp(Buffer.from(source)).resize(size, size).png().toFile(out);
		console.log("generated:", out);
	}
}
