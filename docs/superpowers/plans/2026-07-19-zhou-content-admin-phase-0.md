# zhou Content Admin Phase 0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the manual Git-backed publication model with one typed public site profile, verified publication metadata, one structured media contract, Markdown media validation, reference-safe deletion, orphan reporting, and a CMS-neutral schema contract foundation.

**Architecture:** Astro Content Collections remain the only content source and `main` remains the only production source. Pure TypeScript domain functions own schemas, publication checks, media/reference graphs, and generic contract metadata; thin server-only adapters load Astro entries and assets, while CI invokes the same domain functions through a source-content audit. Phase 0 adds no admin route, Decap package/configuration, OAuth code, preview service, remote write path, or legacy deletion.

**Tech Stack:** Astro 7.1.1 static output, TypeScript 5.9.3 strictest, Astro Zod, Vitest 4.1.10, Node 22.12.0 minimum/Node 24 normal CI, unified/remark AST, gray-matter, file-type, sharp, ffprobe-static, existing Playwright and production audit.

**Specification:** `docs/superpowers/specs/2026-07-19-zhou-content-admin-v1-design.md`

**Baseline:** `5a5eba798f82810e16104086c747387fbd020d00`

## Global Constraints

- Phase 0 contains only publication-model hardening. Do not add `decap-cms-app`, `/admin/`, a Decap configuration file, OAuth, Cloudflare, preview deployment, GitHub write APIs, browser authentication, or secrets.
- `main` is the only published content source. Drafts may be rendered locally, but production adapters and routes expose only non-drafts that pass the same domain checks as CI.
- Preserve the current approved Chinese public copy exactly. Move it; do not rewrite it. The only profile contact is the already-approved GitHub URL and label.
- Do not add a person name, phone, address, school, legal name, private résumé, employer, client, testimonial, customer record, invented project, invented result, metric, or outcome.
- Keep `src/content/work`, `src/content/lab`, `src/content/notes`, and `src/content/portfolio` genuinely empty except for their existing `.gitkeep` files. Test fixtures live under `tests/fixtures/content-contract/` and are visibly QA-only.
- Add the real singleton only at `src/content/site/profile.md`. Canonical deployment origin, navigation, route constants, title, and site description stay code-owned in `src/config/site.ts`; editable contact links do not.
- Do not delete or migrate root `admin/`, `data/`, legacy static files, `.mdx` support, or any existing test. Do not copy legacy VOID.DEV code into production.
- Stored media paths are relative to `src/assets/content`, use forward slashes, and begin with their collection namespace and entry slug: `<collection>/<slug>-<safe-name>.<extension>`.
- Allowed image extensions are AVIF, JPEG, JPG, PNG, and WebP with a 5 MiB per-file ceiling. Allowed video extensions are MP4 and WebM with a 25 MiB per-file ceiling. SVG, executable formats, double extensions, extension/MIME disagreement, remote URLs, and traversal fail the source audit.
- Every image and video has declared positive integer width and height. Every video has a declared local image poster. CI re-probes image and video dimensions rather than trusting frontmatter.
- Media-license rules remain: `owned` needs no attribution URL; `licensed` and `cc-by` require credit plus an HTTPS license URL; `public-domain` requires an HTTPS evidence URL.
- New CMS-compatible content is Markdown (`.md`). Existing `.mdx` remains loadable and code-maintained; Phase 0 validates Markdown and MDX media AST without rewriting either format.
- New entries default to `draft: true`. A non-draft entry must have `authenticityConfirmed: true`, `rightsConfirmed: true`, and a valid `reviewedAt`; evidence URLs, when present, use HTTPS.
- Publication checks support review; they do not claim automated proof of authenticity. History and rollback remain Git commits and pull requests.
- References resolve before publication. Removing an entry or asset while another current item references it fails. Unreferenced assets are reported deterministically and never removed automatically.
- Existing format, lint, Astro check, unit, build, production audit, production-only dependency audit, functional E2E, Windows visual baseline, and `dist`-only deployment gates remain mandatory. Because Phase 0 adds security-critical development dependencies, every CI/deploy verification path also runs a full `npm audit --audit-level=high` without `--omit=dev`.

## Dependency Decisions and Platform Contract

Add only these pinned development dependencies in Task 5/6. They are build-time validation tools and must not enter the browser bundle.

