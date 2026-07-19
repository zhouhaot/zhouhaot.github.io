import { z } from 'astro/zod';

export const httpsUrl = z.url().refine((value) => new URL(value).protocol === 'https:', {
  message: 'URL must use https:',
});

export const publicContactUrl = z.url().refine((value) => ['https:', 'mailto:'].includes(new URL(value).protocol), {
  message: 'Contact URL must use https: or mailto:',
});

export const contactKindSchema = z.enum(['github', 'email', 'website']);

export const publicContactSchema = z
  .object({
    label: z.string().trim().min(1).max(80),
    kind: contactKindSchema,
    href: publicContactUrl,
  })
  .strict()
  .superRefine((contact, context) => {
    const protocol = new URL(contact.href).protocol;
    const expected = contact.kind === 'email' ? 'mailto:' : 'https:';
    if (protocol !== expected) {
      context.addIssue({ code: 'custom', path: ['href'], message: `${contact.kind} contacts must use ${expected}` });
    }
  });

export const siteProfileSchema = z
  .object({
    heroEyebrow: z.string().trim().min(1).max(80),
    heroTitle: z.string().trim().min(1).max(120),
    role: z.string().trim().min(1).max(80),
    heroSummary: z.string().trim().min(1).max(240),
    positioning: z.string().trim().min(1).max(320),
    capabilities: z.array(z.string().trim().min(1).max(120)).min(1),
    method: z.array(z.string().trim().min(1).max(120)).min(1),
    principles: z.array(z.string().trim().min(1).max(160)).min(1),
    currentStatus: z.string().trim().min(1).max(240),
    trustBoundary: z.string().trim().min(1).max(400),
    contacts: z.array(publicContactSchema).min(1),
  })
  .strict();

export type SiteProfile = z.infer<typeof siteProfileSchema>;
export type PublicContact = z.infer<typeof publicContactSchema>;

export const localMediaPath = z.string().superRefine((value, context) => {
  const segments = value.split('/');
  const valid =
    value === value.normalize('NFC') &&
    value === value.trim() &&
    value.length > 0 &&
    !value.startsWith('/') &&
    !value.startsWith('./') &&
    !value.includes(':') &&
    !value.includes('\\') &&
    !value.includes('%') &&
    !value.includes('..') &&
    segments.every((segment) => segment.length > 0 && !segment.startsWith('.'));

  if (!valid) {
    context.addIssue({ code: 'custom', message: 'Media path must be a canonical local relative path.' });
  }
});

function localMediaPathWithExtension(extensions: readonly string[]) {
  return localMediaPath.refine((value) => extensions.some((extension) => value.endsWith(`.${extension}`)), {
    message: `Media path must use one of: ${extensions.join(', ')}.`,
  });
}

const canonicalProjectId = z.string().superRefine((value, context) => {
  const canonical = value.normalize('NFC').trim();
  if (
    value !== canonical ||
    !canonical ||
    canonical === '.' ||
    canonical === '..' ||
    /[\\/%]/.test(canonical) ||
    canonical.includes('..')
  ) {
    context.addIssue({ code: 'custom', message: 'Related project id must be a canonical safe single id.' });
  }
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
  constraints: z.array(z.string().min(1)).optional(),
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

const portfolioMediaBaseSchema = z
  .object({
    alt: z.string().min(1),
    caption: z.string().min(1),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    license: z.enum(['owned', 'licensed', 'cc-by', 'public-domain']),
    credit: z.string().min(1).optional(),
    licenseUrl: httpsUrl.optional(),
    evidenceUrl: httpsUrl.optional(),
  })
  .superRefine((media, context) => {
    if ((media.license === 'licensed' || media.license === 'cc-by') && (!media.credit || !media.licenseUrl)) {
      context.addIssue({ code: 'custom', message: 'Licensed media requires credit and an HTTPS license URL.' });
    }

    if (media.license === 'public-domain' && !media.evidenceUrl) {
      context.addIssue({ code: 'custom', message: 'Public-domain media requires an HTTPS evidence URL.' });
    }
  });

const portfolioMediaSchema = z.discriminatedUnion('type', [
  portfolioMediaBaseSchema.extend({
    type: z.literal('image'),
    source: localMediaPathWithExtension(['avif', 'jpeg', 'jpg', 'png', 'webp']),
  }),
  portfolioMediaBaseSchema.extend({
    type: z.literal('video'),
    source: localMediaPathWithExtension(['mp4', 'webm']),
    poster: localMediaPathWithExtension(['avif', 'jpeg', 'jpg', 'png', 'webp']),
  }),
]);

export const portfolioSchema = commonSchema.extend({
  order: z.number().int().nonnegative(),
  status: z.enum(['published', 'archived']),
  relatedProject: canonicalProjectId.optional(),
  items: z.array(portfolioMediaSchema).min(1),
});
