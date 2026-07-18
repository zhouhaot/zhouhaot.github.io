# Production UI Task 1 Report

## Changed files

- `src/domain/routes.ts` — typed public route constants and safe single-segment project/article detail-route builders.
- `src/config/site.ts` — public navigation restricted to the five approved routes; GitHub remains `githubUrl`.
- `src/domain/content-schema.ts` — ordered portfolio-series schema, complete media metadata, explicit license states, and safe local-media paths.
- `src/content.config.ts` — registered the empty `portfolio` content collection.
- `src/content/portfolio/.gitkeep` — retained the empty portfolio collection without example content.
- `tests/production-ui-contracts.test.ts` — navigation, route-builder, privacy, collection, media-completeness, and unsafe-source contract coverage.

## TDD evidence

- RED: `npm test -- tests/production-ui-contracts.test.ts` failed 7/7 before implementation because the routes module, portfolio schema/collection, and approved navigation contract were absent.
- Follow-up RED: the focused suite failed 1/8 after adding explicit rejection cases for blank IDs, dot segments, and path separators.
- GREEN: the same focused command passed 8/8 after the minimal contract implementation.

## Verification

- `npx prettier --check src/domain/routes.ts src/config/site.ts src/domain/content-schema.ts src/content.config.ts tests/production-ui-contracts.test.ts` — passed.
- `npm run check` — passed with 0 errors, 0 warnings, and 0 hints.
- `npm test` — passed: 4 files, 36 tests.
- `git diff --check` — passed.

## Commit

`feat: define production ui contracts`

## Concerns

- Astro reports expected glob-loader notices because all content collections are intentionally empty; diagnostics remain clean.
- The repository-wide `npm run format:check` is currently blocked by pre-existing Prettier setup issues (no Astro parser and no `e2e/**/*.ts` matches), plus unrelated pre-existing formatting findings. Task 1 files pass a targeted Prettier check.
