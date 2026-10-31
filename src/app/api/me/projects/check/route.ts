import { NextResponse } from 'next/server';
import { errorResponse, readJson, requireUser } from '@/lib/api';
import { findDuplicates } from '@/lib/projects';

/** R3.16: before saving, list projects that already use these repositories or share the title. */
export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.user === null) return auth.error;
  const body = await readJson(request);
  const repositories = Array.isArray(body?.repositories) ? body!.repositories.map(String).slice(0, 10) : [];
  try {
    return NextResponse.json(await findDuplicates(repositories, String(body?.title ?? ''), body?.exclude_id ? String(body.exclude_id) : undefined));
  } catch (err) {
    return errorResponse(err);
  }
}
