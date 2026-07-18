# zhou OpenDesign Production UI Implementation Plan

> **Execution:** Use `superpowers:subagent-driven-development` task by task. Terra implements each task; an independent reviewer checks the task diff before the next task starts.

**Goal:** Convert the approved OpenDesign prototype into a truthful, anonymous, production-grade Astro portfolio for `zhou`.

**Specification:** `docs/superpowers/specs/2026-07-18-zhou-opendesign-production-ui.md`

**Baseline:** `9bcb70f`

**Architecture:** Astro static generation, strict TypeScript, Git-backed Content Collections, semantic CSS tokens, and small native TypeScript modules for interaction. No React/Vue runtime, database, CMS, accounts, or fabricated content in phase one.

## Task 1: Lock Production Routes and Content Contracts

**Primary files:**

- Create `src/domain/routes.ts`
- Modify `src/config/site.ts`
- Modify `src/domain/content-schema.ts`
- Modify `src/content.config.ts`
- Create `src/content/portfolio/.gitkeep`
- Modify/add contract tests under `tests/`

**RED:** Add tests that require the public navigation to use `/`, `/projects/`, `/articles/`, `/portfolio/`, `/about/`; require `portfolio` series media metadata and reject unsafe URLs or identity fields; reject `LAB.LOG`, `VOID.DEV`, placeholder markers, and private profile fields from public configuration.

**GREEN:** Define typed route constants, update `SITE.navigation`, add a `portfolioSchema` with ordered series and licensed media metadata, register the collection, and keep all content directories empty. Run focused tests, `npm run check`, and the full unit suite.

**Commit:** `feat: define production ui contracts`

## Task 2: Build the Semantic Theme Foundation

**Primary files:**

- Create `src/styles/tokens.css`
- Create `src/styles/base.css`
- Create `src/styles/components.css`
- Modify `src/layouts/BaseLayout.astro`
- Modify `src/components/SiteHeader.astro`
- Create theme behavior tests

**RED:** Tests require Light/Dark/Cyber semantic tokens, the 1240px shell and 720px reading measure, a pre-paint theme initializer, saved preference precedence, system-dark fallback, and Cyber only by explicit choice.

**GREEN:** Port the OpenDesign token system into layered production CSS with accessible focus/reduced-motion defaults. Add a CSP-compatible inline initializer or equivalent deterministic pre-paint script. Do not copy page-level prototype styles.

**Commit:** `feat: build semantic theme foundation`

## Task 3: Add Accessible Responsive Navigation

**Primary files:**

- Refactor `src/components/SiteHeader.astro`
- Create `src/components/MobileDrawer.astro`
- Create `src/components/MobileNavigation.astro`
- Create `src/components/ThemeSwitcher.astro`
- Create `src/scripts/navigation.ts`
- Add navigation unit/browser tests

**RED:** Tests fail for mobile drawer open/close, overlay, Escape, focus return, `aria-hidden`, `inert`, active route state, and five mobile navigation items.

**GREEN:** Desktop navigation is visible at 768px and above; mobile drawer and bottom navigation operate below it. All controls are keyboard reachable, focus is restored, and 360px has no horizontal overflow.

**Commit:** `feat: add accessible responsive navigation`

## Task 4: Implement the Production Homepage

**Primary files:**

- Modify `src/pages/index.astro`
- Create components under `src/components/home/`
- Add homepage contract tests

**RED:** Tests require the approved AI application positioning, GitHub primary CTA, projects secondary CTA, truthful module order, and empty-content behavior without fake cards.

**GREEN:** Implement Hero, featured projects, AI capability map, experiments, delivery method, latest articles, current status, and contact sections using collection data. Hide optional sections or render concise truthful empty states when data is absent.

**Commit:** `feat: implement production homepage`

## Task 5: Ship Project Routes and Filters

**Primary files:**

- Create `src/pages/projects/index.astro`
- Create `src/pages/projects/[id].astro`
- Create components under `src/components/projects/`
- Extend `src/domain/content.ts` with a tested public project view model
- Create `src/scripts/project-filters.ts`

