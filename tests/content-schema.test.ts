import { describe, expect, it } from 'vitest';
import {
  mediaSchema,
  noteSchema,
  publicContactUrl,
  worksSchema,
} from '../src/domain/content-schema';

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

const baseWork = {
  ...publication('enterprise-knowledge-assistant'),
  title: '企业知识助手',
  summary: '面向内部知识检索的可验证原型',
  kind: 'project',
  tags: ['AI', 'RAG'],
  status: 'prototype',
  publishedAt: '2026-07-18',
  featured: false,
};

describe('content schemas', () => {
  it('accepts an evidence-based works entry', () => {
    expect(worksSchema.parse(baseWork).title).toBe('企业知识助手');
  });

  it('rejects unsafe repository protocols', () => {
    expect(() => worksSchema.parse({ ...baseWork, repositoryUrl: 'javascript:alert(1)' })).toThrow();
  });

  it('accepts only explicit works lifecycle states', () => {
    expect(() =>
      worksSchema.parse({ ...baseWork, status: 'finished' }),
    ).toThrow();
  });

  it('accepts experiment kind', () => {
    expect(worksSchema.parse({ ...baseWork, kind: 'experiment' }).kind).toBe('experiment');
  });

  it('coerces note dates and requires draft state', () => {
    const note = noteSchema.parse({
      ...publication('ai-workflow-eval'),
      title: 'AI 工作流评估',
      summary: '如何建立回归集',
      tags: ['eval'],
      publishedAt: '2026-07-18',
      draft: true,
    });
    expect(note.publishedAt).toBeInstanceOf(Date);
  });

  it('allows https and mailto public contact URLs only', () => {
    expect(publicContactUrl.parse('mailto:public@example.com')).toBe('mailto:public@example.com');
    expect(() => publicContactUrl.parse('tel:+8613800000000')).toThrow();
  });

  it('uses one media shape in works and notes schemas', () => {
    const published = {
      publishedAt: '2026-07-19',
      draft: false,
      attestation: { authenticityConfirmed: true, rightsConfirmed: true, reviewedAt: '2026-07-19', evidenceUrls: [] },
    };
    const ownedImage = {
      type: 'image',
      source: 'works/qa-work-overview.webp',
      alt: 'QA-only image description.',
      caption: 'QA-only schema fixture.',
      width: 1600,
      height: 900,
      license: 'owned',
    } as const;
    expect(worksSchema.parse({ ...baseWork, slug: 'qa-work', ...published, media: [ownedImage] }).media).toEqual([
      ownedImage,
    ]);
    expect(
      noteSchema.parse({
        ...publication('qa-note'),
        title: 'QA Note',
        summary: 'QA note',
        tags: ['qa'],
        ...published,
        media: [{ ...ownedImage, source: 'notes/qa-note-overview.webp' }],
      }).media,
    ).toHaveLength(1);
  });

  it('rejects bad namespaces, double extensions, blank alt, and incomplete video metadata', () => {
    const ownedImage = {
      type: 'image',
      source: 'works/qa-work-overview.webp',
      alt: 'Image',
      caption: 'Caption',
      width: 1,
      height: 1,
      license: 'owned',
    } as const;
    expect(() => mediaSchema.parse(ownedImage)).not.toThrow();
    expect(() => mediaSchema.parse({ ...ownedImage, source: 'works/qa-work-overview.png.exe' })).toThrow();
    expect(() => mediaSchema.parse({ ...ownedImage, source: 'works/qa-work-overview.exe.png' })).toThrow();
    expect(() => mediaSchema.parse({ ...ownedImage, alt: '  ' })).toThrow();
    expect(() =>
      mediaSchema.parse({ ...ownedImage, type: 'video', source: 'works/qa-work-demo.webm' }),
    ).toThrow(/poster/i);
  });
});