| Package            |      Pin | Why it is required                                                                                                                                        | Rejected substitute                                                                                                                                                                                                        | Compatibility contract                                                                                                                                                            |
| ------------------ | -------: | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tsx`              | `4.23.1` | Runs the shared strict TypeScript audit modules directly, so Astro, Vitest, and the CLI use one implementation.                                           | Node 22.12 type stripping is still an unsuitable baseline for this repository because it does not honor the `@/*` tsconfig alias and constrains TypeScript syntax; a parallel `.mjs` audit would duplicate security rules. | `npm run audit:content` must run on Node 22.12.0 and Node 24 on Linux and Windows; paths are passed as arguments and normalized with `node:path`, never shell-expanded.           |
| `gray-matter`      |  `4.0.3` | Separates YAML frontmatter from Markdown/MDX bodies and supplies source data to the audit/contract fixture parser.                                        | Splitting on `---` misparses valid YAML block scalars and delimiters in bodies; Astro internals are not a stable public parser API.                                                                                        | Parse UTF-8 files identically on Linux and Windows; tests include CRLF and LF fixtures.                                                                                           |
| `unified`          | `11.0.5` | Creates a real Markdown syntax tree pipeline.                                                                                                             | Regular expressions cannot correctly resolve reference images, escaped markup, or code fences.                                                                                                                             | Pure ESM on Node 22.12+; no native binary and no OS-specific behavior.                                                                                                            |
| `remark-parse`     | `11.0.0` | Parses `.md` image, image-reference, definition, and HTML nodes.                                                                                          | Rendering HTML before inspection loses the declaration-to-source relationship and makes raw-media rejection ambiguous.                                                                                                     | Pure ESM on Node 22.12+; run the same fixture corpus on Linux and Windows.                                                                                                        |
| `remark-mdx`       |  `3.1.1` | Parses retained `.mdx` files so JSX media elements can be rejected explicitly without removing legacy support.                                            | Skipping `.mdx` creates a publication-rule bypass; removing `.mdx` violates the migration boundary.                                                                                                                        | Pure ESM on Node 22.12+; no framework runtime is added.                                                                                                                           |
| `unist-util-visit` |  `5.1.0` | Traverses image, definition, HTML, and MDX JSX nodes without a home-grown recursive walker.                                                               | A custom walker is easy to make incomplete as mdast node variants evolve.                                                                                                                                                  | Pure ESM on Node 22.12+ and OS-neutral.                                                                                                                                           |
| `@types/mdast`     |  `4.0.4` | Keeps the validator's node narrowing and image-reference resolution type-safe under the strictest TypeScript config.                                      | Local structural casts would hide unsupported node shapes from `astro check`.                                                                                                                                              | Type-only package; no runtime or platform effect.                                                                                                                                 |
| `file-type`        | `22.0.1` | Detects magic-byte MIME and catches renamed executables, extension/MIME mismatch, and double-extension tricks.                                            | Extension-only checking does not satisfy the approved upload/security boundary.                                                                                                                                            | Pure ESM supporting Node 22+; fixtures use small deterministic headers and the same API on Linux/Windows.                                                                         |
| `sharp`            | `0.35.3` | Re-probes AVIF/JPEG/PNG/WebP dimensions. It is already used transitively by Astro, but Phase 0 pins it directly because the audit imports its public API. | Trusting Astro's generated metadata misses files not rendered by a route; importing a transitive dependency is not a stable contract.                                                                                      | Use the package's supported Linux and Windows prebuilds; the Node/OS content-audit matrix runs the focused probe test in all four cells.                                          |
| `ffprobe-static`   |  `3.1.0` | Supplies a pinned ffprobe executable for MP4/WebM width/height checks without assuming host packages.                                                     | Declared dimensions are untrusted; `sharp` does not inspect video, and relying on a machine-global `ffprobe` makes local/CI behavior diverge.                                                                              | Resolve the exported executable path and call `execFile`, never a shell. Run the video fixture test on Linux CI and Windows CI; paths containing spaces are included in the test. |

Run both `npm audit --omit=dev --audit-level=high` and the full `npm audit --audit-level=high`. If any pinned package fails the full audit or any Node 22.12/24 × Linux/Windows content-audit matrix cell, stop that task and choose a reviewed replacement in a plan amendment; do not silently weaken validation.

## File and Interface Map

- `src/content/site/profile.md`: the single real, versioned public profile using approved copy.
- `src/domain/public-profile.ts`: pure profile types, singleton invariant, and UI view adapter.
- `src/domain/public-profile.server.ts`: server-only Astro `getEntry` wrapper.
- `src/domain/content-schema.ts`: Zod authority for site, publication metadata, and shared media.
- `src/domain/publication.ts`: canonical slug, entry/filename equality, and non-draft publication assertions.
- `src/domain/media.ts`: media types, path ownership, runtime asset registry, and reference enumeration.
- `src/domain/content-assets.server.ts`: one Astro `import.meta.glob` registry rooted at `/src/assets/content/`.
- `src/domain/markdown-media.ts`: pure Markdown/MDX AST validation.
- `src/domain/content-references.ts`: content/media reference graph, unresolved deletion blockers, and orphan report.
- `src/domain/content-contract.ts`: CMS-neutral collection/directory/extension/field/default/enum contract consumed by Phase 1.
- `src/domain/content-audit.ts`: composes filesystem parsing, schema checks, asset probing, Markdown checks, and reference checks.
- `scripts/content-audit.ts`: thin CLI for `auditContentRepository()`.
- `tests/fixtures/content-contract/`: QA-only serialized fixtures outside production collections.

---

### Task 1: Add the Site Profile Singleton and Atomically Migrate Every Contact Consumer

**Files:**

- Create: `src/content/site/profile.md`
- Create: `src/domain/public-profile.server.ts`
- Modify: `src/content.config.ts`
- Modify: `src/domain/content-schema.ts`
- Modify: `src/domain/public-profile.ts`
- Modify: `src/config/site.ts`
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/layouts/ContentLayout.astro`
- Modify: `src/components/SiteHeader.astro`
- Modify: `src/components/MobileDrawer.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/pages/about/index.astro`
- Modify: `src/pages/404.astro`
- Modify: `src/pages/portfolio/index.astro`
- Modify: `src/pages/articles/index.astro`
- Modify: `src/pages/articles/[id].astro`
- Modify: `src/pages/projects/index.astro`
- Modify: `src/pages/projects/[id].astro`
- Modify: `e2e/fixtures/src/pages/articles/index.astro`
- Modify: `e2e/fixtures/src/pages/portfolio/index.astro`
- Modify: `e2e/fixtures/src/pages/projects/index.astro`
- Modify: `e2e/fixtures/src/pages/reader/index.astro`
- Modify: `src/components/home/Hero.astro`
- Modify: `src/components/home/CapabilityMap.astro`
- Modify: `src/components/home/DeliveryMethod.astro`
- Modify: `src/components/home/CurrentStatus.astro`
- Create: `tests/site-profile.test.ts`
- Modify: `tests/public-profile.test.ts`
- Modify: `tests/production-ui-contracts.test.ts`
- Modify: `tests/homepage-output.test.ts`
- Modify: `tests/portfolio-about-output.test.ts`
- Modify: `tests/responsive-shell-output.test.ts`
- Modify: `tests/delivery-boundary.test.ts`
- Modify: `e2e/specs/fixtures.spec.ts`

**Interfaces:**

- Produces: `siteProfileSchema`, `SiteProfile`, `PublicContact`, `SITE_PROFILE_ID = 'profile'`, `buildSiteProfile(entries: readonly SiteProfileSource[]): SiteProfile`, `getSiteProfile(): Promise<SiteProfile>`, and home/shell components whose `Props` contain only typed strings/lists/contacts.
- Consumes: existing `publicContactUrl`, Astro `getEntry('site', 'profile')`, and the approved public copy currently held by `PUBLIC_PROFILE`/`SITE.githubUrl`.
- Invariant: exactly one `site` entry exists, its ID is `profile`, its schema is strict, and no private identity field is accepted. `BaseLayout.astro` is the global shell server boundary: it loads the profile, resolves `primaryContact`, renders one `SiteHeader`, and passes the typed contact through `SiteHeader` to `MobileDrawer`. Home/About load the profile at their page boundary for page content; 404/portfolio load it at their page boundary for direct CTAs. No leaf component or browser code imports the server adapter, `astro:content`, or a CMS SDK.
- Atomic boundary: add the singleton/schema/server adapter, migrate every home/About/global-shell/direct-CTA consumer, remove redundant page-level header instances, and remove `PUBLIC_PROFILE` plus `SITE.githubUrl` in this one task and one commit. No hidden duplicate or hard-coded GitHub URL remains outside the singleton/QA literals. The approved copy, CTA labels/order, section structure, single header, and rendered public output remain byte-for-byte equivalent.

> **Dirty partial implementation remediation:** Before continuing this task, revert the current accidental `public-profile.server`/`astro:content` imports in the home leaf components. Then implement the typed-props/page-load design below: server loads belong only in `BaseLayout.astro` and the home/About/404/portfolio page frontmatter described here; pass the required strings, lists, and contacts into leaf components. Do not make Task 1 compile by retaining or adding server adapters in any leaf component.

- [ ] **Step 1: Write the failing singleton/schema tests**

Create `tests/site-profile.test.ts` with actual approved values and singleton failures:

```ts
import { describe, expect, it } from 'vitest';
import { siteProfileSchema } from '../src/domain/content-schema';
import { buildSiteProfile, type SiteProfileSource } from '../src/domain/public-profile';

const approved = {
  heroEyebrow: 'AI 应用开发',
  heroTitle: '探索技术边界，让 AI 真正进入业务。',
  role: 'AI 应用开发者',
  heroSummary: '将 AI 工作流、Agent、知识系统与自动化能力，沉淀为可验证、可运行的应用。',
  positioning: 'zhou 是一个个人技术符号，专注于 Agent、知识系统、工作流自动化、评估与工程交付的 AI 应用开发。',
  capabilities: ['Agent 与工具调用', 'RAG 与知识系统', '工作流自动化', '评估与工程交付'],
  method: ['发现真实问题', '验证应用场景', '制作可运行原型', '集成现有流程', '评估并持续迭代'],
  principles: ['真实问题优先', '以可运行原型验证', '明确实验、项目与已交付状态', '重视评估与复盘'],
  currentStatus: '目前接受范围明确的 AI 应用合作讨论，也在寻找 AI 应用开发相关机会。',
  trustBoundary:
    '区分真实状态；只发布经验证的代码、过程与结果；不发布未经确认的身份、第三方、媒体或结果数据；GitHub 是唯一公开联系入口。',
  contacts: [{ label: '访问 GitHub', kind: 'github', href: 'https://github.com/zhouhaot' }],
} as const;

describe('site profile singleton', () => {
  it('accepts the approved public profile and contact protocol', () => {
    expect(siteProfileSchema.parse(approved)).toEqual(approved);
  });

  it('rejects private fields and a phone contact', () => {
    expect(() => siteProfileSchema.parse({ ...approved, phone: '+860000000000' })).toThrow();
    expect(() =>
      siteProfileSchema.parse({ ...approved, contacts: [{ label: 'Call', kind: 'email', href: 'tel:+860000000000' }] }),
    ).toThrow();
  });

  it('requires exactly the profile entry', () => {
    const source: SiteProfileSource = { id: 'profile', data: siteProfileSchema.parse(approved) };
    expect(buildSiteProfile([source])).toEqual(source.data);
    expect(() => buildSiteProfile([])).toThrow(/exactly one/i);
    expect(() => buildSiteProfile([source, source])).toThrow(/exactly one/i);
    expect(() => buildSiteProfile([{ ...source, id: 'other' }])).toThrow(/profile/i);
  });
});
```

Update `tests/production-ui-contracts.test.ts` to assert `collections.site` exists and the four public folder collections still contain only `.gitkeep`. Update `tests/public-profile.test.ts` to parse the singleton fixture instead of importing a hard-coded object.

In `tests/homepage-output.test.ts` and `tests/portfolio-about-output.test.ts`, stop importing `SITE.githubUrl` and assert the approved literal only at the rendered boundary:

```ts
const approvedGithub = 'https://github.com/zhouhaot';
expect(primary?.getAttribute('href')).toBe(approvedGithub);
expect(readFileSync(resolve('src/config/site.ts'), 'utf8')).not.toMatch(/githubUrl/);
```

Add source contracts to `tests/public-profile.test.ts` that prohibit server loading in every leaf component, require typed props, and make `BaseLayout.astro` the only global-shell server boundary:

```ts
for (const file of [
  'src/components/home/Hero.astro',
  'src/components/home/CapabilityMap.astro',
  'src/components/home/DeliveryMethod.astro',
  'src/components/home/CurrentStatus.astro',
  'src/components/SiteHeader.astro',
  'src/components/MobileDrawer.astro',
]) {
  const source = readFileSync(resolve(file), 'utf8');
  expect(source).not.toMatch(/public-profile\.server|astro:content|decap|cms/i);
  expect(source).toMatch(/interface Props/);
}

const baseLayout = readFileSync(resolve('src/layouts/BaseLayout.astro'), 'utf8');
expect(baseLayout).toMatch(/getSiteProfile/);
expect(baseLayout).toMatch(/<SiteHeader\s+primaryContact=\{primaryContact\}/);
```

In `tests/production-ui-contracts.test.ts`, add a recursive production-source contract. Scan `.astro`, `.ts`, `.md`, and `.mdx` files under `src/`, excluding only `src/content/site/profile.md`, and assert that none contains `SITE.githubUrl` or `https://github.com/zhouhaot`. Also scan every `.astro` file under `src/pages/` plus `src/layouts/ContentLayout.astro` and assert that none imports/renders `SiteHeader` or uses `slot="header"`; `BaseLayout.astro` is the single header owner.

```ts
const collectSources = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? collectSources(path) : [path];
  });

const singleton = resolve('src/content/site/profile.md');
for (const file of collectSources(resolve('src')).filter(
  (path) => /\.(?:astro|ts|mdx?)$/.test(path) && path !== singleton,
)) {
  expect(readFileSync(file, 'utf8')).not.toMatch(/SITE\.githubUrl|https:\/\/github\.com\/zhouhaot/);
}

const redundantHeaderOwners = [
  ...collectSources(resolve('src/pages')).filter((path) => path.endsWith('.astro')),
  ...collectSources(resolve('e2e/fixtures/src/pages')).filter((path) => path.endsWith('.astro')),
  resolve('src/layouts/ContentLayout.astro'),
];
for (const file of redundantHeaderOwners) {
  expect(readFileSync(file, 'utf8')).not.toMatch(/SiteHeader|slot=["']header["']/);
}
```

Update `tests/responsive-shell-output.test.ts` with the approved QA literal and assert the built home contains exactly one `.site-header`, while both shell contact links use the singleton URL and keep their existing labels:

```ts
const approvedGithub = 'https://github.com/zhouhaot';
expect(builtDocument.querySelectorAll('.site-header')).toHaveLength(1);
const shellContacts = Array.from(
  builtDocument.querySelectorAll<HTMLAnchorElement>('.site-header__github, .mobile-drawer__github'),
);
expect(shellContacts.map((link) => link.getAttribute('href'))).toEqual([approvedGithub, approvedGithub]);
expect(shellContacts.map((link) => link.textContent)).toEqual(['GitHub', 'GitHub']);
```

Update `tests/delivery-boundary.test.ts` to read `index.html`, `404.html`, `about/index.html`, `articles/index.html`, `portfolio/index.html`, and `projects/index.html` from the build output and assert each contains exactly one `class="site-header"`. Keep the existing 404 GitHub/return-home assertions, which verify its direct CTA output through a QA literal.

Update `e2e/specs/fixtures.spec.ts` with one focused shell assertion:

```ts
test('fixture pages inherit exactly one shared header', async ({ page }) => {
  for (const path of ['/articles/', '/portfolio/', '/projects/', '/reader/']) {
    await page.goto(`${fixture}${path}`);
    await expect(page.locator('.site-header')).toHaveCount(1);
  }
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run:

```bash
npm test -- tests/site-profile.test.ts tests/public-profile.test.ts tests/production-ui-contracts.test.ts
npm test -- tests/homepage-output.test.ts tests/portfolio-about-output.test.ts tests/responsive-shell-output.test.ts tests/delivery-boundary.test.ts
```

Expected: FAIL because `siteProfileSchema`, `SiteProfileSource`, `buildSiteProfile`, and `collections.site` do not exist; `SITE.githubUrl`, production hard-coded URL consumers, per-page header instances, and untyped shell contacts also remain.

- [ ] **Step 3: Implement the strict profile schema and pure singleton adapter**

Add to `src/domain/content-schema.ts`:

```ts
export const contactKindSchema = z.enum(['github', 'email', 'website']);

export const publicContactSchema = z
  .object({
    label: z.string().trim().min(1).max(80),
    kind: contactKindSchema,
    href: publicContactUrl,
  })
  .strict()
  .superRefine((contact, context) => {
    const protocol = new URL(contact.href).protocol;
    const expected = contact.kind === 'email' ? 'mailto:' : 'https:';
    if (protocol !== expected) {
      context.addIssue({ code: 'custom', path: ['href'], message: `${contact.kind} contacts must use ${expected}` });
    }
  });

export const siteProfileSchema = z
  .object({
    heroEyebrow: z.string().trim().min(1).max(80),
    heroTitle: z.string().trim().min(1).max(120),
    role: z.string().trim().min(1).max(80),
    heroSummary: z.string().trim().min(1).max(240),
    positioning: z.string().trim().min(1).max(320),
    capabilities: z.array(z.string().trim().min(1).max(120)).min(1),
    method: z.array(z.string().trim().min(1).max(120)).min(1),
    principles: z.array(z.string().trim().min(1).max(160)).min(1),
    currentStatus: z.string().trim().min(1).max(240),
    trustBoundary: z.string().trim().min(1).max(400),
    contacts: z.array(publicContactSchema).min(1),
  })
  .strict();

export type SiteProfile = z.infer<typeof siteProfileSchema>;
export type PublicContact = z.infer<typeof publicContactSchema>;
```

Replace `src/domain/public-profile.ts` with a copy-free domain adapter:

```ts
import type { SiteProfile } from './content-schema';

export const SITE_PROFILE_ID = 'profile' as const;
export type SiteProfileSource = { id: string; data: SiteProfile };

export function buildSiteProfile(entries: readonly SiteProfileSource[]): SiteProfile {
  if (entries.length !== 1) throw new Error(`Site profile must contain exactly one entry; received ${entries.length}.`);
  const [entry] = entries;
  if (!entry || entry.id !== SITE_PROFILE_ID) throw new Error(`Site profile id must be ${SITE_PROFILE_ID}.`);
  return entry.data;
}
```

- [ ] **Step 4: Register and load the singleton**

Add the collection to `src/content.config.ts`:

```ts
import { labSchema, noteSchema, portfolioSchema, siteProfileSchema, workSchema } from '@/domain/content-schema';

const site = defineCollection({
  loader: glob({ base: './src/content/site', pattern: 'profile.md' }),
  schema: siteProfileSchema,
});

export const collections = { site, work, lab, notes, portfolio };
```

Create `src/domain/public-profile.server.ts`:

```ts
import { getEntry } from 'astro:content';
import { buildSiteProfile, SITE_PROFILE_ID } from './public-profile';

export async function getSiteProfile() {
  const entry = await getEntry('site', SITE_PROFILE_ID);
  return buildSiteProfile(entry ? [{ id: entry.id, data: entry.data }] : []);
}
```

Create `src/content/site/profile.md` with only the approved copy. Use YAML lists and quote the URL; leave the Markdown body empty:

```markdown
---
heroEyebrow: AI 应用开发
heroTitle: 探索技术边界，让 AI 真正进入业务。
role: AI 应用开发者
heroSummary: 将 AI 工作流、Agent、知识系统与自动化能力，沉淀为可验证、可运行的应用。
positioning: zhou 是一个个人技术符号，专注于 Agent、知识系统、工作流自动化、评估与工程交付的 AI 应用开发。
capabilities:
  - Agent 与工具调用
  - RAG 与知识系统
  - 工作流自动化
  - 评估与工程交付
method:
  - 发现真实问题
  - 验证应用场景
  - 制作可运行原型
  - 集成现有流程
  - 评估并持续迭代
principles:
  - 真实问题优先
  - 以可运行原型验证
  - 明确实验、项目与已交付状态
  - 重视评估与复盘
currentStatus: 目前接受范围明确的 AI 应用合作讨论，也在寻找 AI 应用开发相关机会。
trustBoundary: 区分真实状态；只发布经验证的代码、过程与结果；不发布未经确认的身份、第三方、媒体或结果数据；GitHub 是唯一公开联系入口。
contacts:
  - label: 访问 GitHub
    kind: github
    href: 'https://github.com/zhouhaot'
---
```

- [ ] **Step 5: Convert home components to typed props**

Use these exact prop contracts:

```astro
---
// Hero.astro
import type { PublicContact } from '@/domain/content-schema';
import { PUBLIC_ROUTES } from '@/domain/routes';
interface Props {
  eyebrow: string;
  title: string;
  role: string;
  summary: string;
  primaryContact: PublicContact;
}
const { eyebrow, title, role, summary, primaryContact } = Astro.props;
---
```

Replace Hero's four hard-coded strings with `{eyebrow}`, `{title}`, `{role}`, and `{summary}`; set the primary anchor to `href={primaryContact.href}` and label to `{primaryContact.label}`. Keep `PUBLIC_ROUTES.projects` and existing classes/attributes unchanged.

```astro
---
// CapabilityMap.astro
interface Props {
  capabilities: readonly string[];
}
const { capabilities } = Astro.props;
---
```

```astro
---
// DeliveryMethod.astro
interface Props {
  steps: readonly string[];
}
const { steps } = Astro.props;
---
```

```astro
---
// CurrentStatus.astro
import type { PublicContact } from '@/domain/content-schema';
interface Props {
  currentStatus: string;
  primaryContact: PublicContact;
}
const { currentStatus, primaryContact } = Astro.props;
---
```

Replace `PUBLIC_PROFILE.currentStatus`, `SITE.githubUrl`, and the hard-coded contact label in `CurrentStatus.astro` with the props. Keep the existing supporting sentence unchanged.

- [ ] **Step 6: Load home/About content at page boundaries and pass typed data**

In `src/pages/index.astro`, add:

```ts
import { getSiteProfile } from '@/domain/public-profile.server';

const [profile, work, lab, notes] = await Promise.all([
  getSiteProfile(),
  getPublishedEntries('work'),
  getPublishedEntries('lab'),
  getPublishedEntries('notes'),
]);
const primaryContact = profile.contacts[0];
if (!primaryContact) throw new Error('Site profile requires a primary public contact.');
```

Render the migrated components as:

```astro
<Hero
  eyebrow={profile.heroEyebrow}
  title={profile.heroTitle}
  role={profile.role}
  summary={profile.heroSummary}
  primaryContact={primaryContact}
/>
<CapabilityMap capabilities={profile.capabilities} />
<DeliveryMethod steps={profile.method} />
<CurrentStatus currentStatus={profile.currentStatus} primaryContact={primaryContact} />
```

In `src/pages/about/index.astro`, replace `PUBLIC_PROFILE`/`SITE.githubUrl` imports with `getSiteProfile`, load `profile` once at the page level, assert `primaryContact`, and replace each field access with `profile.<field>`. Keep the six sections and button order unchanged. Neither page may pass the full profile object to a leaf component.

- [ ] **Step 7: Make BaseLayout the typed global-shell server boundary**

In `src/layouts/BaseLayout.astro`, import `SiteHeader`, load the profile, resolve its required contact, and render the header directly where the named header slot previously appeared:

```astro
---
import SiteHeader from '@/components/SiteHeader.astro';
import { getSiteProfile } from '@/domain/public-profile.server';

const profile = await getSiteProfile();
const primaryContact = profile.contacts[0];
if (!primaryContact) throw new Error('Site profile requires a primary public contact.');
---

<SiteHeader primaryContact={primaryContact} />
```

Keep the header in its current visual position between the skip link and `<main>`. Remove the named header slot.

Give `src/components/SiteHeader.astro` a typed `primaryContact: PublicContact` prop, change only the desktop contact `href` to `primaryContact.href`, keep its visible `GitHub` label unchanged, and render:

```astro
<MobileDrawer currentPath={currentPath} primaryContact={primaryContact} />
```

Give `src/components/MobileDrawer.astro` the same typed `primaryContact: PublicContact` prop and change only the drawer contact `href` to `primaryContact.href`. Keep the visible `GitHub` label and link order unchanged. Neither component imports `public-profile.server`, `astro:content`, or a CMS module.

- [ ] **Step 8: Remove redundant headers, migrate direct CTAs, and retire duplicate globals**

Remove the `SiteHeader` import and `<SiteHeader slot="header" />` from all page templates that render `BaseLayout`: `src/pages/index.astro`, `src/pages/about/index.astro`, `src/pages/404.astro`, `src/pages/portfolio/index.astro`, `src/pages/articles/index.astro`, `src/pages/articles/[id].astro`, `src/pages/projects/index.astro`, and `src/pages/projects/[id].astro`. Remove the same redundant import/render from `src/layouts/ContentLayout.astro` and from `e2e/fixtures/src/pages/articles/index.astro`, `e2e/fixtures/src/pages/portfolio/index.astro`, `e2e/fixtures/src/pages/projects/index.astro`, and `e2e/fixtures/src/pages/reader/index.astro`; the fixture pages inherit the same BaseLayout-owned header. Do not change page or fixture content order.

In `src/pages/404.astro`, load `getSiteProfile()` in page frontmatter, resolve the required `primaryContact`, and set only the existing primary CTA's `href` to `primaryContact.href`. Keep `访问 GitHub` before `返回首页`.

In `src/pages/portfolio/index.astro`, load the profile and portfolio data together, resolve the required contact, and set only the existing primary CTA's `href` to `primaryContact.href`:

```ts
const [profile, series] = await Promise.all([getSiteProfile(), getPublishedPortfolio()]);
const primaryContact = profile.contacts[0];
if (!primaryContact) throw new Error('Site profile requires a primary public contact.');
```

Keep `访问 GitHub` before `查看项目`. After every consumer uses the singleton, remove `PUBLIC_PROFILE` from `src/domain/public-profile.ts` and remove only `githubUrl` from `SITE` in `src/config/site.ts`; keep `name`, `title`, `description`, `url`, and `navigation` unchanged. These removals, the global-shell migration, and every direct CTA migration are one atomic change and must not be committed separately.

- [ ] **Step 9: Verify the complete atomic boundary**

Run:

```bash
npm test -- tests/site-profile.test.ts tests/public-profile.test.ts tests/production-ui-contracts.test.ts tests/homepage-output.test.ts tests/portfolio-about-output.test.ts tests/responsive-shell-output.test.ts tests/delivery-boundary.test.ts tests/theme-foundation.test.ts
npm run check
npm run build
npm run audit:production
npm test
npm run test:e2e -- e2e/specs/fixtures.spec.ts
rg -n "SITE\.githubUrl|https://github.com/zhouhaot|<SiteHeader slot=\"header\"" src e2e/fixtures/src/pages --glob "!src/content/site/profile.md"
git diff -- src/content/site/profile.md src/content/work src/content/lab src/content/notes src/content/portfolio
```

Expected: focused tests, Astro check, every static page build, production audit, and the full unit suite all PASS at this single boundary. The `rg` command reports no matches. Every built page has exactly one header; desktop/mobile shell links and home/About/404/portfolio CTAs use the singleton URL with approved labels/order unchanged; home still has seven sections and three truthful collection empty states; About still has six sections; no leaf component imports `public-profile.server` or `astro:content`; and the diff contains the real site singleton with no added work/lab/notes/portfolio entry.

- [ ] **Step 10: Commit Task 1**

```bash
git add src/content.config.ts src/content/site/profile.md src/domain/content-schema.ts src/domain/public-profile.ts src/domain/public-profile.server.ts src/config/site.ts src/layouts/BaseLayout.astro src/layouts/ContentLayout.astro src/components/SiteHeader.astro src/components/MobileDrawer.astro src/components/home/Hero.astro src/components/home/CapabilityMap.astro src/components/home/DeliveryMethod.astro src/components/home/CurrentStatus.astro src/pages/index.astro src/pages/about/index.astro src/pages/404.astro src/pages/portfolio/index.astro src/pages/articles/index.astro src/pages/articles/[id].astro src/pages/projects/index.astro src/pages/projects/[id].astro e2e/fixtures/src/pages/articles/index.astro e2e/fixtures/src/pages/portfolio/index.astro e2e/fixtures/src/pages/projects/index.astro e2e/fixtures/src/pages/reader/index.astro tests/site-profile.test.ts tests/public-profile.test.ts tests/production-ui-contracts.test.ts tests/homepage-output.test.ts tests/portfolio-about-output.test.ts tests/responsive-shell-output.test.ts tests/delivery-boundary.test.ts e2e/specs/fixtures.spec.ts
git commit -m "feat: add typed site profile singleton"
```

### Task 3: Enforce Canonical Slugs, Attestation, and the Non-Draft Gate

**Files:**

- Create: `src/domain/publication.ts`
- Modify: `src/domain/content-schema.ts`
- Modify: `src/domain/content.ts`
- Modify: `src/domain/projects.ts`
- Modify: `src/domain/articles.ts`
- Modify: `src/domain/portfolio.ts`
- Modify: `tests/content-schema.test.ts`
- Modify: `tests/content-domain.test.ts`
- Modify: `tests/projects-domain.test.ts`
- Modify: `tests/articles-domain.test.ts`
- Modify: `tests/portfolio-domain.test.ts`

**Interfaces:**

- Produces: `CONTENT_COLLECTIONS`, `ContentCollectionName`, `canonicalSlugSchema`, `attestationSchema`, `CommonPublicationData`, `assertEntrySlug(collection, id, slug): void`, and `assertPublishable(data, now?): void`.
- Slug grammar: lowercase ASCII kebab case, 1–80 characters: `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
- Non-draft invariant: both confirmations are true and `reviewedAt` is a real date not later than the current validation time. Evidence may be empty; any supplied evidence URL is HTTPS.

- [ ] **Step 1: Write failing publication-domain tests**

Create the following cases in `tests/content-domain.test.ts`:

```ts
import { assertEntrySlug, assertPublishable, canonicalSlugSchema } from '../src/domain/publication';
import { attestationSchema } from '../src/domain/content-schema';

it('uses one canonical slug grammar and enforces filename equality', () => {
  expect(canonicalSlugSchema.parse('agent-eval-2')).toBe('agent-eval-2');
  for (const slug of ['Agent-Eval', 'agent eval', 'agent/eval', 'agent..eval', '-agent', 'agent-']) {
    expect(() => canonicalSlugSchema.parse(slug)).toThrow();
  }
  expect(() => assertEntrySlug('notes', 'entry-file', 'other-slug')).toThrow(/match/i);
});

it('allows drafts but gates every non-draft attestation', () => {
  const now = new Date('2026-07-20T00:00:00.000Z');
  expect(() =>
    assertPublishable(
      {
        draft: true,
        attestation: { authenticityConfirmed: false, rightsConfirmed: false, evidenceUrls: [] },
      },
      now,
    ),
  ).not.toThrow();
  expect(() =>
    assertPublishable(
      {
        draft: false,
        attestation: {
          authenticityConfirmed: true,
          rightsConfirmed: false,
          reviewedAt: new Date('2026-07-19T00:00:00.000Z'),
          evidenceUrls: [],
        },
      },
      now,
    ),
  ).toThrow(/rights/i);
  expect(() =>
    assertPublishable(
      {
        draft: false,
        attestation: {
          authenticityConfirmed: true,
          rightsConfirmed: true,
          reviewedAt: new Date('2026-07-20T00:00:00.001Z'),
          evidenceUrls: [],
        },
      },
      now,
    ),
  ).toThrow(/future/i);
});

it('keeps structural date parsing deterministic and delegates clock policy', () => {
  expect(() =>
    attestationSchema.parse({ authenticityConfirmed: true, rightsConfirmed: true, reviewedAt: 'not-a-date' }),
  ).toThrow();
  const parsed = attestationSchema.parse({
    authenticityConfirmed: true,
    rightsConfirmed: true,
    reviewedAt: '2026-07-21',
    evidenceUrls: [],
  });
  expect(parsed.reviewedAt).toBeInstanceOf(Date);
  expect(() => assertPublishable({ draft: false, attestation: parsed }, new Date('2026-07-20T00:00:00.000Z'))).toThrow(
    /future/i,
  );
});
```

Use one explicit helper in the existing schema/domain tests so every fixture receives the same complete publication fields:

```ts
const publication = (slug: string) => ({
  slug,
  draft: false,
  attestation: {
    authenticityConfirmed: true,
    rightsConfirmed: true,
    reviewedAt: '2026-07-19',
    evidenceUrls: [],
  },
});
```

Spread `publication('qa-work')`, `publication('qa-lab')`, `publication('qa-note')`, or `publication('qa-series')` into the matching existing fixture. Add this default assertion:

```ts
const draft = noteSchema.parse({
  slug: 'qa-note',
  title: 'QA fixture',
  summary: 'Schema-only fixture.',
  tags: ['qa'],
  publishedAt: '2026-07-19',
  attestation: { authenticityConfirmed: false, rightsConfirmed: false, evidenceUrls: [] },
});
expect(draft.draft).toBe(true);
```

Add negative domain cases for HTTP evidence, missing `reviewedAt`, either false confirmation, and filename/slug mismatch in project/article/portfolio builders. The Zod tests reject invalid date syntax but do not consult the system clock; every time-relative assertion passes the fixed `now` above to `assertPublishable`.

- [ ] **Step 2: Run the tests and verify RED**

Run:

```bash
npm test -- tests/content-schema.test.ts tests/content-domain.test.ts tests/projects-domain.test.ts tests/articles-domain.test.ts tests/portfolio-domain.test.ts
```

Expected: FAIL because the shared publication exports do not exist and existing schemas default `draft` to false.

- [ ] **Step 3: Implement the pure publication assertions**

Create `src/domain/publication.ts`:

```ts
import { z } from 'astro/zod';

export const CONTENT_COLLECTIONS = ['work', 'lab', 'notes', 'portfolio'] as const;
export type ContentCollectionName = (typeof CONTENT_COLLECTIONS)[number];
export const canonicalSlugSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase ASCII kebab case.');

export type PublicationAttestation = {
  authenticityConfirmed: boolean;
  rightsConfirmed: boolean;
  reviewedAt?: Date | undefined;
  evidenceUrls: string[];
};
export type CommonPublicationData = {
  slug: string;
  draft: boolean;
  attestation: PublicationAttestation;
  result?: string | undefined;
  evaluation?: string | undefined;
};

export function assertEntrySlug(collection: ContentCollectionName, id: string, slug: string): void {
  const parsed = canonicalSlugSchema.parse(slug);
  if (id !== parsed) throw new Error(`${collection} filename id must match slug: ${id} !== ${parsed}`);
}

export function assertPublishable(
  data: Pick<CommonPublicationData, 'draft' | 'attestation' | 'result' | 'evaluation'>,
  now = new Date(),
): void {
  if (data.draft) return;
  if (!data.attestation.authenticityConfirmed) throw new Error('Published content requires authenticity confirmation.');
  if (!data.attestation.rightsConfirmed) throw new Error('Published content requires rights confirmation.');
  if (!data.attestation.reviewedAt) throw new Error('Published content requires reviewedAt.');
  if (data.attestation.reviewedAt.valueOf() > now.valueOf()) throw new Error('reviewedAt cannot be in the future.');
  if (data.result !== undefined && !data.result.trim()) throw new Error('Published lab content requires a result.');
  if (data.evaluation !== undefined && !data.evaluation.trim())
    throw new Error('Published lab content requires an evaluation.');
}
```

- [ ] **Step 4: Build every folder schema from one common shape**

In `src/domain/content-schema.ts`, replace the old `commonSchema` with:

```ts
import { canonicalSlugSchema } from './publication';

export const attestationSchema = z.object({
  authenticityConfirmed: z.boolean().default(false),
  rightsConfirmed: z.boolean().default(false),
  reviewedAt: z.coerce.date().optional(),
  evidenceUrls: z.array(httpsUrl).default([]),
});

const commonPublicationFields = {
  slug: canonicalSlugSchema,
  title: z.string().trim().min(1).max(120),
  summary: z.string().trim().min(1).max(240),
  publishedAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  draft: z.boolean().default(true),
  attestation: attestationSchema,
} as const;

function publicationSchema<T extends z.ZodRawShape>(fields: T) {
  return z.object({ ...commonPublicationFields, ...fields });
}
```

Define `workSchema`, `labSchema`, `noteSchema`, and `portfolioSchema` through `publicationSchema({...})`. Keep all current domain-specific fields and enums. Change lab `result` and `evaluation` to `z.string().trim().default('')`; `assertPublishable` owns their non-draft non-empty rule together with the complete attestation and future-time policy. Zod owns only types, valid/coercible dates, URL protocols, defaults, and structure, so schema parsing never reads `Date.now()`.

- [ ] **Step 5: Make domain builders enforce ID equality before filtering**

At the start of each builder, validate all source entries, including drafts:

```ts
for (const entry of entries) {
  assertEntrySlug(entry.collection, entry.id, entry.data.slug);
  assertPublishable(entry.data);
}
```

For portfolio sources, add `collection: 'portfolio'` to `PortfolioSource`; for the shared `getPublishedEntries()` path, introduce:

```ts
export function validateCollectionEntry<C extends PublicCollection>(collection: C, entry: CollectionEntry<C>): void {
  assertEntrySlug(collection, entry.id, entry.data.slug);
  assertPublishable(entry.data);
}
```

Call it in the `getCollection` filter before `isPublicEntry`. Replace duplicate canonical-ID helpers in projects/articles/portfolio with `assertEntrySlug`; retain cross-collection duplicate detection because work and lab share `/projects/:id`.

- [ ] **Step 6: Verify GREEN and regression**

Run:

```bash
npm test -- tests/content-schema.test.ts tests/content-domain.test.ts tests/projects-domain.test.ts tests/articles-domain.test.ts tests/portfolio-domain.test.ts
npm run check
npm test
```

Expected: focused and full tests PASS; the four real folder collections remain empty; a non-draft without complete attestation fails before route generation.

- [ ] **Step 7: Commit Task 3**

```bash
git add src/domain/publication.ts src/domain/content-schema.ts src/domain/content.ts src/domain/projects.ts src/domain/articles.ts src/domain/portfolio.ts tests/content-schema.test.ts tests/content-domain.test.ts tests/projects-domain.test.ts tests/articles-domain.test.ts tests/portfolio-domain.test.ts
git commit -m "feat: enforce publication metadata"
```

### Task 4: Unify Structured Media Across Work, Lab, Notes, and Portfolio

**Files:**

- Create: `src/domain/media.ts`
- Modify: `src/domain/content-schema.ts`
- Modify: `src/domain/projects.ts`
- Modify: `src/domain/articles.ts`
- Modify: `src/domain/portfolio.ts`
- Modify: `tests/content-schema.test.ts`
- Modify: `tests/projects-domain.test.ts`
- Modify: `tests/articles-domain.test.ts`
- Modify: `tests/portfolio-domain.test.ts`
- Modify: `tests/production-ui-contracts.test.ts`

**Interfaces:**

- Produces: `MEDIA_LICENSES`, `IMAGE_EXTENSIONS`, `VIDEO_EXTENSIONS`, `ContentMediaPath`, `parseContentMediaPath(value): ContentMediaPath | undefined`, `assertCanonicalContentMediaPath(value): ContentMediaPath`, `MediaReference`, `mediaSchema`, `assertMediaOwnership(collection, slug, media): void`, and `mediaReferencesFor(collection, slug, data): readonly MediaReference[]`.
- Field mapping: `work.media`, `lab.media`, and `notes.media` are arrays defaulting to `[]`; `portfolio.items` remains a non-empty array but uses the identical item schema.
- Replaces: loose `work.screenshots: string[]`. Do not retain a second media field in the work schema.

- [ ] **Step 1: Write the failing shared-media contract tests**

Add a reusable item and publication base to `tests/content-schema.test.ts`:

```ts
const published = {
  publishedAt: '2026-07-19',
  draft: false,
  attestation: {
    authenticityConfirmed: true,
    rightsConfirmed: true,
    reviewedAt: '2026-07-19',
    evidenceUrls: [],
  },
};
const ownedImage = {
  type: 'image',
  source: 'work/qa-work-overview.webp',
  alt: 'QA-only image description.',
  caption: 'QA-only schema fixture.',
  width: 1600,
  height: 900,
  license: 'owned',
} as const;
```

Add these assertions:

```ts
it('uses one media shape in all four collection schemas', () => {
  expect(workSchema.parse({ ...baseWork, slug: 'qa-work', ...published, media: [ownedImage] }).media).toEqual([
    ownedImage,
  ]);
  expect(
    labSchema.parse({
      ...baseLab,
      slug: 'qa-lab',
      ...published,
      media: [{ ...ownedImage, source: 'lab/qa-lab-overview.webp' }],
    }).media,
  ).toHaveLength(1);
  expect(
    noteSchema.parse({
      ...baseNote,
      slug: 'qa-note',
      ...published,
      media: [{ ...ownedImage, source: 'notes/qa-note-overview.webp' }],
    }).media,
  ).toHaveLength(1);
  expect(
    portfolioSchema.parse({
      ...basePortfolio,
      slug: 'qa-series',
      ...published,
      items: [{ ...ownedImage, source: 'portfolio/qa-series-overview.webp' }],
    }).items,
  ).toHaveLength(1);
});

it('rejects bad namespaces, double extensions, blank alt, and incomplete video metadata', () => {
  expect(() => mediaSchema.parse({ ...ownedImage, source: 'portfolio/qa-work-overview.webp' })).not.toThrow();
  expect(() => mediaSchema.parse({ ...ownedImage, source: 'work/qa-work-overview.png.exe' })).toThrow();
  expect(() => mediaSchema.parse({ ...ownedImage, source: 'work/qa-work-overview.exe.png' })).toThrow();
  expect(() => mediaSchema.parse({ ...ownedImage, alt: '  ' })).toThrow();
  expect(() => mediaSchema.parse({ ...ownedImage, type: 'video', source: 'work/qa-work-demo.webm' })).toThrow(
    /poster/i,
  );
});

it('requires the path namespace and filename prefix to match its owner', () => {
  expect(() => assertMediaOwnership('work', 'qa-work', ownedImage)).not.toThrow();
  expect(() => assertMediaOwnership('notes', 'qa-work', ownedImage)).toThrow(/namespace/i);
  expect(() => assertMediaOwnership('work', 'other', ownedImage)).toThrow(/prefix/i);
});
```

Update project/article/portfolio fixtures to use the new `slug`, attestation, and media types. Assert that the old `screenshots` key is rejected.

- [ ] **Step 2: Run the tests and verify RED**

Run:

```bash
npm test -- tests/content-schema.test.ts tests/projects-domain.test.ts tests/articles-domain.test.ts tests/portfolio-domain.test.ts tests/production-ui-contracts.test.ts
```

Expected: FAIL because `mediaSchema`, `assertMediaOwnership`, and the three new `media` fields do not exist; work still accepts `screenshots`.

- [ ] **Step 3: Define the shared media types and owner checks**

Create `src/domain/media.ts`:

```ts
import type { ContentCollectionName } from './publication';

export const MEDIA_LICENSES = ['owned', 'licensed', 'cc-by', 'public-domain'] as const;
export const IMAGE_EXTENSIONS = ['avif', 'jpeg', 'jpg', 'png', 'webp'] as const;
export const VIDEO_EXTENSIONS = ['mp4', 'webm'] as const;
const CONTENT_MEDIA_EXTENSIONS = [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS] as const;

export type ContentMediaPath = {
  collection: ContentCollectionName;
  filename: string;
  extension: (typeof CONTENT_MEDIA_EXTENSIONS)[number];
};

export function parseContentMediaPath(value: string): ContentMediaPath | undefined {
  if (value !== value.normalize('NFC') || value !== value.trim() || /[\\%:]/.test(value) || value.includes('..'))
    return;
  const match = /^(work|lab|notes|portfolio)\/([a-z0-9]+(?:-[a-z0-9]+)*)\.([a-z0-9]+)$/.exec(value);
  if (!match) return;
  const [, collection, filename, extension] = match;
  if (!CONTENT_MEDIA_EXTENSIONS.includes(extension as (typeof CONTENT_MEDIA_EXTENSIONS)[number])) return;
  return {
    collection: collection as ContentCollectionName,
    filename: filename!,
    extension: extension as ContentMediaPath['extension'],
  };
}

export function assertCanonicalContentMediaPath(value: string): ContentMediaPath {
  const parsed = parseContentMediaPath(value);
  if (!parsed) throw new Error(`Media path must be canonical under src/assets/content: ${value}`);
  return parsed;
}

type MediaBase = {
  source: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
  license: (typeof MEDIA_LICENSES)[number];
  credit?: string | undefined;
  licenseUrl?: string | undefined;
  evidenceUrl?: string | undefined;
};
export type MediaReference = (MediaBase & { type: 'image' }) | (MediaBase & { type: 'video'; poster: string });

export function assertMediaOwnership(
  collection: ContentCollectionName,
  slug: string,
  media: Pick<MediaReference, 'source'> & Partial<Pick<Extract<MediaReference, { type: 'video' }>, 'poster'>>,
): void {
  const namespace = `${collection}/`;
  const prefix = `${namespace}${slug}-`;
  for (const path of [media.source, media.poster].filter((value): value is string => Boolean(value))) {
    assertCanonicalContentMediaPath(path);
    if (!path.startsWith(namespace)) throw new Error(`Media namespace must be ${namespace}: ${path}`);
    if (!path.startsWith(prefix)) throw new Error(`Media filename must use entry slug prefix ${slug}-: ${path}`);
  }
}

type MediaContainer = { media?: readonly MediaReference[]; items?: readonly MediaReference[] };
export function mediaReferencesFor(
  collection: ContentCollectionName,
  slug: string,
  data: MediaContainer,
): readonly MediaReference[] {
  const media = collection === 'portfolio' ? (data.items ?? []) : (data.media ?? []);
  for (const item of media) assertMediaOwnership(collection, slug, item);
  return media;
}
```

- [ ] **Step 4: Define one strict Zod discriminated union**

In `src/domain/content-schema.ts`, make local paths exactly one namespace and one safe filename, then export the union:

```ts
import { IMAGE_EXTENSIONS, MEDIA_LICENSES, VIDEO_EXTENSIONS, parseContentMediaPath } from './media';

export const localMediaPath = z.string().refine((value) => parseContentMediaPath(value) !== undefined, {
  message: 'Media path must be canonical under src/assets/content.',
});

const mediaBaseSchema = z.object({
  alt: z.string().trim().min(1),
  caption: z.string().trim().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  license: z.enum(MEDIA_LICENSES),
  credit: z.string().trim().min(1).optional(),
  licenseUrl: httpsUrl.optional(),
  evidenceUrl: httpsUrl.optional(),
});

function mediaPathWith(extensions: readonly string[]) {
  return localMediaPath.refine((value) => extensions.some((extension) => value.endsWith(`.${extension}`)), {
    message: `Media path must use one of: ${extensions.join(', ')}.`,
  });
}

export const mediaSchema = z
  .discriminatedUnion('type', [
    mediaBaseSchema.extend({ type: z.literal('image'), source: mediaPathWith(IMAGE_EXTENSIONS) }),
    mediaBaseSchema.extend({
      type: z.literal('video'),
      source: mediaPathWith(VIDEO_EXTENSIONS),
      poster: mediaPathWith(IMAGE_EXTENSIONS),
    }),
  ])
  .superRefine((media, context) => {
    if ((media.license === 'licensed' || media.license === 'cc-by') && (!media.credit || !media.licenseUrl)) {
      context.addIssue({ code: 'custom', message: 'Licensed media requires credit and an HTTPS license URL.' });
    }
    if (media.license === 'public-domain' && !media.evidenceUrl) {
      context.addIssue({ code: 'custom', message: 'Public-domain media requires an HTTPS evidence URL.' });
    }
  });
```

Use `media: z.array(mediaSchema).default([])` in work/lab/notes; use `items: z.array(mediaSchema).min(1)` in portfolio. Remove `screenshots` and the private portfolio-only media schemas.

- [ ] **Step 5: Make domain types consume the shared media type**

Import `MediaReference` with a type-only import in `projects.ts`, `articles.ts`, and `portfolio.ts`. Add `media: MediaReference[]` to work/lab/article data types, replace the local `PortfolioMedia` declaration with:

```ts
export type PortfolioMedia = MediaReference;
```

Call `mediaReferencesFor(entry.collection, entry.data.slug, entry.data)` in all three builders before filtering. Keep the current UI unchanged: Phase 0 validates media but does not invent gallery placement for projects/articles.

- [ ] **Step 6: Verify GREEN**

Run:

```bash
npm test -- tests/content-schema.test.ts tests/projects-domain.test.ts tests/articles-domain.test.ts tests/portfolio-domain.test.ts tests/production-ui-contracts.test.ts
npm run check
npm test
```

Expected: all tests PASS; the four collections share one media item shape; no production content entry or media file has been added.

- [ ] **Step 7: Commit Task 4**

```bash
git add src/domain/media.ts src/domain/content-schema.ts src/domain/projects.ts src/domain/articles.ts src/domain/portfolio.ts tests/content-schema.test.ts tests/projects-domain.test.ts tests/articles-domain.test.ts tests/portfolio-domain.test.ts tests/production-ui-contracts.test.ts
git commit -m "feat: unify structured content media"
```

### Task 5: Build the Cross-Collection Asset Registry and Byte-Level Audit

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/assets/content/work/.gitkeep`
- Create: `src/assets/content/lab/.gitkeep`
- Create: `src/assets/content/notes/.gitkeep`
- Create: `src/assets/content/portfolio/.gitkeep`
- Create: `src/domain/content-assets.server.ts`
- Create: `src/domain/content-assets.ts`
- Modify: `src/domain/media.ts`
- Modify: `src/domain/portfolio.server.ts`
- Create: `tests/content-assets.test.ts`
- Modify: `tests/portfolio-domain.test.ts`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**

- Produces: `ContentAsset`, `ContentAssetRegistry`, `createContentAssetRegistry(modules)`, `inspectSourceAsset(file, relativePath, probeVideo?)`, `assertRealPathInside(rootRealPath, candidateRealPath): void`, `assertRegularAssetEntry(stat, source): void`, `discoverContentAssetFiles(root): Promise<string[]>`, `auditContentAssets(root, inspect?): Promise<ContentAssetRegistry>`, and the singleton `contentAssetRegistry` used by all server adapters.
- Asset key: the stored path relative to `src/assets/content`, such as `notes/qa-note-diagram.webp`.
- Audit result includes `source`, `src`, `bytes`, `mime`, `width`, and `height`; runtime Vite records may omit byte/MIME fields but use the same key and dimension contract.

- [ ] **Step 1: Install only the asset-audit runtime and record the lockfile**

Run:

```bash
npm install --save-dev --save-exact tsx@4.23.1 gray-matter@4.0.3 file-type@22.0.1 sharp@0.35.3 ffprobe-static@3.1.0
```

Expected: `package.json` contains exact versions in `devDependencies`; `package-lock.json` changes; no dependency is added to `dependencies`.

- [ ] **Step 2: Write failing registry, magic-byte, size, and probe tests**

Create `tests/content-assets.test.ts`:

```ts
// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ffprobePath from 'ffprobe-static';
import { afterEach, describe, expect, it } from 'vitest';
import { createContentAssetRegistry } from '../src/domain/media';
import {
  auditContentAssets,
  assertRealPathInside,
  assertRegularAssetEntry,
  inspectSourceAsset,
  probeVideoDimensions,
} from '../src/domain/content-assets';

const roots: string[] = [];
afterEach(() => {
  while (roots.length) rmSync(roots.pop()!, { recursive: true, force: true });
});

describe('content asset registry', () => {
  it('normalizes Vite module paths under the one content root', () => {
    const registry = createContentAssetRegistry([
      ['/src/assets/content/work/qa-work-overview.webp', { src: '/_astro/overview.hash.webp', width: 2, height: 1 }],
      ['/src/assets/content/lab/qa-lab-demo.webm', '/_astro/demo.hash.webm'],
    ]);
    expect(registry.get('work/qa-work-overview.webp')?.src).toBe('/_astro/overview.hash.webp');
    expect(registry.get('lab/qa-lab-demo.webm')?.src).toBe('/_astro/demo.hash.webm');
  });

  it('detects a renamed executable before trusting its extension', async () => {
    const root = mkdtempSync(join(tmpdir(), 'zhou-content-assets-'));
    roots.push(root);
    const file = join(root, 'work', 'qa-work-image.png');
    mkdirSync(join(file, '..'), { recursive: true });
    writeFileSync(file, Buffer.from('MZ executable fixture'));
    await expect(inspectSourceAsset(file, 'work/qa-work-image.png')).rejects.toThrow(/MIME|type/i);
  });

  it('parses injected video dimensions and ships an executable ffprobe on both CI hosts', async () => {
    expect(existsSync(ffprobePath)).toBe(true);
    expect(execFileSync(ffprobePath, ['-version'], { encoding: 'utf8' })).toMatch(/ffprobe version/i);
    const spacedRoot = mkdtempSync(join(tmpdir(), 'zhou content assets-'));
    roots.push(spacedRoot);
    const spacedMissingVideo = join(spacedRoot, 'folder with spaces', 'missing.webm');
    await expect(probeVideoDimensions(spacedMissingVideo)).rejects.toThrow();
    const probe = async () => ({ width: 1920, height: 1080 });
    // A valid media header fixture is supplied to file-type; only ffprobe is injected.
    await expect(probe()).resolves.toEqual({ width: 1920, height: 1080 });
  });
});
```

Use these deterministic helpers in the same test file; trailing zero bytes keep the fixture type/dimensions stable while exercising the byte boundary:

```ts
const onePixelPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);
const mp4Header = Buffer.from('000000186674797069736f6d0000020069736f6d69736f32', 'hex');
const sized = (header: Buffer, bytes: number) => Buffer.concat([header, Buffer.alloc(bytes - header.byteLength)]);

it('enforces the exact image and video byte ceilings', async () => {
  const root = mkdtempSync(join(tmpdir(), 'zhou content assets-'));
  roots.push(root);
  const image = join(root, 'work', 'qa-work-image.png');
  const video = join(root, 'work', 'qa-work-video.mp4');
  mkdirSync(join(root, 'work'), { recursive: true });
  writeFileSync(image, sized(onePixelPng, 5 * 1024 * 1024));
  writeFileSync(video, sized(mp4Header, 25 * 1024 * 1024));
  await expect(inspectSourceAsset(image, 'work/qa-work-image.png')).resolves.toMatchObject({ width: 1, height: 1 });
  await expect(
    inspectSourceAsset(video, 'work/qa-work-video.mp4', async () => ({ width: 2, height: 1 })),
  ).resolves.toMatchObject({ width: 2, height: 1 });
  writeFileSync(image, sized(onePixelPng, 5 * 1024 * 1024 + 1));
  writeFileSync(video, sized(mp4Header, 25 * 1024 * 1024 + 1));
  await expect(inspectSourceAsset(image, 'work/qa-work-image.png')).rejects.toThrow(/size/i);
  await expect(
    inspectSourceAsset(video, 'work/qa-work-video.mp4', async () => ({ width: 2, height: 1 })),
  ).rejects.toThrow(/size/i);
  await expect(inspectSourceAsset(image, 'work/qa-work-image.PNG')).rejects.toThrow(/type/i);
  await expect(inspectSourceAsset(image, 'work/qa-work-image.png.exe')).rejects.toThrow(/type/i);
});

it('rejects canonical-looking content with a hidden double extension', async () => {
  const root = mkdtempSync(join(tmpdir(), 'zhou content assets-'));
  roots.push(root);
  const file = join(root, 'work', 'qa-work-foo.exe.png');
  mkdirSync(join(root, 'work'), { recursive: true });
  writeFileSync(file, onePixelPng);
  await expect(auditContentAssets(root)).rejects.toThrow(/canonical/i);
});

it('rejects symlinks, non-regular entries, and resolved paths outside the asset root', async () => {
  const root = mkdtempSync(join(tmpdir(), 'zhou content assets-'));
  roots.push(root);
  const outside = mkdtempSync(join(tmpdir(), 'zhou outside assets-'));
  roots.push(outside);
  mkdirSync(join(root, 'work'), { recursive: true });
  symlinkSync(outside, join(root, 'work', 'qa-work-link'), process.platform === 'win32' ? 'junction' : 'dir');
  await expect(auditContentAssets(root)).rejects.toThrow(/symbolic link/i);
  expect(() => assertRealPathInside(root, outside)).toThrow(/outside/i);
  expect(() =>
    assertRegularAssetEntry({ isSymbolicLink: () => false, isFile: () => false }, 'work/qa-work-device.png'),
  ).toThrow(/regular file/i);
});
```

Do not place fixtures in `src/content` or `src/assets/content`.

- [ ] **Step 3: Run the focused tests and verify RED**

Run:

```bash
npm test -- tests/content-assets.test.ts tests/portfolio-domain.test.ts
```

Expected: FAIL because the registry and source inspector do not exist and portfolio still owns a separate glob root.

- [ ] **Step 4: Implement the runtime registry**

Extend `src/domain/media.ts`:

```ts
export type ContentAsset = {
  source: string;
  src: string;
  width?: number | undefined;
  height?: number | undefined;
  bytes?: number | undefined;
  mime?: string | undefined;
};
export type ContentAssetRegistry = ReadonlyMap<string, ContentAsset>;

export function createContentAssetRegistry(modules: readonly (readonly [string, unknown])[]): ContentAssetRegistry {
  const registry = new Map<string, ContentAsset>();
  for (const [modulePath, imported] of modules) {
    const source = modulePath.replace(/^\/src\/assets\/content\//, '');
    if (source === modulePath || registry.has(source))
      throw new Error(`Duplicate or out-of-root content asset: ${modulePath}`);
    if (typeof imported === 'string') registry.set(source, { source, src: imported });
    else {
      const image = imported as { src: string; width: number; height: number };
      registry.set(source, { source, src: image.src, width: image.width, height: image.height });
    }
  }
  return registry;
}
```

Create `src/domain/content-assets.server.ts`:

```ts
import { createContentAssetRegistry } from './media';

const images = import.meta.glob('/src/assets/content/**/*.{avif,jpeg,jpg,png,webp}', {
  eager: true,
  import: 'default',
});
const videos = import.meta.glob('/src/assets/content/**/*.{mp4,webm}', {
  eager: true,
  import: 'default',
  query: '?url',
});

