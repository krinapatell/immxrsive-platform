import Link from 'next/link';
import { notFound } from 'next/navigation';
import { staffState } from '@/lib/staff';
import { studentAdmin } from '@/lib/admin';
import { staleCutoff } from '@/lib/students';
import StaffGate from '@/components/staff/StaffGate';
import StaffNav from '@/components/staff/StaffNav';
import StaffButton from '@/components/staff/StaffButton';
import StaffActionForm from '@/components/staff/StaffActionForm';

export const dynamic = 'force-dynamic';

const STATE: Record<string, string> = { draft: 'Draft (never published)', published: 'Public', unpublished: 'Hidden from the public', retired: 'Retired' };

/** Staff: one profile's lifecycle, owner, claims and duplicates (F.09 - F.17). */
export default async function StaffStudent({ params }: { params: Promise<{ id: string }> }) {
  const { state } = await staffState();
  if (state !== 'staff') return <StaffGate state={state} />;
  const { id } = await params;
  const a = await studentAdmin(id);
  if (!a) notFound();
  const s = a.student;
  const url = `/api/staff/students/${encodeURIComponent(s.id)}`;
  const card = 'rounded-2xl border border-line bg-white p-5 sm:p-6';
  const stale = s.talent_state === 'active' && (!s.availability_confirmed_at || s.availability_confirmed_at < staleCutoff());

  return (
    <div className="space-y-5">
      <StaffNav />
      <Link href="/staff/students" className="ml-3 text-sm font-semibold text-accent-dark underline">
        All profiles
      </Link>
      <div>
        <h1 className="break-words text-3xl font-extrabold">{s.name}</h1>
        <p className="text-muted">
          Profile {s.id}
          {s.legacy_id ? ` · old site id ${s.legacy_id}` : ''} · {STATE[s.profile_status]}
          {s.profile_status === 'published' && (
            <>
              {' '}
              ·{' '}
              <Link href={`/students/${encodeURIComponent(s.id)}`} className="underline">
                View public page
              </Link>
            </>
          )}
        </p>
      </div>

      {s.merged_into ? (
        <p className="rounded-lg bg-amber-50 p-4">
          This profile was merged into{' '}
          <Link className="font-semibold underline" href={`/staff/students/${encodeURIComponent(s.merged_into)}`}>
            {s.merged_into}
          </Link>
          . Its old public link now goes there.
        </p>
      ) : (
        <>
          {a.possible_duplicates.length > 0 && (
            <p className="rounded-lg bg-amber-50 p-4 text-sm">
              <strong>Possible duplicate:</strong> {a.possible_duplicates.map((d) => `${d.name} (${d.id})`).join(', ')} came from the old site with the same email. If they are the same
              person, merge them below.
            </p>
          )}

          {a.claims.length > 0 && (
            <section className={card} aria-labelledby="claims-h">
              <h2 id="claims-h" className="text-lg font-bold">
                Waiting claims
              </h2>
              <ul className="mt-2 space-y-2">
                {a.claims.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line p-3">
                    <span>
                      GitHub <strong>{c.github_login}</strong> ({c.verified_email ?? 'no verified email'})
                    </span>
                    <Link href={`/staff/claims/${c.id}`} className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white">
                      Review claim
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className={card} aria-labelledby="who-h">
            <h2 id="who-h" className="text-lg font-bold">
              Owner
            </h2>
            {a.owner ? (
              <p className="mt-1">
                GitHub <strong>{a.owner.github_login}</strong>
                {a.owner.affiliation_verified_at ? ` · verified ${a.owner.affiliation_email}` : ' · Algoma email not verified'}
              </p>
            ) : (
              <p className="mt-1">{s.legacy_id ? 'Nobody has claimed this profile yet.' : 'No account owns this profile.'}</p>
            )}
            {s.legacy_email && <p className="mt-1 text-sm text-muted">Email on the old site (staff only): {s.legacy_email}</p>}
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <StaffActionForm
                url={url}
                action="assign_owner"
                name="github_login"
                label={a.owner ? 'Give this profile to another account' : 'Give this profile to an account'}
                hint="Their GitHub username. They must have signed in to ImmXrsive once."
                submitLabel="Assign owner"
              />
              {a.owner && (
                <div>
                  <p className="text-sm font-semibold">Remove the owner</p>
                  <p className="mb-2 text-xs text-muted">The profile stays, but that account can no longer edit it.</p>
                  <StaffButton url={url} body={{ action: 'unlink_owner' }} label="Unlink owner" variant="danger" confirm="The owner will no longer be able to edit this profile." />
                </div>
              )}
            </div>
          </section>

          <section className={card} aria-labelledby="life-h">
            <h2 id="life-h" className="text-lg font-bold">
              Status and visibility
            </h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <StaffActionForm
                url={url}
                action="status"
                name="status"
                label="Student or alumni"
                initial={s.status}
                options={[
                  { value: 'current', label: 'Current student' },
                  { value: 'alumni', label: 'Alumni (graduated)' },
                ]}
                hint="Graduating does not remove their verified Algoma status or their projects."
                submitLabel="Save"
              />
              <StaffActionForm
                url={url}
                action="talent"
                name="talent_state"
                label="Looking for opportunities?"
                initial={s.talent_state}
                options={[
                  { value: 'active', label: 'Active Talent (shows availability)' },
                  { value: 'showcase', label: 'Showcase Only (work only, no availability)' },
                ]}
                submitLabel="Save"
              />
            </div>
            <p className="mt-3 text-sm">
              Availability last confirmed: <strong>{s.availability_confirmed_at ?? 'never'}</strong>
              {stale && ' · older than a year, so the public page says it is not confirmed and directory availability filters skip it.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {s.profile_status !== 'published' && s.profile_status !== 'retired' && <StaffButton url={url} body={{ action: 'publish' }} label="Publish" variant="primary" />}
              {s.profile_status === 'published' && <StaffButton url={url} body={{ action: 'unpublish' }} label="Hide from the public" />}
              {s.profile_status !== 'retired' ? (
                <StaffButton
                  url={url}
                  body={{ action: 'retire' }}
                  label="Retire profile"
                  variant="danger"
                  confirm="The profile is hidden. Their roles stay on projects as 'a former contributor'."
                />
              ) : (
                <StaffButton url={url} body={{ action: 'restore' }} label="Restore and publish" variant="primary" />
              )}
            </div>
          </section>

          <section className={card} aria-labelledby="proj-h">
            <h2 id="proj-h" className="text-lg font-bold">
              Projects
            </h2>
            {a.projects.length === 0 ? (
              <p className="mt-1 text-sm">No projects.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {a.projects.map((p) => (
                  <li key={p.id}>
                    <Link className="font-semibold underline" href={`/staff/projects/${encodeURIComponent(p.id)}`}>
                      {p.title}
                    </Link>{' '}
                    — {p.role}
                    {p.maintainer ? ' · maintainer' : ''}
                    {p.status !== 'accepted' ? ` · ${p.status}` : ''}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={card} aria-labelledby="merge-h">
            <h2 id="merge-h" className="text-lg font-bold">
              Merge a duplicate
            </h2>
            <p className="text-sm text-muted">
              Use this when this profile is the same person as another one. This profile&apos;s projects move to the one you keep, and this profile&apos;s public link
              redirects there. It cannot be undone from here.
            </p>
            <div className="mt-2 max-w-md">
              <StaffActionForm
                url={url}
                action="merge"
                name="merge_into"
                label="Id of the profile to keep"
                hint={a.possible_duplicates.length ? `Suggested: ${a.possible_duplicates.map((d) => d.id).join(', ')}` : 'For example LS01'}
                initial={a.possible_duplicates[0]?.id ?? ''}
                submitLabel="Merge into that profile"
                confirm="Merge this profile into the one you entered? Its projects move there and this profile is hidden."
                redirectField="merged_into"
                redirectBase="/staff/students/"
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
