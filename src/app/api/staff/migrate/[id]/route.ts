import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api';
import { requireStaffApi } from '@/lib/staff';
import { getRun } from '@/lib/migration';

/** Staff only: one migration run's full report, as a downloadable JSON file (F.03). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaffApi();
  if (auth.user === null) return auth.error;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Report not found.' }, { status: 404 });
  try {
    const run = await getRun(id);
    if (!run) return NextResponse.json({ error: 'Report not found.' }, { status: 404 });
    const body = JSON.stringify({ run_id: run.id, created_at: run.created_at, ...run.report }, null, 2);
    return new NextResponse(body, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="migration-report-${String(run.created_at).slice(0, 10)}-${run.id.slice(0, 8)}.json"`,
      },
    });
  } catch (err) {
    return errorResponse(err, 'migration');
  }
}
