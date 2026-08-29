/*
 * AI 推送文章脚本
 * 用法: node scripts/push-post.mjs <草稿.md> [--publish] [--force] [--no-push] [--no-build]
 *
 * 流程: 校验 frontmatter → 落盘到 src/content/posts/<slug>.md → pnpm build 验证
 *       → git commit → push 当前分支（push main 需用户确认后手动合并或明确授权）
 *
 * 选项:
 *   --publish   将 draft 置为 false（发布）；默认保持草稿状态
 *   --force     目标文件已存在时覆盖
 *   --no-push   只落盘和构建，不执行 git 操作
 *   --no-build  跳过构建验证（不推荐）
 *
 * 供 AI agent 与人使用；frontmatter 规范见 docs/WRITING.md
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const args = process.argv.slice(2).filter((a) => a !== "--");
const flags = new Set(args.filter((a) => a.startsWith("--")));
const positional = args.filter((a) => !a.startsWith("--"));

const POSTS_DIR = "src/content/posts";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;

function die(msg) {
	console.error(`Error: ${msg}`);
	process.exit(1);
}

function parseFrontmatter(source) {
	const m = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
	if (!m) die("文件缺少 frontmatter（--- 包裹的元数据块）");
	const data = {};
	for (const line of m[1].split(/\r?\n/)) {
		const kv = line.match(/^(\w[\w-]*):\s*(.*)$/);
		if (!kv) continue;
		let [, key, value] = kv;
		value = value.trim();
		if (value.startsWith("[") && value.endsWith("]")) {
			data[key] = value
				.slice(1, -1)
				.split(",")
				.map((s) => s.trim().replace(/^["']|["']$/g, ""))
				.filter(Boolean);
		} else {
			data[key] = value.replace(/^["']|["']$/g, "");
		}
	}
	return { data, body: m[2] };
}

function run(cmd, opts = {}) {
	console.log(`> ${cmd}`);
	execSync(cmd, { stdio: "inherit", env: { ...process.env, CI: "true" }, ...opts });
}

// ---- 参数与文件 ----
if (positional.length !== 1) {
	die("用法: node scripts/push-post.mjs <草稿.md> [--publish] [--force] [--no-push] [--no-build]");
}
const srcPath = positional[0];
if (!fs.existsSync(srcPath)) die(`文件不存在: ${srcPath}`);

const slug = path.basename(srcPath).replace(/\.(md|mdx)$/i, "");
if (!SLUG_RE.test(slug)) die(`slug 不合法: "${slug}"（需为小写英文/数字/连字符）`);

// ---- 校验 frontmatter ----
const { data, body } = parseFrontmatter(fs.readFileSync(srcPath, "utf-8"));
if (!data.title) die("frontmatter 缺少 title");
if (!DATE_RE.test(data.published || "")) die("published 必须为 YYYY-MM-DD 格式");
const publishing = flags.has("--publish");
if (publishing && !data.description) die("发布（--publish）前必须填写 description（列表页/SEO/搜索摘要使用）");
if (data.category && !/^[a-z]+$/.test(data.category)) {
	console.warn(`Warn: category "${data.category}" 不是小写英文（约定 tech/design/life）`);
}
if (body.trim().length < 20) {
	console.warn("Warn: 正文内容过短，确认不是空文件");
}

const draft = publishing ? false : data.draft !== "false";
const q = (v) => (v && String(v).trim() ? v : '""'); // 空值必须写 ""，否则 YAML 解析为 null 违反 schema
const frontmatter = `---
title: ${q(data.title)}
published: ${data.published}
description: ${q(data.description)}
image: ${q(data.image)}
tags: [${Array.isArray(data.tags) ? data.tags.join(", ") : ""}]
category: ${q(data.category)}
draft: ${draft}
lang: ${q(data.lang)}
---
`;

const target = path.join(POSTS_DIR, `${slug}.md`);
if (fs.existsSync(target) && !flags.has("--force")) {
	die(`目标文件已存在: ${target}（使用 --force 覆盖）`);
}

fs.mkdirSync(POSTS_DIR, { recursive: true });
fs.writeFileSync(target, frontmatter + body, "utf-8");
console.log(`written: ${target} (draft: ${draft})`);

// ---- 构建验证 ----
if (!flags.has("--no-build")) {
	console.log("构建验证中…");
	run("pnpm build");
}

// ---- git 提交推送 ----
if (!flags.has("--no-push")) {
	run(`git add "${target}"`);
	run(`git commit -m "post: ${data.title.replace(/"/g, "'")}"`);
	run("git -c http.proxy= -c https.proxy= push");
	console.log(`\n已推送到分支 ${execSync("git branch --show-current").toString().trim()}。`);
	if (draft) {
		console.log("当前为草稿状态，仅预览可见；正式发布请改 draft: false 后再推送（或加 --publish）。");
	} else {
		console.log("文章已发布。合并到 main 并触发部署后即可线上访问。");
	}
}
