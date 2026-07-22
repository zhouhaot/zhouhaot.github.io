import type { MediaReference } from './media';
import { assertEntrySlug, assertPublishable } from './publication';
import type { PublicProject } from './projects';

export type PortfolioAsset = { src: string; width?: number; height?: number };
export type PortfolioAssetResolver = (path: string) => PortfolioAsset | undefined;

export type PortfolioMedia = MediaReference;

export const PORTFOLIO_LICENSE_LABELS = {
  owned: '自有',
  licensed: '已获授权',
  'cc-by': '知识共享署名',
  'public-domain': '公共领域',
} satisfies Record<PortfolioMedia['license'], string>;

export function portfolioLicenseLabel(license: PortfolioMedia['license'] | string): string {
  return PORTFOLIO_LICENSE_LABELS[license as PortfolioMedia['license']] ?? license;
}

export type PortfolioSeriesData = {
  title: string;
  summary: string;
  publishedAt: Date;
  draft?: boolean;
  slug: string;
  attestation: {
    authenticityConfirmed: boolean;
    rightsConfirmed: boolean;
    reviewedAt?: Date | undefined;
    evidenceUrls: string[];
  };
  order: number;
  status: 'published' | 'archived';
  relatedProject?: string;
  items: PortfolioMedia[];
};

export type PortfolioSource = { id: string; collection: 'portfolio'; data: PortfolioSeriesData };

export type PortfolioMediaView = PortfolioMedia & {
  asset: PortfolioAsset;
  posterAsset?: PortfolioAsset;
};

export type PublicPortfolioSeries = Omit<PortfolioSeriesData, 'items' | 'relatedProject'> & {
  id: string;
  items: PortfolioMediaView[];
  relatedProject?: Pick<PublicProject, 'id' | 'href' | 'title'>;
};

export function createPortfolioAssetResolver(
  registry: Readonly<Record<string, PortfolioAsset>>,
): PortfolioAssetResolver {
  return (path) => registry[path];
}

function assertCanonicalSeriesId(id: string): void {
  const canonical = id.normalize('NFC').trim();
  if (id !== canonical || !canonical || canonical === '.' || canonical === '..' || /[\\/%]/.test(canonical)) {
    throw new Error(`Portfolio series id must be canonical and safe: ${id}`);
  }
}

function assertCanonicalRelatedProjectId(id: string): void {
  const canonical = id.normalize('NFC').trim();
  if (id !== canonical || !canonical || canonical === '.' || canonical === '..' || /[\\/%]/.test(canonical)) {
    throw new Error(`Related project id must be canonical and safe: ${id}`);
  }
}

function toMediaView(media: PortfolioMedia, resolveAsset: PortfolioAssetResolver): PortfolioMediaView {
  const asset = resolveAsset(media.source);
  if (!asset) throw new Error(`Portfolio asset is missing: ${media.source}`);
  if (media.type === 'image' && (asset.width !== media.width || asset.height !== media.height)) {
    throw new Error(`Portfolio image dimensions do not match metadata: ${media.source}`);
  }

  const posterAsset = media.type === 'video' ? resolveAsset(media.poster ?? '') : undefined;
  if (media.type === 'video' && !posterAsset) throw new Error(`Portfolio video poster is missing: ${media.poster}`);
  return posterAsset ? { ...media, asset, posterAsset } : { ...media, asset };
}

function compareSeries(left: PortfolioSource, right: PortfolioSource): number {
  return (
    left.data.order - right.data.order ||
    right.data.publishedAt.valueOf() - left.data.publishedAt.valueOf() ||
    left.id.localeCompare(right.id, 'en')
  );
}

export function buildPortfolioSeries(
  entries: readonly PortfolioSource[],
  projects: readonly Pick<PublicProject, 'id' | 'href' | 'title'>[],
  resolveAsset: PortfolioAssetResolver,
): PublicPortfolioSeries[] {
  for (const entry of entries) {
    assertEntrySlug('portfolio', entry.id, entry.data.slug);
    assertPublishable(entry.data);
  }
  const publicEntries = entries.filter((entry) => entry.data.draft !== true && entry.data.status === 'published');
  const seenIds = new Set<string>();

  for (const entry of publicEntries) {
    assertCanonicalSeriesId(entry.id);
    const key = entry.id.toLocaleLowerCase('en');
    if (seenIds.has(key)) throw new Error(`Duplicate portfolio series id: ${entry.id}`);
    seenIds.add(key);
  }

  return [...publicEntries].sort(compareSeries).map((entry) => {
    const { relatedProject: relatedProjectId, ...data } = entry.data;
    const relatedProject = relatedProjectId
      ? (() => {
          assertCanonicalRelatedProjectId(relatedProjectId);
          const project = projects.find((candidate) => candidate.id === relatedProjectId);
          if (!project)
            throw new Error(`Related portfolio reference does not resolve to a public project: ${relatedProjectId}`);
          return project;
        })()
      : undefined;

    const view = { ...data, id: entry.id, items: entry.data.items.map((media) => toMediaView(media, resolveAsset)) };
    return relatedProject ? { ...view, relatedProject } : view;
  });
}
