import { NextResponse } from 'next/server';
import { errorResponse, readJson } from '@/lib/api';
import { requireStaffApi } from '@/lib/staff';
import { companyAdmin, saveCollaboration, setCompanyPublished, updateCompany } from '@/lib/partners';

type Ctx = { params: Promise<{ id: string }> };

/** Staff only. GET: the company with its source history and all collaborations. */
export async function GET(_r: Request, ctx: Ctx) {
  const auth = await requireStaffApi();
  if (auth.user === null) return auth.error;
  const { id } = await ctx.params;
  try {
    return NextResponse.json(await companyAdmin(id), { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return errorResponse(err);
  }
}

/** PUT: save the reviewed company details (stays a draft until published). */
export async function PUT(request: Request, ctx: Ctx) {
  const auth = await requireStaffApi();
  if (auth.user === null) return auth.error;
  const { id } = await ctx.params;
  const body = await readJson(request);
  if (!body) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  try {
    const result = await updateCompany(auth.user, id, body);
    if ('duplicates' in result) return NextResponse.json({ duplicates: result.duplicates }, { status: 409 });
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}

/** POST { action: publish | unpublish | add_collaboration, ... } */
export async function POST(request: Request, ctx: Ctx) {
  const auth = await requireStaffApi();
  if (auth.user === null) return auth.error;
  const { id } = await ctx.params;
  const body = await readJson(request);
  if (!body) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  try {
    switch (body.action) {
      case 'publish':
      case 'unpublish':
        return NextResponse.json(await setCompanyPublished(auth.user, id, body.action === 'publish'));
      case 'add_collaboration':
        return NextResponse.json(await saveCollaboration(auth.user, id, body), { status: 201 });
      default:
        return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
    }
  } catch (err) {
    return errorResponse(err);
  }
}
