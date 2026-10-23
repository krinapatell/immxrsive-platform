import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { config } from '@/lib/config';

/**
 * Step 1 of GitHub sign-in (R2.01). Sends the student to GitHub.
 *
 * R2.03: we request NO scopes. With an empty scope GitHub only shares the
 * public profile (id, username, avatar), which is all we need to identify
 * the account. We never ask for repository or email access.
 */
export async function GET(request: Request) {
  if (!config.githubClientId) {
    return NextResponse.redirect(new URL('/student?error=github_not_configured', request.url));
  }
  const state = randomBytes(24).toString('base64url');
  const origin = config.siteUrl || new URL(request.url).origin;

  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', config.githubClientId);
  url.searchParams.set('redirect_uri', `${origin}/api/auth/github/callback`);
  url.searchParams.set('scope', '');
  url.searchParams.set('state', state);
  // Always show GitHub's account picker, so on a shared computer the next
  // person can choose "Use a different account" instead of being signed in
  // automatically as whoever is already logged in to GitHub.
  url.searchParams.set('prompt', 'select_account');

  const response = NextResponse.redirect(url);
  // The state cookie protects against cross-site request forgery on the callback.
  response.cookies.set('imx_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });
  return response;
}
