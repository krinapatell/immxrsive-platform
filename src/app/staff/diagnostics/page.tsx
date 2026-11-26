import { staffState } from '@/lib/staff';
import { recentEvents } from '@/lib/events';
import StaffGate from '@/components/staff/StaffGate';
import StaffNav from '@/components/staff/StaffNav';

export const dynamic = 'force-dynamic';

const COLOR: Record<string, string> = { error: 'bg-red-100 text-red-900', warn: 'bg-amber-100 text-amber-900', info: 'bg-stone-100' };

/**
 * Staff-only diagnostics (F.30 - F.32): recent problems and important actions.
 * Secrets, codes, tokens and cookies are never stored, so they can't show here.
 */
export default async function Diagnostics() {
  const { state } = await staffState();
  if (state !== 'staff') return <StaffGate state={state} />;
  const events = await recentEvents(150);
  const errors = events.filter((e) => e.level === 'error').length;
  return (
    <div className="space-y-5">
      <StaffNav />
      <div>
        <h1 className="text-3xl font-extrabold">Diagnostics</h1>
        <p className="text-muted">
          The last {events.length} events. {errors ? `${errors} errors.` : 'No errors.'} Health check:{' '}
          <a className="underline" href="/api/health">
            /api/health
          </a>
        </p>
      </div>
      {events.length === 0 ? (
        <p>Nothing has been recorded yet.</p>
      ) : (
        <ul className="space-y-2">
          {events.map((e) => (
            <li key={String(e.id)} className="rounded-lg border border-line bg-white p-3 text-sm">
              <p>
                <span className={`rounded px-2 py-0.5 text-xs font-bold uppercase ${COLOR[e.level as string] ?? ''}`}>{e.level as string}</span>{' '}
                <span className="font-semibold">{e.area as string}</span> · {new Date(e.created_at as string).toLocaleString('en-CA', { timeZone: 'America/Toronto' })}
              </p>
              <p className="mt-1 break-words">{e.message as string}</p>
              {e.context && Object.keys(e.context as object).length > 0 && (
                <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all text-xs text-muted">{JSON.stringify(e.context)}</pre>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
