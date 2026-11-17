import { NextResponse } from 'next/server';
import { errorResponse, readJson } from '@/lib/api';
import { requireStaffApi } from '@/lib/staff';
import { createCompany, listCompaniesForPicker } from '@/lib/partners';

/** Staff only (R4.02). GET: all companies. POST: create a DRAFT company (R4.07, R4.09). 409 = same website domain already exists. */
export async function GET() {
  const auth = await requireStaffApi();
  if (auth.user === null) return auth.error;
  try {
    return NextResponse.json({ companies: await listCompaniesForPicker(false) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  const auth = await requireStaffApi();
  if (auth.user === null) return auth.error;
  const body = await readJson(request);
  if (!body) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  try {
    const result = await createCompany(auth.user, body);
    if ('duplicates' in result) return NextResponse.json({ duplicates: result.duplicates }, { status: 409 });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
