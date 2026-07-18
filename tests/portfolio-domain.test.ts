import { describe, expect, it } from 'vitest';
import { portfolioSchema } from '../src/domain/content-schema';
import { buildPortfolioSeries, createPortfolioAssetResolver, type PortfolioSource } from '../src/domain/portfolio';

const image = {
  type: 'image' as const,
  source: 'workflow/map.webp',
  alt: '工作流节点关系图。',
  caption: '经确认可公开的工作流结构图。',
  width: 1600,
  height: 900,
  license: 'owned' as const,
};

const series = (overrides: Partial<PortfolioSource> = {}): PortfolioSource => ({
  id: 'workflow-map',
  data: {
    title: '工作流图谱',
    summary: '经确认的视觉记录。',
    publishedAt: new Date('2026-07-18'),
    draft: false,
    order: 1,
    status: 'published',
    relatedProject: 'workflow-assistant',
    items: [image],
  },
  ...overrides,
});

const publicProject = { id: 'workflow-assistant', href: '/projects/workflow-assistant/', title: '工作流助手' };

describe('portfolio schema', () => {
  it('requires a caption and an explicit valid attribution when the license requires one', () => {
    expect(() => portfolioSchema.parse({ ...series().data, items: [{ ...image, caption: '' }] })).toThrow();
    expect(() => portfolioSchema.parse({ ...series().data, items: [{ ...image, license: 'licensed' }] })).toThrow();
    expect(() =>
      portfolioSchema.parse({
        ...series().data,
        items: [{ ...image, license: 'cc-by', credit: '授权方', licenseUrl: 'http://example.com/license' }],
      }),
    ).toThrow();
    expect(() =>
      portfolioSchema.parse({ ...series().data, items: [{ ...image, license: 'public-domain' }] }),
    ).toThrow();
  });

  it('accepts only canonical local media paths with media-specific extensions and a video poster', () => {
    for (const source of [
      './workflow/map.webp',
      'workflow/../map.webp',
      'workflow\\map.webp',
      'workflow/%2e%2e/map.webp',
      '.hidden/map.webp',
      'workflow/map.svg',
      'workflow/map.webp ',
      'workflow/map.mp4',
    ]) {
      expect(() => portfolioSchema.parse({ ...series().data, items: [{ ...image, source }] })).toThrow();
    }

    expect(() =>
      portfolioSchema.parse({
        ...series().data,
        items: [{ ...image, type: 'video', source: 'workflow/demo.webm', poster: undefined }],
      }),
    ).toThrow();
  });
});

describe('portfolio view model', () => {
  it('validates assets and public related projects, then preserves media order', () => {
    const resolveAsset = createPortfolioAssetResolver({
      'workflow/map.webp': { src: '/_astro/map.hash.webp', width: 1600, height: 900 },
    });

    const [view] = buildPortfolioSeries([series()], [publicProject], resolveAsset);

    expect(view?.items.map((item) => item.caption)).toEqual([image.caption]);
    expect(view?.relatedProject).toEqual(publicProject);
    expect(view?.items[0]).toMatchObject({ type: 'image', width: 1600, height: 900 });
  });

  it('rejects missing assets, image-dimension mismatches, unsafe project ids, and non-public related projects', () => {
    const resolver = createPortfolioAssetResolver({
      'workflow/map.webp': { src: '/_astro/map.hash.webp', width: 800, height: 900 },
    });

    expect(() => buildPortfolioSeries([series()], [publicProject], resolver)).toThrow(/dimension/i);
    expect(() => buildPortfolioSeries([series()], [publicProject], createPortfolioAssetResolver({}))).toThrow(/asset/i);
    expect(() =>
      buildPortfolioSeries(
        [series({ data: { ...series().data, relatedProject: ' workflow-assistant ' } })],
        [publicProject],
        resolver,
      ),
    ).toThrow(/canonical|safe/i);
    expect(() => buildPortfolioSeries([series()], [], resolver)).toThrow(/public project/i);
  });

  it('filters non-public series, rejects duplicate ids case-insensitively, and sorts without mutating input', () => {
    const resolver = createPortfolioAssetResolver({
      'workflow/map.webp': { src: '/_astro/map.hash.webp', width: 1600, height: 900 },
    });
    const sources = [
      series({ id: 'zeta', data: { ...series().data, order: 2, publishedAt: new Date('2026-07-17') } }),
      series({ id: 'alpha', data: { ...series().data, order: 2, publishedAt: new Date('2026-07-18') } }),
      series({ id: 'archived', data: { ...series().data, status: 'archived' } }),
      series({ id: 'draft', data: { ...series().data, draft: true } }),
    ];

    expect(buildPortfolioSeries(sources, [publicProject], resolver).map((entry) => entry.id)).toEqual([
      'alpha',
      'zeta',
    ]);
    expect(sources.map((entry) => entry.id)).toEqual(['zeta', 'alpha', 'archived', 'draft']);
    expect(() =>
      buildPortfolioSeries([series({ id: 'Same' }), series({ id: 'same' })], [publicProject], resolver),
    ).toThrow(/duplicate/i);
  });
});
