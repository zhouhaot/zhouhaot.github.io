// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CONTENT_CONTRACT, parseContractFixture } from '../src/domain/content-contract';
import { assertPublishable } from '../src/domain/publication';

describe('CMS-neutral Astro content contract', () => {
  it('fixes collection kind, source, extension, and create policy', () => {
    expect(CONTENT_CONTRACT).toMatchObject({
      site: { kind: 'singleton', source: 'src/content/site/profile.md', extension: 'md', create: false },
      works: { kind: 'folder', source: 'src/content/works', extension: 'md', create: true },
      notes: { kind: 'folder', source: 'src/content/notes', extension: 'md', create: true },
    });
  });

  it.each(['site', 'works', 'notes'] as const)(
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
    expect(CONTENT_CONTRACT.works.fields.find((f) => f.path === 'draft')?.default).toBe(true);
    expect(CONTENT_CONTRACT.works.fields.find((f) => f.path === 'status')?.enum).toEqual([
      'prototype',
      'validated',
      'shipped',
      'archived',
    ]);
    expect(CONTENT_CONTRACT.works.fields.find((f) => f.path === 'media[].license')?.enum).toEqual([
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

  it('works draft:false without attestation.reviewedAt fails assertPublishable', () => {
    const source = readFileSync(resolve('tests/fixtures/content-contract/works.md'), 'utf8');
    const parsed = parseContractFixture('works', source) as Record<string, unknown>;
    const clone = JSON.parse(JSON.stringify(parsed)) as Record<string, unknown>;
    clone['draft'] = false;
    expect(() =>
      assertPublishable(clone as Parameters<typeof assertPublishable>[0], new Date('2026-07-20T00:00:00.000Z')),
    ).toThrow();
  });
});
