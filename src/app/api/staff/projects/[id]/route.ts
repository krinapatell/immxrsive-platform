import { NextResponse } from 'next/server';
import { errorResponse, readJson } from '@/lib/api';
import { requireStaffApi } from '@/lib/staff';
import { removeProjectPartner, removeVerification } from '@/lib/partners';
import { setMaintainer, setDemoStatus } from '@/lib/admin';

type Ctx = { params: Promise<{ id: string }> };

/** Staff only. POST { action: remove_verification | remove_partner {company_id} | set_maintainer {student_id} | demo_status {demo_status, demo_note} }. */
export async function POST(request: Request, ctx: Ctx) {
  const auth = await requireStaffApi();
  if (auth.user === null) return auth.error;
  const { id } = await ctx.params;
  const body = await readJson(request);
  if (!body) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  try {
    if (body.action === 'remove_verification') return NextResponse.json(await removeVerification(auth.user, id));
    if (body.action === 'remove_partner') return NextResponse.json(await removeProjectPartner(auth.user, id, String(body.company_id ?? '')));
    if (body.action === 'set_maintainer') return NextResponse.json(await setMaintainer(auth.user, id, body.student_id));
    if (body.action === 'demo_status') return NextResponse.json(await setDemoStatus(auth.user, id, body.demo_status, body.demo_note));
    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (err) {
    return errorResponse(err);
  }
}
