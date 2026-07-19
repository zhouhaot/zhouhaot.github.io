# zhou Content Admin V1 Design

**Date:** 2026-07-19  
**Status:** Architecture approved; written specification awaiting final review  
**Product:** zhou — AI 应用开发者个人作品集

## Goal

Build a secure content-management workflow that lets the owner edit public profile copy, create and maintain projects, experiments, articles, and portfolio media, preview drafts, and publish verified content without editing source files by hand.

Content Admin V1 is a content system, not a free-form page builder. Page structure remains versioned application code. The admin edits structured public content only.

## Product principles

1. `main` is the only published content source.
2. Public claims must be real, reviewed, and attributable; the system never invents projects, clients, metrics, or outcomes.
3. No private identity fields are introduced. The public model excludes phone, address, school, legal name, private résumé, employer, and customer records.
4. Admin, preview, and OAuth outages must not affect the already-published static site.
5. Every publish action is reviewable and reversible through Git history and a pull request.
6. Secrets never enter the repository, browser bundle, build artifacts, or logs.
7. Existing Astro schemas and production audits remain the final publication authority.

## Current system

The production site is Astro 7 static output hosted by GitHub Pages. GitHub Actions validates the repository and uploads only `dist/`. The public content system already contains four empty Astro content collections:

- `work`: formal project case studies;
- `lab`: experiments;
- `notes`: articles;
- `portfolio`: visual and media work.

The current schema already enforces draft state, canonical identifiers, HTTPS links, local media paths, alt text, dimensions, video posters, and media licensing. The production audit rejects legacy branding, placeholders, unsupported claims, unsafe links, remote media, missing files, and incomplete licensing.

The root `admin/` directory is legacy VOID.DEV code. It uses browser storage and client-side password checks, is not a secure backend, does not match the Astro content model, and is excluded from `dist`. It must not be reused.

## Architectural decision

### Selected: Git-based CMS

V1 uses:

- the existing Astro `7.1.1` static site and Content Collections as the publication source;
- pinned, locally bundled `decap-cms-app@3.14.1`;
- Decap's GitHub backend and Editorial Workflow;
- a dedicated Cloudflare Worker as the GitHub OAuth broker;
- GitHub `cms/*` branches and pull requests for drafts;
- required GitHub checks as the publication gate;
- Cloudflare Pages branch previews protected by Cloudflare Access;
- the existing GitHub Pages workflow for production, still publishing only `dist/`.

This preserves the current static production boundary, requires no database migration, reuses the existing schema and audits, and obtains history and rollback from Git.

### Rejected for V1: managed database/API/storage

A managed database is appropriate for future private customer leads, CRM state, or high-volume media. It is not the V1 content source because it would require a second schema, draft revisions, publication snapshots, webhooks, object/content consistency, database backups, and a new build integration.

Future private data must be implemented as a separate service. It must never be written to the public Git content repository.

### Rejected for V1: full-stack Astro/self-hosted backend

Server output would require a new host and would make authentication, sessions, CSRF protection, uploads, persistence, monitoring, and backups part of the site's runtime. That complexity is not justified for one-owner, public, file-based content.

## System architecture

```text
Browser /admin/
    │
    ├── GitHub OAuth ──> Cloudflare Worker OAuth broker
    │                         └── client secret stored as Worker Secret
    │
    └── Decap CMS ──> GitHub API ──> cms/* branch + pull request
                                           │
                              ┌────────────┴────────────┐
                              │                         │
                       GitHub required checks     Protected branch preview
                       schema/audit/build/E2E     Cloudflare Pages + Access
                              │
                         manual merge to main
                              │
                     existing GitHub Pages deploy
                              │
                           dist only
```

## Component boundaries

### Admin shell

- Astro serves `/admin/` as a static, responsive page.
- The CMS package is pinned in `package.json` and bundled locally; no floating CDN script is allowed.
- The page has `noindex`, is excluded from the sitemap, and contains no secret or default credential.
- Admin configuration is a versioned repository file and may be public. Authorization never depends on hiding configuration.
- The legacy root `admin/` scripts and styles are not imported or copied.

