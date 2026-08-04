import { z } from 'astro/zod';

export const CONTENT_COLLECTIONS = ['works', 'notes'] as const;
export type ContentCollectionName = (typeof CONTENT_COLLECTIONS)[number];

export const canonicalSlugSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase ASCII kebab case.');

export type PublicationAttestation = {
  authenticityConfirmed: boolean;
  rightsConfirmed: boolean;
  reviewedAt?: Date | undefined;
  evidenceUrls: string[];
};

export type CommonPublicationData = {
  slug: string;
  draft: boolean;
  attestation: PublicationAttestation;
  result?: string | undefined;
  evaluation?: string | undefined;
};

export function assertEntrySlug(collection: ContentCollectionName, id: string, slug: string): void {
  const parsed = canonicalSlugSchema.parse(slug);
  if (id !== parsed) throw new Error(`${collection} filename id must match slug: ${id} !== ${parsed}`);
}

export function assertPublishable(
  data: { draft?: boolean | undefined; attestation: PublicationAttestation; result?: string | undefined; evaluation?: string | undefined },
  now = new Date(),
): void {
  if (data.draft) return;
  if (!data.attestation.authenticityConfirmed)
    throw new Error('Published content requires authenticity confirmation.');
  if (!data.attestation.rightsConfirmed) throw new Error('Published content requires rights confirmation.');
  if (!data.attestation.reviewedAt) throw new Error('Published content requires reviewedAt.');
  if (data.attestation.reviewedAt.valueOf() > now.valueOf())
    throw new Error('reviewedAt cannot be in the future.');
  if (data.result !== undefined && !data.result.trim())
    throw new Error('Published lab content requires a result.');
  if (data.evaluation !== undefined && !data.evaluation.trim())
    throw new Error('Published lab content requires an evaluation.');
}
