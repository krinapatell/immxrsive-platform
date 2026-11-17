import { NextResponse } from 'next/server';
import { errorResponse, readJson } from '@/lib/api';
import { requireStaffApi } from '@/lib/staff';
import { decideVerification } from '@/lib/partners';

type Ctx = { params: Promise<{ id: string }> };

/** Staff only. POST { action: approve | reject, staff_note }: decide a project verification request (R4.05). */
export async function POST(request: Request, ctx: Ctx) {
  const auth = await requireStaffApi();
  if (auth.user === null) return auth.error;
  const { id } = await ctx.params;
  const body = await readJson(request);
  if (!body || (body.action !== 'approve' && body.action !== 'reject')) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  try {
    return NextResponse.json(await decideVerification(auth.user, id, body.action === 'approve', body.staff_note));
  } catch (err) {
    return errorResponse(err);
  }
}
