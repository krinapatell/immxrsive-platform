import { DatabaseNotConfiguredError } from '@/lib/db';
import Link from 'next/link';
import { listSkills, parseDirectoryQuery, searchStudents, type DirectoryPage } from '@/lib/students';
import DirectoryFilters from '@/components/DirectoryFilters';
import StudentCard from '@/components/StudentCard';

export const dynamic = 'force-dynamic';

/**
 * Public talent directory (R1.01 – R1.11). Filtering happens on the server
 * from the URL, so every filtered view has a shareable URL and the same
 * filters always give the same results.
 */
export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const query = parseDirectoryQuery(sp);
  const pageParam = Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1;

  let result: DirectoryPage = { students: [], total: 0, page: 1, pageSize: 24 };
  let skills: string[] = [];
  let failed = false;
  try {
    [result, skills] = await Promise.all([searchStudents(query, pageParam), listSkills()]);
  } catch (err) {
    failed = true;
    if (!(err instanceof DatabaseNotConfiguredError)) console.error('Directory failed:', err);
  }

  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const first = (result.page - 1) * result.pageSize + 1;
  const last = Math.min(result.total, result.page * result.pageSize);
  // Keep the current filters when moving between pages.
  const pageHref = (n: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      if (k === 'page' || v === undefined) continue;
      for (const one of Array.isArray(v) ? v : [v]) params.append(k, one);
    }
    if (n > 1) params.set('page', String(n));
    const qs = params.toString();
    return qs ? `/?${qs}` : '/';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Talent directory</h1>
        <p className="mt-1 text-muted">
          Find Algoma University students and alumni by skill, availability and status. No account needed.
        </p>
      </div>

      {/* key resets the text box when the search text in the URL changes (e.g. browser Back) */}
      <DirectoryFilters key={query.q} skills={skills} query={query} />

      <p className="text-sm font-semibold text-muted" role="status" aria-live="polite">
        {failed
          ? 'The directory is temporarily unavailable.'
          : `${result.total} ${result.total === 1 ? 'student' : 'students'} found${
              result.total > result.pageSize ? ` · showing ${first}–${last}` : ''
            }`}
      </p>

      {failed ? (
        <p className="rounded-xl border border-line bg-white p-6">We couldn&apos;t load the directory right now. Please try again shortly.</p>
      ) : result.students.length === 0 ? (
        <p className="rounded-xl border border-line bg-white p-6">
          No students match these filters. Try removing a skill or clearing all filters.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {result.students.map((s) => (
            <li key={s.id}>
              <StudentCard student={s} />
            </li>
          ))}
        </ul>
      )}

      {!failed && pages > 1 && (
        <nav aria-label="Directory pages" className="flex flex-wrap items-center justify-center gap-3">
          {result.page > 1 ? (
            <Link href={pageHref(result.page - 1)} className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold">
              ← Previous
            </Link>
          ) : null}
          <span className="text-sm text-muted">
            Page {result.page} of {pages}
          </span>
          {result.page < pages ? (
            <Link href={pageHref(result.page + 1)} className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold">
              Next →
            </Link>
          ) : null}
        </nav>
      )}
    </div>
  );
}
