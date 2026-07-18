import { getCollection } from 'astro:content';
import { getPublishedProjects } from './projects';
import {
  buildPortfolioSeries,
  createPortfolioAssetResolver,
  type PortfolioAsset,
  type PortfolioSource,
  type PublicPortfolioSeries,
} from './portfolio';

const portfolioAssetModules = import.meta.glob('/src/assets/portfolio/**/*.{avif,jpeg,jpg,png,webp,mp4,webm}', {
  eager: true,
  import: 'default',
});

const portfolioAssets = Object.fromEntries(
  Object.entries(portfolioAssetModules).map(([path, asset]) => {
    const key = path.replace('/src/assets/portfolio/', '');
    if (typeof asset === 'string') return [key, { src: asset }];
    return [key, asset as PortfolioAsset];
  }),
) as Record<string, PortfolioAsset>;

export async function getPublishedPortfolio(): Promise<PublicPortfolioSeries[]> {
  const [entries, projects] = await Promise.all([getCollection('portfolio'), getPublishedProjects()]);
  return buildPortfolioSeries(entries as PortfolioSource[], projects, createPortfolioAssetResolver(portfolioAssets));
}