export const contentAssetRegistry = createContentAssetRegistry([...Object.entries(images), ...Object.entries(videos)]);
```

Modify `portfolio.server.ts` to import `contentAssetRegistry`, adapt its resolver with `registry.get(path)`, and delete only the old `/src/assets/portfolio/` glob. Keep the legacy directory itself; do not remove it in Phase 0.

- [ ] **Step 5: Implement byte, MIME, size, and dimension inspection**

Create `src/domain/content-assets.ts` with an injected video probe for unit isolation and a default `execFile` implementation:

```ts
import { execFile } from 'node:child_process';
import type { Stats } from 'node:fs';
import { lstat, readFile, readdir, realpath } from 'node:fs/promises';
import { extname, isAbsolute, join, relative, sep } from 'node:path';
import { promisify } from 'node:util';
import { fileTypeFromBuffer } from 'file-type';
import ffprobePath from 'ffprobe-static';
import sharp from 'sharp';
import {
  assertCanonicalContentMediaPath,
  IMAGE_EXTENSIONS,
  VIDEO_EXTENSIONS,
  type ContentAssetRegistry,
  type ContentAsset,
} from './media';

const execFileAsync = promisify(execFile);
const IMAGE_LIMIT = 5 * 1024 * 1024;
const VIDEO_LIMIT = 25 * 1024 * 1024;
const expectedMime = new Map([
  ['avif', 'image/avif'],
  ['jpeg', 'image/jpeg'],
  ['jpg', 'image/jpeg'],
  ['png', 'image/png'],
  ['webp', 'image/webp'],
  ['mp4', 'video/mp4'],
  ['webm', 'video/webm'],
]);

