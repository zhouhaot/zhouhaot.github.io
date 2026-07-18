# zhou Foundation and Content System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-checkable Astro foundation for zhou with typed content collections, static routes, SEO feeds, and automated quality gates without making visual decisions that belong to the pending OpenDesign prototype.

**Architecture:** Keep the legacy site in place while introducing a new Astro application under `src/`. Git-managed Markdown/MDX is the only phase-one content source; Astro validates and prerenders every public page. Presentation remains deliberately semantic and minimal so the later UI plan can replace styles and components without changing routes or content contracts.

**Tech Stack:** Astro 7.1.1, TypeScript 6.0.3 strict mode, Astro Content Collections, MDX 7.0.3, Vitest 4.1.10, Playwright 1.61.1, axe-core 4.12.1, GitHub Actions.

## Global Constraints

- Public brand name is exactly `zhou`; do not reintroduce `VOID.DEV` in new pages.
- Public copy is Chinese only in phase one.
- Do not publish a real name, portrait, address, phone number, unapproved employer, or unredacted resume data.
- Do not create fictional clients, outcomes, testimonials, projects, or conversion metrics.
- Primary conversion is GitHub; secondary conversion is cooperation or employment contact.
- Production content comes only from Git-tracked Markdown/MDX and assets; do not read `localStorage`.
- Every public content route is statically generated without Hash routing.
- The old `admin/`, `themes/`, `js/`, and root static entry remain untouched until the launch-migration plan.
- UI in this plan is semantic scaffolding only; colors, typography, layout, and animation await the approved OpenDesign prototype.
- Node.js floor is 22.12.0; the verified local runtime is 24.10.0.
- New external content URLs permit `https:` only; public contact URLs permit `https:` or `mailto:`.
- Accessibility baseline is WCAG 2.2 AA; all pages must work with keyboard navigation and reduced motion.

---

## Scope Decomposition

This specification is implemented through three independent plans:

1. **This plan — foundation and content system:** Astro runtime, schemas, static routes, SEO outputs, tests, and CI.
2. **OpenDesign UI implementation plan:** design tokens, visual components, responsive states, motion, and visual regression. Write only after the prototype is supplied.
3. **Launch migration plan:** verified content import, legacy removal, redirects, deployment cutover, and production checks. Write after the new UI and real content are ready.

## File Responsibility Map

```text
astro.config.mjs                 Astro integrations, canonical site, trailing slash policy
package.json                     dependency and quality-command contract
tsconfig.json                    strict TypeScript rules
src/content.config.ts            collection registration only
src/domain/content-schema.ts     reusable Zod schemas and URL rules
src/domain/content.ts            published-entry filtering and deterministic sorting
src/config/site.ts               public brand/navigation/contact configuration
src/layouts/BaseLayout.astro     document shell, canonical metadata, accessibility shell
src/layouts/ContentLayout.astro  shared detail-page structure
src/components/SiteHeader.astro  semantic global navigation
src/components/EmptyState.astro  truthful empty collection state
src/components/EntryList.astro   shared semantic content index
src/pages/*                      file-based public routes
src/pages/*/[id].astro           prerendered collection detail routes
src/pages/rss.xml.ts             RSS endpoint generated at build time
src/styles/foundation.css        temporary non-branded readability baseline
tests/content-schema.test.ts     schema and protocol regression tests
tests/content-domain.test.ts     draft filtering and sorting regression tests
e2e/foundation.spec.ts           route, keyboard, metadata, and axe checks
playwright.config.ts             built-site E2E configuration
.github/workflows/ci.yml         install, check, test, build, and E2E gate
```

