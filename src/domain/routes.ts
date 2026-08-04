export const PUBLIC_ROUTES = {
  home: '/',
  works: '/works/',
  blog: '/blog/',
  resume: '/resume/',
} as const;

export type PublicRoute = (typeof PUBLIC_ROUTES)[keyof typeof PUBLIC_ROUTES];

function detailRoute(base: string, id: string): string {
  const segment = id.normalize('NFC').trim();

  if (!segment || segment === '.' || segment === '..' || /[\\/]/.test(segment)) {
    throw new Error('Detail route id must be a safe single path segment.');
  }

  return `${base}${encodeURIComponent(segment)}/`;
}

export function workRoute(id: string): string {
  return detailRoute(PUBLIC_ROUTES.works, id);
}

export function articleRoute(id: string): string {
  return detailRoute(PUBLIC_ROUTES.blog, id);
}