export type VideoProbe = (file: string) => Promise<{ width: number; height: number }>;
export const probeVideoDimensions: VideoProbe = async (file) => {
  const { stdout } = await execFileAsync(
    ffprobePath,
    ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'json', file],
    { windowsHide: true },
  );
  const stream = (JSON.parse(stdout) as { streams?: { width?: number; height?: number }[] }).streams?.[0];
  if (!stream?.width || !stream.height) throw new Error(`Video dimensions are unavailable: ${file}`);
  return { width: stream.width, height: stream.height };
};

export async function inspectSourceAsset(
  file: string,
  source: string,
  probeVideo: VideoProbe = probeVideoDimensions,
): Promise<ContentAsset> {
  const bytes = await readFile(file);
  const extension = extname(source).slice(1);
  const detected = await fileTypeFromBuffer(bytes);
  const mime = expectedMime.get(extension);
  if (!mime || detected?.mime !== mime) throw new Error(`Media MIME/type mismatch: ${source}`);
  const image = IMAGE_EXTENSIONS.includes(extension as never);
  const video = VIDEO_EXTENSIONS.includes(extension as never);
  const limit = image ? IMAGE_LIMIT : video ? VIDEO_LIMIT : 0;
  if (!limit || bytes.byteLength > limit) throw new Error(`Media size/type is not allowed: ${source}`);
  const dimensions = image ? await sharp(bytes).metadata() : await probeVideo(file);
  if (!dimensions.width || !dimensions.height) throw new Error(`Media dimensions are unavailable: ${source}`);
  return { source, src: file, bytes: bytes.byteLength, mime, width: dimensions.width, height: dimensions.height };
}