### Task 1: Install the Astro Build Foundation

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `eslint.config.js`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `src/env.d.ts`
- Create: `src/styles/foundation.css`
- Create: `src/config/site.ts`
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/pages/index.astro`

**Interfaces:**

- Produces: `SITE` configuration, `BaseLayout` props `{ title?: string; description?: string; canonicalPath?: string; image?: string; type?: 'website' | 'article' }`.
- Consumes: no earlier task.

- [ ] **Step 1: Replace the package contract without deleting legacy source**

Set `package.json` to:

```json
{
  "name": "zhou-portfolio",
  "version": "2.0.0",
  "type": "module",
  "private": true,
  "engines": { "node": ">=22.12.0" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro check && astro build",
    "preview": "astro preview",
    "check": "astro check",
    "lint": "eslint js/ themes/ admin/ src/ tests/ e2e/",
    "format:check": "prettier --check \"src/**/*.{astro,ts,md,mdx,css}\" \"tests/**/*.ts\" \"e2e/**/*.ts\" \"*.{js,ts,json}\" \".github/**/*.{yml,yaml}\"",
    "format": "prettier --write \"src/**/*.{astro,ts,md,mdx,css}\" \"tests/**/*.ts\" \"e2e/**/*.ts\" \"*.{js,ts,json}\" \".github/**/*.{yml,yaml}\"",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "@astrojs/mdx": "7.0.3",
    "@astrojs/rss": "4.0.19",
    "@astrojs/sitemap": "3.7.3",
    "astro": "7.1.1"
  },
  "devDependencies": {
    "@astrojs/check": "0.9.9",
    "@axe-core/playwright": "4.12.1",
    "@playwright/test": "1.61.1",
    "dompurify": "3.2.6",
    "eslint": "9.39.2",
    "eslint-plugin-astro": "3.0.1",
    "jsdom": "26.1.0",
    "marked": "15.0.12",
    "prettier": "3.8.2",
    "typescript-eslint": "8.64.0",
    "typescript": "6.0.3",
    "vitest": "4.1.10"
  }
}
```

- [ ] **Step 2: Install the exact dependency graph**

Run:

```powershell
npm install
```

Expected: exit 0 and an updated `package-lock.json` with `astro@7.1.1`.

- [ ] **Step 3: Add Astro and TypeScript configuration**

Create `astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://zhouhaot.github.io',
  trailingSlash: 'always',
  integrations: [mdx(), sitemap()],
});
```

Create `tsconfig.json`:

```json
{
  "extends": "astro/tsconfigs/strictest",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "noUncheckedIndexedAccess": true
  }
}
```

Create `src/env.d.ts`:

```ts
/// <reference types="astro/client" />
```

Replace `eslint.config.js` with a legacy-compatible flat configuration plus TypeScript and Astro rules:

```js
import eslintPluginAstro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

const legacyGlobals = {
  window: 'readonly',
  document: 'readonly',
  localStorage: 'readonly',
  sessionStorage: 'readonly',
  console: 'readonly',
  fetch: 'readonly',
  setTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  clearTimeout: 'readonly',
  requestAnimationFrame: 'readonly',
  IntersectionObserver: 'readonly',
  URL: 'readonly',
  crypto: 'readonly',
  TextEncoder: 'readonly',
  Uint8Array: 'readonly',
  Array: 'readonly',
  Math: 'readonly',
  Date: 'readonly',
  JSON: 'readonly',
  String: 'readonly',
  Number: 'readonly',
  Promise: 'readonly',
  confirm: 'readonly',
  alert: 'readonly',
  location: 'readonly',
  FileReader: 'readonly',
  Image: 'readonly',
  matchMedia: 'readonly',
  Blob: 'readonly',
  cancelAnimationFrame: 'readonly',
  DOMPurify: 'readonly',
  marked: 'readonly',
  Core: 'readonly',
  Router: 'readonly',
  ParticleSystem: 'readonly',
  CursorGlow: 'readonly',
  initScrollReveal: 'readonly',
  initSkillBars: 'readonly',
  init3DTilt: 'readonly',
  initFilters: 'readonly',
  initBlogCardClicks: 'readonly',
  initProjectCardClicks: 'readonly',
  initMobileNav: 'readonly',
  initScatterReveal: 'readonly',
  initCardEffects: 'readonly',
  initFilterAnimReplay: 'readonly',
  initTypewriter: 'readonly',
  initNavBehavior: 'readonly',
  updateActiveNavLink: 'readonly',
  initSmoothScroll: 'readonly',
  initLoader: 'readonly',
  initScrollProgress: 'readonly',
};

export default [
  { ignores: ['vendor/**', 'node_modules/**', 'dist/**', 'data/**', '*.min.js'] },
  {
    files: ['js/**/*.js', 'themes/**/*.js', 'admin/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'script', globals: legacyGlobals },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-console': 'off',
      eqeqeq: 'warn',
      'no-eval': 'error',
      'no-implied-eval': 'error',
    },
  },
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
];
```

- [ ] **Step 4: Add the public site configuration**

Create `src/config/site.ts`:

```ts
export const SITE = {
  name: 'zhou',
  title: 'zhou — AI 应用开发者',
  description: '探索技术边界，让 AI 真正进入业务。',
  url: 'https://zhouhaot.github.io',
  githubUrl: 'https://github.com/zhouhaot',
  navigation: [
    { label: '首页', href: '/' },
    { label: '作品', href: '/work/' },
    { label: 'AI 实验室', href: '/lab/' },
    { label: '技术文章', href: '/notes/' },
    { label: '关于 zhou', href: '/about/' },
  ],
} as const;
```

- [ ] **Step 5: Add a semantic, deliberately unbranded document shell**

Create `src/layouts/BaseLayout.astro`:

```astro
---
import { SITE } from '@/config/site';
import '@/styles/foundation.css';

interface Props {
  title?: string;
  description?: string;
  canonicalPath?: string;
  image?: string;
  type?: 'website' | 'article';
}

