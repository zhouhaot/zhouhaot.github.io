import type { ContentCollectionName } from './publication';

export const MEDIA_LICENSES = ['owned', 'licensed', 'cc-by', 'public-domain'] as const;
export const IMAGE_EXTENSIONS = ['avif', 'jpeg', 'jpg', 'png', 'webp'] as const;
export const VIDEO_EXTENSIONS = ['mp4', 'webm'] as const;
const CONTENT_MEDIA_EXTENSIONS = [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS] as const;

export type ContentMediaPath = {
  collection: ContentCollectionName;
  filename: string;
  extension: (typeof CONTENT_MEDIA_EXTENSIONS)[number];
};

export function parseContentMediaPath(value: string): ContentMediaPath | undefined {
  if (value !== value.normalize('NFC') || value !== value.trim() || /[\\%:]/.test(value) || value.includes('..'))
    return;
  const match = /^(work|lab|notes|portfolio)\/([a-z0-9]+(?:-[a-z0-9]+)*)\.([a-z0-9]+)$/.exec(value);
  if (!match) return;
  const [, collection, filename, extension] = match;
  if (!CONTENT_MEDIA_EXTENSIONS.includes(extension as (typeof CONTENT_MEDIA_EXTENSIONS)[number])) return;
  return {
    collection: collection as ContentCollectionName,
    filename: filename!,
    extension: extension as ContentMediaPath['extension'],
  };
}

export function assertCanonicalContentMediaPath(value: string): ContentMediaPath {
  const parsed = parseContentMediaPath(value);
  if (!parsed) throw new Error(`Media path must be canonical under src/assets/content: ${value}`);
  return parsed;
}

type MediaBase = {
  source: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
  license: (typeof MEDIA_LICENSES)[number];
  credit?: string | undefined;
  licenseUrl?: string | undefined;
  evidenceUrl?: string | undefined;
};
export type MediaReference = (MediaBase & { type: 'image' }) | (MediaBase & { type: 'video'; poster: string });

export function assertMediaOwnership(
  collection: ContentCollectionName,
  slug: string,
  media: Pick<MediaReference, 'source'> & Partial<Pick<Extract<MediaReference, { type: 'video' }>, 'poster'>>,
): void {
  const namespace = `${collection}/`;
  const prefix = `${namespace}${slug}-`;
  for (const path of [media.source, media.poster].filter((value): value is string => Boolean(value))) {
    assertCanonicalContentMediaPath(path);
    if (!path.startsWith(namespace)) throw new Error(`Media namespace must be ${namespace}: ${path}`);
    if (!path.startsWith(prefix)) throw new Error(`Media filename must use entry slug prefix ${slug}-: ${path}`);
  }
}

type MediaContainer = { media?: readonly MediaReference[]; items?: readonly MediaReference[] };
export function mediaReferencesFor(
  collection: ContentCollectionName,
  slug: string,
  data: MediaContainer,
): readonly MediaReference[] {
  const media = collection === 'portfolio' ? (data.items ?? []) : (data.media ?? []);
  for (const item of media) assertMediaOwnership(collection, slug, item);
  return media;
}

export type ContentAsset = {
  source: string;
  src: string;
  width?: number | undefined;
  height?: number | undefined;
  bytes?: number | undefined;
  mime?: string | undefined;
};
export type ContentAssetRegistry = ReadonlyMap<string, ContentAsset>;

export function createContentAssetRegistry(modules: readonly (readonly [string, unknown])[]): ContentAssetRegistry {
  const registry = new Map<string, ContentAsset>();
  for (const [modulePath, imported] of modules) {
    const source = modulePath.replace(/^\/src\/assets\/content\//, '');
    if (source === modulePath || registry.has(source))
      throw new Error(`Duplicate or out-of-root content asset: ${modulePath}`);
    if (typeof imported === 'string') registry.set(source, { source, src: imported });
    else {
      const image = imported as { src: string; width: number; height: number };
      registry.set(source, { source, src: image.src, width: image.width, height: image.height });
    }
  }
  return registry;
}
