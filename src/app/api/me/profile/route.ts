import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/users';
import { getOrCreateMyProfile, saveMyProfile, setPublished } from '@/lib/profile';

/**
 * The signed-in student's own profile. There is deliberately no way to
 * name a different profile: the server always uses the session's user.
 * If a request tries to (by sending an id or user_id that isn't theirs),
 * it is refused with 403 so the attempt is visible (R2.30).
 */
async function requireVerified() {
  const user = await currentUser();
  if (!user) return { error: NextResponse.json({ error: 'Sign in with GitHub first.' }, { status: 401 }) };
  if (!user.affiliation_verified_at) {
    return { error: NextResponse.json({ error: 'Verify your Algoma email first.' }, { status: 403 }) };
  }
  return { user };
}

export async function GET() {
  const { user, error } = await requireVerified();
  if (error) return error;
  const profile = await getOrCreateMyProfile(user);
  return NextResponse.json({ profile }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PUT(request: Request) {
  const { user, error } = await requireVerified();
  if (error) return error;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const mine = await getOrCreateMyProfile(user);
  if ((body.id !== undefined && body.id !== mine.id) || (body.user_id !== undefined && body.user_id !== user.user_id)) {
    return NextResponse.json({ error: 'You can only edit your own profile.' }, { status: 403 });
  }

  if (body.action === 'publish' || body.action === 'unpublish') {
    const result = await setPublished(user, body.action === 'publish');
    if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 400 });
    return NextResponse.json({ profile: result.profile });
  }

  const result = await saveMyProfile(user, body);
  if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 400 });
  return NextResponse.json({ profile: result.profile });
}
