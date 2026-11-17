import { NextResponse } from 'next/server';
import { errorResponse, readJson } from '@/lib/api';
import { requireStaffApi } from '@/lib/staff';
import { removeProjectPartner, removeVerification } from '@/lib/partners';

type Ctx = { params: Promise<{ id: string }> };

/** Staff only. POST { action: remove_verification | remove_partner, company_id }. */
export async function POST(request: Request, ctx: Ctx) {
  const auth = await requireStaffApi();
  if (auth.user === null) return auth.error;
  const { id } = await ctx.params;
  const body = await readJson(request);
  if (!body) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  try {
    if (body.action === 'remove_verification') return NextResponse.json(await removeVerification(auth.user, id));
    if (body.action === 'remove_partner') return NextResponse.json(await removeProjectPartner(auth.user, id, String(body.company_id ?? '')));
    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (err) {
    return errorResponse(err);
  }
}
