import type { SiteProfile } from './content-schema';

export const SITE_PROFILE_ID = 'profile' as const;
export type SiteProfileSource = { id: string; data: SiteProfile };

export function buildSiteProfile(entries: readonly SiteProfileSource[]): SiteProfile {
  if (entries.length !== 1) throw new Error(`Site profile must contain exactly one entry; received ${entries.length}.`);
  const [entry] = entries;
  if (!entry || entry.id !== SITE_PROFILE_ID) throw new Error(`Site profile id must be ${SITE_PROFILE_ID}.`);
  return entry.data;
}
