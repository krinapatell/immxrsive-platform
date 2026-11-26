import Link from 'next/link';
import { staffState } from '@/lib/staff';
import { staffProjects } from '@/lib/admin';
import StaffGate from '@/components/staff/StaffGate';
import StaffNav from '@/components/staff/StaffNav';

export const dynamic = 'force-dynamic';

/** Staff: find a project to change its maintainer or demo status (F.19, F.36). */
export default async function StaffProjects({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { state } = await staffState();
  if (state !== 'staff') return <StaffGate state={state} />;
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q : '';
  const projects = await staffProjects(q);
  return (
    <div className="space-y-5">
      <StaffNav />
      <h1 className="text-3xl font-extrabold">Projects</h1>
      <form className="flex flex-wrap items-end gap-2" role="search">
        <div className="min-w-0 flex-1">
          <label htmlFor="pq" className="block text-sm font-semibold">
            Search by title or id
          </label>
          <input id="pq" name="q" defaultValue={q} className="mt-1 w-full rounded-lg border border-line px-3 py-2" />
        </div>
        <button className="rounded-lg bg-accent px-4 py-2 font-semibold text-white">Search</button>
      </form>
      <p role="status" className="text-sm text-muted">
        Showing {projects.length} project{projects.length === 1 ? '' : 's'}
        {projects.length === 50 ? ' (first 50; search to narrow down)' : ''}
      </p>
      <ul className="space-y-2">
        {projects.map((p) => (
          <li key={p.id as string} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-white p-3">
            <span>
              <span className="font-semibold">{p.title as string}</span> <span className="text-sm text-muted">({p.id as string})</span>
              <span className="block text-sm text-muted">
                {p.publish_status === 'draft' ? 'Draft' : 'Public'} · Maintainer: {(p.maintainer_student_id as string) ?? 'none'} · Demo: {p.demo_status as string}
              </span>
            </span>
            <Link href={`/staff/projects/${encodeURIComponent(p.id as string)}`} className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-dark">
              Manage <span className="sr-only">{p.title as string}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
