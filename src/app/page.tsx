import { DatabaseNotConfiguredError } from '@/lib/db';
import { listSkills, parseDirectoryQuery, searchStudents, type PublicStudent } from '@/lib/students';
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
  const query = parseDirectoryQuery(await searchParams);

  let students: PublicStudent[] = [];
  let skills: string[] = [];
  let failed = false;
  try {
    [students, skills] = await Promise.all([searchStudents(query), listSkills()]);
  } catch (err) {
    failed = true;
    if (!(err instanceof DatabaseNotConfiguredError)) console.error('Directory failed:', err);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Talent directory</h1>
        <p className="mt-1 text-muted">
          Find Algoma University students and alumni by skill, availability and status. No account needed.
        </p>
      </div>

      <DirectoryFilters skills={skills} query={query} />

      <p className="text-sm font-semibold text-muted" role="status" aria-live="polite">
        {failed ? 'The directory is temporarily unavailable.' : `${students.length} ${students.length === 1 ? 'student' : 'students'} found`}
      </p>

      {failed ? (
        <p className="rounded-xl border border-line bg-white p-6">We couldn&apos;t load the directory right now. Please try again shortly.</p>
      ) : students.length === 0 ? (
        <p className="rounded-xl border border-line bg-white p-6">
          No students match these filters. Try removing a skill or clearing all filters.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {students.map((s) => (
            <li key={s.id}>
              <StudentCard student={s} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