**RED:** Tests require deterministic merging of `work` and `lab`, duplicate ID rejection, type/status/year filters, arrow-key filter navigation, explicit experiment labels, and omission of missing optional detail sections.

**GREEN:** Render static project cards from collections and use a small native script only to filter existing DOM. Formal projects use the approved case-study narrative; lab entries remain visibly experiments.

**Commit:** `feat: ship project routes and filters`

## Task 6: Deliver Article Discovery and Reading

**Primary files:**

- Create `src/pages/articles/index.astro`
- Create `src/pages/articles/[id].astro`
- Create components under `src/components/articles/`
- Create `src/scripts/articles.ts`
- Add article behavior tests

**RED:** Tests cover search, tag filtering, list/grid preference, recoverable no-results state, unique heading anchors, desktop/mobile TOC, reading progress, code copy, `aria-live`, tables, and previous/next navigation.

**GREEN:** Render articles from `notes`; keep reading surfaces quiet and accessible. Use unique generated IDs and native scripts for discovery/reading enhancements.

**Commit:** `feat: deliver article discovery and reading`

## Task 7: Add Portfolio and Anonymous About Pages

**Primary files:**

- Create `src/pages/portfolio/index.astro`
- Create `src/pages/about/index.astro`
- Create components under `src/components/portfolio/` and `src/components/about/`
- Create `src/scripts/lightbox.ts`
- Add privacy/media/lightbox tests

**RED:** Tests require a truthful portfolio empty state, complete media metadata, lazy loading, keyboard lightbox controls/focus trap, and an about page with no identity fields or private contact placeholders.

**GREEN:** Render approved series only. When empty, render no media placeholders. About includes only public positioning, capabilities, method, job/cooperation status, GitHub, and confirmed public contact links.

**Commit:** `feat: add portfolio and anonymous about pages`

## Task 8: Harden Responsive Accessibility Flows

**Primary files:**

- Create/update `playwright.config.ts`
- Create E2E tests under `e2e/`
- Refine styles/scripts found by tests

**RED:** Browser tests demonstrate failures across 360, 390, 430, 600, 820, 1024, 1366, 1440, and 1920 widths, reduced motion, keyboard-only journeys, and Axe serious/critical rules.

**GREEN:** All target widths have no horizontal overflow; the specified breakpoint behavior matches the prototype; keyboard and reduced-motion flows pass; serious/critical Axe violations are zero. Keep a small desktop/mobile visual baseline for the homepage and one detail page.

**Commit:** `test: harden responsive accessibility flows`

## Task 9: Enforce SEO and Release Gates

**Primary files:**

- Create `src/pages/rss.xml.ts`
- Create `public/robots.txt`
- Add sitemap/OG assets and structured data in layout/components
- Create `src/pages/404.astro`
- Modify `.github/workflows/ci.yml`
- Create `.nvmrc`
- Add built-output and release-scan tests

**RED:** Tests require canonical/OG, RSS using `/articles`, sitemap, robots, correct WebPage/Article/CreativeWork/ProfilePage JSON-LD, 404, GitHub CTA, and scans for private data, placeholders, bad links, unauthorized media markers, and unsupported metrics.

**GREEN:** Run `npm ci`, format, lint, Astro check, unit tests, build, Playwright, Axe, and `git diff --check`. All must pass with no fabricated content and no legacy production deletion.

**Commit:** `chore: enforce production release gates`

## Superseded Foundation Work

- New Tasks 1 and 4–7 replace foundation Task 5.
- New Task 9 absorbs foundation Task 6.
- New Tasks 2–3 and 8 expand and replace foundation Task 7.
- Foundation Task 8 CI requirements move into new Task 9.

## Completion Gate

The plan is complete only after every task has an implementation report, an independent approved review, fresh verification output, and a focused commit. The old SPA and admin files remain until a separate launch-migration plan is approved and executed.