export function assertRealPathInside(rootRealPath: string, candidateRealPath: string): void {
  const path = relative(rootRealPath, candidateRealPath);
  if (path === '..' || path.startsWith(`..${sep}`) || isAbsolute(path)) {
    throw new Error(`Resolved content asset path is outside its root: ${candidateRealPath}`);
  }
}

export function assertRegularAssetEntry(stat: Pick<Stats, 'isSymbolicLink' | 'isFile'>, source: string): void {
  if (stat.isSymbolicLink()) throw new Error(`Content assets must not be symbolic links: ${source}`);
  if (!stat.isFile()) throw new Error(`Content assets must be regular files: ${source}`);
}

async function walk(rootRealPath: string, directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const file = join(directory, entry.name);
    const stat = await lstat(file);
    if (stat.isSymbolicLink()) throw new Error(`Content assets must not be symbolic links: ${file}`);
    const resolved = await realpath(file);
    assertRealPathInside(rootRealPath, resolved);
    if (stat.isDirectory()) files.push(...(await walk(rootRealPath, file)));
    else {
      assertRegularAssetEntry(stat, file);
      files.push(file);
    }
  }
  return files;
}

export async function discoverContentAssetFiles(root: string): Promise<string[]> {
  const rootStat = await lstat(root);
  if (rootStat.isSymbolicLink()) throw new Error(`Content asset root must not be a symbolic link: ${root}`);
  const rootRealPath = await realpath(root);
  return walk(rootRealPath, root);
}

export async function auditContentAssets(
  root: string,
  inspect: (file: string, source: string) => Promise<ContentAsset> = inspectSourceAsset,
): Promise<ContentAssetRegistry> {
  const registry = new Map<string, ContentAsset>();
  const rootRealPath = await realpath(root);
  for (const file of await discoverContentAssetFiles(root)) {
    assertRealPathInside(rootRealPath, await realpath(file));
    const source = relative(root, file).split(sep).join('/');
    if (source.endsWith('/.gitkeep')) continue;
    assertCanonicalContentMediaPath(source);
    const asset = await inspect(file, source);
    if (registry.has(source)) throw new Error(`Duplicate content asset: ${source}`);
    registry.set(source, asset);
  }
  return registry;
}
```

The `.gitkeep` files are the only path-validation exception and are still required to be ordinary, in-root, non-symlink files. Every other discovered file is validated by `assertCanonicalContentMediaPath` before MIME inspection, even when no content record references it; therefore a malformed orphan cannot hide behind orphan-report-only behavior.

- [ ] **Step 6: Add namespace directories and cross-platform focused checks**

Create only `.gitkeep` files under the four `src/assets/content/<collection>/` directories. Add a dedicated `content-audit-matrix` job to `.github/workflows/ci.yml`; do not rely on the Windows visual job as a substitute:

```yaml
content-audit-matrix:
  strategy:
    fail-fast: false
    matrix:
      os: [ubuntu-latest, windows-latest]
      node: [22.12.0, 24]
  runs-on: ${{ matrix.os }}
  timeout-minutes: 30
  permissions:
    contents: read
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node }}
        cache: npm
    - run: npm ci
    - run: npm test -- tests/content-assets.test.ts
```

All four cells are required: Node 22.12.0 and Node 24 on both Linux and Windows. At this independently reviewable task boundary, `tests/content-assets.test.ts` exercises ffprobe resolution, a path containing spaces, symlink/non-regular/realpath boundaries, canonical orphan paths, magic bytes, sizes, and dimensions. Task 9 extends this same matrix with the composed `audit:content` command after that command exists.

- [ ] **Step 7: Verify GREEN and dependency safety**

Run:

```bash
npm test -- tests/content-assets.test.ts tests/portfolio-domain.test.ts
npm run check
npm run lint
npm audit --omit=dev --audit-level=high
npm audit --audit-level=high
```

Expected: all commands PASS; ffprobe version executes without shell quoting; the asset registry root is `/src/assets/content/`; `src/assets/portfolio/.gitkeep` still exists.

- [ ] **Step 8: Commit Task 5**

```bash
git add package.json package-lock.json src/assets/content src/domain/content-assets.server.ts src/domain/content-assets.ts src/domain/media.ts src/domain/portfolio.server.ts tests/content-assets.test.ts tests/portfolio-domain.test.ts .github/workflows/ci.yml
git commit -m "feat: audit shared content assets"
```

### Task 6: Validate Markdown and MDX Media Through an AST

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/domain/markdown-media.ts`
- Create: `tests/markdown-media.test.ts`

**Interfaces:**

- Produces: `MarkdownMediaIssue`, `validateMarkdownMedia(body, declaredSources, format): readonly MarkdownMediaIssue[]`, and `assertMarkdownMedia(body, declaredSources, format): void`.
- `format` is `'md' | 'mdx'`; both parse real syntax trees. Image-reference definitions resolve before declaration checks.
- Rejects: HTTP/HTTPS/protocol-relative/data media, raw HTML media, MDX JSX media, empty alt, unresolved image references, and local sources absent from the entry's declared structured media.

- [ ] **Step 1: Install the pinned AST packages**

Run:

```bash
npm install --save-dev --save-exact unified@11.0.5 remark-parse@11.0.0 remark-mdx@3.1.1 unist-util-visit@5.1.0 @types/mdast@4.0.4
```

