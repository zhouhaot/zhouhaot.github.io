export const PUBLIC_ROUTES = {
  home: '/',
  projects: '/projects/',
  articles: '/articles/',
  portfolio: '/portfolio/',
  about: '/about/',
} as const;

export type PublicRoute = (typeof PUBLIC_ROUTES)[keyof typeof PUBLIC_ROUTES];

function detailRoute(base: string, id: string): string {
  const segment = id.trim();

  if (!segment || segment === '.' || segment === '..' || /[\\/]/.test(segment)) {
    throw new Error('Detail route id must be a safe single path segment.');
  }

  return `${base}${encodeURIComponent(segment)}/`;
}

export function projectRoute(id: string): string {
  return detailRoute(PUBLIC_ROUTES.projects, id);
}

export function articleRoute(id: string): string {
  return detailRoute(PUBLIC_ROUTES.articles, id);
}
