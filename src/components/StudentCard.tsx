import Link from 'next/link';
import type { PublicStudent } from '@/lib/students';

/** Directory card: name, headline, key skills, availability and project count (R1.11). */
export default function StudentCard({ student }: { student: PublicStudent }) {
  const count = student.projects.length;
  return (
    <article className="flex h-full flex-col justify-between rounded-2xl border border-line bg-white p-5 shadow-sm">
      <div>
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold">
            <Link href={`/students/${student.id}`} className="hover:text-accent hover:underline">
              {student.name}
            </Link>
          </h2>
          <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-xs font-semibold capitalize text-muted">
            {student.status}
          </span>
        </div>
        <p className="mt-1 text-sm font-medium text-accent-dark">{student.headline}</p>

        <h3 className="sr-only">Skills</h3>
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Skills">
          {student.skills.map((skill) => (
            <li key={skill} className="rounded-md bg-stone-100 px-2 py-1 text-xs font-medium">
              {skill}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3 text-sm">
        <div className="text-muted">
          {student.availability?.length ? (
            <span>
              Available: <span className="font-medium capitalize text-ink">{student.availability.join(', ')}</span>
            </span>
          ) : (
            <span>Availability not shown</span>
          )}
          <span aria-hidden="true"> · </span>
          <span>
            {count} {count === 1 ? 'project' : 'projects'}
          </span>
        </div>
        <Link
          href={`/students/${student.id}`}
          className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white hover:bg-accent-dark"
          aria-label={`View profile of ${student.name}`}
        >
          View profile
        </Link>
      </div>
    </article>
  );
}
