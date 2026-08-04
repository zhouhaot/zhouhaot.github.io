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
      auditMediaGitChanges([{ status: 'M', path: 'src/assets/content/works/qa-work-image.webp' }], new Map()),
    ).toThrow(/overwrite/i);
    expect(() =>
      auditMediaGitChanges(
        [
          { status: 'A', path: 'src/assets/content/works/qa-work-a.webp' },
          { status: 'A', path: 'src/assets/content/works/qa-work-b.webp' },
        ],
        new Map([
          ['src/assets/content/works/qa-work-a.webp', 30 * 1024 * 1024],
          ['src/assets/content/works/qa-work-b.webp', 21 * 1024 * 1024],
        ]),
      ),
    ).toThrow(/50 MiB/i);
  });

  it('fails closed when an added or renamed asset has no current stat', () => {
    expect(() =>
      auditMediaGitChanges([{ status: 'A', path: 'src/assets/content/works/qa-work-new.webp' }], new Map()),
    ).toThrow(/size|stat/i);
    expect(() =>
      auditMediaGitChanges(
        [
          {
            status: 'R',
            similarity: 100,
            oldPath: 'src/assets/content/works/qa-work-old.webp',
            newPath: 'src/assets/content/works/qa-work-new.webp',
          },
        ],
        new Map(),
      ),
    ).toThrow(/size|stat/i);
  });

  it('parses R100 old/new paths and returns add/delete sides separately', () => {
    const changes = parseGitMediaChanges(
      'R100\tsrc/assets/content/works/qa-work-old.webp\tsrc/assets/content/works/qa-work-new.webp\n',
    );
    expect(changes).toEqual([
      {
        status: 'R',
        similarity: 100,
        oldPath: 'src/assets/content/works/qa-work-old.webp',
        newPath: 'src/assets/content/works/qa-work-new.webp',
      },
    ]);
    expect(auditMediaGitChanges(changes, new Map([['src/assets/content/works/qa-work-new.webp', 1024]]))).toEqual({
      addedPaths: ['src/assets/content/works/qa-work-new.webp'],
      deletedPaths: ['src/assets/content/works/qa-work-old.webp'],
      addedBytes: 1024,
    });
  });

  it('returns deterministic orphan reporting for an otherwise valid empty publication repository', async () => {
    const root = mkdtempSync(join(tmpdir(), 'zhou-content-audit-'));
    roots.push(root);
    for (const path of [
      'src/content/site',
      'src/content/works',
      'src/content/notes',
      'src/assets/content/works',
      'src/assets/content/notes',
    ])
      mkdirSync(join(root, path), { recursive: true });
    writeFileSync(join(root, 'src/content/site/profile.md'), approvedProfileFixture, 'utf8');
    const report = await auditContentRepository({
      root,
      inspectAsset: async () => {
        throw new Error('No assets expected.');
      },
    });
    expect(report.entryCounts).toEqual({ works: 0, notes: 0 });
    expect(report.orphanAssets).toEqual([]);
  });

  it('rejects a missing site profile', async () => {
    const root = mkdtempSync(join(tmpdir(), 'zhou-content-audit-'));
    roots.push(root);
    mkdirSync(join(root, 'src/content/site'), { recursive: true });
    mkdirSync(join(root, 'src/assets/content'), { recursive: true });
    await expect(auditContentRepository({ root })).rejects.toThrow(/profile\.md/);
  });

  it('rejects a filename/slug mismatch', async () => {
    const root = mkdtempSync(join(tmpdir(), 'zhou-content-audit-'));
    roots.push(root);
    for (const path of [
      'src/content/site',
      'src/content/works',
      'src/content/notes',
      'src/assets/content/works',
      'src/assets/content/notes',
    ])
      mkdirSync(join(root, path), { recursive: true });
    writeFileSync(join(root, 'src/content/site/profile.md'), approvedProfileFixture, 'utf8');
    writeFileSync(
      join(root, 'src/content/works/different-slug.md'),
      [
        '---',
        'slug: not-matching',
        'title: T',
        'summary: S',
        'publishedAt: 2026-07-19',
        'draft: true',
        'attestation:',
        '  authenticityConfirmed: false',
        '  rightsConfirmed: false',
        '  evidenceUrls: []',
        'kind: project',
        'tags: [qa]',
        'status: prototype',
        'featured: false',
        '---',
      ].join('\n'),
      'utf8',
    );
    await expect(auditContentRepository({ root })).rejects.toThrow(/match/i);
  });
});
