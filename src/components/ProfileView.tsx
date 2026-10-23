import Link from 'next/link';
import type { PublicStudent } from '@/lib/students';

/**
 * Renders a public profile (R1.13, R1.14, R2.23). Used both by the public
 * page and by the student's own Preview, so the preview shows exactly what
 * visitors get. All text is rendered as plain text by React, so profile
 * content can never run as code in a visitor's browser (R2.25).
 *
 * `privateFields` is only passed by the preview, to label what visitors won't see.
 */
export default function ProfileView({
  student,
  privateFields,
  showInquiry = true,
}: {
  student: PublicStudent;
  privateFields?: Record<string, string>;
  showInquiry?: boolean;
}) {
  const initials = student.name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const sections: Record<string, React.ReactNode> = {
    projects: (
      <section key="projects" aria-labelledby="projects-h">
        <h2 id="projects-h" className="text-lg font-bold">
          Project evidence
        </h2>
        {student.projects.length ? (
          <ul className="mt-2 space-y-2">
            {student.projects.map((p) => (
              <li key={p.id}>
                <Link href={`/projects/${p.id}`} className="font-semibold underline" style={{ color: 'var(--profile-accent)' }}>
                  {p.title}
                </Link>
                <span style={{ color: 'var(--profile-muted)' }}> — {p.role}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2" style={{ color: 'var(--profile-muted)' }}>
            No projects listed yet.
          </p>
        )}
      </section>
    ),
    experience: student.experience?.length ? (
      <section key="experience" aria-labelledby="experience-h">
        <h2 id="experience-h" className="text-lg font-bold">
          Experience
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {student.experience.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </section>
    ) : privateFields?.experience ? (
      <PrivateNote key="experience" label="Experience" />
    ) : null,
    education: student.education ? (
      <section key="education" aria-labelledby="education-h">
        <h2 id="education-h" className="text-lg font-bold">
          Education
        </h2>
        <p className="mt-2 whitespace-pre-line">{student.education}</p>
      </section>
    ) : privateFields?.education ? (
      <PrivateNote key="education" label="Education" />
    ) : null,
  };

  const links = student.links ?? {};
  return (
    <article className={`theme-${student.theme} overflow-hidden rounded-2xl border border-line`} style={{ background: 'var(--profile-bg)', color: 'var(--profile-ink)' }}>
      <div className={student.theme === 'minimal' ? 'p-6 sm:p-8' : 'p-6 sm:p-8 border-b border-black/10'}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {student.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={student.avatar_url} alt="" width={72} height={72} className="h-18 w-18 rounded-full" />
          ) : (
            <div aria-hidden="true" className="flex h-18 w-18 items-center justify-center rounded-full text-2xl font-bold" style={{ background: 'var(--profile-chip)', color: 'var(--profile-accent)' }}>
              {initials}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-extrabold">{student.name}</h1>
            <p className="text-lg font-medium" style={{ color: 'var(--profile-accent)' }}>
              {student.headline}
            </p>
            <p className="text-sm" style={{ color: 'var(--profile-muted)' }}>
              {student.program} · <span className="capitalize">{student.status === 'current' ? 'Current student' : 'Alumni'}</span>
              {student.location ? ` · ${student.location}` : ''}
            </p>
          </div>
        </div>
        {student.bio && <p className="mt-4 max-w-2xl whitespace-pre-line">{student.bio}</p>}
      </div>

      <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-3">
        <aside className="space-y-5 md:col-span-1">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: 'var(--profile-muted)' }}>
              Skills
            </h2>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {student.skills.map((s) => (
                <li key={s} className="rounded-md px-2 py-1 text-sm" style={{ background: 'var(--profile-chip)' }}>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: 'var(--profile-muted)' }}>
              Availability
            </h2>
            {student.availability ? (
              <p className="mt-1 capitalize">{student.availability.join(', ') || 'Not specified'}</p>
            ) : (
              <p className="mt-1" style={{ color: 'var(--profile-muted)' }}>
                {privateFields?.availability ? '🔒 Private — hidden from visitors' : 'Not shown'}
              </p>
            )}
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: 'var(--profile-muted)' }}>
              Links
            </h2>
            <ul className="mt-1 space-y-1">
              {links.github && (
                <li>
                  <a href={links.github} rel="noopener noreferrer nofollow" target="_blank" className="underline">
                    GitHub
                  </a>
                </li>
              )}
              {links.linkedin && (
                <li>
                  <a href={links.linkedin} rel="noopener noreferrer nofollow" target="_blank" className="underline">
                    LinkedIn
                  </a>
                </li>
              )}
              {links.portfolio && (
                <li>
                  <a href={links.portfolio} rel="noopener noreferrer nofollow" target="_blank" className="underline">
                    Portfolio
                  </a>
                </li>
              )}
              {privateFields?.links && <li style={{ color: 'var(--profile-muted)' }}>🔒 Other links are private</li>}
            </ul>
          </div>
          {privateFields?.location && <PrivateNote label="Location" />}
        </aside>

        <div className="space-y-6 md:col-span-2">{student.section_order.map((key) => sections[key] ?? null)}</div>
      </div>

      {showInquiry && (
        <div className="border-t border-black/10 p-6 sm:p-8">
          <Link
            href={`/inquiry?source_type=student&source_id=${encodeURIComponent(student.id)}`}
            className="inline-block rounded-lg bg-accent px-4 py-3 font-semibold text-white hover:bg-accent-dark"
          >
            Interested in working with {student.name}?
          </Link>
        </div>
      )}
    </article>
  );
}

function PrivateNote({ label }: { label: string }) {
  return (
    <p className="text-sm" style={{ color: 'var(--profile-muted)' }}>
      🔒 {label} is private — hidden from visitors
    </p>
  );
}
