import { NextResponse } from 'next/server';
import { errorResponse, readJson } from '@/lib/api';
import { requireStaffApi } from '@/lib/staff';
import { collaborationAdmin, saveCollaboration } from '@/lib/partners';

type Ctx = { params: Promise<{ id: string }> };

/** Staff only. PUT: update a collaboration (title, years, status, visibility, projects, students). */
export async function PUT(request: Request, ctx: Ctx) {
  const auth = await requireStaffApi();
  if (auth.user === null) return auth.error;
  const { id } = await ctx.params;
  const body = await readJson(request);
  if (!body) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  try {
    const current = await collaborationAdmin(id);
    return NextResponse.json(await saveCollaboration(auth.user, current.company_id, body, id));
  } catch (err) {
    return errorResponse(err);
  }
}
