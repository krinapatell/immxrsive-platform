import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getPublicProject } from '@/lib/students';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await getPublicProject(id).catch(() => null);
  return { title: project ? `${project.title} · ImmXrsive` : 'Project not found · ImmXrsive' };
}

/** Stable project page with contributors and roles (R1.16, R1.17, R1.19). */
export default async function ProjectPage({ params }: Props) {
  const { id } = await params;
  const project = await getPublicProject(id);
  if (!project) notFound();

  return (
    <div className="space-y-4">
      <Link href="/" className="text-sm font-semibold text-accent-dark underline">
        ← Back to directory
      </Link>
      <article className="space-y-6 rounded-2xl border border-line bg-white p-6 sm:p-8">
        <div>
          <p className="text-sm font-semibold text-muted">{project.domain}</p>
          <h1 className="text-3xl font-extrabold">{project.title}</h1>
          <p className="mt-2 max-w-2xl">{project.description}</p>
        </div>

        <section aria-labelledby="contributors-h">
          <h2 id="contributors-h" className="text-lg font-bold">
            Contributors and roles
          </h2>
          <ul className="mt-2 space-y-1">
            {project.contributors.map((c, i) => (
              <li key={c.student_id ?? `hidden-${i}`}>
                {c.student_id ? (
                  <Link href={`/students/${c.student_id}`} className="font-semibold text-accent-dark underline">
                    {c.name}
                  </Link>
                ) : (
                  <span className="text-muted">A contributor without a public profile</span>
                )}{' '}
                — {c.role}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="tech-h">
          <h2 id="tech-h" className="text-lg font-bold">
            Technologies used in the project
          </h2>
          <p className="text-sm text-muted">Listed for the project as a whole; each contributor&apos;s own skills are on their profile.</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {project.technologies.map((t) => (
              <li key={t} className="rounded-md bg-stone-100 px-2 py-1 text-sm">
                {t}
              </li>
            ))}
          </ul>
        </section>

        {Object.keys(project.links).length > 0 && (
          <section aria-labelledby="links-h">
            <h2 id="links-h" className="text-lg font-bold">
              Links
            </h2>
            <ul className="mt-2 space-y-1">
              {Object.entries(project.links).map(([kind, url]) => (
                <li key={kind}>
                  <a href={url} target="_blank" rel="noopener noreferrer nofollow" className="capitalize underline">
                    {kind}
                  </a>{' '}
                  <span className="text-xs text-muted">(external site — may be unavailable)</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <Link
          href={`/inquiry?source_type=project&source_id=${encodeURIComponent(project.id)}`}
          className="inline-block rounded-lg bg-accent px-4 py-3 font-semibold text-white hover:bg-accent-dark"
        >
          Ask about this project
        </Link>
      </article>
    </div>
  );
}
