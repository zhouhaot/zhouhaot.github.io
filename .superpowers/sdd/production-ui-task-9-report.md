# Production UI Task 9 report

## Scope delivered

- Centralized same-origin canonical validation, safe JSON-LD serialization, page-type schema mapping, and article-only RSS item mapping in `src/domain/seo.ts`.
- Added complete metadata without an OG image dependency: canonical, Open Graph, Twitter summary, RSS alternate, theme/color scheme, and JSON-LD.
- Added static RSS, robots, sitemap filtering, and a noindex GitHub Pages 404 boundary.
- Added a `dist`-only production scanner and an `audit:production` script. It verifies markers, visible unsupported metrics, references/protocols/fragments, local media metadata, portfolio attribution, and fixture leakage without network probes.
- Set Node 24 and full CI/deploy gates; deployment uploads only `dist`. Added a Windows Chromium visual job and generic E2E exclusion for that platform-specific suite.

## RED → GREEN evidence

1. `npm test -- tests/seo-production.test.ts tests/production-audit.test.ts`
   - RED: both imports failed because `src/domain/seo.ts` and `scripts/production-audit.mjs` did not exist.
   - GREEN: 10 tests passed after the minimal implementations.
2. `npm test -- tests/delivery-boundary.test.ts`
   - RED: missing `og:locale`, `rss.xml`, `robots.txt`, `404.html`, and `.nvmrc`/workflow contracts.
   - GREEN: 5 tests passed after static delivery implementation.
3. `npm run test:e2e -- e2e/specs/not-found.spec.ts`
   - RED: the new unknown-route test could not find the required primary 404 CTA marker.
   - GREEN: 1 test passed after adding the two labelled 404 CTA targets.
4. `npm test -- tests/production-audit.test.ts`
   - RED: CLI audit invocation produced no success output; the script-entry comparison was not portable on Windows.
   - GREEN: 7 tests passed after making the executable-entry test portable.

## Final verification

- `npm ci`: completed successfully.
- `npm run format:check`: passed.
- `npm run lint`: passed.
- `npm run check`: passed with 0 errors, 0 warnings, and 0 hints.
- `npm test`: 24 files, 137 tests passed.
- `npm run build`: passed; emits `/404.html`, `/rss.xml`, `robots.txt`, and `sitemap-index.xml` with only real current routes.
- `npm run audit:production`: passed against `dist`.
- `npm audit --omit=dev --audit-level=high --registry=https://registry.npmjs.org`: `found 0 vulnerabilities`.
- `npm run test:e2e -- --grep-invert "approved Windows Chromium visual baselines"`: 88 passed.
- `npm run test:e2e -- e2e/specs/visual.spec.ts`: 8 approved Windows Chromium baselines passed.

## Environment note

The local default npm registry is `https://registry.npmmirror.com`; its audit endpoint returns `404 NOT_IMPLEMENTED`. The project configuration was not changed. The same audit command passed against the official npm registry above, and CI uses the normal GitHub setup-node environment.

## Review remediation: RED → GREEN evidence

1. Encoded canonical traversal
   - RED: `npm test -- tests/seo-domain.test.ts` failed because `/%2e%2e/private/` and `/articles/%2E%2E/notes/` did not throw.
   - GREEN: the same command passed, 1/1. Canonical segments are percent-decoded before traversal validation.
2. Public-output scanner coverage
   - RED: `npm test -- tests/production-audit.test.ts` failed 9/21, including JSON-LD `VOID.DEV`, remote `og:image` content, remote `srcset`, directory links, cross-page fragments, `3x`/`3×`/read-time, and missing portfolio output attributes.
   - RED: after CSS/XML cases were added, the same command failed 1/23 because `url(https://cdn.example/hero.png)` was ignored.
   - GREEN: `npm test -- tests/production-audit.test.ts` passed 23/23. The scanner now inspects public HTML, CSS, JSON, and XML; validates metadata, JSON-LD, srcset, CSS URLs, XML media, directory `index.html` resolution, and target-document fragments.
   - RED: an additional JSON-LD/XML media fixture failed 1/24 because `<image><url>https://…</url></image>` was not an attribute form.
   - GREEN: the same command passed 24/24 after nested XML image URLs were scanned.
3. Portfolio output attribution
   - Covered in the audit RED batch above: real image/video DOM elements now emit `data-portfolio-media`, license, credit, license URL, and evidence URL attributes. Fixtures prove unknown license and missing credit/license URL/evidence fail.
4. Workflow least privilege
   - RED: `npm test -- tests/delivery-boundary.test.ts` failed 1/6 because deploy was a single globally privileged job.
   - GREEN: the same command passed 6/6. `verify` has only `contents: read`, runs all quality/build gates, and uploads `dist`; `deploy` needs `verify`, has only pages/id-token permissions, downloads that artifact, and uploads only `dist` to Pages.
5. Script tooling coverage
   - RED: `npm test -- tests/tooling-contracts.test.ts` failed because format/lint omitted `scripts/**/*.{js,mjs}`.
   - GREEN: `npm test -- tests/tooling-contracts.test.ts` passed 1/1; `npm run format`, `npm run format:check`, and `npm run lint` all passed with the production audit script included.

## Remediation final verification

- Focused: `npm run check`, the four affected test suites (31 tests), `npm run build`, and `npm run audit:production` all passed.
- Full: format/lint/check (0 errors, 0 warnings, 0 hints), 26 test files/157 tests, build, production audit, official-registry audit (0 vulnerabilities), generic E2E (88 passed), and Windows visual baselines (8 passed) all passed.
