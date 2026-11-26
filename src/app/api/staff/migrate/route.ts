import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api';
import { requireStaffApi } from '@/lib/staff';
import { listRuns, runMigration } from '@/lib/migration';

/**
 * Staff only. GET: recent migration runs.
 * POST { source, dry_run, data }: checks (dry_run true) or imports a legacy export (F.01 - F.06).
 * Running the same file again is safe: records are matched by their legacy id.
 */
export async function GET() {
  const auth = await requireStaffApi();
  if (auth.user === null) return auth.error;
  try {
    return NextResponse.json({ runs: await listRuns() });
  } catch (err) {
    return errorResponse(err, 'migration');
  }
}

export async function POST(request: Request) {
  const auth = await requireStaffApi();
  if (auth.user === null) return auth.error;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'That file is not valid JSON. Upload the export file exactly as you downloaded it.' }, { status: 400 });
  }
  const data = body?.data;
  if (!data || typeof data !== 'object' || Array.isArray(data) || !Array.isArray((data as Record<string, unknown>).students)) {
    return NextResponse.json({ error: 'That file does not look like an export: it has no "students" list.' }, { status: 400 });
  }
  const source = typeof body.source === 'string' && body.source.trim() ? body.source.trim().slice(0, 120) : 'uploaded file';
  try {
    const result = await runMigration(auth.user, data, source, body.dry_run !== false);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    // Staff see the database's reason (no secrets in it) and how to recover; details go to diagnostics.
    const reason = err && typeof err === 'object' && 'message' in err && !(err instanceof Error) ? String((err as { message: unknown }).message).slice(0, 200) : '';
    const res = errorResponse(err, 'migration');
    if (!reason) return res;
    return NextResponse.json(
      {
        error: `The import stopped: ${reason}. Fix the cause and run it again; anything already imported is matched by its old id and is not copied twice. Details are in Staff › Diagnostics.`,
      },
      { status: 500 },
    );
  }
}