const {
  title = SITE.title,
  description = SITE.description,
  canonicalPath = Astro.url.pathname,
  image = '/og-default.png',
  type = 'website',
} = Astro.props;
const canonical = new URL(canonicalPath, SITE.url);
const socialImage = new URL(image, SITE.url);
---

<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <meta property="og:site_name" content={SITE.name} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content={type} />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content={socialImage} />
    <meta name="twitter:card" content="summary_large_image" />
    <title>{title}</title>
  </head>
  <body>
    <a class="skip-link" href="#main-content">跳到主要内容</a>
    <slot name="header" />
    <main id="main-content" tabindex="-1"><slot /></main>
  </body>
</html>
```

Create `src/styles/foundation.css`:

```css
:root {
  color-scheme: dark;
  font-family: system-ui, sans-serif;
  line-height: 1.6;
  background: #111;
  color: #f5f5f5;
}

body {
  margin: 0;
}

a {
  color: inherit;
}

a:focus-visible,
button:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}

.skip-link {
  position: absolute;
  transform: translateY(-200%);
}

.skip-link:focus {
  transform: translateY(0);
}

main {
  max-width: 72rem;
  margin: 0 auto;
  padding: 2rem 1rem;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 6: Add the build-smoke homepage**

Create `src/pages/index.astro`:

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
---

<BaseLayout>
  <h1>zhou</h1>
  <p>探索技术边界，让 AI 真正进入业务。</p>
  <a href="https://github.com/zhouhaot" rel="me external">访问 GitHub</a>
</BaseLayout>
```

- [ ] **Step 7: Verify the foundation**

Run:

```powershell
npm run check
npm run build
```

Expected: both commands exit 0; `dist/index.html` exists and contains `<title>zhou — AI 应用开发者</title>`.

- [ ] **Step 8: Commit**

```powershell
git add package.json package-lock.json astro.config.mjs tsconfig.json src
git commit -m "feat: establish Astro portfolio foundation"
```

### Task 2: Define Typed Content Contracts

**Files:**

- Create: `src/domain/content-schema.ts`
- Create: `src/content.config.ts`
- Create: `src/content/work/.gitkeep`
- Create: `src/content/lab/.gitkeep`
- Create: `src/content/notes/.gitkeep`
- Create: `tests/content-schema.test.ts`

**Interfaces:**

- Produces: `workSchema`, `labSchema`, `noteSchema`, `httpsUrl`, `publicContactUrl`; collections named `work`, `lab`, `notes`.
- Consumes: Astro Content Collections from Task 1.

- [ ] **Step 1: Write failing schema tests**

Create `tests/content-schema.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { labSchema, noteSchema, publicContactUrl, workSchema } from '../src/domain/content-schema';

const baseWork = {
  title: '企业知识助手',
  summary: '面向内部知识检索的可验证原型',
  problem: '知识分散且检索成本高',
  role: 'AI 应用开发',
  solution: '检索增强生成工作流',
  stack: ['Astro', 'Python'],
  contributions: ['内容模型', '评估流程'],
  status: 'prototype',
  publishedAt: '2026-07-18',
  featured: false,
};

describe('content schemas', () => {
  it('accepts an evidence-based work entry', () => {
    expect(workSchema.parse(baseWork).title).toBe('企业知识助手');
  });

  it('rejects unsafe repository protocols', () => {
    expect(() => workSchema.parse({ ...baseWork, repositoryUrl: 'javascript:alert(1)' })).toThrow();
  });

  it('accepts only explicit lab lifecycle states', () => {
    expect(() =>
      labSchema.parse({
        title: 'Agent 路由实验',
        summary: '比较路由策略',
        hypothesis: '显式路由更稳定',
        workflow: ['分类', '执行', '评估'],
        modelOrTools: ['OpenAI API'],
        result: '形成基线',
        evaluation: '使用固定测试集',
        status: 'finished',
        publishedAt: '2026-07-18',
      }),
    ).toThrow();
  });

  it('coerces note dates and requires draft state', () => {
    const note = noteSchema.parse({
      title: 'AI 工作流评估',
      summary: '如何建立回归集',
      tags: ['eval'],
      publishedAt: '2026-07-18',
      draft: true,
    });
    expect(note.publishedAt).toBeInstanceOf(Date);
  });

  it('allows https and mailto public contact URLs only', () => {
    expect(publicContactUrl.parse('mailto:public@example.com')).toBe('mailto:public@example.com');
    expect(() => publicContactUrl.parse('tel:+8613800000000')).toThrow();
  });
});
```

- [ ] **Step 2: Run the tests and confirm the red state**

Run:

```powershell
npx vitest run tests/content-schema.test.ts
```

Expected: FAIL because `src/domain/content-schema.ts` does not exist.

- [ ] **Step 3: Implement the reusable schemas**

Create `src/domain/content-schema.ts`:

```ts
import { z } from 'astro/zod';

export const httpsUrl = z.url().refine((value) => new URL(value).protocol === 'https:', {
  message: 'URL must use https:',
});

export const publicContactUrl = z.url().refine((value) => ['https:', 'mailto:'].includes(new URL(value).protocol), {
  message: 'Contact URL must use https: or mailto:',
});

const commonSchema = z.object({
  title: z.string().min(1).max(120),
  summary: z.string().min(1).max(240),
  publishedAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  draft: z.boolean().default(false),
});

export const workSchema = commonSchema.extend({
  problem: z.string().min(1),
  role: z.string().min(1),
  solution: z.string().min(1),
  stack: z.array(z.string().min(1)).min(1),
  contributions: z.array(z.string().min(1)).min(1),
  status: z.enum(['prototype', 'validated', 'shipped', 'archived']),
  featured: z.boolean().default(false),
  repositoryUrl: httpsUrl.optional(),
  demoUrl: httpsUrl.optional(),
  architecture: z.string().optional(),
  screenshots: z.array(z.string().min(1)).default([]),
  outcomes: z.array(z.string().min(1)).default([]),
  limitations: z.array(z.string().min(1)).default([]),
  nextSteps: z.array(z.string().min(1)).default([]),
});

export const labSchema = commonSchema.extend({
  hypothesis: z.string().min(1),
  workflow: z.array(z.string().min(1)).min(1),
  modelOrTools: z.array(z.string().min(1)).min(1),
  result: z.string().min(1),
  evaluation: z.string().min(1),
  status: z.enum(['prototype', 'validated', 'archived']),
  repositoryUrl: httpsUrl.optional(),
  demoUrl: httpsUrl.optional(),
});

export const noteSchema = commonSchema.extend({
  tags: z.array(z.string().min(1)).min(1),
});
```

- [ ] **Step 4: Register the collections**

Create `src/content.config.ts`:

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { labSchema, noteSchema, workSchema } from '@/domain/content-schema';

const work = defineCollection({
  loader: glob({ base: './src/content/work', pattern: '**/*.{md,mdx}' }),
  schema: workSchema,
});

const lab = defineCollection({
  loader: glob({ base: './src/content/lab', pattern: '**/*.{md,mdx}' }),
  schema: labSchema,
});

const notes = defineCollection({
  loader: glob({ base: './src/content/notes', pattern: '**/*.{md,mdx}' }),
  schema: noteSchema,
});

export const collections = { work, lab, notes };
```

Add `.gitkeep` to each empty content directory. Do not add public sample entries.

- [ ] **Step 5: Run schema and framework checks**

Run:

```powershell
npx vitest run tests/content-schema.test.ts
npm run check
```

Expected: 5 tests pass and Astro check exits 0.

- [ ] **Step 6: Commit**

```powershell
git add src/content.config.ts src/content src/domain/content-schema.ts tests/content-schema.test.ts
git commit -m "feat: define typed portfolio content contracts"
```

### Task 3: Add Deterministic Published-Content Queries

**Files:**

- Create: `src/domain/content.ts`
- Create: `tests/content-domain.test.ts`

**Interfaces:**

- Produces: `isPublicEntry(data, production)`, `sortNewestFirst(entries)`, `getPublishedEntries(collection)`.
- Consumes: collection names `work | lab | notes` and schemas from Task 2.

- [ ] **Step 1: Write failing domain tests**

Create `tests/content-domain.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { isPublicEntry, sortNewestFirst } from '../src/domain/content';

describe('content domain', () => {
  it('excludes drafts in production and includes them in development', () => {
    expect(isPublicEntry({ draft: true }, true)).toBe(false);
    expect(isPublicEntry({ draft: true }, false)).toBe(true);
  });

  it('sorts newest entries first without mutating input', () => {
    const entries = [
      { data: { publishedAt: new Date('2026-01-01') } },
      { data: { publishedAt: new Date('2026-07-18') } },
    ];
    const sorted = sortNewestFirst(entries);
    expect(sorted[0]?.data.publishedAt.toISOString()).toContain('2026-07-18');
    expect(entries[0]?.data.publishedAt.toISOString()).toContain('2026-01-01');
  });
});
```

- [ ] **Step 2: Verify the red state**

Run `npx vitest run tests/content-domain.test.ts`.

Expected: FAIL because `src/domain/content.ts` does not exist.

- [ ] **Step 3: Implement pure rules and the Astro query adapter**

Create `src/domain/content.ts`:

```ts
import { getCollection, type CollectionEntry } from 'astro:content';

type DatedEntry = { data: { publishedAt: Date } };

export function isPublicEntry(data: { draft?: boolean }, production = import.meta.env.PROD): boolean {
  return production ? data.draft !== true : true;
}

export function sortNewestFirst<T extends DatedEntry>(entries: readonly T[]): T[] {
  return [...entries].sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());
}

type PublicCollection = 'work' | 'lab' | 'notes';

export async function getPublishedEntries<C extends PublicCollection>(collection: C): Promise<CollectionEntry<C>[]> {
  const entries = await getCollection(collection, ({ data }) => isPublicEntry(data));
  return sortNewestFirst(entries as CollectionEntry<C>[]);
}
```

- [ ] **Step 4: Verify tests and types**

Run:

```powershell
npx vitest run tests/content-domain.test.ts
npm run check
```

Expected: 2 tests pass and Astro check exits 0.

- [ ] **Step 5: Commit**

```powershell
git add src/domain/content.ts tests/content-domain.test.ts
git commit -m "feat: add deterministic public content queries"
```

### Task 4: Build Semantic Navigation and Shared Content Layouts

**Files:**

- Create: `src/components/SiteHeader.astro`
- Create: `src/components/EmptyState.astro`
- Create: `src/components/EntryList.astro`
- Create: `src/layouts/ContentLayout.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**

- Produces: semantic site header, truthful empty state, generic entry list, detail layout.
- Consumes: `SITE`, `BaseLayout`.

- [ ] **Step 1: Add semantic shared components**

Create `src/components/SiteHeader.astro`:

```astro
---
import { SITE } from '@/config/site';
---

<header>
  <nav aria-label="主导航">
    <a href="/" aria-label="zhou 首页">zhou</a>
    <ul>
      {SITE.navigation.map((item) => <li><a href={item.href}>{item.label}</a></li>)}
    </ul>
    <a href={SITE.githubUrl} rel="me external">GitHub</a>
  </nav>
</header>
```

Create `src/components/EmptyState.astro`:

```astro
---
interface Props { title: string; description: string }
const { title, description } = Astro.props;
---

<section aria-labelledby="empty-title">
  <h2 id="empty-title">{title}</h2>
  <p>{description}</p>
</section>
```

Create `src/components/EntryList.astro`:

```astro
---
interface Entry { id: string; data: { title: string; summary: string; publishedAt: Date } }
interface Props { entries: Entry[]; basePath: '/work' | '/lab' | '/notes' }
const { entries, basePath } = Astro.props;
---

<ul>
  {entries.map((entry) => (
    <li>
      <article>
        <h2><a href={`${basePath}/${entry.id}/`}>{entry.data.title}</a></h2>
        <p>{entry.data.summary}</p>
        <time datetime={entry.data.publishedAt.toISOString()}>
          {entry.data.publishedAt.toLocaleDateString('zh-CN')}
        </time>
      </article>
    </li>
  ))}
</ul>
```

- [ ] **Step 2: Add the shared detail layout**

Create `src/layouts/ContentLayout.astro`:

```astro
---
import BaseLayout from './BaseLayout.astro';
import SiteHeader from '@/components/SiteHeader.astro';

interface Props { title: string; summary: string; publishedAt: Date; canonicalPath: string }
const { title, summary, publishedAt, canonicalPath } = Astro.props;
---

<BaseLayout title={`${title} — zhou`} description={summary} canonicalPath={canonicalPath} type="article">
  <SiteHeader slot="header" />
  <article>
    <header>
      <h1>{title}</h1>
      <p>{summary}</p>
      <time datetime={publishedAt.toISOString()}>{publishedAt.toLocaleDateString('zh-CN')}</time>
    </header>
    <slot />
  </article>
</BaseLayout>
```

- [ ] **Step 3: Update the homepage to use global navigation**

Replace `src/pages/index.astro` with:

```astro
---
import SiteHeader from '@/components/SiteHeader.astro';
import { SITE } from '@/config/site';
import BaseLayout from '@/layouts/BaseLayout.astro';
---

<BaseLayout>
  <SiteHeader slot="header" />
  <h1>zhou</h1>
  <p>AI 应用开发者</p>
  <p>探索技术边界，让 AI 真正进入业务。</p>
  <a href={SITE.githubUrl} rel="me external">访问 GitHub</a>
  <p>正在寻找工作，同时接受合适的 AI 应用合作。</p>
</BaseLayout>
```

- [ ] **Step 4: Verify semantic compilation**

Run `npm run check && npm run build`.

Expected: exit 0 and no content is invented to fill empty collections.

- [ ] **Step 5: Commit**

```powershell
git add src/components src/layouts src/pages/index.astro
git commit -m "feat: add semantic portfolio page primitives"
```

### Task 5: Generate Public Collection Routes

**Files:**

- Create: `src/pages/work/index.astro`
- Create: `src/pages/work/[id].astro`
- Create: `src/pages/lab/index.astro`
- Create: `src/pages/lab/[id].astro`
- Create: `src/pages/notes/index.astro`
- Create: `src/pages/notes/[id].astro`
- Create: `src/pages/about.astro`
- Create: `src/pages/404.astro`

**Interfaces:**

- Produces: `/work/`, `/work/[id]/`, `/lab/`, `/lab/[id]/`, `/notes/`, `/notes/[id]/`, `/about/`, `/404.html`.
- Consumes: `getPublishedEntries`, `EntryList`, `EmptyState`, `ContentLayout`, collection entry types.

- [ ] **Step 1: Add the three truthful list routes**

Create `src/pages/work/index.astro`:

```astro
---
import EmptyState from '@/components/EmptyState.astro';
import EntryList from '@/components/EntryList.astro';
import SiteHeader from '@/components/SiteHeader.astro';
import { getPublishedEntries } from '@/domain/content';
import BaseLayout from '@/layouts/BaseLayout.astro';
const entries = await getPublishedEntries('work');
---

<BaseLayout title="作品 — zhou" description="可验证的 AI 应用与工程作品。" canonicalPath="/work/">
  <SiteHeader slot="header" />
  <h1>作品</h1>
  {entries.length > 0
    ? <EntryList entries={entries} basePath="/work" />
    : <EmptyState title="作品正在整理" description="只展示经过核验的真实项目。" />}
</BaseLayout>
```

Create `src/pages/lab/index.astro`:

```astro
---
import EmptyState from '@/components/EmptyState.astro';
import EntryList from '@/components/EntryList.astro';
import SiteHeader from '@/components/SiteHeader.astro';
import { getPublishedEntries } from '@/domain/content';
import BaseLayout from '@/layouts/BaseLayout.astro';
const entries = await getPublishedEntries('lab');
---

<BaseLayout title="AI 实验室 — zhou" description="可运行、可复现的 AI 技术探索。" canonicalPath="/lab/">
  <SiteHeader slot="header" />
  <h1>AI 实验室</h1>
  {entries.length > 0
    ? <EntryList entries={entries} basePath="/lab" />
    : <EmptyState title="实验正在整理" description="实验内容将在完成验证后公开。" />}
</BaseLayout>
```

Create `src/pages/notes/index.astro`:

```astro
---
import EmptyState from '@/components/EmptyState.astro';
import EntryList from '@/components/EntryList.astro';
import SiteHeader from '@/components/SiteHeader.astro';
import { getPublishedEntries } from '@/domain/content';
import BaseLayout from '@/layouts/BaseLayout.astro';
const entries = await getPublishedEntries('notes');
---

<BaseLayout title="技术文章 — zhou" description="关于 AI 工作流、工程实践与产品落地的笔记。" canonicalPath="/notes/">
  <SiteHeader slot="header" />
  <h1>技术文章</h1>
  {entries.length > 0
    ? <EntryList entries={entries} basePath="/notes" />
    : <EmptyState title="文章正在整理" description="文章将在完成事实核验后公开。" />}
</BaseLayout>
```

- [ ] **Step 2: Add prerendered detail routes**

Create `src/pages/work/[id].astro`:

```astro
---
import { getPublishedEntries } from '@/domain/content';
import ContentLayout from '@/layouts/ContentLayout.astro';
import { render, type CollectionEntry } from 'astro:content';

export async function getStaticPaths() {
  const entries = await getPublishedEntries('work');
  return entries.map((entry) => ({ params: { id: entry.id }, props: { entry } }));
}

interface Props { entry: CollectionEntry<'work'> }
const { entry } = Astro.props;
const { Content } = await render(entry);
---

<ContentLayout
  title={entry.data.title}
  summary={entry.data.summary}
  publishedAt={entry.data.publishedAt}
  canonicalPath={`/work/${entry.id}/`}
>
  <Content />
</ContentLayout>
```

Create `src/pages/lab/[id].astro`:

```astro
---
import { getPublishedEntries } from '@/domain/content';
import ContentLayout from '@/layouts/ContentLayout.astro';
import { render, type CollectionEntry } from 'astro:content';

export async function getStaticPaths() {
  const entries = await getPublishedEntries('lab');
  return entries.map((entry) => ({ params: { id: entry.id }, props: { entry } }));
}

interface Props { entry: CollectionEntry<'lab'> }
const { entry } = Astro.props;
const { Content } = await render(entry);
---

<ContentLayout
  title={entry.data.title}
  summary={entry.data.summary}
  publishedAt={entry.data.publishedAt}
  canonicalPath={`/lab/${entry.id}/`}
>
  <Content />
</ContentLayout>
```

Create `src/pages/notes/[id].astro`:

```astro
---
import { getPublishedEntries } from '@/domain/content';
import ContentLayout from '@/layouts/ContentLayout.astro';
import { render, type CollectionEntry } from 'astro:content';

export async function getStaticPaths() {
  const entries = await getPublishedEntries('notes');
  return entries.map((entry) => ({ params: { id: entry.id }, props: { entry } }));
}

interface Props { entry: CollectionEntry<'notes'> }
const { entry } = Astro.props;
const { Content } = await render(entry);
---

<ContentLayout
  title={entry.data.title}
  summary={entry.data.summary}
  publishedAt={entry.data.publishedAt}
  canonicalPath={`/notes/${entry.id}/`}
>
  <Content />
</ContentLayout>
```

- [ ] **Step 3: Add anonymous about and 404 routes**

Create `src/pages/about.astro`:

```astro
---
import SiteHeader from '@/components/SiteHeader.astro';
import BaseLayout from '@/layouts/BaseLayout.astro';
---

<BaseLayout title="关于 zhou" description="zhou 是专注于 AI 工作流与企业应用落地的个人技术符号。" canonicalPath="/about/">
  <SiteHeader slot="header" />
  <h1>关于 zhou</h1>
  <p>zhou 是一个个人技术符号，关注 AI 工作流、智能体和企业应用的可验证落地。</p>
  <p>正在寻找工作，同时接受合适的 AI 应用合作。</p>
</BaseLayout>
```

Create `src/pages/404.astro`:

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
---

<BaseLayout title="页面不存在 — zhou" description="请求的页面不存在。" canonicalPath="/404/">
  <h1>页面不存在</h1>
  <p>该地址不存在或内容尚未公开。</p>
  <a href="/">返回首页</a>
</BaseLayout>
```

- [ ] **Step 4: Verify the complete empty-content build**

Run:

```powershell
npm run check
npm run build
Get-ChildItem -Recurse dist | Select-Object FullName
```

Expected: exit 0; list routes, `about/index.html`, `404.html`, and no fabricated detail routes exist.

- [ ] **Step 5: Commit**

```powershell
git add src/pages
git commit -m "feat: add static portfolio content routes"
```

### Task 6: Generate RSS, Sitemap, Robots, and Structured Data

**Files:**

- Create: `src/pages/rss.xml.ts`
- Create: `public/robots.txt`
- Create: `public/og-default.png` as a temporary neutral non-personal wordmark asset
- Modify: `src/layouts/BaseLayout.astro`
- Create: `tests/seo-output.test.ts`

**Interfaces:**

- Produces: `/rss.xml`, `/sitemap-index.xml` or `/sitemap-0.xml`, `/robots.txt`, JSON-LD in every document.
- Consumes: `SITE`, `getPublishedEntries('notes')`.

- [ ] **Step 1: Write a failing built-output test**

Create `tests/seo-output.test.ts`:

```ts
import { beforeAll, describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

beforeAll(() => execFileSync('npm', ['run', 'build'], { shell: true, stdio: 'pipe' }), 120_000);

describe('built SEO outputs', () => {
  it('generates RSS and robots directives', async () => {
    const rss = await readFile('dist/rss.xml', 'utf8');
    const robots = await readFile('dist/robots.txt', 'utf8');
    expect(rss).toContain('<title>zhou 技术文章</title>');
    expect(robots).toContain('Sitemap: https://zhouhaot.github.io/sitemap-index.xml');
  });

  it('embeds ProfilePage structured data on the about page', async () => {
    const about = await readFile('dist/about/index.html', 'utf8');
    expect(about).toContain('application/ld+json');
    expect(about).toContain('ProfilePage');
  });
});
```

- [ ] **Step 2: Verify the test fails**

Run `npx vitest run tests/seo-output.test.ts`.

Expected: FAIL because `dist/rss.xml` and the structured data do not exist.

- [ ] **Step 3: Add RSS and robots outputs**

Create `src/pages/rss.xml.ts`:

```ts
import rss from '@astrojs/rss';
import { getPublishedEntries } from '@/domain/content';
import { SITE } from '@/config/site';

export async function GET(context: { site?: URL }) {
  const notes = await getPublishedEntries('notes');
  return rss({
    title: 'zhou 技术文章',
    description: SITE.description,
    site: context.site ?? new URL(SITE.url),
    items: notes.map((note) => ({
      title: note.data.title,
      description: note.data.summary,
      pubDate: note.data.publishedAt,
      link: `/notes/${note.id}/`,
    })),
  });
}
```

Create `public/robots.txt`:

```text
User-agent: *
Allow: /

Sitemap: https://zhouhaot.github.io/sitemap-index.xml
```

Use the image-generation workflow with this exact prompt and save the result as a 1200×630 PNG at `public/og-default.png`:

```text
Create a temporary Open Graph card for a technical portfolio. Solid near-black background, centered lowercase word “zhou” in plain white geometric sans-serif lettering, no logo symbol, no gradients, no illustration, no portrait, no texture, no extra text. Exact aspect ratio 1200:630. This is a neutral placeholder that will be replaced by the approved OpenDesign visual system.
```

Verify with an image metadata tool that the final file is exactly 1200×630 pixels.

- [ ] **Step 4: Add deterministic JSON-LD**

Add to the frontmatter of `BaseLayout.astro`:

```ts
const structuredData =
  canonicalPath === '/about/'
    ? {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        mainEntity: { '@type': 'Person', name: 'zhou', url: canonical.href },
      }
    : {
        '@context': 'https://schema.org',
        '@type': type === 'article' ? 'Article' : 'WebPage',
        name: title,
        description,
        url: canonical.href,
      };
```

Add inside `<head>`:

```astro
<script type="application/ld+json" set:html={JSON.stringify(structuredData)} />
```

- [ ] **Step 5: Verify generated outputs**

Run:

```powershell
npx vitest run tests/seo-output.test.ts
npm run check
```

Expected: 2 tests pass and Astro check exits 0.

- [ ] **Step 6: Commit**

```powershell
git add src/pages/rss.xml.ts src/layouts/BaseLayout.astro public tests/seo-output.test.ts
git commit -m "feat: generate portfolio SEO outputs"
```

### Task 7: Add Browser and Accessibility Gates

**Files:**

- Create: `playwright.config.ts`
- Create: `e2e/foundation.spec.ts`

**Interfaces:**

- Produces: built-site E2E suite and axe WCAG gate.
- Consumes: all routes from Tasks 4–6.

- [ ] **Step 1: Configure Playwright against Astro preview**

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://127.0.0.1:4321', trace: 'on-first-retry' },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1',
    port: 4321,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
});
```

- [ ] **Step 2: Write route, conversion, keyboard, and axe checks**

Create `e2e/foundation.spec.ts`:

```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const path of ['/', '/work/', '/lab/', '/notes/', '/about/']) {
  test(`${path} has one heading, canonical metadata, and no serious axe violations`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^https:\/\//);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual(
      [],
    );
  });
}