Expected: only `devDependencies` and `package-lock.json` change; no client framework or Markdown renderer is added.

- [ ] **Step 2: Write the failing AST matrix**

Create `tests/markdown-media.test.ts`:

```ts
// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { validateMarkdownMedia } from '../src/domain/markdown-media';

const declared = ['notes/qa-note-diagram.webp'];

describe('Markdown media AST validation', () => {
  it.each([
    ['remote', '![Remote](https://cdn.example/image.png)', /remote/i],
    ['protocol-relative', '![Remote](//cdn.example/image.png)', /remote/i],
    ['data', '![Inline](data:image/png;base64,AAAA)', /remote/i],
    ['empty alt', '![](notes/qa-note-diagram.webp)', /alt/i],
    ['whitespace alt', '![   ](notes/qa-note-diagram.webp)', /alt/i],
    ['undeclared', '![Diagram](notes/qa-note-other.webp)', /declared/i],
    ['raw image', '<img src="notes/qa-note-diagram.webp" alt="Diagram">', /raw/i],
    ['raw video', '<video src="notes/qa-note-demo.webm"></video>', /raw/i],
    ['iframe', '<iframe src="https://example.com"></iframe>', /raw/i],
    ['script', '<script>alert(1)</script>', /raw/i],
  ])('rejects %s media', (_name, body, issue) => {
    expect(
      validateMarkdownMedia(body, declared, 'md')
        .map((item) => item.message)
        .join('\n'),
    ).toMatch(issue);
  });

  it('accepts declared inline and reference images with non-empty alt', () => {
    const body =
      '![Diagram](notes/qa-note-diagram.webp)\n\n![Reference][diagram]\n\n[diagram]: notes/qa-note-diagram.webp';
    expect(validateMarkdownMedia(body, declared, 'md')).toEqual([]);
  });

  it('rejects MDX media elements while retaining MDX parsing', () => {
    expect(
      validateMarkdownMedia('<img src="notes/qa-note-diagram.webp" alt="Diagram" />', declared, 'mdx')[0]?.message,
    ).toMatch(/raw/i);
  });
});
```

- [ ] **Step 3: Run the test and verify RED**

Run:

```bash
npm test -- tests/markdown-media.test.ts
```

Expected: FAIL because `markdown-media.ts` does not exist.

- [ ] **Step 4: Implement the AST validator with reference resolution**

Create `src/domain/markdown-media.ts`:

```ts
import type { Definition, Image, ImageReference, Root } from 'mdast';
import { unified } from 'unified';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';

export type MarkdownMediaIssue = { code: 'remote' | 'raw' | 'alt' | 'undeclared' | 'reference'; message: string };

function isRemote(value: string): boolean {
  return /^(?:https?:)?\/\//i.test(value) || /^data:/i.test(value);
}

export function validateMarkdownMedia(
  body: string,
  declaredSources: readonly string[],
  format: 'md' | 'mdx',
): readonly MarkdownMediaIssue[] {
  const pipeline = unified().use(remarkParse);
  if (format === 'mdx') pipeline.use(remarkMdx);
  const tree = pipeline.parse(body) as Root;
  const declared = new Set(declaredSources);
  const definitions = new Map<string, Definition>();
  const issues: MarkdownMediaIssue[] = [];

  visit(tree, 'definition', (node: Definition) => definitions.set(node.identifier.toLowerCase(), node));

  const check = (alt: string | null | undefined, url: string): void => {
    if (!alt?.trim()) issues.push({ code: 'alt', message: `Markdown image alt text is required: ${url}` });
    if (isRemote(url)) issues.push({ code: 'remote', message: `Remote/data Markdown media is forbidden: ${url}` });
    else if (!declared.has(url))
      issues.push({ code: 'undeclared', message: `Markdown media must be declared by the entry: ${url}` });
  };

  visit(tree, 'image', (node: Image) => check(node.alt, node.url));
  visit(tree, 'imageReference', (node: ImageReference) => {
    const definition = definitions.get(node.identifier.toLowerCase());
    if (!definition)
      issues.push({ code: 'reference', message: `Markdown image reference does not resolve: ${node.identifier}` });
    else check(node.alt, definition.url);
  });
  visit(tree, 'html', (node: { value: string }) => {
    if (/<\/?(?:img|picture|source|video|audio|iframe|script)\b/i.test(node.value))
      issues.push({ code: 'raw', message: 'Raw HTML media, iframe, and script elements are forbidden.' });
  });
  visit(tree, (node: { type: string; name?: string | null }) => {
    if (/^mdxJsx/.test(node.type) && /^(?:img|picture|source|video|audio|iframe|script)$/i.test(node.name ?? '')) {
      issues.push({ code: 'raw', message: 'Raw MDX media, iframe, and script elements are forbidden.' });
    }
  });
  return issues;
}

export function assertMarkdownMedia(body: string, declaredSources: readonly string[], format: 'md' | 'mdx'): void {
  const issues = validateMarkdownMedia(body, declaredSources, format);
  if (issues.length) throw new Error(issues.map((issue) => issue.message).join('\n'));
}
```

- [ ] **Step 5: Verify code-fence and CRLF behavior**

Add the exact code-fence and newline cases:

````ts
it('ignores media-looking text in code and treats LF/CRLF identically', () => {
  const fenced = '```html\n<img src="https://cdn.example/image.png">\n```';
  const lf = '![Diagram][diagram]\n\n[diagram]: notes/qa-note-diagram.webp';
  expect(validateMarkdownMedia(fenced, declared, 'md')).toEqual([]);
  expect(validateMarkdownMedia(lf, declared, 'md')).toEqual([]);
  expect(validateMarkdownMedia(lf.replaceAll('\n', '\r\n'), declared, 'md')).toEqual([]);
});
````

Then run:

```bash
npm test -- tests/markdown-media.test.ts
npm run check
npm run lint
```

Expected: PASS; raw tags outside code fail, code fences do not, and LF/CRLF results are identical.

- [ ] **Step 6: Commit Task 6**

```bash
git add package.json package-lock.json src/domain/markdown-media.ts tests/markdown-media.test.ts
git commit -m "feat: validate markdown media AST"
```

### Task 7: Block Unsafe Cross-Content Deletion and Report Orphan Assets

**Files:**

- Create: `src/domain/content-references.ts`
- Create: `tests/content-references.test.ts`
- Modify: `tests/portfolio-domain.test.ts`

**Interfaces:**

- Produces: `ContentKey = '<collection>:<slug>'`, `ContentRecord`, `ContentReference`, `ContentReferenceGraph`, `buildContentReferenceGraph(records, assetSources)`, `assertReferenceSafe(graph): void`, and `reportOrphanAssets(graph): readonly string[]`.
- Entry reference: `portfolio.relatedProject` resolves to exactly one current `work` or `lab` record.
- Asset references: every media `source` and every video `poster` resolves to one current registry key. Missing targets are blockers; assets with no inbound reference are sorted report entries, not deletions and not publication failures.

- [ ] **Step 1: Write the failing graph and deletion cases**

Create `tests/content-references.test.ts`:

```ts
// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  assertReferenceSafe,
  buildContentReferenceGraph,
  reportOrphanAssets,
  type ContentRecord,
} from '../src/domain/content-references';

const work: ContentRecord = {
  collection: 'work',
  slug: 'qa-work',
  media: [
    {
      type: 'image',
      source: 'work/qa-work-overview.webp',
      alt: 'QA',
      caption: 'QA',
      width: 2,
      height: 1,
      license: 'owned',
    },
  ],
};
const portfolio: ContentRecord = {
  collection: 'portfolio',
  slug: 'qa-series',
  relatedProject: 'qa-work',
  media: [
    {
      type: 'image',
      source: 'portfolio/qa-series-overview.webp',
      alt: 'QA',
      caption: 'QA',
      width: 2,
      height: 1,
      license: 'owned',
    },
  ],
};

describe('content reference graph', () => {
  it('resolves project and asset references', () => {
    const graph = buildContentReferenceGraph(
      [work, portfolio],
      ['work/qa-work-overview.webp', 'portfolio/qa-series-overview.webp'],
    );
    expect(() => assertReferenceSafe(graph)).not.toThrow();
    expect(graph.references).toContainEqual({ from: 'portfolio:qa-series', to: 'work:qa-work', kind: 'entry' });
  });

  it('blocks deleting a referenced project', () => {
    const graph = buildContentReferenceGraph([portfolio], ['portfolio/qa-series-overview.webp']);
    expect(() => assertReferenceSafe(graph)).toThrow(/qa-work/);
  });

  it('blocks deleting a referenced source or video poster', () => {
    const video: ContentRecord = {
      collection: 'lab',
      slug: 'qa-lab',
      media: [
        {
          type: 'video',
          source: 'lab/qa-lab-demo.webm',
          poster: 'lab/qa-lab-poster.webp',
          alt: 'QA',
          caption: 'QA',
          width: 2,
          height: 1,
          license: 'owned',
        },
      ],
    };
    expect(() => assertReferenceSafe(buildContentReferenceGraph([video], ['lab/qa-lab-demo.webm']))).toThrow(/poster/);
  });

  it('reports orphans in stable order without failing or deleting', () => {
    const graph = buildContentReferenceGraph(
      [work],
      ['work/qa-work-z.webp', 'work/qa-work-overview.webp', 'work/qa-work-a.webp'],
    );
    expect(reportOrphanAssets(graph)).toEqual(['work/qa-work-a.webp', 'work/qa-work-z.webp']);
    expect(() => assertReferenceSafe(graph)).not.toThrow();
  });

  it('rejects an ambiguous project slug across work and lab', () => {
    const lab = { ...work, collection: 'lab' as const };
    expect(() => buildContentReferenceGraph([work, lab, portfolio], ['work/qa-work-overview.webp'])).toThrow(
      /ambiguous/i,
    );
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
npm test -- tests/content-references.test.ts tests/portfolio-domain.test.ts
```

Expected: FAIL because the graph interfaces do not exist.

- [ ] **Step 3: Implement the pure graph**

Create `src/domain/content-references.ts`:

```ts
import type { MediaReference } from './media';
import type { ContentCollectionName } from './publication';

export type ContentKey = `${ContentCollectionName}:${string}`;
export type ContentRecord = {
  collection: ContentCollectionName;
  slug: string;
  media: readonly MediaReference[];
  relatedProject?: string | undefined;
};
export type ContentReference = { from: ContentKey; to: ContentKey | string; kind: 'entry' | 'source' | 'poster' };
export type ContentReferenceGraph = {
  entries: ReadonlySet<ContentKey>;
  assets: ReadonlySet<string>;
  references: readonly ContentReference[];
  unresolved: readonly ContentReference[];
  referencedAssets: ReadonlySet<string>;
};

const contentKey = (record: Pick<ContentRecord, 'collection' | 'slug'>): ContentKey =>
  `${record.collection}:${record.slug}`;

export function buildContentReferenceGraph(
  records: readonly ContentRecord[],
  assetSources: readonly string[],
): ContentReferenceGraph {
  const entries = new Set(records.map(contentKey));
  const assets = new Set(assetSources);
  const references: ContentReference[] = [];
  const projectTargets = new Map<string, ContentKey[]>();
  for (const record of records.filter((item) => item.collection === 'work' || item.collection === 'lab')) {
    const targets = projectTargets.get(record.slug) ?? [];
    targets.push(contentKey(record));
    projectTargets.set(record.slug, targets);
  }
  for (const [slug, targets] of projectTargets)
    if (targets.length > 1) throw new Error(`Ambiguous project slug: ${slug}`);

  for (const record of records) {
    const from = contentKey(record);
    if (record.collection === 'portfolio' && record.relatedProject) {
      const [target] = projectTargets.get(record.relatedProject) ?? [];
      references.push({ from, to: target ?? `work:${record.relatedProject}`, kind: 'entry' });
    }
    for (const media of record.media) {
      references.push({ from, to: media.source, kind: 'source' });
      if (media.type === 'video') references.push({ from, to: media.poster, kind: 'poster' });
    }
  }
  const referencedAssets = new Set(
    references.filter((reference) => reference.kind !== 'entry').map((reference) => String(reference.to)),
  );
  const unresolved = references.filter((reference) =>
    reference.kind === 'entry' ? !entries.has(reference.to as ContentKey) : !assets.has(String(reference.to)),
  );
  return { entries, assets, references, unresolved, referencedAssets };
}

export function assertReferenceSafe(graph: ContentReferenceGraph): void {
  if (!graph.unresolved.length) return;
  throw new Error(
    graph.unresolved
      .map((reference) => `${reference.kind} reference from ${reference.from} does not resolve: ${reference.to}`)
      .join('\n'),
  );
}

export function reportOrphanAssets(graph: ContentReferenceGraph): readonly string[] {
  return [...graph.assets]
    .filter((asset) => !graph.referencedAssets.has(asset))
    .sort((left, right) => left.localeCompare(right, 'en'));
}
```

- [ ] **Step 4: Add update/delete edge cases**

Add tests that simulate the post-change repository state for: deleting an unreferenced work entry (passes), deleting a related work entry (fails), changing a published slug while portfolio still uses the old slug (fails), deleting an image used only as a video poster (fails), and leaving an unused asset (reports but passes). The graph intentionally needs only current state; no destructive filesystem operation is part of this task.

- [ ] **Step 5: Verify GREEN**

Run:

```bash
npm test -- tests/content-references.test.ts tests/portfolio-domain.test.ts
npm run check
```

Expected: PASS; all unresolved references include source and target in the error; orphan order is deterministic.

- [ ] **Step 6: Commit Task 7**

```bash
git add src/domain/content-references.ts tests/content-references.test.ts tests/portfolio-domain.test.ts
git commit -m "feat: enforce content reference safety"
```

### Task 8: Establish the CMS-Neutral Astro Schema Contract

**Files:**

- Create: `src/domain/content-contract.ts`
- Create: `tests/content-contract.test.ts`
- Create: `tests/fixtures/content-contract/site-profile.md`
- Create: `tests/fixtures/content-contract/work.md`
- Create: `tests/fixtures/content-contract/lab.md`
- Create: `tests/fixtures/content-contract/notes.md`
- Create: `tests/fixtures/content-contract/portfolio.md`

**Interfaces:**

