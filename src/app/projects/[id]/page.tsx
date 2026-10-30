import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getPublicProject } from '@/lib/students';
import FallbackImage from '@/components/FallbackImage';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await getPublicProject(id).catch(() => null);
  return { title: project ? `${project.title} · ImmXrsive` : 'Project not found · ImmXrsive' };
}

function host(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/**
 * Canonical public project page (R1.17, R3.05, R3.15, R3.18 – R3.23, R3.26).
 * Demos are LINKS that open in a new tab; nothing a student types is embedded
 * as HTML or script (R3.19), so a broken demo can't break this page (R3.22).
 */
export default async function ProjectPage({ params }: Props) {
  const { id } = await params;
  const project = await getPublicProject(id);
  if (!project) notFound();

  const hasFallback = !!(project.fallback_image_url || project.fallback_text);
  const statusLabel = project.project_status === 'in-progress' ? 'In progress' : 'Completed';

  return (
    <div className="space-y-4">
      <Link href="/" className="text-sm font-semibold text-accent-dark underline">
        ← Back to directory
      </Link>
      <article className="space-y-8 rounded-2xl border border-line bg-white p-5 sm:p-8">
        <header>
          <p className="text-sm font-semibold text-muted">
            {[project.domain, statusLabel, project.project_date].filter(Boolean).join(' · ')}
          </p>
          <h1 className="break-words text-3xl font-extrabold">{project.title}</h1>
          {project.description && <p className="mt-2 max-w-2xl whitespace-pre-line break-words">{project.description}</p>}
        </header>

        {(project.demo_url || project.video_url || project.repositories.length > 0) && (
          <section aria-labelledby="try-h" className="space-y-3">
            <h2 id="try-h" className="text-lg font-bold">
              See it in action
            </h2>
            <div className="flex flex-wrap gap-3">
              {project.demo_url && (
                <a
                  href={project.demo_url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="rounded-lg bg-accent px-5 py-3 font-semibold text-white hover:bg-accent-dark"
                >
                  ▶ Play demo <span className="sr-only">(opens in a new tab)</span>
                </a>
              )}
              {project.video_url && (
                <a href={project.video_url} target="_blank" rel="noopener noreferrer nofollow" className="rounded-lg border border-line px-5 py-3 font-semibold">
                  Watch video <span className="sr-only">(opens in a new tab)</span>
                </a>
              )}
              {project.repositories.map((r) => (
                <a key={r} href={r} target="_blank" rel="noopener noreferrer nofollow" className="rounded-lg border border-line px-5 py-3 font-semibold">
                  View source <span className="font-normal text-muted">({host(r)})</span>
                </a>
              ))}
            </div>
            {project.demo_url && (
              <p className="text-sm text-muted">
                The demo opens on another site and may not work on every device or browser{hasFallback ? '. If it doesn’t load, see the preview below.' : '.'}
              </p>
            )}
          </section>
        )}

        {hasFallback && (
          <section aria-labelledby="fallback-h" className="space-y-2">
            <h2 id="fallback-h" className="text-lg font-bold">
              Preview
            </h2>
            {project.fallback_text && <p className="max-w-2xl whitespace-pre-line break-words">{project.fallback_text}</p>}
            {project.fallback_image_url && <FallbackImage src={project.fallback_image_url} alt={`Preview of ${project.title}`} />}
          </section>
        )}

        <section aria-labelledby="contributors-h">
          <h2 id="contributors-h" className="text-lg font-bold">
            Who worked on it
          </h2>
          {project.contributors.length === 0 ? (
            <p className="mt-2 text-muted">No contributors listed yet.</p>
          ) : (
            <ul className="mt-2 space-y-3">
              {project.contributors.map((c, i) => (
                <li key={c.student_id ?? `hidden-${i}`} className="rounded-lg border border-line p-3">
                  <p>
                    {c.student_id ? (
                      <Link href={`/students/${c.student_id}`} className="font-semibold text-accent-dark underline">
                        {c.name}
                      </Link>
                    ) : (
                      <span className="text-muted">A contributor without a public profile</span>
                    )}{' '}
                    — <span className="font-medium">{c.role}</span>
                    {c.is_maintainer && <span className="ml-2 rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold">Maintainer</span>}
                  </p>
                  {c.statement && <p className="mt-1 whitespace-pre-line break-words text-sm text-muted">“{c.statement}”</p>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="tech-h">
          <h2 id="tech-h" className="text-lg font-bold">
            Technologies used in the project
          </h2>
          <p className="text-sm text-muted">These describe the project as a whole. Each contributor&apos;s own skills are on their profile.</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {project.technologies.map((t) => (
              <li key={t} className="rounded-md bg-stone-100 px-2 py-1 text-sm">
                {t}
              </li>
            ))}
          </ul>
        </section>

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
