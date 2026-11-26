import { NextResponse } from 'next/server';
import { errorResponse, readJson } from '@/lib/api';
import { requireStaffApi } from '@/lib/staff';
import { createPracticePair } from '@/lib/admin';

/** Staff only. POST { action: 'practice_pair' }: a labelled duplicate pair + project for QA practice. */
export async function POST(request: Request) {
  const auth = await requireStaffApi();
  if (auth.user === null) return auth.error;
  const body = await readJson(request);
  if (body?.action !== 'practice_pair') return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  try {
    return NextResponse.json(await createPracticePair(auth.user), { status: 201 });
  } catch (err) {
    return errorResponse(err, 'staff');
  }
}