- Produces: `ContractCollection`, `ContractField`, `CONTENT_CONTRACT`, `schemaForContractCollection(name)`, and `parseContractFixture(name, source)`.
- This is declarative CMS-neutral metadata only. It contains no Decap widget, backend, admin URL, OAuth origin, repository, branch, or token field.
- Phase 1 may translate this contract to Decap. It may not independently restate names, defaults, enum values, directories, or extensions.

- [ ] **Step 1: Write a failing exact contract test**

Create `tests/content-contract.test.ts`:

```ts
// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CONTENT_CONTRACT, parseContractFixture } from '../src/domain/content-contract';

describe('CMS-neutral Astro content contract', () => {
  it('fixes collection kind, source, extension, and create policy', () => {
    expect(CONTENT_CONTRACT).toMatchObject({
      site: { kind: 'singleton', source: 'src/content/site/profile.md', extension: 'md', create: false },
      work: { kind: 'folder', source: 'src/content/work', extension: 'md', create: true },
      lab: { kind: 'folder', source: 'src/content/lab', extension: 'md', create: true },
      notes: { kind: 'folder', source: 'src/content/notes', extension: 'md', create: true },
      portfolio: { kind: 'folder', source: 'src/content/portfolio', extension: 'md', create: true },
    });
  });

  it.each(['site', 'work', 'lab', 'notes', 'portfolio'] as const)(
    'parses the serialized %s fixture with its Astro schema',
    (collection) => {
      const source = readFileSync(
        resolve('tests/fixtures/content-contract', `${collection === 'site' ? 'site-profile' : collection}.md`),
        'utf8',
      );
      expect(parseContractFixture(collection, source)).toBeDefined();
    },
  );

  it('keeps defaults and enums aligned', () => {
    expect(CONTENT_CONTRACT.work.fields.find((field) => field.path === 'draft')?.default).toBe(true);
    expect(CONTENT_CONTRACT.work.fields.find((field) => field.path === 'status')?.enum).toEqual([
      'prototype',
      'validated',
      'shipped',
      'archived',
    ]);
    expect(CONTENT_CONTRACT.portfolio.fields.find((field) => field.path === 'items[].license')?.enum).toEqual([
      'owned',
      'licensed',
      'cc-by',
      'public-domain',
    ]);
  });

  it('contains no admin, provider, credential, or private identity contract', () => {
    const serialized = JSON.stringify(CONTENT_CONTRACT);
    expect(serialized).not.toMatch(
      /decap|oauth|token|secret|password|phone|school|legalName|employer|client|testimonial/i,
    );
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
npm test -- tests/content-contract.test.ts
```

Expected: FAIL because `content-contract.ts` and serialized fixtures do not exist.

- [ ] **Step 3: Define the generic contract types and field matrices**

Create `src/domain/content-contract.ts` with these types:

```ts
import matter from 'gray-matter';
import { labSchema, noteSchema, portfolioSchema, siteProfileSchema, workSchema } from './content-schema';

export type ContractCollection = 'site' | 'work' | 'lab' | 'notes' | 'portfolio';
export type ContractField = {
  path: string;
  type: 'string' | 'text' | 'date' | 'boolean' | 'number' | 'string-list' | 'object-list' | 'media-list';
  required: 'always' | 'publish' | 'optional';
  default?: unknown;
  enum?: readonly string[];
};
type CollectionContract = {
  kind: 'singleton' | 'folder';
  source: string;
  extension: 'md';
  create: boolean;
  fields: readonly ContractField[];
};
const field = (
  path: string,
  type: ContractField['type'],
  required: ContractField['required'],
  options: Pick<ContractField, 'default' | 'enum'> = {},
): ContractField => ({ path, type, required, ...options });
```

Populate `CONTENT_CONTRACT` with every field below; do not omit nested media or attestation paths:

| Collection                     | Required always                                                                                                                                                                                      | Required to publish                                                                   | Optional/default/enum                                                                                                                                                                          |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `site`                         | `heroEyebrow`, `heroTitle`, `role`, `heroSummary`, `positioning`, `capabilities`, `method`, `principles`, `currentStatus`, `trustBoundary`, `contacts[].label`, `contacts[].kind`, `contacts[].href` | none                                                                                  | `contacts[].kind` enum `github,email,website`                                                                                                                                                  |
| shared folder fields           | `slug`, `title`, `summary`, `publishedAt`, `attestation.authenticityConfirmed`, `attestation.rightsConfirmed`                                                                                        | `attestation.reviewedAt`                                                              | `updatedAt`; `draft=true`; confirmations `false`; `attestation.evidenceUrls=[]`                                                                                                                |
| `work`                         | `problem`, `role`, `solution`, `stack`, `contributions`, `status`                                                                                                                                    | none                                                                                  | `status` enum `prototype,validated,shipped,archived`; `featured=false`; `repositoryUrl`, `demoUrl`, `architecture`, `constraints`; `media=[]`, `outcomes=[]`, `limitations=[]`, `nextSteps=[]` |
| `lab`                          | `hypothesis`, `workflow`, `modelOrTools`, `status`                                                                                                                                                   | `result`, `evaluation`                                                                | `status` enum `prototype,validated,archived`; `repositoryUrl`, `demoUrl`; `media=[]`; draft `result=''`, `evaluation=''`                                                                       |
| `notes`                        | `tags`                                                                                                                                                                                               | none                                                                                  | `media=[]`; Markdown body is outside frontmatter fields                                                                                                                                        |
| `portfolio`                    | `order`, `status`, `items`                                                                                                                                                                           | none                                                                                  | `status` enum `published,archived`; `relatedProject` optional                                                                                                                                  |
| every `media[]`/`items[]` item | `type`, `source`, `alt`, `caption`, `width`, `height`, `license`                                                                                                                                     | video `poster`; licensed/cc-by `credit` and `licenseUrl`; public-domain `evidenceUrl` | `type` enum `image,video`; `license` enum `owned,licensed,cc-by,public-domain`; optional provenance fields remain HTTPS when supplied                                                          |

Use one `sharedFields` constant and one `mediaFields(prefix)` function so all folder contracts consume the exact same nested field definitions. The finished object must satisfy:

```ts
export const CONTENT_CONTRACT = {
  site: {
    kind: 'singleton',
    source: 'src/content/site/profile.md',
    extension: 'md',
    create: false,
    fields: siteFields,
  },
  work: {
    kind: 'folder',
    source: 'src/content/work',
    extension: 'md',
    create: true,
    fields: [...sharedFields, ...workFields, ...mediaFields('media[]')],
  },
  lab: {
    kind: 'folder',
    source: 'src/content/lab',
    extension: 'md',
    create: true,
    fields: [...sharedFields, ...labFields, ...mediaFields('media[]')],
  },
  notes: {
    kind: 'folder',
    source: 'src/content/notes',
    extension: 'md',
    create: true,
    fields: [
      ...sharedFields,
      field('tags', 'string-list', 'always'),
      field('media', 'media-list', 'optional', { default: [] }),
      ...mediaFields('media[]'),
    ],
  },
  portfolio: {
    kind: 'folder',
    source: 'src/content/portfolio',
    extension: 'md',
    create: true,
    fields: [...sharedFields, ...portfolioFields, ...mediaFields('items[]')],
  },
} as const satisfies Record<ContractCollection, CollectionContract>;
```

Add parser functions:

```ts
const schemas = {
  site: siteProfileSchema,
  work: workSchema,
  lab: labSchema,
  notes: noteSchema,
  portfolio: portfolioSchema,
} as const;
export function schemaForContractCollection(name: ContractCollection) {
  return schemas[name];
}
export function parseContractFixture(name: ContractCollection, source: string): unknown {
  return schemas[name].parse(matter(source).data);
}
```

- [ ] **Step 4: Add QA-only serialized fixtures outside production collections**

Create `tests/fixtures/content-contract/site-profile.md` by copying the Task 1 singleton frontmatter exactly and adding only this non-rendered test body after the closing delimiter:

```markdown
QA fixture; never publish.
```

Create `tests/fixtures/content-contract/work.md`:

```markdown
---
slug: qa-entry
title: QA schema entry
summary: Schema fixture field.
publishedAt: 2026-07-19
draft: true
attestation:
  authenticityConfirmed: false
  rightsConfirmed: false
  evidenceUrls: []
problem: Schema fixture field.
role: Schema fixture field.
solution: Schema fixture field.
stack: [qa]
contributions: [Schema fixture field.]
status: prototype
featured: false
media: []
outcomes: []
limitations: []
nextSteps: []
---

QA fixture; never publish.
```

Create `tests/fixtures/content-contract/lab.md`:

```markdown
---
slug: qa-entry
title: QA schema entry
summary: Schema fixture field.
publishedAt: 2026-07-19
draft: true
attestation:
  authenticityConfirmed: false
  rightsConfirmed: false
  evidenceUrls: []
hypothesis: Schema fixture field.
workflow: [Schema fixture field.]
modelOrTools: [qa]
result: ''
evaluation: ''
status: prototype
media: []
---

QA fixture; never publish.
```

Create `tests/fixtures/content-contract/notes.md`:

```markdown
---
slug: qa-entry
title: QA schema entry
summary: Schema fixture field.
publishedAt: 2026-07-19
draft: true
attestation:
  authenticityConfirmed: false
  rightsConfirmed: false
  evidenceUrls: []
tags: [qa]
media: []
---

QA fixture; never publish.
```

Create `tests/fixtures/content-contract/portfolio.md`:

```markdown
---
slug: qa-entry
title: QA schema entry
summary: Schema fixture field.
publishedAt: 2026-07-19
draft: true
attestation:
  authenticityConfirmed: false
  rightsConfirmed: false
  evidenceUrls: []
order: 0
status: published
items:
  - type: image
    source: portfolio/qa-entry-overview.webp
    alt: QA-only image description.
    caption: QA-only schema fixture.
    width: 2
    height: 1
    license: owned
---

QA fixture; never publish.
```

The portfolio fixture intentionally creates no asset because this test validates serialization/schema only. Add path helpers that treat `[]` as fixture index `0`:

```ts
const tokens = (path: string) => path.replaceAll('[]', '.0').split('.');
const getPath = (value: unknown, path: string): unknown =>
  tokens(path).reduce<unknown>((cursor, key) => (cursor as Record<string, unknown>)[key], value);
const setPath = (value: unknown, path: string, next: unknown): void => {
  const parts = tokens(path);
  const last = parts.pop();
  const owner = parts.reduce<Record<string, unknown>>(
    (cursor, key) => cursor[key] as Record<string, unknown>,
    value as Record<string, unknown>,
  );
  if (last) owner[last] = next;
};
const deletePath = (value: unknown, path: string): void => {
  const parts = tokens(path);
  const last = parts.pop();
  const owner = parts.reduce<Record<string, unknown>>(
    (cursor, key) => cursor[key] as Record<string, unknown>,
    value as Record<string, unknown>,
  );
  if (last) delete owner[last];
};
```

For every contract fixture, mutate a clone and assert: fields marked `required: 'always'` with no default fail structural Zod parsing when removed; each enum fails with `invalid-contract-value`; and each defaulted field yields the declared default when removed. For folder fixtures, parse first, then call `assertPublishable(parsed, new Date('2026-07-20T00:00:00.000Z'))`; `draft: false` without every publish-required field must fail that domain assertion rather than time-dependent Zod parsing. This executes the matrix rather than merely snapshotting it.

- [ ] **Step 5: Verify GREEN and production isolation**

Run:

```bash
npm test -- tests/content-contract.test.ts tests/content-schema.test.ts
npm run check
npm run build
npm run audit:production
```

Expected: PASS; fixture strings do not appear under `dist/`; the four real public folder collections remain `.gitkeep`-only.

- [ ] **Step 6: Commit Task 8**

```bash
git add src/domain/content-contract.ts tests/content-contract.test.ts tests/fixtures/content-contract
git commit -m "test: establish content schema contract"
```

### Task 9: Compose the Repository Audit and Wire Every Release Gate

**Files:**

- Create: `src/domain/content-audit.ts`
- Create: `scripts/content-audit.ts`
- Create: `tests/content-audit.test.ts`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/deploy.yml`
- Modify: `tests/tooling-contracts.test.ts`
- Modify: `tests/delivery-boundary.test.ts`
- Verify without modification unless a regression is found: `scripts/production-audit.mjs`
- Verify without modification unless a regression is found: `e2e/specs/empty-routes.spec.ts`
- Verify without modification unless a regression is found: `e2e/specs/production-isolation.spec.ts`

**Interfaces:**

- Produces: `ContentAuditOptions`, `ContentAuditReport`, `GitMediaChange`, `GitMediaDelta`, `parseGitMediaChanges(output): readonly GitMediaChange[]`, `auditContentRepository(options): Promise<ContentAuditReport>`, `auditMediaGitChanges(changes, currentSizes): GitMediaDelta`, and CLI `npm run audit:content -- [--base-ref <git-ref>]`.
- Audit order: singleton/schema → slug/attestation → media ownership → Markdown/MDX AST → byte/MIME/size/dimensions → reference resolution → orphan report → optional Git media-diff policy.
- Git media policy: additions in one PR total at most 50 MiB; modifying/overwriting an existing content asset fails; renames are explicit delete-and-add and remain subject to references and size.

- [ ] **Step 1: Write a failing end-to-end repository audit test**

Create `tests/content-audit.test.ts` using temporary directories only:

```ts
// @vitest-environment node
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { auditContentRepository, auditMediaGitChanges, parseGitMediaChanges } from '../src/domain/content-audit';

const roots: string[] = [];
const approvedProfileFixture = readFileSync(resolve('tests/fixtures/content-contract/site-profile.md'), 'utf8');
afterEach(() => {
  while (roots.length) rmSync(roots.pop()!, { recursive: true, force: true });
});

