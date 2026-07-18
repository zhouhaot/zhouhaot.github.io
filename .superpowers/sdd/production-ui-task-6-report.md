# Production UI Task 6 Report

## Scope

Implemented static article discovery and reading for the `notes` collection. The empty production collection renders only `/articles/index.html` with the shared navigation and a truthful empty state; no note fixtures or user content were added.

## TDD evidence

- Initial RED: `npx vitest run tests/articles-domain.test.ts tests/article-discovery.test.ts tests/article-reader.test.ts tests/articles-structure.test.ts tests/articles-output.test.ts` failed because the article domain, scripts, routes, components, and output did not yet exist.
- Initial GREEN: the same focused suite passed with 17 tests.
- Review-fix RED: added regressions for multi-word tag keys, non-TOC unsafe/duplicate headings, content-only progress geometry, semantic discovery lists, and Chinese copy status. The focused behavior suite failed on the pre-fix implementation.
- Review-fix GREEN: focused suite passed with 18 tests.

## Delivered behavior

- Build-time article view model filters drafts according to the current environment, canonicalizes IDs, produces route-builder hrefs, normalizes public-only search text, and constructs deterministic tags, neighbours, and TOCs.
- Discovery filters existing server-rendered list items with strict query/tag AND semantics; it supports resilient view persistence, keyboard tag focus, recoverable zero state, and cleanup/remount.
- Reading uses Astro `render(entry)` headings as the sole TOC slug source, native progress based on `.article-content`, responsive desktop/mobile TOCs, pagers, and removable native code-copy enhancement.
- CSS keeps the reading measure, responsive TOC breakpoints, semantic tables, and local code/table overflow constraints.

## Verification matrix

| Command | Result |
| --- | --- |
| Focused articles tests | 5 files, 18 tests passed |
| `npm run check` | 0 errors, 0 warnings |
| `npm test` | 17 files, 105 tests passed |
| `npm run build` | passed; static output includes only `dist/articles/index.html` for articles |
| `npx eslint src/ tests/` | passed |
| `git diff --check` | passed |

The isolated output-test directory is removed by `afterAll`; no `dist-articles-test` or inspection output directory remains.

## Deferred

- The existing root `npm run lint` / `npm run format:check` scripts reference the absent `e2e/` directory and Astro Prettier parser configuration. This pre-existing repository debt is not changed in this scoped task; scoped ESLint was run successfully.
- Astro emits existing empty-collection warnings during check/build. The empty `notes` collection is intentional for this production state.