### CMS schema adapter

- Folder collections map directly to `work`, `lab`, `notes`, and `portfolio`.
- A file collection maps to the site-profile singleton.
- Decap field names, required flags, defaults, enums, directories, and extensions are contract-tested against the Astro Zod schemas.
- New CMS-authored prose files use `.md`. Existing hand-authored `.mdx` files remain code-maintained and are not rewritten by the CMS.

### OAuth broker

- The Worker implements only the OAuth broker endpoints required by the CMS.
- The GitHub client secret exists only as an encrypted Worker Secret.
- The flow validates an unpredictable `state` and uses PKCE S256.
- Admin origins and callback URLs use exact allowlists.
- `postMessage` uses an exact `targetOrigin`, never `*`.
- OAuth responses use `Cache-Control: no-store`.
- Logs redact authorization codes, tokens, email addresses, user details, and unpublished content.
- Any origin, state, callback, token-exchange, or provider error fails closed. There is no fallback password.

### Git content repository

- `main` is the only published source.
- Admin saves create or update `cms/*` branches and pull requests.
- Content and its media are committed together.
- Direct CMS writes to `main` are forbidden.
- Pull requests cannot merge until all required checks pass.

### Preview plane

- Decap preview templates provide immediate structured preview inside the editor.
- Cloudflare Pages builds `cms/*` branches for a complete application preview.
- Preview access is restricted by Cloudflare Access and remains `noindex`.
- Cloudflare Pages has no production branch deployment; formal production remains GitHub Pages.

### Production plane

- Existing build, production audit, dependency audit, E2E, visual baseline, and `dist`-only deployment gates remain mandatory.
- Admin or preview failure cannot remove or alter the last successful production artifact.

## Content model

### Site profile singleton

Create one versioned singleton at `src/content/site/profile.md`. It contains only public portfolio content:

- `heroEyebrow`
- `heroTitle`
- `role`
- `heroSummary`
- `positioning`
- `capabilities[]`
- `method[]`
- `principles[]`
- `currentStatus`
- `trustBoundary`
- `contacts[]`, where every item contains `label`, `kind`, and `href`

`href` accepts only explicit HTTPS or `mailto:` values. The model has no phone, address, school, legal-name, employer, client, testimonial, or private résumé field.

The home and About pages load this singleton through a server-only domain adapter. UI components receive typed props and never import a CMS SDK.

Canonical deployment values such as the production site origin remain code-owned in `src/config/site.ts`. Editable public contact links move to the singleton, and public CTA components consume those typed contacts instead of maintaining a second editable contact source.

### Common publication metadata

Every `work`, `lab`, `notes`, and `portfolio` entry contains:

- `slug`: canonical safe single identifier;
- `title`;
- `summary`;
- `publishedAt`;
- optional `updatedAt`;
- `draft`, defaulting to `true` for new CMS entries;
- `attestation.authenticityConfirmed`;
- `attestation.rightsConfirmed`;
- `attestation.reviewedAt`;
- `attestation.evidenceUrls[]`, restricted to HTTPS.

The filename-derived entry ID must equal `slug`. A non-draft entry cannot pass publication validation unless both confirmations are true and `reviewedAt` is valid. Evidence URLs are supporting references; the software does not claim that automated checks prove authenticity.

Published slugs are immutable in V1. Renaming is handled as delete-and-create and is rejected when references still target the old entry. Automatic redirects are outside V1.

### Work

Retain the current work fields: problem, role, solution, stack, contributions, status, featured, repository URL, demo URL, architecture, constraints, outcomes, limitations, and next steps.

Replace the loose screenshot-string list with typed media references using the shared media model.

### Lab

Retain hypothesis, workflow, model/tools, result, evaluation, status, repository URL, and demo URL. Optional media uses the shared media model. A lab cannot publish without both a result and evaluation.

### Notes

Retain tags and Markdown body. Notes may declare shared media. Markdown validation rejects remote images, raw HTML media, data URLs, protocol-relative URLs, empty alt text, and references that are not declared by the entry.

### Portfolio