test('GitHub is the primary working conversion', async ({ page }) => {
  await page.goto('/');
  const github = page.getByRole('link', { name: '访问 GitHub' });
  await expect(github).toHaveAttribute('href', 'https://github.com/zhouhaot');
});

test('skip link moves focus to main content', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: '跳到主要内容' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
});
```

- [ ] **Step 3: Install the browser and run the red/green suite**

Run:

```powershell
npx playwright install chromium
npm run build
npm run test:e2e
```

Expected: all tests pass in desktop and mobile Chromium. If axe reports a violation, fix the semantic source and rerun; do not suppress the rule.

- [ ] **Step 4: Commit**

```powershell
git add playwright.config.ts e2e
git commit -m "test: add portfolio browser quality gates"
```

### Task 8: Replace CI with the New Quality Gate

**Files:**

- Modify: `.github/workflows/ci.yml`
- Create: `.nvmrc`

**Interfaces:**

- Produces: pull-request and main-branch gate for format, lint, types, unit tests, build, and E2E.
- Consumes: package scripts and tests from Tasks 1–7.

- [ ] **Step 1: Pin the supported Node major**

Create `.nvmrc`:

```text
24
```

- [ ] **Step 2: Replace the CI workflow**

Set `.github/workflows/ci.yml` to:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read

jobs:
  quality:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm run format:check
      - run: npm run lint
      - run: npm run check
      - run: npm test
      - run: npm run build
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
```

