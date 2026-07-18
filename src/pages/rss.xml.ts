import rss from '@astrojs/rss';
import { getPublishedArticles } from '@/domain/articles.server';
import { rssItems } from '@/domain/seo';
import { SITE } from '@/config/site';

export async function GET(context: { site: URL | undefined }) {
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? new URL(SITE.url),
    items: rssItems(await getPublishedArticles()),
  });
}
