import { getEntry } from 'astro:content';
import { buildSiteProfile, SITE_PROFILE_ID } from './public-profile';

export async function getSiteProfile() {
  const entry = await getEntry('site', SITE_PROFILE_ID);
  return buildSiteProfile(entry ? [{ id: entry.id, data: entry.data }] : []);
}
