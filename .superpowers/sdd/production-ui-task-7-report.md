# Production UI Task 7 Report

## Scope delivered

- Added anonymous `/portfolio/` and `/about/` routes with Chinese-only public copy, GitHub-first CTAs, canonical paths, current navigation, and responsive shared styles.
- Kept the portfolio collection empty. The empty route emits an `EmptyState` and no cards, media, gallery, dialog, template, or lightbox initializer.
- Tightened portfolio media validation: canonical local paths and extensions, required alt/caption/dimensions, video posters, attribution requirements, and safe canonical related-project IDs.
- Added an injectable asset resolver and typed public portfolio view model. It validates assets/dimensions/public related projects, filters non-public entries, rejects case-insensitive duplicate IDs, preserves media order, and sorts series without mutation.
- Added a conditional future gallery with safe attribution rendering and a native accessible lightbox. It supports cyclic arrows, Escape/cancel/close, dynamic focus trapping (including video), focus restoration, video pausing, owner-document usage, and stale-cleanup-safe WeakMap remount handling.
- Added a single anonymous public-profile source and reused its capabilities, method, and status on the homepage.
- Added `src/assets/portfolio/.gitkeep`; no media or fabricated content was added.

## RED evidence

1. Initial focused suite failed because `src/domain/portfolio`, `src/domain/public-profile`, and `src/scripts/lightbox` did not exist.
2. The isolated output build failed with `ENOENT` for `dist-portfolio-about-test/portfolio/index.html` before the new routes existed.
3. Pre-commit lightbox regressions were added and observed RED: missing attribution, video omitted from Tab order, and stale cleanup produced two dialogs.

## Verification

- Focused portfolio/about/lightbox/public-profile/home suites: 22 tests passed.
- `npm run check`: 0 errors, 0 warnings.
- `npm test`: 21 files, 121 tests passed.
- `npm run build`: passed; generated `/about/` and `/portfolio/`.
- Scoped ESLint for all Task 7 source and tests: passed.
- `git diff --check`: passed.
- Isolated output directories were cleaned: `dist-portfolio-about-test` and `dist-projects-test` absent after tests.

## Formatting note

Task 7 TypeScript, CSS, and tests were formatted with Prettier. This workspace does not install `prettier-plugin-astro`, so direct Prettier invocation for `.astro` files reports that no parser can be inferred; this is recorded separately from the passing scoped ESLint/type/test/build gates and was not used to block the task.

The root `npm run lint` and `npm run format:check` remain pre-existing baseline failures outside Task 7: the lint script includes a missing `e2e/` path, and the format command cannot infer an Astro parser (and reports unrelated existing formatting warnings). Scoped Task 7 ESLint passed.

## Follow-up hardening

- Added fail-fast path-contract coverage for protocol-shaped values, Windows drive prefixes, and uppercase media extensions. The schema now rejects every colon and preserves case-sensitive extension validation while accepting canonical nested hyphenated paths.
- Added a licensed-to-owned lightbox regression. On media changes without attribution, both attribution links are hidden and their `href` attributes are removed, so they are not retained as stale focusable destinations.
- RED was observed for both regressions; the focused suite then passed 9 tests. Final `npm run check`, full test suite (121 tests), production build, scoped ESLint, diff check, and temporary-output cleanup all passed.
