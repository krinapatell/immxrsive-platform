import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/users';
import { confirmCode, requestCode } from '@/lib/verification';

/**
 * POST { action: "send", email } -> emails a code to an approved address
 * POST { action: "confirm", code } -> checks the code for the signed-in user
 *
 * The code is never included in any response.
 */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Sign in with GitHub first.' }, { status: 401 });
  if (user.affiliation_verified_at) {
    return NextResponse.json({ ok: true, message: 'Already verified.' });
  }

  let body: { action?: string; email?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  try {
    const result =
      body.action === 'send'
        ? await requestCode(user.user_id, String(body.email ?? ''))
        : body.action === 'confirm'
          ? await confirmCode(user.user_id, String(body.code ?? ''))
          : ({ ok: false, status: 400, message: 'Unknown action.' } as const);

    if (!result.ok) return NextResponse.json({ error: result.message }, { status: result.status });
    return NextResponse.json({ ok: true, message: result.message });
  } catch (err) {
    console.error('Verification error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
