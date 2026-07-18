import { describe, expect, it } from 'vitest';
import { labSchema, noteSchema, portfolioSchema, publicContactUrl, workSchema } from '../src/domain/content-schema';

const baseWork = {
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

  it('accepts the portfolio attribution combinations enforced by production audit', () => {
    const media = { type: 'image', source: 'image.webp', alt: 'Image', caption: 'Caption', width: 1, height: 1 };
    for (const item of [
      { ...media, license: 'owned' },
      { ...media, license: 'licensed', credit: 'Source', licenseUrl: 'https://example.com/license' },
      { ...media, license: 'cc-by', credit: 'Source', licenseUrl: 'https://example.com/license' },
      { ...media, license: 'public-domain', evidenceUrl: 'https://example.com/evidence' },
    ]) {
      expect(
        portfolioSchema.parse({
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
});
