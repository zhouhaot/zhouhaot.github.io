import { describe, expect, it } from 'vitest';
import {
  labSchema,
  mediaSchema,
  noteSchema,
  portfolioSchema,
  publicContactUrl,
  workSchema,
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
  problem: '知识分散且检索成本高',
  role: 'AI 应用开发',
  solution: '检索增强生成工作流',
  stack: ['Astro', 'Python'],
  contributions: ['内容模型', '评估流程'],
  status: 'prototype',
  publishedAt: '2026-07-18',
  featured: false,
};

describe('content schemas', () => {
  it('accepts an evidence-based work entry', () => {
    expect(workSchema.parse(baseWork).title).toBe('企业知识助手');
  });

  it('rejects unsafe repository protocols', () => {
    expect(() => workSchema.parse({ ...baseWork, repositoryUrl: 'javascript:alert(1)' })).toThrow();
  });

  it('accepts only explicit lab lifecycle states', () => {
    expect(() =>
      labSchema.parse({
        ...publication('agent-routing-experiment'),
        title: 'Agent 路由实验',
        summary: '比较路由策略',
        hypothesis: '显式路由更稳定',
        workflow: ['分类', '执行', '评估'],
        modelOrTools: ['OpenAI API'],
        result: '形成基线',
        evaluation: '使用固定测试集',
        status: 'finished',
        publishedAt: '2026-07-18',
      }),
    ).toThrow();
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

  it('uses one media shape in all four collection schemas', () => {
    const published = {
      publishedAt: '2026-07-19',
      draft: false,
      attestation: { authenticityConfirmed: true, rightsConfirmed: true, reviewedAt: '2026-07-19', evidenceUrls: [] },
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
    expect(workSchema.parse({ ...baseWork, slug: 'qa-work', ...published, media: [ownedImage] }).media).toEqual([
      ownedImage,
    ]);
    expect(
      labSchema.parse({
        ...publication('qa-lab'),
        title: 'QA Lab',
        summary: 'QA lab',
        hypothesis: 'H',
        workflow: ['W'],
        modelOrTools: ['T'],
        result: 'R',
        evaluation: 'E',
        status: 'prototype',
        ...published,
        media: [{ ...ownedImage, source: 'lab/qa-lab-overview.webp' }],
      }).media,
    ).toHaveLength(1);
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
    expect(
      portfolioSchema.parse({
        ...publication('qa-series'),
        title: 'Portfolio',
        summary: 'Summary',
        order: 0,
        status: 'published',
        ...published,
        items: [{ ...ownedImage, source: 'portfolio/qa-series-overview.webp' }],
      }).items,
    ).toHaveLength(1);
  });

  it('accepts the portfolio attribution combinations enforced by production audit', () => {
    const media = {
      type: 'image',
      source: 'portfolio/qa-series-image.webp',
      alt: 'Image',
      caption: 'Caption',
      width: 1,
      height: 1,
    };
    for (const item of [
      { ...media, license: 'owned' },
      { ...media, license: 'licensed', credit: 'Source', licenseUrl: 'https://example.com/license' },
      { ...media, license: 'cc-by', credit: 'Source', licenseUrl: 'https://example.com/license' },
      { ...media, license: 'public-domain', evidenceUrl: 'https://example.com/evidence' },
    ]) {
      expect(
        portfolioSchema.parse({
          ...publication('portfolio-attribution-test'),
          title: 'Portfolio',
          summary: 'Summary',
          publishedAt: '2026-07-18',
          order: 0,
          status: 'published',
          items: [item],
        }),
      ).toMatchObject({ items: [expect.objectContaining({ license: item.license })] });
    }
  });

  it('rejects non-HTTPS optional portfolio provenance URLs for owned media', () => {
    const media = {
      type: 'image',
      source: 'portfolio/qa-series-image.webp',
      alt: 'Image',
      caption: 'Caption',
      width: 1,
      height: 1,
      license: 'owned',
    };
    for (const optionalUrl of [
      { licenseUrl: 'http://example.com/license' },
      { evidenceUrl: 'http://example.com/evidence' },
    ]) {
      expect(() =>
        portfolioSchema.parse({
          ...publication('portfolio-url-test'),
          title: 'Portfolio',
          summary: 'Summary',
          publishedAt: '2026-07-18',
          order: 0,
          status: 'published',
          items: [{ ...media, ...optionalUrl }],
        }),
      ).toThrow();
    }
  });

  it('rejects bad namespaces, double extensions, blank alt, and incomplete video metadata', () => {
    const ownedImage = {
      type: 'image',
      source: 'work/qa-work-overview.webp',
      alt: 'Image',
      caption: 'Caption',
      width: 1,
      height: 1,
      license: 'owned',
    } as const;
    expect(() => mediaSchema.parse(ownedImage)).not.toThrow();
    expect(() => mediaSchema.parse({ ...ownedImage, source: 'work/qa-work-overview.png.exe' })).toThrow();
    expect(() => mediaSchema.parse({ ...ownedImage, source: 'work/qa-work-overview.exe.png' })).toThrow();
    expect(() => mediaSchema.parse({ ...ownedImage, alt: '  ' })).toThrow();
    expect(() =>
      mediaSchema.parse({ ...ownedImage, type: 'video', source: 'work/qa-work-demo.webm' }),
    ).toThrow(/poster/i);
  });
});
