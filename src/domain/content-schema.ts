import { z } from 'astro/zod';

export const httpsUrl = z.url().refine((value) => new URL(value).protocol === 'https:', {
  message: 'URL must use https:',
});

export const publicContactUrl = z.url().refine((value) => ['https:', 'mailto:'].includes(new URL(value).protocol), {
  message: 'Contact URL must use https: or mailto:',
});

const commonSchema = z.object({
  title: z.string().min(1).max(120),
  summary: z.string().min(1).max(240),
  publishedAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  draft: z.boolean().default(false),
});

export const workSchema = commonSchema.extend({
  problem: z.string().min(1),
  role: z.string().min(1),
  solution: z.string().min(1),
  stack: z.array(z.string().min(1)).min(1),
  contributions: z.array(z.string().min(1)).min(1),
  status: z.enum(['prototype', 'validated', 'shipped', 'archived']),
  featured: z.boolean().default(false),
  repositoryUrl: httpsUrl.optional(),
  demoUrl: httpsUrl.optional(),
  architecture: z.string().optional(),
  screenshots: z.array(z.string().min(1)).default([]),
  outcomes: z.array(z.string().min(1)).default([]),
  limitations: z.array(z.string().min(1)).default([]),
  nextSteps: z.array(z.string().min(1)).default([]),
});

export const labSchema = commonSchema.extend({
  hypothesis: z.string().min(1),
  workflow: z.array(z.string().min(1)).min(1),
  modelOrTools: z.array(z.string().min(1)).min(1),
  result: z.string().min(1),
  evaluation: z.string().min(1),
  status: z.enum(['prototype', 'validated', 'archived']),
  repositoryUrl: httpsUrl.optional(),
  demoUrl: httpsUrl.optional(),
});

export const noteSchema = commonSchema.extend({
  tags: z.array(z.string().min(1)).min(1),
});