Retain order, status, related project, and media items. An image requires source, alt, caption, width, height, and license data. A video additionally requires a local poster. License requirements remain:

- `owned`: no attribution URL required;
- `licensed`: credit and HTTPS license URL;
- `cc-by`: credit and HTTPS license URL;
- `public-domain`: HTTPS evidence URL.

### Media namespace

Repository media lives under:

```text
src/assets/content/work/
src/assets/content/lab/
src/assets/content/notes/
src/assets/content/portfolio/
```

Files use canonical names prefixed by their entry slug. Stored content paths are relative to `src/assets/content` and pass the existing traversal-safe local-path validator.

V1 limits:

- images: AVIF, JPEG, PNG, or WebP; maximum 5 MiB per file;
- video: MP4 or WebM; maximum 25 MiB per file;
- maximum media increase per content pull request: 50 MiB;
- SVG, executable formats, double extensions, extension/MIME mismatches, and remote media are rejected;
- image/video dimensions are extracted on upload and revalidated during CI;
- name collisions create a new safe name and never overwrite an existing asset;
- referenced media cannot be deleted; orphan media is reported and never silently removed.

Git LFS and a large video library are outside V1.

## Roles and permissions

| Role | Permission |
|---|---|
| Anonymous visitor | Read production; may load the public admin shell but cannot access repository content through the CMS |
| CMS editor | OAuth login; create and update `cms/*` branches and pull requests in this repository |
| Publisher | Manually merge a pull request after all required checks pass |
| GitHub Actions | Read repository content; retain the existing minimal Pages deployment permissions |
| OAuth Worker | Hold only the OAuth client secret and perform the short-lived code exchange |
| Preview viewer | View unpublished branch previews only after Cloudflare Access authentication |

Use a dedicated CMS editor GitHub account with 2FA and write access only to this repository. It receives no admin or branch-protection bypass permission. Open Authoring and anonymous registration are disabled.

The GitHub OAuth scope required by the GitHub backend is broader than a single repository for public repositories. The dedicated account limits the practical token impact to this repository.

## Draft, preview, publish, delete, and rollback

1. The editor authenticates through the OAuth broker.
2. New entries receive a safe slug and `draft=true`.
3. Saving creates a `cms/*` branch and pull request; it never writes `main` directly.
4. The editor uses the CMS preview pane for immediate feedback.
5. Cloudflare Pages provides a full preview after required build checks; Access restricts visibility.
6. Before publication, the editor sets `draft=false`, confirms authenticity and rights, and completes alt, dimensions, license, and evidence fields.
7. Schema, domain, media, production-audit, build, and browser checks must pass.
8. The publisher explicitly merges the pull request.
9. The existing GitHub Pages workflow builds and publishes only `dist`.
10. Deletion also uses a pull request. CI blocks deletion when another content item references the entry or its media.
11. Rollback uses `git revert` through a new pull request and must pass the same gates.

Git commits, pull-request diffs, checks, and deployments are the V1 modification history. A separate audit database and inline field-by-field history viewer are outside V1.

## Error handling

- OAuth state/origin/callback/token errors terminate the flow and provide a retryable, non-sensitive message.
- GitHub 401 or 403 clears the CMS session and requires reauthorization.
- A network interruption never shows “saved” until GitHub confirms the commit.
- A branch conflict requires refresh or pull-request conflict resolution; force-push recovery is not automated.
- Schema failures appear beside fields where possible and are independently enforced again in CI.
- Content cannot reference media until its repository commit succeeds.
- Preview failure blocks publication but does not affect production.
- Production deployment failure preserves the previous static deployment and is recovered through a new fix or revert.
- Rate-limit responses show a retry time without discarding the current editor state.

## Security requirements

