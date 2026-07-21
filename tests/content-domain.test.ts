// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { isPublicEntry, sortNewestFirst } from '../src/domain/content';
import { assertEntrySlug, assertPublishable, canonicalSlugSchema } from '../src/domain/publication';
import { attestationSchema } from '../src/domain/content-schema';

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
});
