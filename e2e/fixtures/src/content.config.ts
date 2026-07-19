import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { siteProfileSchema } from '../../../src/domain/content-schema';

const site = defineCollection({
  loader: glob({ base: '../../src/content/site', pattern: 'profile.md' }),
  schema: siteProfileSchema,
});

export const collections = { site };
