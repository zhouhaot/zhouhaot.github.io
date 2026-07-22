/**
 * Cloudflare Pages Function: GET /oauth
 * Initiates the GitHub App OAuth flow by redirecting to GitHub's authorization endpoint.
 * Required env vars: GITHUB_CLIENT_ID
 */

export async function onRequestGet(context) {
  const { env, request } = context;
  const clientId = env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return new Response('GITHUB_CLIENT_ID is not configured.', { status: 500 });
  }

  const url = new URL(request.url);
  const provider = url.searchParams.get('provider');
  if (provider !== 'github') {
    return new Response(`Unsupported provider: ${provider ?? '(none)'}`, { status: 400 });
  }

  // state is passed through by Decap CMS for CSRF protection
  const state = url.searchParams.get('state') ?? '';

  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('scope', 'repo');
  authUrl.searchParams.set('state', state);

  return Response.redirect(authUrl.toString(), 302);
}
