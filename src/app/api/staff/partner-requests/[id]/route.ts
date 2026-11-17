import { NextResponse } from 'next/server';
import { errorResponse, readJson } from '@/lib/api';
import { requireStaffApi } from '@/lib/staff';
import { decidePartnerRequest } from '@/lib/partners';

type Ctx = { params: Promise<{ id: string }> };

/** Staff only. POST { action: approve | reject, company_id?, create_company?, staff_note } (R4.21). */
export async function POST(request: Request, ctx: Ctx) {
  const auth = await requireStaffApi();
  if (auth.user === null) return auth.error;
  const { id } = await ctx.params;
  const body = await readJson(request);
  if (!body || (body.action !== 'approve' && body.action !== 'reject')) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  try {
    return NextResponse.json(await decidePartnerRequest(auth.user, id, body.action === 'approve', body));
  } catch (err) {
    return errorResponse(err);
  }
}
