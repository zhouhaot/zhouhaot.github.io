import { getCollection } from 'astro:content';
import { contentAssetRegistry } from './content-assets.server';
import { getPublishedProjects } from './projects';
import {
  buildPortfolioSeries,
  createPortfolioAssetResolver,
  type PortfolioAsset,
  type PortfolioSource,
  type PublicPortfolioSeries,
} from './portfolio';

export async function getPublishedPortfolio(): Promise<PublicPortfolioSeries[]> {
  const [entries, projects] = await Promise.all([getCollection('portfolio'), getPublishedProjects()]);
  const assets: Record<string, PortfolioAsset> = {};
  for (const [key, asset] of contentAssetRegistry.entries()) {
    const entry: PortfolioAsset = { src: asset.src };
    if (asset.width !== undefined) entry.width = asset.width;
    if (asset.height !== undefined) entry.height = asset.height;
    assets[key] = entry;
  }
  return buildPortfolioSeries(entries as PortfolioSource[], projects, createPortfolioAssetResolver(assets));
}
