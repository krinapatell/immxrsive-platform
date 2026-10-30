import { NextResponse } from 'next/server';
import { errorResponse, readJson, requireUser } from '@/lib/api';
import { importFromGithub } from '@/lib/projects';

/** R3.03: suggestions from a public GitHub repository. Nothing is saved. */
export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.user === null) return auth.error;
  if (!auth.user.affiliation_verified_at) return NextResponse.json({ error: 'Verify your Algoma email first.' }, { status: 403 });
  const body = await readJson(request);
  try {
    return NextResponse.json({ suggestions: await importFromGithub(body?.repository) });
  } catch (err) {
    return errorResponse(err);
  }
}
