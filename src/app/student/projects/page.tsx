import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/users';
import { listRoles, myProjects, type MyProjectItem } from '@/lib/projects';
import { InvitationResponse } from '@/components/student/ProjectActions';

export const dynamic = 'force-dynamic';

/** "My projects": invitations to answer, projects I'm on, and requests I've sent. */
export default async function MyProjectsPage() {
  const user = await currentUser();
  if (!user || !user.affiliation_verified_at) redirect('/student');
  const [{ items }, roles] = await Promise.all([myProjects(user), listRoles()]);

  const invitations = items.filter((i) => i.membership.status === 'invited');
  const active = items.filter((i) => i.membership.status === 'accepted');
  const requested = items.filter((i) => i.membership.status === 'requested');
  const removed = items.filter((i) => i.membership.status === 'removed');

  const row = (i: MyProjectItem, extra?: React.ReactNode) => (
    <li key={i.project.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white p-4">
      <div>
        <p className="font-semibold">
          <Link href={`/student/projects/${i.project.id}`} className="underline">
            {i.project.title}
          </Link>
        </p>
        <p className="text-sm text-muted">
          {i.membership.role}
          {i.is_maintainer ? ' · Maintainer' : ''} · {i.project.publish_status === 'published' ? 'Public' : 'Draft (not public)'}
          {i.membership.status === 'accepted' && !i.membership.featured ? ' · Hidden from my profile' : ''}
        </p>
      </div>
      {extra}
    </li>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/student" className="text-sm font-semibold text-accent-dark underline">
            ← Back to my profile
          </Link>
          <h1 className="text-3xl font-extrabold">My projects</h1>
        </div>
        <Link href="/student/projects/new" className="rounded-lg bg-accent px-5 py-3 font-semibold text-white hover:bg-accent-dark">
          + Add project
        </Link>
      </div>

      {invitations.length > 0 && (
        <section aria-labelledby="inv-h" className="space-y-3">
          <h2 id="inv-h" className="text-xl font-bold">
            Invitations waiting for you
          </h2>
          <ul className="space-y-3">
            {invitations.map((i) =>
              row(
                i,
                <InvitationResponse projectId={i.project.id} proposedRole={roles.includes(i.membership.role) ? i.membership.role : roles[0]} roles={roles} />,
              ),
            )}
          </ul>
        </section>
      )}

      <section aria-labelledby="mine-h" className="space-y-3">
        <h2 id="mine-h" className="text-xl font-bold">
          Projects I&apos;m on
        </h2>
        {active.length ? (
          <ul className="space-y-3">{active.map((i) => row(i))}</ul>
        ) : (
          <p className="rounded-xl border border-line bg-white p-5 text-muted">No projects yet. Click &quot;Add project&quot; to create one.</p>
        )}
      </section>

      {requested.length > 0 && (
        <section aria-labelledby="req-h" className="space-y-3">
          <h2 id="req-h" className="text-xl font-bold">
            Requests to join (waiting for the maintainer)
          </h2>
          <ul className="space-y-3">{requested.map((i) => row(i))}</ul>
        </section>
      )}

      {removed.length > 0 && (
        <section aria-labelledby="rem-h" className="space-y-3">
          <h2 id="rem-h" className="text-xl font-bold">
            Removed by the maintainer
          </h2>
          <p className="text-sm text-muted">Your contribution is kept on record. The maintainer can restore you at any time.</p>
          <ul className="space-y-3">{removed.map((i) => row(i))}</ul>
        </section>
      )}
    </div>
  );
}