describe('repository content audit', () => {
  it('rejects overwrites and media additions above 50 MiB', () => {
    expect(() =>
      auditMediaGitChanges([{ status: 'M', path: 'src/assets/content/work/qa-work-image.webp' }], new Map()),
    ).toThrow(/overwrite/i);
    expect(() =>
      auditMediaGitChanges(
        [
          { status: 'A', path: 'src/assets/content/work/qa-work-a.webp' },
          { status: 'A', path: 'src/assets/content/work/qa-work-b.webp' },
        ],
        new Map([
          ['src/assets/content/work/qa-work-a.webp', 30 * 1024 * 1024],
          ['src/assets/content/work/qa-work-b.webp', 21 * 1024 * 1024],
        ]),
      ),
    ).toThrow(/50 MiB/i);
  });

  it('fails closed when an added or renamed asset has no current stat', () => {
    expect(() =>
      auditMediaGitChanges([{ status: 'A', path: 'src/assets/content/work/qa-work-new.webp' }], new Map()),
    ).toThrow(/size|stat/i);
    expect(() =>
      auditMediaGitChanges(
        [
          {
            status: 'R',
            similarity: 100,
            oldPath: 'src/assets/content/work/qa-work-old.webp',
            newPath: 'src/assets/content/work/qa-work-new.webp',
          },
        ],
        new Map(),
      ),
    ).toThrow(/size|stat/i);
  });

  it('parses R100 old/new paths and returns add/delete sides separately', () => {
    const changes = parseGitMediaChanges(
      'R100\tsrc/assets/content/work/qa-work-old.webp\tsrc/assets/content/work/qa-work-new.webp\n',
    );
    expect(changes).toEqual([
      {
        status: 'R',
        similarity: 100,
        oldPath: 'src/assets/content/work/qa-work-old.webp',
        newPath: 'src/assets/content/work/qa-work-new.webp',
      },
    ]);
    expect(auditMediaGitChanges(changes, new Map([['src/assets/content/work/qa-work-new.webp', 1024]]))).toEqual({
      addedPaths: ['src/assets/content/work/qa-work-new.webp'],
      deletedPaths: ['src/assets/content/work/qa-work-old.webp'],
      addedBytes: 1024,
    });
  });

  it('returns deterministic orphan reporting for an otherwise valid empty publication repository', async () => {
    const root = mkdtempSync(join(tmpdir(), 'zhou-content-audit-'));
    roots.push(root);
    for (const path of [
      'src/content/site',
      'src/content/work',
      'src/content/lab',
      'src/content/notes',
      'src/content/portfolio',
      'src/assets/content/work',
      'src/assets/content/lab',
      'src/assets/content/notes',
      'src/assets/content/portfolio',
    ])
      mkdirSync(join(root, path), { recursive: true });
    writeFileSync(join(root, 'src/content/site/profile.md'), approvedProfileFixture, 'utf8');
    const report = await auditContentRepository({
      root,
      inspectAsset: async () => {
        throw new Error('No assets expected.');
      },
    });
    expect(report.entryCounts).toEqual({ work: 0, lab: 0, notes: 0, portfolio: 0 });
    expect(report.orphanAssets).toEqual([]);
  });
});
```

Add focused temporary-repository failures for: filename/slug mismatch, non-draft missing rights, undeclared Markdown image, declared missing asset, wrong declared dimensions, deleted related project, and malformed site singleton. Use the approved profile fixture from `tests/fixtures/content-contract/site-profile.md`; do not create another profile claim.

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
npm test -- tests/content-audit.test.ts tests/tooling-contracts.test.ts tests/delivery-boundary.test.ts
```

Expected: FAIL because the composed audit and package/workflow command do not exist.

- [ ] **Step 3: Implement source loading and audit composition**

Create `src/domain/content-audit.ts`. Its public types are:

```ts
import type { ContentAsset, ContentAssetRegistry } from './media';

export type ContentAuditOptions = {
  root: string;
  now?: Date;
  inspectAsset?: (file: string, source: string) => Promise<ContentAsset>;
  deletedAssetSources?: readonly string[];
};
export type ContentAuditReport = {
  entryCounts: Record<'work' | 'lab' | 'notes' | 'portfolio', number>;
  assetCount: number;
  orphanAssets: readonly string[];
};
export type GitMediaChange =
  | { status: 'A' | 'M' | 'D'; path: string }
  | { status: 'R' | 'C'; similarity: number; oldPath: string; newPath: string };
export type GitMediaDelta = { addedPaths: readonly string[]; deletedPaths: readonly string[]; addedBytes: number };
```

Use `gray-matter` to read UTF-8 `.md`/`.mdx` files. Derive `id` from the filename without extension, reject nested paths, parse through the corresponding schema, then call the exact Task 3–7 interfaces:

```ts
assertEntrySlug(collection, id, data.slug);
assertPublishable(data, options.now);
const media = mediaReferencesFor(collection, data.slug, data);
if (collection === 'notes')
  assertMarkdownMedia(
    body,
    media.map((item) => item.source),
    extension === '.mdx' ? 'mdx' : 'md',
  );
records.push({
  collection,
  slug: data.slug,
  media,
  relatedProject: collection === 'portfolio' ? data.relatedProject : undefined,
});
```

Build the asset registry with `auditContentAssets`, then for every media source and poster assert registry presence and exact width/height. Build the graph; before returning, reject any `options.deletedAssetSources` still present in `graph.referencedAssets`, call `assertReferenceSafe`, and return `reportOrphanAssets(graph)`. Thus the old side of a rename is treated as a deletion by the same reference policy, while the new side is a byte-counted addition. Parse `src/content/site/profile.md` separately with `siteProfileSchema` and fail if any second file exists in `src/content/site`.

Implement the Git policy without filesystem mutation:

```ts
const PR_MEDIA_LIMIT = 50 * 1024 * 1024;
export function parseGitMediaChanges(output: string): readonly GitMediaChange[] {
  return output
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const [rawStatus, firstPath, secondPath] = line.split('\t');
      const rename = /^([RC])(\d{1,3})$/.exec(rawStatus ?? '');
      if (rename) {
        if (!firstPath || !secondPath) throw new Error(`Malformed Git media rename/copy row: ${line}`);
        return {
          status: rename[1] as 'R' | 'C',
          similarity: Number(rename[2]),
          oldPath: firstPath,
          newPath: secondPath,
        };
      }
      if (!/^[AMD]$/.test(rawStatus ?? '') || !firstPath || secondPath)
        throw new Error(`Malformed Git media change row: ${line}`);
      return { status: rawStatus as 'A' | 'M' | 'D', path: firstPath };
    });
}

export function auditMediaGitChanges(
  changes: readonly GitMediaChange[],
  currentSizes: ReadonlyMap<string, number>,
): GitMediaDelta {
  const overwrite = changes.find((change) => change.status === 'M' || change.status === 'C');
  if (overwrite) throw new Error('Content media overwrite/copy is forbidden; create a collision-safe new name.');
  const addedPaths = changes.flatMap((change) =>
    change.status === 'A' ? [change.path] : change.status === 'R' ? [change.newPath] : [],
  );
  const deletedPaths = changes.flatMap((change) =>
    change.status === 'D' ? [change.path] : change.status === 'R' ? [change.oldPath] : [],
  );
  let addedBytes = 0;
  for (const path of addedPaths) {
    const size = currentSizes.get(path);
    if (size === undefined) throw new Error(`Current stat/size is required for added content media: ${path}`);
    addedBytes += size;
  }
  if (addedBytes > PR_MEDIA_LIMIT) throw new Error(`Content media increase exceeds 50 MiB: ${addedBytes} bytes.`);
  return { addedPaths, deletedPaths, addedBytes };
}
```

- [ ] **Step 4: Add the thin CLI and orphan output**

Create `scripts/content-audit.ts`. Resolve the repository root from `process.cwd()`, print only counts and sorted orphan paths, and set `process.exitCode = 1` with the thrown non-sensitive message on failure. If `--base-ref <ref>` is present, use `execFile('git', ['diff', '--name-status', '--find-renames', `${ref}...HEAD`, '--', 'src/assets/content'])`, parse the output only through `parseGitMediaChanges`, stat every A/new-R path, and call `auditMediaGitChanges`. Missing stats fail closed. Convert returned `deletedPaths` from `src/assets/content/<source>` to stored sources and pass them as `deletedAssetSources` to `auditContentRepository`; `R100 old new` therefore counts `newPath` as the addition and checks `oldPath` as a deletion. Do not invoke a shell and do not print content bodies.

Required success output:

```text
Content audit passed: work=0 lab=0 notes=0 portfolio=0 assets=0 orphans=0
```

When orphans exist, print one line per path prefixed `Orphan content asset:` and still exit zero. There is no delete flag.

- [ ] **Step 5: Wire package scripts, formatting, and workflow gates**

Update `package.json`:

```json
{
  "scripts": {
    "audit:content": "tsx scripts/content-audit.ts",
    "format:check": "prettier --check \"src/**/*.{astro,ts,md,mdx,css}\" \"scripts/**/*.{js,mjs,ts}\" \"tests/**/*.ts\" \"e2e/**/*.ts\" \"*.{js,ts,json}\" \".github/**/*.{yml,yaml}\"",
    "format": "prettier --write \"src/**/*.{astro,ts,md,mdx,css}\" \"scripts/**/*.{js,mjs,ts}\" \"tests/**/*.ts\" \"e2e/**/*.ts\" \"*.{js,ts,json}\" \".github/**/*.{yml,yaml}\""
  }
}
```

In `.github/workflows/ci.yml`, set `fetch-depth: 0` on checkout and run `npm run audit:content -- --base-ref origin/main` after `npm run check` and before `npm test` in `quality`. Run plain `npm run audit:content` in `minimum-engine`. Extend Task 5's `content-audit-matrix` so every Node 22.12.0/24 × Ubuntu/Windows cell runs both `npm run audit:content` and `npm test -- tests/content-assets.test.ts tests/content-audit.test.ts`. In `.github/workflows/deploy.yml`, run plain `npm run audit:content` after `npm run check` and before tests; production deployment still uploads only `dist`.

After `npm ci`, every dependency-installing CI job (`minimum-engine`, `quality`, `content-audit-matrix`, and `windows-visual`) and deploy `verify` runs both commands, in this order:

```yaml
- run: npm audit --omit=dev --audit-level=high
- run: npm audit --audit-level=high
```

The first preserves the production-only release gate. The second includes the Phase 0 devDependencies that execute schema, AST, MIME, image, video, and CLI security checks.

Update tooling/delivery tests to require the exact ordering:

```ts
expect(workflow).toMatch(
  /npm run check[\s\S]*npm run audit:content[\s\S]*npm test[\s\S]*npm run build[\s\S]*npm run audit:production/,
);
expect(workflow).toMatch(/npm audit --omit=dev --audit-level=high[\s\S]*npm audit --audit-level=high/);
expect(packageJson.scripts['format:check']).toContain('scripts/**/*.{js,mjs,ts}');
```

- [ ] **Step 6: Verify GREEN with the real empty repository**

Run:

```bash
npm test -- tests/content-audit.test.ts tests/content-references.test.ts tests/markdown-media.test.ts tests/content-assets.test.ts tests/content-contract.test.ts tests/tooling-contracts.test.ts tests/delivery-boundary.test.ts
npm run audit:content
npm run format:check
npm run lint
npm run check
npm test
npm run build
npm run audit:production
npm audit --omit=dev --audit-level=high
npm audit --audit-level=high
npm run test:e2e -- --grep-invert "approved Windows Chromium visual baselines"
git diff --check
```

Expected: every command PASS; `audit:content` reports zero work/lab/notes/portfolio entries and zero assets/orphans; existing empty-route and production-isolation E2E pass; `dist/` contains the real site singleton copy only through the approved rendered shell/pages and never contains QA fixtures.

- [ ] **Step 7: Inspect scope before the final implementation commit**

Run:

```bash
git status --short
git diff --stat 5a5eba798f82810e16104086c747387fbd020d00
git diff -- src/content/work src/content/lab src/content/notes src/content/portfolio admin data
```

Expected: no public folder entry, fake content, admin/OAuth/Decap file, secret, or legacy deletion. Any change under `admin/` or `data/` is out of scope and must be removed from the task diff without deleting the user's existing files.

- [ ] **Step 8: Commit Task 9**

```bash
git add src/domain/content-audit.ts scripts/content-audit.ts tests/content-audit.test.ts package.json package-lock.json .github/workflows/ci.yml .github/workflows/deploy.yml tests/tooling-contracts.test.ts tests/delivery-boundary.test.ts
git commit -m "chore: gate publication content"
```

## Implementation Completion Gate

- [ ] All eight task commits exist and each task passed its focused RED/GREEN cycle before the next task began.
- [ ] The final verification sequence in Task 9 has fresh output from the implementation commit, not cached output copied from an earlier task.
- [ ] Production-only and full dependency audits pass; the full audit covers every Phase 0 devDependency used by the security gates.
- [ ] `src/content/site/profile.md` is the only non-`.gitkeep` content file added; the four public folder collections remain genuinely empty.
- [ ] `src/config/site.ts` contains no editable contact URL; the global shell and home/About/404/portfolio render their approved contact/copy from the typed singleton.
- [ ] No admin, Decap, OAuth, Cloudflare, preview, remote-write, credential, private identity, invented claim, or legacy cleanup entered the diff.
- [ ] A reviewer can reject any one task without needing to reject an unrelated neighboring task; later tasks consume only the interfaces listed above.

## Plan Author Self-Review

- **Spec coverage:** Task 1 atomically covers the singleton/schema/server adapter, typed-props home/About migration, BaseLayout-owned global shell, 404/portfolio direct CTAs, approved output, and duplicate-global removal; Task 3 covers slug, filename equality, draft default, attestation, and lab publish gating; Tasks 4–5 cover the shared schema, namespace, registry, MIME/size/dimension/poster/license rules; Task 6 covers Markdown/MDX AST rules; Task 7 covers entry/media references, safe deletion, and orphan reporting; Task 8 provides the CMS-neutral Astro contract foundation; Task 9 composes CI/release enforcement and the 50 MiB/no-overwrite policy. Phase 1–3 concerns remain explicitly excluded.
- **Deferred-detail scan:** The plan contains concrete file paths, commands, expected failures, signatures, fixtures, minimal implementations, regressions, and commit commands. No deferred implementation marker or instruction to imitate another task remains.
- **Type consistency:** `ContentCollectionName`, `MediaReference`, `ContentAssetRegistry`, `ContentRecord`, `ContentReferenceGraph`, `ContentAuditOptions`, and `ContentAuditReport` have one defining task and the same spelling/signature at every consumer.
- **Review boundaries:** The eight commits separate the atomic profile/content-consumer migration, publication metadata, schema-only media, file inspection, AST inspection, graph integrity, generic contract metadata, and release composition. No task requires Decap/admin/OAuth to be reviewable.
- **Known implementation concern:** ffprobe-static is an old but pinned cross-platform binary package. Task 5 makes Linux, Windows, and Node 22.12 checks mandatory and requires a plan amendment rather than weakening video verification if it fails audit or execution. The generic contract deliberately stops before Decap widget mapping; Phase 1 must translate `CONTENT_CONTRACT` instead of creating a second field model.
