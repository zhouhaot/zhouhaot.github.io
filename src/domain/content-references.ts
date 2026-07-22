import type { MediaReference } from './media';
import type { ContentCollectionName } from './publication';

export type ContentKey = `${ContentCollectionName}:${string}`;
export type ContentRecord = {
  collection: ContentCollectionName;
  slug: string;
  media: readonly MediaReference[];
  relatedProject?: string | undefined;
};
export type ContentReference = { from: ContentKey; to: ContentKey | string; kind: 'entry' | 'source' | 'poster' };
export type ContentReferenceGraph = {
  entries: ReadonlySet<ContentKey>;
  assets: ReadonlySet<string>;
  references: readonly ContentReference[];
  unresolved: readonly ContentReference[];
  referencedAssets: ReadonlySet<string>;
};

const contentKey = (record: Pick<ContentRecord, 'collection' | 'slug'>): ContentKey =>
  `${record.collection}:${record.slug}`;

export function buildContentReferenceGraph(
  records: readonly ContentRecord[],
  assetSources: readonly string[],
): ContentReferenceGraph {
  const entries = new Set(records.map(contentKey));
  const assets = new Set(assetSources);
  const references: ContentReference[] = [];
  const projectTargets = new Map<string, ContentKey[]>();
  for (const record of records.filter((item) => item.collection === 'work' || item.collection === 'lab')) {
    const targets = projectTargets.get(record.slug) ?? [];
    targets.push(contentKey(record));
    projectTargets.set(record.slug, targets);
  }
  for (const [slug, targets] of projectTargets)
    if (targets.length > 1) throw new Error(`Ambiguous project slug: ${slug}`);

  for (const record of records) {
    const from = contentKey(record);
    if (record.collection === 'portfolio' && record.relatedProject) {
      const [target] = projectTargets.get(record.relatedProject) ?? [];
      references.push({ from, to: target ?? `work:${record.relatedProject}`, kind: 'entry' });
    }
    for (const media of record.media) {
      references.push({ from, to: media.source, kind: 'source' });
      if (media.type === 'video') references.push({ from, to: media.poster, kind: 'poster' });
    }
  }
  const referencedAssets = new Set(
    references.filter((reference) => reference.kind !== 'entry').map((reference) => String(reference.to)),
  );
  const unresolved = references.filter((reference) =>
    reference.kind === 'entry' ? !entries.has(reference.to as ContentKey) : !assets.has(String(reference.to)),
  );
  return { entries, assets, references, unresolved, referencedAssets };
}

export function assertReferenceSafe(graph: ContentReferenceGraph): void {
  if (!graph.unresolved.length) return;
  throw new Error(
    graph.unresolved
      .map((reference) => `${reference.kind} reference from ${reference.from} does not resolve: ${reference.to}`)
      .join('\n'),
  );
}

export function reportOrphanAssets(graph: ContentReferenceGraph): readonly string[] {
  return [...graph.assets]
    .filter((asset) => !graph.referencedAssets.has(asset))
    .sort((left, right) => left.localeCompare(right, 'en'));
}
