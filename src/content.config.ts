import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { labSchema, noteSchema, portfolioSchema, workSchema } from '@/domain/content-schema';

const work = defineCollection({
  loader: glob({ base: './src/content/work', pattern: '**/*.{md,mdx}' }),
  schema: workSchema,
});

const lab = defineCollection({
  loader: glob({ base: './src/content/lab', pattern: '**/*.{md,mdx}' }),
  schema: labSchema,
});

const notes = defineCollection({
  loader: glob({ base: './src/content/notes', pattern: '**/*.{md,mdx}' }),
  schema: noteSchema,
});

const portfolio = defineCollection({
  loader: glob({ base: './src/content/portfolio', pattern: '**/*.{md,mdx}' }),
  schema: portfolioSchema,
});

export const collections = { work, lab, notes, portfolio };