- [ ] **Step 3: Run the exact local gate**

Run:

```powershell
npm ci
npm run format:check
npm run lint
npm run check
npm test
npm run build
npm run test:e2e
```

Expected: every command exits 0. Existing legacy lint warnings may remain warnings, but no new warning may originate under `src/`, `tests/`, or `e2e/`.

- [ ] **Step 4: Review the complete foundation diff**

Run:

```powershell
git status --short
git diff --check
git diff --stat HEAD~7..HEAD
```

Expected: only the files listed in this plan changed; legacy runtime files and user content remain untouched.

- [ ] **Step 5: Commit**

```powershell
git add .github/workflows/ci.yml .nvmrc
git commit -m "ci: gate the Astro portfolio build"
```

## Completion Gate

The foundation plan is complete only when all of the following are evidenced by fresh command output:

- `npm run format:check` exits 0.
- `npm run lint` exits 0.
- `npm run check` exits 0 with zero errors.
- `npm test` exits 0.
- `npm run build` exits 0 and produces the defined routes, RSS, sitemap, and robots output.
- `npm run test:e2e` passes desktop and mobile Chromium.
- `git diff --check` reports no whitespace errors.
- No real personal information or fabricated case study was added.
- Legacy production files remain present until the launch-migration plan.

After this gate, create the OpenDesign UI implementation plan from the delivered prototype. Do not improvise a final visual system inside this foundation plan.
