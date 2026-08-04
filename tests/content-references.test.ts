// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  assertReferenceSafe,
  buildContentReferenceGraph,
  reportOrphanAssets,
  type ContentRecord,
} from '../src/domain/content-references';

const work: ContentRecord = {
  collection: 'works',
  slug: 'qa-work',
  media: [
    {
      type: 'image',
      source: 'works/qa-work-overview.webp',
      alt: 'QA',
      caption: 'QA',
      width: 2,
      height: 1,
      license: 'owned',
    },
  ],
};

describe('content reference graph', () => {
  it('resolves asset references', () => {
    const graph = buildContentReferenceGraph(
      [work],
      ['works/qa-work-overview.webp'],
    );
    expect(() => assertReferenceSafe(graph)).not.toThrow();
  });

  it('blocks deleting a referenced source or video poster', () => {
    const video: ContentRecord = {
      collection: 'works',
      slug: 'qa-video',
      media: [
        {
          type: 'video',
          source: 'works/qa-video-demo.webm',
          poster: 'works/qa-video-poster.webp',
          alt: 'QA',
          caption: 'QA',
          width: 2,
          height: 1,
          license: 'owned',
        },
      ],
    };
    expect(() => assertReferenceSafe(buildContentReferenceGraph([video], ['works/qa-video-demo.webm']))).toThrow(/poster/);
  });

  it('reports orphans in stable order without failing or deleting', () => {
    const graph = buildContentReferenceGraph(
      [work],
      ['works/qa-work-z.webp', 'works/qa-work-overview.webp', 'works/qa-work-a.webp'],
    );
    expect(reportOrphanAssets(graph)).toEqual(['works/qa-work-a.webp', 'works/qa-work-z.webp']);
    expect(() => assertReferenceSafe(graph)).not.toThrow();
  });

  it('allows deleting an unreferenced work entry', () => {
    const unreferenced: ContentRecord = { collection: 'works', slug: 'qa-other', media: [] };
    const graph = buildContentReferenceGraph([unreferenced], []);
    expect(() => assertReferenceSafe(graph)).not.toThrow();
  });

  it('blocks deleting an image used only as a video poster', () => {
    const withPoster: ContentRecord = {
      collection: 'works',
      slug: 'qa-poster',
      media: [
        {
          type: 'video',
          source: 'works/qa-poster-demo.webm',
          poster: 'works/qa-poster-thumb.webp',
          alt: 'QA',
          caption: 'QA',
          width: 2,
          height: 1,
          license: 'owned',
        },
      ],
    };
    const graph = buildContentReferenceGraph([withPoster], ['works/qa-poster-demo.webm']);
    expect(() => assertReferenceSafe(graph)).toThrow(/poster/);
  });

  it('reports an unused asset without failing', () => {
    const graph = buildContentReferenceGraph([work], [
      'works/qa-work-overview.webp',
      'works/qa-work-unused.webp',
    ]);
    expect(() => assertReferenceSafe(graph)).not.toThrow();
    expect(reportOrphanAssets(graph)).toEqual(['works/qa-work-unused.webp']);
  });
});
