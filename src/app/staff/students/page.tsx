import Link from 'next/link';
import { staffState } from '@/lib/staff';
import { staffStudents } from '@/lib/admin';
import StaffGate from '@/components/staff/StaffGate';
import StaffNav from '@/components/staff/StaffNav';
import StaffButton from '@/components/staff/StaffButton';

export const dynamic = 'force-dynamic';

const STATE: Record<string, string> = { draft: 'Draft', published: 'Public', unpublished: 'Hidden', retired: 'Retired' };

/** Staff: every profile in every state, with owner and duplicate hints (F.11 - F.17). */
export default async function StaffStudents({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { state } = await staffState();
  if (state !== 'staff') return <StaffGate state={state} />;
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q : '';
  const page = Math.max(1, Number(sp.page) || 1);
  const r = await staffStudents(q, page);
  const last = Math.max(1, Math.ceil(r.total / r.pageSize));
  const href = (p: number) => `/staff/students?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`;
  return (
    <div className="space-y-5">
      <StaffNav />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-extrabold">Student profiles</h1>
        <StaffButton
          url="/api/staff/students"
          body={{ action: 'practice_pair' }}
          label="Create a practice duplicate pair"
          done="Created. Search for “QA Practice” to find it."
        />
      </div>
      <form className="flex flex-wrap items-end gap-2" role="search">
        <div className="min-w-0 flex-1">
          <label htmlFor="sq" className="block text-sm font-semibold">
            Search by name or id
          </label>
          <input id="sq" name="q" defaultValue={q} className="mt-1 w-full rounded-lg border border-line px-3 py-2" placeholder="e.g. Avery or LS04" />
        </div>
        <button className="rounded-lg bg-accent px-4 py-2 font-semibold text-white">Search</button>
      </form>
      <p role="status" className="text-sm text-muted">
        {r.total} profiles{r.total > r.pageSize ? ` · page ${page} of ${last}` : ''}
      </p>
      <ul className="space-y-2">
        {r.students.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-white p-3">
            <span className="min-w-0">
              <span className="font-semibold">{s.name}</span> <span className="text-sm text-muted">({s.id})</span>
              <span className="block text-sm text-muted">
                {s.merged_into
                  ? `Merged into ${s.merged_into}`
                  : [STATE[s.profile_status], s.status === 'alumni' ? 'Alumni' : 'Current student', s.talent_state === 'showcase' ? 'Showcase only' : 'Active talent', s.owned ? 'Has an owner' : s.legacy_id ? 'Unclaimed (from old site)' : 'No owner'].join(' · ')}
              </span>
              {s.possible_duplicates.length > 0 && (
                <span className="mt-1 block text-sm font-semibold text-amber-800">Possible duplicate of {s.possible_duplicates.join(', ')}</span>
              )}
            </span>
            <Link href={`/staff/students/${encodeURIComponent(s.id)}`} className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-dark">
              Manage <span className="sr-only">{s.name}</span>
            </Link>
          </li>
        ))}
      </ul>
      {last > 1 && (
        <nav aria-label="Pages" className="flex gap-3">
          {page > 1 && (
            <Link href={href(page - 1)} className="font-semibold underline">
              ← Previous
            </Link>
          )}
          {page < last && (
            <Link href={href(page + 1)} className="font-semibold underline">
              Next →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
