/**
 * Cloudflare Pages Function: GET /oauth/callback
 * Completes the GitHub App OAuth flow: exchanges the code for a token
 * and posts the result back to the Decap CMS popup window.
 * Required env vars: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
 */

export async function onRequestGet(context) {
  const { env, request } = context;
  const clientId = env.GITHUB_CLIENT_ID;
  const clientSecret = env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return oauthError('OAuth credentials are not configured.');
  }

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state') ?? '';

  if (!code) {
    return oauthError('Missing code parameter from GitHub.');
  }

  // Exchange the code for a token server-side (secret never reaches the browser)
  let token;
  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });
    const data = await tokenResponse.json();
    if (data.error || !data.access_token) {
      return oauthError(data.error_description ?? 'GitHub token exchange failed.');
    }
    token = data.access_token;
  } catch {
    return oauthError('Token exchange request failed.');
  }

  // Post the token back to the Decap CMS opener window via postMessage
  const postMessagePayload = JSON.stringify({
    token,
    provider: 'github',
  });

  // The state is used by Decap to match the popup to the original request
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body>
<script>
(function() {
  const receiveMessage = function(e) {
    window.opener.postMessage(
      'authorization:github:success:${`\${JSON.stringify({token: ${JSON.stringify(token)}, provider: 'github'})}`}',
      e.origin
    );
  };
  window.addEventListener('message', receiveMessage, false);
  window.opener.postMessage('authorizing:github', '*');
})();
</script>
</body>
</html>`;

  // Build the response Decap expects: postMessage with the token
  const script = `
    (function() {
      function receiveMessage(e) {
        window.opener.postMessage(
          'authorization:github:success:' + JSON.stringify({ token: ${JSON.stringify(token)}, provider: 'github' }),
          e.origin
        );
      }
      window.addEventListener('message', receiveMessage, false);
      window.opener.postMessage('authorizing:github', '*');
    })();
  `;

  return new Response(
    `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body><script>${script}<\/script></body></html>`,
    {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    },
  );
}

function oauthError(message) {
  const script = `
    (function() {
      window.opener.postMessage(
        'authorization:github:error:' + JSON.stringify({ message: ${JSON.stringify('')} + ${JSON.stringify(message)} }),
        window.location.origin
      );
    })();
  `;
  return new Response(
    `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body><script>${script}<\/script></body></html>`,
    {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    },
  );
}
