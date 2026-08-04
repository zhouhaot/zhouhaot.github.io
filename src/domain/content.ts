import { getCollection, type CollectionEntry } from 'astro:content';
import { assertEntrySlug, assertPublishable, type ContentCollectionName } from './publication';

type DatedEntry = { data: { publishedAt: Date } };

export function isPublicEntry(data: { draft?: boolean | undefined }, production = import.meta.env.PROD): boolean {
  return production ? data.draft !== true : true;
}

export function sortNewestFirst<T extends DatedEntry>(entries: readonly T[]): T[] {
  return [...entries].sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());
}

type PublicCollection = 'works' | 'notes';

export function validateCollectionEntry<C extends PublicCollection>(
  collection: C,
  entry: CollectionEntry<C>,
): void {
  assertEntrySlug(collection as ContentCollectionName, entry.id, entry.data.slug);
  assertPublishable(entry.data);
}

export async function getPublishedEntries<C extends PublicCollection>(collection: C): Promise<CollectionEntry<C>[]> {
  const entries = await getCollection(collection, ({ data }) => isPublicEntry(data));
  return sortNewestFirst(entries as CollectionEntry<C>[]);
}
