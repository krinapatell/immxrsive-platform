import 'server-only';
import { createHash, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { db } from './db';
import { ProjectError } from './projects';
import { currentUser, type AppUser } from './users';

/**
 * Release 4 staff role (R4.01, R4.02).
 *
 * Staff is a separate role stored on the server (staff_members). A signed-in,
 * Algoma-verified account becomes staff only by entering the staff access
 * code, which is kept in the STAFF_ACCESS_CODE setting on Vercel and given to
 * staff/evaluators privately. It is never in the repository.
 *
 * Every staff page and staff API calls requireStaff(); the browser never
 * decides who is staff.
 */
const MAX_WRONG = 5;
const WINDOW_MINUTES = 15;

export async function isStaff(user: AppUser | null): Promise<boolean> {
  if (!user) return false;
  const { data, error } = await db().from('staff_members').select('user_id').eq('user_id', user.user_id).maybeSingle();
  if (error) throw error;
  return !!data;
}

export type StaffState = 'signed-out' | 'unverified' | 'not-staff' | 'staff';

export async function staffState(): Promise<{ state: StaffState; user: AppUser | null }> {
  const user = await currentUser();
  if (!user) return { state: 'signed-out', user };
  if (!user.affiliation_verified_at) return { state: 'unverified', user };
  return { state: (await isStaff(user)) ? 'staff' : 'not-staff', user };
}

/** For staff API routes: the staff user, or a 401/403 response. */
export async function requireStaffApi(): Promise<{ user: AppUser; error: null } | { user: null; error: NextResponse }> {
  const user = await currentUser();
  if (!user) return { user: null, error: NextResponse.json({ error: 'Sign in first.' }, { status: 401 }) };
  if (!(await isStaff(user))) return { user: null, error: NextResponse.json({ error: 'Only ImmXrsive staff can do this.' }, { status: 403 }) };
  return { user, error: null };
}

function digest(s: string) {
  return createHash('sha256').update(s).digest();
}

/** Grants staff to the signed-in, verified user when the code matches. Limited to 5 wrong tries per 15 minutes. */
export async function redeemStaffCode(user: AppUser, code: unknown): Promise<void> {
  if (!user.affiliation_verified_at) throw new ProjectError(403, 'Verify your Algoma email first.');
  const expected = (process.env.STAFF_ACCESS_CODE ?? '').trim();
  if (expected.length < 12) throw new ProjectError(503, 'Staff access is not set up on this deployment yet.');

  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
  const { count, error: countError } = await db()
    .from('staff_access_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.user_id)
    .eq('ok', false)
    .gte('created_at', since);
  if (countError) throw countError;
  if ((count ?? 0) >= MAX_WRONG) throw new ProjectError(429, `Too many wrong codes. Try again in ${WINDOW_MINUTES} minutes.`);

  const given = typeof code === 'string' ? code.trim() : '';
  const ok = given.length > 0 && timingSafeEqual(digest(given), digest(expected));
  await db().from('staff_access_attempts').insert({ user_id: user.user_id, ok });
  if (!ok) throw new ProjectError(403, 'That staff access code is not correct.');

  const { error } = await db().from('staff_members').upsert({ user_id: user.user_id }, { onConflict: 'user_id' });
  if (error) throw error;
}

/** Lets a tester go back to being an ordinary student on the same account. */
export async function leaveStaff(user: AppUser): Promise<void> {
  const { error } = await db().from('staff_members').delete().eq('user_id', user.user_id);
  if (error) throw error;
}
