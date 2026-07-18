// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { isPublicEntry, sortNewestFirst } from '../src/domain/content';

describe('content domain', () => {
  it('excludes drafts in production and includes them in development', () => {
    expect(isPublicEntry({ draft: true }, true)).toBe(false);
    expect(isPublicEntry({ draft: true }, false)).toBe(true);
  });

  it('sorts newest entries first without mutating input', () => {
    const entries = [
      { data: { publishedAt: new Date('2026-01-01') } },
      { data: { publishedAt: new Date('2026-07-18') } },
    ];
    const sorted = sortNewestFirst(entries);
    expect(sorted[0]?.data.publishedAt.toISOString()).toContain('2026-07-18');
    expect(entries[0]?.data.publishedAt.toISOString()).toContain('2026-01-01');
  });
});
