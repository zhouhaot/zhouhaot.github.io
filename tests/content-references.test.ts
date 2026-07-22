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

  it('allows deleting an unreferenced work entry', () => {
    const unreferenced: ContentRecord = { collection: 'work', slug: 'qa-other', media: [] };
    const graph = buildContentReferenceGraph([unreferenced], []);
    expect(() => assertReferenceSafe(graph)).not.toThrow();
  });

  it('blocks slug change when portfolio still references the old slug', () => {
    // portfolio references 'qa-work' but only 'qa-work-renamed' is present
    const renamed: ContentRecord = { collection: 'work', slug: 'qa-work-renamed', media: [] };
    const graph = buildContentReferenceGraph([renamed, portfolio], ['portfolio/qa-series-overview.webp']);
    expect(() => assertReferenceSafe(graph)).toThrow(/qa-work/);
  });

  it('blocks deleting an image used only as a video poster', () => {
    const withPoster: ContentRecord = {
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
    // Both source and poster declared, but poster file is absent
    const graph = buildContentReferenceGraph(
      [withPoster],
      ['lab/qa-lab-demo.webm'],
    );
    expect(() => assertReferenceSafe(graph)).toThrow(/poster/);
  });

  it('reports an unused asset without failing', () => {
    const graph = buildContentReferenceGraph([work], [
      'work/qa-work-overview.webp',
      'work/qa-work-unused.webp',
    ]);
    expect(() => assertReferenceSafe(graph)).not.toThrow();
    expect(reportOrphanAssets(graph)).toEqual(['work/qa-work-unused.webp']);
  });
});
