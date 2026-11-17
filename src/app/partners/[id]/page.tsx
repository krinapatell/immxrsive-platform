import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPublicPartner, type PublicCollaboration } from '@/lib/partners';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = await getPublicPartner(id).catch(() => null);
  return { title: p ? `${p.name} · Industry partner · ImmXrsive` : 'Partner not found · ImmXrsive' };
}

const years = (c: PublicCollaboration) => (c.year_end && c.year_end !== c.year_start ? `${c.year_start}–${c.year_end}` : String(c.year_start));

function host(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function CollaborationCard({ c }: { c: PublicCollaboration }) {
  if (c.kind === 'limited') {
    return (
      <li className="rounded-xl border border-dashed border-line bg-white p-4">
        <p className="text-sm font-semibold text-muted">
          {years(c)} · Confidential collaboration
        </p>
        <p className="mt-1 break-words">{c.public_summary}</p>
        <p className="mt-1 text-xs text-muted">Details are kept private at the partner&apos;s request.</p>
      </li>
    );
  }
  return (
    <li className="space-y-2 rounded-xl border border-line bg-white p-4">
      <p className="text-sm font-semibold text-muted">{years(c)}</p>
      <h3 className="break-words text-lg font-bold">{c.title}</h3>
      {c.description && <p className="whitespace-pre-line break-words">{c.description}</p>}
      {c.outcome && (
        <p className="break-words text-sm">
          <span className="font-semibold">Outcome:</span> {c.outcome}
        </p>
      )}
      {(c.projects?.length ?? 0) > 0 && (
        <p className="text-sm">
          <span className="font-semibold">Projects:</span>{' '}
          {c.projects!.map((p, i) => (
            <span key={p.id}>
              {i > 0 && ', '}
              <Link href={`/projects/${p.id}`} className="underline">
                {p.title}
              </Link>
            </span>
          ))}
        </p>
      )}
      {(c.students?.length ?? 0) > 0 && (
        <p className="text-sm">
          <span className="font-semibold">Students:</span>{' '}
          {c.students!.map((s, i) => (
            <span key={s.id}>
              {i > 0 && ', '}
              <Link href={`/students/${s.id}`} className="underline">
                {s.name}
              </Link>
            </span>
          ))}
        </p>
      )}
      <Link href={`/inquiry?source_type=collaboration&source_id=${encodeURIComponent(c.id)}`} className="inline-block text-sm font-semibold text-accent-dark underline">
        Ask about this collaboration
      </Link>
    </li>
  );
}

/**
 * Public partner page (R4.22, R4.23). Collaborations arrive already filtered
 * on the server: Private ones are never sent and Limited ones only as a short
 * summary (R4.18). Everything is plain text; nothing is rendered as HTML.
 */
export default async function PartnerPage({ params }: Props) {
  const { id } = await params;
  const p = await getPublicPartner(id);
  if (!p) notFound();
  const current = p.collaborations.filter((c) => c.status === 'current');
  const past = p.collaborations.filter((c) => c.status === 'past');

  return (
    <div className="space-y-4">
      <Link href="/partners" className="text-sm font-semibold text-accent-dark underline">
        ← All industry partners
      </Link>
      <article className="space-y-8 rounded-2xl border border-line bg-white p-5 sm:p-8">
        <header className="space-y-2">
          <p className="text-sm font-semibold text-muted">Industry partner{p.sector && ` · ${p.sector}`}</p>
          <h1 className="break-words text-3xl font-extrabold">{p.name}</h1>
          {p.location && <p className="text-muted">{p.location}</p>}
          {p.description && <p className="max-w-2xl whitespace-pre-line break-words">{p.description}</p>}
          <div className="flex flex-wrap gap-3 pt-1">
            {p.website && (
              <a href={p.website} target="_blank" rel="noopener noreferrer nofollow" className="rounded-lg border border-line px-4 py-2 text-sm font-semibold">
                Visit {host(p.website)} ↗
              </a>
            )}
            <Link href={`/inquiry?source_type=company&source_id=${encodeURIComponent(p.id)}`} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark">
              Start a collaboration inquiry
            </Link>
          </div>
        </header>

        <section aria-labelledby="how-h" className="space-y-4">
          <h2 id="how-h" className="text-xl font-bold">
            How ImmXrsive has worked with {p.name}
          </h2>
          {p.collaborations.length === 0 && <p className="text-muted">No public collaborations to show yet.</p>}
          {current.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold">Working together now</h3>
              <ul className="space-y-3">
                {current.map((c) => (
                  <CollaborationCard key={c.id} c={c} />
                ))}
              </ul>
            </div>
          )}
          {past.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold">Past collaborations</h3>
              <ul className="space-y-3">
                {past.map((c) => (
                  <CollaborationCard key={c.id} c={c} />
                ))}
              </ul>
            </div>
          )}
        </section>

        {p.projects.length > 0 && (
          <section aria-labelledby="proj-h" className="space-y-2">
            <h2 id="proj-h" className="text-xl font-bold">
              Student projects with {p.name}
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              {p.projects.map((pr) => (
                <li key={pr.id}>
                  <Link href={`/projects/${pr.id}`} className="underline">
                    {pr.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </div>
  );
}
