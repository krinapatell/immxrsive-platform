import { NextResponse } from 'next/server';
import { errorResponse, readJson, requireUser } from '@/lib/api';
import { createProject, myProjects } from '@/lib/projects';

/** GET: my projects, invitations and requests. POST: create a project (R3.01, R3.02, R3.16). */
export async function GET() {
  const auth = await requireUser();
  if (auth.user === null) return auth.error;
  try {
    const { items } = await myProjects(auth.user);
    return NextResponse.json({ items }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.user === null) return auth.error;
  const body = await readJson(request);
  if (!body) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  try {
    const result = await createProject(auth.user, body);
    // A repository already used by another project: warn and offer to view/join it instead.
    if ('duplicates' in result) return NextResponse.json({ duplicates: result.duplicates }, { status: 409 });
    return NextResponse.json({ project: result.project }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
