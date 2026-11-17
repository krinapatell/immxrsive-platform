import Link from 'next/link';
import type { Metadata } from 'next';
import { listPublicPartners } from '@/lib/partners';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Industry partners · ImmXrsive' };

/** Public list of published industry partners (R4.22). */
export default async function PartnersPage() {
  let partners: Awaited<ReturnType<typeof listPublicPartners>> = [];
  let failed = false;
  try {
    partners = await listPublicPartners();
  } catch (err) {
    failed = true;
    console.error('Partners failed to load:', err instanceof Error ? err.message : err);
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Industry partners</h1>
        <p className="mt-1 max-w-2xl text-muted">
          Companies that have worked with ImmXrsive and Algoma University students: what we did together, the projects, and the people involved.
        </p>
      </div>
      {failed ? (
        <p className="rounded-xl border border-line bg-white p-6">We couldn&apos;t load the partners right now. Please try again shortly.</p>
      ) : partners.length === 0 ? (
        <p className="rounded-xl border border-line bg-white p-6">No partners have been published yet.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {partners.map((p) => (
            <li key={p.id}>
              <Link href={`/partners/${p.id}`} className="block h-full rounded-2xl border border-line bg-white p-5 hover:border-accent">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="break-words text-lg font-bold">{p.name}</h2>
                  {p.has_current && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900">Working with us now</span>}
                </div>
                <p className="text-sm text-muted">{[p.sector, p.location].filter(Boolean).join(' · ')}</p>
                {p.description && <p className="mt-2 line-clamp-3 break-words text-sm">{p.description}</p>}
                <p className="mt-2 text-sm font-semibold text-accent-dark">
                  {p.collaborations.length} {p.collaborations.length === 1 ? 'collaboration' : 'collaborations'}
                  {p.projects.length > 0 && ` · ${p.projects.length} ${p.projects.length === 1 ? 'project' : 'projects'}`}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
