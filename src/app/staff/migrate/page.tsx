import { staffState } from '@/lib/staff';
import { listRuns } from '@/lib/migration';
import StaffGate from '@/components/staff/StaffGate';
import StaffNav from '@/components/staff/StaffNav';
import MigrationUploader from '@/components/staff/MigrationUploader';

export const dynamic = 'force-dynamic';

type Counts = Record<string, { created: number; updated: number; skipped: number; conflict: number }>;

/** Staff: import the legacy site's export, check it first, and keep a report of every run (F.01 - F.06). */
export default async function MigratePage() {
  const { state } = await staffState();
  if (state !== 'staff') return <StaffGate state={state} />;
  const runs = await listRuns();
  return (
    <div className="space-y-5">
      <StaffNav />
      <div>
        <h1 className="text-3xl font-extrabold">Import from the old site</h1>
        <p className="text-muted">
          Upload the export file. Check it first: nothing is saved until you choose Import. Running the same file again is safe; records already
          imported are matched by their old id and are not copied twice.
        </p>
      </div>
      <MigrationUploader />
      <section className="rounded-2xl border border-line bg-white p-5 sm:p-6" aria-labelledby="runs">
        <h2 id="runs" className="text-lg font-bold">
          Earlier runs
        </h2>
        {runs.length === 0 ? (
          <p className="mt-2 text-sm">Nothing has been imported yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {runs.map((r) => {
              const c = r.counts as Counts;
              const sum = (k: 'created' | 'updated' | 'skipped' | 'conflict') => Object.values(c ?? {}).reduce((n, x) => n + (x?.[k] ?? 0), 0);
              return (
                <li key={r.id as string} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line p-3">
                  <span>
                    <span className="font-semibold">{r.source as string}</span>{' '}
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold">{r.dry_run ? 'Check only' : 'Imported'}</span>
                    <span className="block text-sm text-muted">
                      {new Date(r.created_at as string).toLocaleString('en-CA', { timeZone: 'America/Toronto', dateStyle: 'medium', timeStyle: 'short' })} ·{' '}
                      {sum('created')} new, {sum('updated')} updated, {sum('skipped')} unchanged, {sum('conflict')} problems
                    </span>
                  </span>
                  <a href={`/api/staff/migrate/${r.id}`} className="text-sm font-semibold text-accent-dark underline">
                    Download report
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
