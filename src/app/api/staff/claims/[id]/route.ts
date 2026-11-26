import { NextResponse } from 'next/server';
import { errorResponse, readJson } from '@/lib/api';
import { requireStaffApi } from '@/lib/staff';
import { decideClaim } from '@/lib/admin';

/** Staff only. POST { action: approve | reject, staff_note } (a note is required to reject). */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireStaffApi();
  if (auth.user === null) return auth.error;
  const { id } = await ctx.params;
  const body = await readJson(request);
  if (!body || (body.action !== 'approve' && body.action !== 'reject')) return NextResponse.json({ error: 'Choose approve or reject.' }, { status: 400 });
  try {
    await decideClaim(auth.user, id, body.action === 'approve', body.staff_note);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err, 'claims');
  }
}
