import { z } from 'astro/zod';
import { IMAGE_EXTENSIONS, MEDIA_LICENSES, VIDEO_EXTENSIONS, parseContentMediaPath } from './media';
import { canonicalSlugSchema } from './publication';

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

export const localMediaPath = z.string().refine((value) => parseContentMediaPath(value) !== undefined, {
  message: 'Media path must be canonical under src/assets/content.',
});

const mediaBaseSchema = z.object({
  alt: z.string().trim().min(1),
  caption: z.string().trim().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  license: z.enum(MEDIA_LICENSES),
  credit: z.string().trim().min(1).optional(),
  licenseUrl: httpsUrl.optional(),
  evidenceUrl: httpsUrl.optional(),
});

function mediaPathWith(extensions: readonly string[]) {
  return localMediaPath.refine((value) => extensions.some((extension) => value.endsWith(`.${extension}`)), {
    message: `Media path must use one of: ${extensions.join(', ')}.`,
  });
}

export const mediaSchema = z
  .discriminatedUnion('type', [
    mediaBaseSchema.extend({ type: z.literal('image'), source: mediaPathWith(IMAGE_EXTENSIONS) }),
    mediaBaseSchema.extend({
      type: z.literal('video'),
      source: mediaPathWith(VIDEO_EXTENSIONS),
      poster: mediaPathWith(IMAGE_EXTENSIONS),
    }),
  ])
  .superRefine((media, context) => {
    if ((media.license === 'licensed' || media.license === 'cc-by') && (!media.credit || !media.licenseUrl)) {
      context.addIssue({ code: 'custom', message: 'Licensed media requires credit and an HTTPS license URL.' });
    }
    if (media.license === 'public-domain' && !media.evidenceUrl) {
      context.addIssue({ code: 'custom', message: 'Public-domain media requires an HTTPS evidence URL.' });
    }
  });

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

export const attestationSchema = z.object({
  authenticityConfirmed: z.boolean().default(false),
  rightsConfirmed: z.boolean().default(false),
  reviewedAt: z.coerce.date().optional(),
  evidenceUrls: z.array(httpsUrl).default([]),
});

const commonPublicationFields = {
  slug: canonicalSlugSchema,
  title: z.string().trim().min(1).max(120),
  summary: z.string().trim().min(1).max(240),
  publishedAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  draft: z.boolean().default(true),
  attestation: attestationSchema,
} as const;

function publicationSchema<T extends z.ZodRawShape>(fields: T) {
  return z.object({ ...commonPublicationFields, ...fields });
}

export const workSchema = publicationSchema({
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
  media: z.array(mediaSchema).default([]),
  constraints: z.array(z.string().min(1)).optional(),
  outcomes: z.array(z.string().min(1)).default([]),
  limitations: z.array(z.string().min(1)).default([]),
  nextSteps: z.array(z.string().min(1)).default([]),
});

export const labSchema = publicationSchema({
  hypothesis: z.string().min(1),
  workflow: z.array(z.string().min(1)).min(1),
  modelOrTools: z.array(z.string().min(1)).min(1),
  result: z.string().trim().default(''),
  evaluation: z.string().trim().default(''),
  status: z.enum(['prototype', 'validated', 'archived']),
  repositoryUrl: httpsUrl.optional(),
  demoUrl: httpsUrl.optional(),
  media: z.array(mediaSchema).default([]),
});

export const noteSchema = publicationSchema({
  tags: z.array(z.string().min(1)).min(1),
  media: z.array(mediaSchema).default([]),
});

export const portfolioSchema = publicationSchema({
  order: z.number().int().nonnegative(),
  status: z.enum(['published', 'archived']),
  relatedProject: canonicalProjectId.optional(),
  items: z.array(mediaSchema).min(1),
});
