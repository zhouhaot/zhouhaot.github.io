import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { noteSchema, siteProfileSchema, worksSchema } from '@/domain/content-schema';

const site = defineCollection({
  loader: glob({ base: './src/content/site', pattern: 'profile.md' }),
  schema: siteProfileSchema,
});

const works = defineCollection({
  loader: glob({ base: './src/content/works', pattern: '**/*.{md,mdx}' }),
  schema: worksSchema,
});

const notes = defineCollection({
  loader: glob({ base: './src/content/notes', pattern: '**/*.{md,mdx}' }),
  schema: noteSchema,
});

export const collections = { site, works, notes };
