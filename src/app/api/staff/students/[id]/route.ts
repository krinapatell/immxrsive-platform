import { NextResponse } from 'next/server';
import { errorResponse, readJson } from '@/lib/api';
import { requireStaffApi } from '@/lib/staff';
import { staffUpdateStudent, studentAdmin } from '@/lib/admin';

type Ctx = { params: Promise<{ id: string }> };

/** Staff only. GET: the profile as staff see it (including private legacy data). */
export async function GET(_r: Request, ctx: Ctx) {
  const auth = await requireStaffApi();
  if (auth.user === null) return auth.error;
  const { id } = await ctx.params;
  try {
    const data = await studentAdmin(id);
    if (!data) return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return errorResponse(err, 'staff');
  }
}

/**
 * POST { action, ... }:
 * status {status} | talent {talent_state} | publish | unpublish | retire | restore |
 * unlink_owner | assign_owner {github_login} | merge {merge_into}
 */
export async function POST(request: Request, ctx: Ctx) {
  const auth = await requireStaffApi();
  if (auth.user === null) return auth.error;
  const { id } = await ctx.params;
  const body = await readJson(request);
  if (!body) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  try {
    return NextResponse.json(await staffUpdateStudent(auth.user, id, body));
  } catch (err) {
    return errorResponse(err, 'staff');
  }
}
