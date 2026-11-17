import { NextResponse } from 'next/server';
import { errorResponse, readJson } from '@/lib/api';
import { requireStaffApi } from '@/lib/staff';
import { importCompany } from '@/lib/partners';

/**
 * Staff only. POST { url, company_id? }: read a company website and return
 * SUGGESTED values. Nothing is saved to a company and nothing is published (R4.08 - R4.10).
 * A failed fetch returns { ok: false, error } with status 200 so the form keeps its draft (R4.11).
 */
export async function POST(request: Request) {
  const auth = await requireStaffApi();
  if (auth.user === null) return auth.error;
  const body = await readJson(request);
  if (!body) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  try {
    const companyId = typeof body.company_id === 'string' && body.company_id ? body.company_id : undefined;
    return NextResponse.json(await importCompany(auth.user, body.url, companyId));
  } catch (err) {
    return errorResponse(err);
  }
}
