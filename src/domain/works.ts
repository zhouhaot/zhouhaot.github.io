import { getCollection } from 'astro:content';
import { isPublicEntry } from './content';
import { assertEntrySlug, assertPublishable } from './publication';
import { workRoute } from './routes';

export type WorkKind = 'project' | 'experiment';
export type WorkStatus = 'prototype' | 'validated' | 'shipped' | 'archived';

export type WorkData = {
  title: string;
  summary: string;
  publishedAt: Date;
  updatedAt?: Date | undefined;
  draft?: boolean | undefined;
  slug: string;
  attestation: {
    authenticityConfirmed: boolean;
    rightsConfirmed: boolean;
    reviewedAt?: Date | undefined;
    evidenceUrls: string[];
  };
  kind: WorkKind;
  tags: string[];
  status: WorkStatus;
  featured?: boolean | undefined;
  demoUrl?: string | undefined;
  repositoryUrl?: string | undefined;
};

export type WorkSource = { id: string; collection: 'works'; data: WorkData };

const statusLabels: Record<WorkStatus, string> = {
  prototype: '原型',
  validated: '已验证',
  shipped: '已交付',
  archived: '已归档',
};

const kindLabels: Record<WorkKind, string> = {
  project: '项目',
  experiment: '实验',
};

export type PublicWork = {
  id: string;
  title: string;
  summary: string;
  publishedAt: Date;
  updatedAt?: Date | undefined;
  year: string;
  kind: WorkKind;
  kindLabel: string;
  tags: string[];
  status: WorkStatus;
  statusLabel: string;
  featured: boolean;
  demoUrl?: string | undefined;
  repositoryUrl?: string | undefined;
  href: string;
};

function assertUniqueSafeIds(entries: readonly WorkSource[]): void {
  const seen = new Set<string>();
  for (const entry of entries) {
    const canonical = entry.id.normalize('NFC').trim();
    workRoute(canonical);
    if (entry.id !== canonical) throw new Error(`Work id must be canonical: ${entry.id}`);
    const normalized = canonical.toLowerCase();
    if (seen.has(normalized)) throw new Error(`Duplicate work id: ${entry.id}`);
    seen.add(normalized);
  }
}

function newestFirst(left: WorkSource, right: WorkSource): number {
  return right.data.publishedAt.valueOf() - left.data.publishedAt.valueOf() || left.id.localeCompare(right.id, 'en');
}

function toPublicWork(source: WorkSource): PublicWork {
  return {
    id: source.id,
    title: source.data.title,
    summary: source.data.summary,
    publishedAt: source.data.publishedAt,
    updatedAt: source.data.updatedAt,
    year: String(source.data.publishedAt.getFullYear()),
    kind: source.data.kind,
    kindLabel: kindLabels[source.data.kind],
    tags: source.data.tags,
    status: source.data.status,
    statusLabel: statusLabels[source.data.status],
    featured: source.data.featured ?? false,
    demoUrl: source.data.demoUrl,
    repositoryUrl: source.data.repositoryUrl,
    href: workRoute(source.id),
  };
}

export function buildWorks(entries: readonly WorkSource[], production = import.meta.env.PROD): PublicWork[] {
  for (const entry of entries) {
    assertEntrySlug('works', entry.id, entry.data.slug);
    assertPublishable(entry.data);
  }
  const published = entries.filter((entry) => isPublicEntry(entry.data, production));
  assertUniqueSafeIds(published);
  return [...published].sort(newestFirst).map(toPublicWork);
}

export function workStaticPaths(works: readonly PublicWork[]) {
  return works.map((work) => ({ params: { id: work.id }, props: { work } }));
}

export async function getPublishedWorks(): Promise<PublicWork[]> {
  const entries = await getCollection('works', ({ data }) => isPublicEntry(data));
  return buildWorks(entries.map((entry) => ({ id: entry.id, collection: 'works' as const, data: entry.data })));
}
