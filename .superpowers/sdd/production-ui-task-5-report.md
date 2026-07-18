# Production UI Task 5 Report

## Delivered

- Added the typed public project adapter for published `work` and `lab` content.
- Added static `/projects/` and `/projects/[id]/` routes, card/filter/detail components, and responsive project styles.
- Kept production collections empty; the list emits a truthful empty state and no fabricated detail routes.
- Added native progressive filter enhancement with combined type/status/year filtering, keyboard type navigation, live result messaging, reset, and remount-safe cleanup.
- Preserved explicit experiment labels, optional work detail omission, safe section IDs, and confirmed repository/demo links only when supplied.

## TDD evidence

1. Added focused domain/filter tests before implementation. The first run failed because `src/domain/projects` and `src/scripts/project-filters` did not exist.
2. Implemented the smallest adapter and filter module; focused suite passed (9 tests).
3. Added built-output coverage and then incorporated the follow-up RED cases for filter DOM ownership, remount cleanup, safe section IDs, and optional project links. Those four assertions failed before the corrections and passed after them.

## Verification

- Focused domain/filter/structure suites: 12 passing tests.
- Isolated real project output suite: 2 passing tests. It builds into `dist-projects-test` so it cannot overwrite the shared `dist` used by other output suites, and its `afterAll` always removes that temporary directory.
- `npm run check`: passed with 0 errors, warnings, and hints.
- `npx eslint src/ tests/`: passed.
- `npm run build`: passed; it emitted `/projects/index.html` and no project detail output for the empty collections.
- `git diff --check`: passed.
- Final `npm test`: passed, 12 files and 83 tests.
- `npm run lint` remains blocked by the existing script's missing `e2e/` path, while the scoped lint command passes.

## Output-test compatibility correction

Adding a second page changed Astro's CSS placement for the homepage: page CSS is now emitted in an inline `<style>` block while the shared shell remains in the linked stylesheet. The first full suite run therefore had three concrete failures in `tests/homepage-output.test.ts`:

1. `does not ship prohibited legacy, placeholder, private-contact, or unverified-result content` expected the full generated document not to match the public-content scan. The received document included the legitimate CSS token `100%`, which matched the broad `\d+%` expression.
2. `ships a token-based bento layout that stacks before 1024px without remote assets or framework runtime` expected `builtCss` to contain `.home-grid`; the received linked stylesheet only contained shared shell CSS because `.home-grid` was inline.
3. `uses complete Direction C grid rows and a high-contrast semantic primary CTA` expected the primary CTA selector in `builtCss`; it was likewise in the inline page CSS.

For comparison, an isolated `855c9be` worktree ran the same homepage suite with 6/6 passing. The correction now reads both linked and inline CSS, retains the raw generated source for framework-marker scanning, and clones the DOM before removing only `style` and `script` elements for the public-content scan. That scan still covers rendered head/body markup and attributes, including metadata, URLs, and `data-*` values. The corrected current homepage suite passes 6/6, and the final full suite passes 83/83.

## Follow-up route hardening

Independent review found that duplicate project IDs were compared without the route builder's whitespace behavior or Unicode normalization. New RED tests failed for `alpha` versus ` alpha ` and composed versus decomposed `café`. The route builder and duplicate key now both normalize NFC and trim; duplicate detection then case-folds the canonical segment, after validating the route segment first.

The output contracts were also hardened: raw generated source is scanned for legacy, placeholder, and private-contact markers; the percentage-metric scan applies only after style/script markup is removed. The empty-project build now recursively verifies that the `projects` output directory contains only `index.html`, not merely the absence of one guessed detail route. Focused hardening verification passed 18/18 and cleaned `dist-projects-test` through `afterAll`.

## Second-review canonical boundary

The domain now rejects a source ID unless it is already trimmed and NFC-normalized. This prevents a single ` alpha ` entry from producing a static params value that differs from its canonical href. The detail page delegates static path creation to `projectStaticPaths`, which the domain tests verify against the public project ID and href.

Raw-source prohibited-marker coverage now includes `简历` and `客户`, including explicit script/style fixtures. The raw scan remains independent from the metric scan, so CSS `100%` is ignored only after style/script nodes are removed. RED evidence covered both the previously accepted non-canonical ID and the missing raw Chinese marker; focused GREEN verification passed 19/19 with no temporary output directory remaining.