- No client-side password, default credential, or browser-storage authentication flag.
- No OAuth secret in Git, build artifacts, client environment variables, or logs.
- Pinned locally bundled CMS package; no floating third-party CDN code.
- Strict admin CSP limited to self-hosted assets, the GitHub API, the OAuth broker, and required preview origins.
- Admin and preview are `noindex`; the admin route is excluded from the sitemap.
- Preview renderers do not pass unpublished text through untrusted `innerHTML`.
- Markdown cannot embed arbitrary scripts, iframes, or raw media.
- Upload validation checks path, filename, extension, MIME/magic bytes, size, dimensions, and license metadata.
- Required checks apply to repository administrators; force push and branch deletion are disabled on `main`.
- OAuth tokens can be revoked and the dedicated editor account can be removed without affecting production.
- Logs redact tokens, authorization codes, private identifiers, and unpublished content.

## Backup and recovery

- GitHub retains the primary content, media, branches, pull requests, and history.
- A monthly `git bundle --all` or bare mirror is stored on a second user-controlled device.
- Schema migrations and major content changes require a tag and fresh bundle before merge.
- GitHub recovery codes and OAuth secrets are stored in a password manager or offline recovery medium, never the repository.
- A quarterly recovery drill restores a new repository from the bundle, recreates OAuth configuration, runs a clean build and production audit, and verifies content/media relationships.

## Testing strategy

### Domain and schema tests

- Positive and negative cases for site, work, lab, notes, and portfolio schemas.
- Default draft behavior and non-draft attestation requirements.
- Canonical slug, unique ID, and filename/slug equality.
- URL protocol allowlists and prohibited privacy fields.
- Media types, limits, dimensions, poster, license, credit, and evidence requirements.
- Reference-safe deletion and orphan reporting.
- Markdown media AST validation.

### CMS contract tests

- Parse the CMS configuration.
- Assert every required Astro field is required by the CMS.
- Assert enums, defaults, names, directories, and extensions match.
- Parse CMS-serialized fixtures with the Astro Zod schemas.
- Reject schema drift, slug mutation, unsafe paths, and undeclared media.

### OAuth Worker tests

- Valid login and callback.
- Missing, mismatched, reused, and expired state.
- PKCE verifier/challenge handling.
- Disallowed origin and callback.
- Provider rejection, malformed response, 401/403, rate limiting, and network failure.
- No secrets or tokens in response bodies, cache, or logs.

### Admin browser tests

Using mocked GitHub/OAuth APIs:

- unauthenticated users cannot edit;
- site singleton editing;
- CRUD for all four folder collections;
- draft saves create a branch/PR and never target `main`;
- upload and structured media metadata;
- missing alt/license/attestation blocks publication;
- conflicts, permission failures, rate limits, and network interruptions;
- keyboard operation and no serious/critical Axe findings;
- responsive layouts at 390, 820, and 1440 pixels.

### Provider smoke test

Before production enablement, a staging OAuth application and fixture branch verify login, draft PR, protected preview, required checks, merge, GitHub Pages deployment, and revert. Fixture content remains clearly identified and never enters the production content collections.

### Existing release gates

Format, lint, Astro check, unit tests, build, production audit, full dependency audit, functional E2E, Windows visual baselines, and `dist`-only delivery checks remain mandatory. Add secret scanning, admin CSP/noindex tests, OAuth tests, schema/CMS contract tests, and preview noindex/access checks.

## Deployment

### GitHub Pages

The existing production workflow remains authoritative. `/admin/` is built into `dist/admin/`, contains only the new shell and configuration, and remains excluded from the sitemap. Legacy `admin/`, old JSON data, and VOID.DEV scripts are never copied.

### OAuth Worker

Deployment requires environment-specific inputs supplied at deployment time:

- GitHub OAuth client ID;
- GitHub OAuth client secret stored as a Worker Secret;
- exact production and local admin origins;
- exact callback URL.

Absence or mismatch fails deployment or login closed. Creating the OAuth application, Worker, DNS route, or secret is an external-state change and requires explicit user authorization at that step.

### Protected branch previews

Cloudflare Pages connects to the same repository, builds only allowed CMS preview branches, outputs `dist`, and does not own the production branch. Cloudflare Access restricts preview viewers. External Pages/Access configuration requires explicit user authorization at deployment time.

## Migration

