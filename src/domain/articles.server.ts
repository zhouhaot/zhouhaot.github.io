import { getCollection } from 'astro:content';
import { buildArticles, type PublicArticle } from './articles';
import { isPublicEntry } from './content';

export async function getPublishedArticles(): Promise<PublicArticle[]> {
  const entries = await getCollection('notes', ({ data }) => isPublicEntry(data));
  return buildArticles(entries.map((entry) => ({ id: entry.id, collection: 'notes' as const, data: entry.data })));
}
