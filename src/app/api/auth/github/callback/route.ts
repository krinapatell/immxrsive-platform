import { NextResponse, type NextRequest } from 'next/server';
import { config } from '@/lib/config';
import { safeEqual, startSession } from '@/lib/session';
import { upsertGithubUser } from '@/lib/users';

/**
 * Step 2 of GitHub sign-in. GitHub sends the student back here with a
 * one-time code, which we exchange (server to server) for the GitHub
 * account's public profile. We keep only the numeric id, username and avatar.
 */
export async function GET(request: NextRequest) {
  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/student?error=${reason}`, request.url));

  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const expected = request.cookies.get('imx_oauth_state')?.value;
  if (!code || !state || !expected || !safeEqual(state, expected)) return fail('signin_failed');

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: config.githubClientId,
        client_secret: config.githubClientSecret,
        code,
      }),
      cache: 'no-store',
    });
    const token = await tokenRes.json();
    if (!token.access_token) return fail('signin_failed');

    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token.access_token}`, Accept: 'application/vnd.github+json' },
      cache: 'no-store',
    });
    if (!userRes.ok) return fail('signin_failed');
    const gh = await userRes.json();
    if (typeof gh.id !== 'number') return fail('signin_failed');

    const user = await upsertGithubUser({ id: gh.id, login: String(gh.login ?? ''), avatar_url: String(gh.avatar_url ?? '') });
    await startSession(user.user_id);
  } catch (err) {
    console.error('GitHub sign-in failed:', err instanceof Error ? err.message : err);
    return fail('signin_failed');
  }

  const response = NextResponse.redirect(new URL('/student', request.url));
  response.cookies.delete('imx_oauth_state');
  return response;
}