1. Add and validate the new site singleton using only already-approved public copy.
2. Add common attestation and structured media rules while collections are empty.
3. Add the CMS schema adapter and admin shell.
4. Add OAuth and preview infrastructure with mocked/local verification first.
5. Enable staging OAuth and preview only after local gates pass.
6. Enable production CMS after one complete staging publish/revert exercise.
7. Treat legacy root `admin/`, `data/`, README, and PROJECT_CONTEXT cleanup as a separate destructive migration. Do not delete them without explicit approval and a verified backup.

No legacy VOID.DEV, Zero, sample post, sample project, metric, customer, or identity data is migrated.

## Phases

Each phase is a separate implementation plan, commit range, and independent review gate. A later phase may rely only on documented interfaces from an approved earlier phase. This specification defines the complete V1 architecture; implementation begins with Phase 0 rather than treating all four phases as one oversized task.

### Phase 0: publication model hardening

Deliver the site singleton, attestation, structured shared media, Markdown validation, deletion/reference rules, and schema contract tests. Manual file editing already follows all V1 publication rules after this phase.

### Phase 1: secure admin

Deliver the pinned CMS bundle, admin shell/configuration, OAuth Worker, dedicated-account runbook, mocked admin/OAuth tests, and draft pull-request workflow.

### Phase 2: preview and publish

Deliver preview templates, protected branch deployments, required-check wiring, staging provider smoke tests, and the complete draft-to-production flow.

### Phase 3: history, recovery, and legacy migration

Deliver history links, revert and backup runbooks, recovery exercise, documentation updates, and a separately approved legacy cleanup.

## Explicit non-goals

V1 does not implement:

- a drag-and-drop page builder;
- arbitrary HTML, JavaScript, CSS, or SVG upload;
- customer lead forms, CRM, email notifications, or private-data storage;
- anonymous registration, open submissions, or Open Authoring;
- multi-user real-time collaboration or complex RBAC;
- multi-site, multi-tenant, or multilingual administration;
- scheduled publishing;
- Git LFS, large-video hosting, or image-CDN transformations;
- comments, subscriptions, or analytics administration;
- automatic content, project, client, metric, or outcome generation;
- automated proof of truth;
- a separate history/audit database;
- migration of the production site to SSR.

## Acceptance criteria

Content Admin V1 is complete when:

1. A permitted editor can authenticate without any repository or client secret reaching the browser bundle.
2. The editor can update the site singleton and CRUD all four content collections through structured fields.
3. New content defaults to draft and creates a `cms/*` branch and pull request, never a direct `main` write.
4. The editor can upload allowed local media and cannot publish invalid paths, types, sizes, alt, dimensions, poster, license, credit, evidence, or attestation.
5. CMS configuration and Astro schemas have an automated drift contract.
6. A protected full-site preview exists for every publishable draft.
7. Required checks prevent merge on schema, authenticity, rights, media, build, security, accessibility, or delivery failures.
8. Manual merge to `main` publishes only `dist` through the current GitHub Pages workflow.
9. Revert through a pull request restores the previous content and passes the same gates.
10. Admin works at 390, 820, and 1440 pixels with keyboard navigation and no serious/critical Axe violations.
11. Production remains available when the CMS, OAuth Worker, GitHub API, or preview service is unavailable.
12. No legacy admin code, fake content, private identity, secret, test fixture, or unpublished preview enters production.

## Official references

- Astro Content Collections: https://docs.astro.build/en/guides/content-collections/
- Astro static output: https://docs.astro.build/en/reference/configuration-reference/#output
- Decap GitHub backend: https://decapcms.org/docs/github-backend/
- Decap OAuth proxy: https://decapcms.org/docs/backends-overview/#using-github-with-an-oauth-proxy
- Decap Editorial Workflow: https://decapcms.org/docs/editorial-workflows/
- Decap media folders: https://decapcms.org/docs/configuration-options/#media-and-public-folders
- Decap custom previews: https://decapcms.org/docs/customization/
- GitHub OAuth web flow: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
- GitHub OAuth scopes: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps
- GitHub protected branches: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- Cloudflare Pages preview deployments: https://developers.cloudflare.com/pages/configuration/preview-deployments/
- Cloudflare Worker secrets: https://developers.cloudflare.com/workers/configuration/secrets/
