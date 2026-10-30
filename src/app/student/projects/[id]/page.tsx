import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { currentUser } from '@/lib/users';
import { editorView, listRoles, ProjectError } from '@/lib/projects';
import ProjectForm, { type ProjectFormValues } from '@/components/student/ProjectForm';
import { ActionButton, InvitationResponse, InviteForm, MyContribution, TransferForm } from '@/components/student/ProjectActions';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  invited: 'Invited (waiting for them)',
  requested: 'Asked to join',
  accepted: 'Contributor',
  declined: 'Declined',
  removed: 'Removed (can be restored)',
};

/**
 * Manage one project. What you see depends on who you are:
 * maintainer → shared details, publishing, teammates; contributor → your own
 * contribution; invited → accept/decline. The server checks every action again.
 */
export default async function ManageProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await currentUser();
  if (!user || !user.affiliation_verified_at) redirect('/student');
  const { id } = await params;
  const created = (await searchParams).created === '1';

  let view;
  try {
    view = await editorView(user, id);
  } catch (err) {
    if (err instanceof ProjectError && err.status === 404) notFound();
    throw err;
  }
  const roles = await listRoles();
  const { project, contributors, me, my, is_maintainer } = view;
  const published = project.publish_status === 'published';
  const others = contributors.filter((c) => c.student_id !== me.id);
  const transferCandidates = others.filter((c) => c.status === 'accepted' && c.github_login).map((c) => ({ id: c.student_id, name: c.name }));

  const initial: ProjectFormValues = {
    title: project.title,
    description: project.description,
    domain: project.domain,
    technologies: project.technologies ?? [],
    project_status: project.project_status,
    project_date: project.project_date ?? '',
    repositories: project.repositories ?? [],
    demo_url: project.demo_url ?? '',
    video_url: project.video_url ?? '',
    fallback_image_url: project.fallback_image_url ?? '',
    fallback_text: project.fallback_text ?? '',
  };

  const card = 'space-y-4 rounded-2xl border border-line bg-white p-5 sm:p-6';
  return (
    <div className="space-y-5">
      <div>
        <Link href="/student/projects" className="text-sm font-semibold text-accent-dark underline">
          ← My projects
        </Link>
        <h1 className="break-words text-3xl font-extrabold">{project.title}</h1>
        <p className="text-sm text-muted">
          {is_maintainer ? 'You are the maintainer' : my ? STATUS_LABEL[my.status] : ''} ·{' '}
          {published ? (
            <>
              Public at{' '}
              <Link href={`/projects/${project.id}`} className="underline">
                /projects/{project.id}
              </Link>
            </>
          ) : (
            'Draft: not public yet'
          )}
        </p>
      </div>

      {created && <p className="rounded-lg bg-emerald-50 p-3 text-sm font-medium">Project created. Invite teammates below, then publish when you&apos;re ready.</p>}

      {my?.status === 'invited' && (
        <section className={card}>
          <h2 className="text-lg font-bold">You&apos;ve been invited to this project</h2>
          <p className="text-sm text-muted">You won&apos;t appear on the project until you accept.</p>
          <InvitationResponse projectId={project.id} proposedRole={roles.includes(my.role) ? my.role : roles[0]} roles={roles} />
        </section>
      )}

      {is_maintainer && (
        <section className={card} aria-labelledby="pub-h">
          <h2 id="pub-h" className="text-lg font-bold">
            Visibility
          </h2>
          <p className="text-sm">{published ? 'This project is public. Visitors can find it from contributor profiles.' : "Only you and your teammates can see this project. Publish it when it's ready."}</p>
          <ActionButton
            projectId={project.id}
            body={{ action: published ? 'unpublish' : 'publish' }}
            label={published ? 'Unpublish' : 'Publish project'}
            variant={published ? 'secondary' : 'primary'}
            done={published ? 'Unpublished.' : 'Published.'}
          />
        </section>
      )}

      {my?.status === 'accepted' && (
        <section className={card} aria-labelledby="mine-h">
          <h2 id="mine-h" className="text-lg font-bold">
            My contribution
          </h2>
          <MyContribution projectId={project.id} roles={roles} initial={{ role: my.role, statement: my.statement ?? '', featured: my.featured }} />
        </section>
      )}

      {is_maintainer && (
        <section className={card} aria-labelledby="team-h">
          <h2 id="team-h" className="text-lg font-bold">
            Teammates
          </h2>
          <ul className="space-y-3">
            {contributors.map((c) => (
              <li key={c.student_id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line p-3">
                <div>
                  <p className="font-semibold">
                    {c.name}
                    {c.github_login && <span className="font-normal text-muted"> @{c.github_login}</span>}
                    {c.student_id === me.id && <span className="font-normal text-muted"> (you)</span>}
                  </p>
                  <p className="text-sm text-muted">
                    {c.role} · {project.maintainer_student_id === c.student_id ? 'Maintainer' : STATUS_LABEL[c.status]}
                  </p>
                  {c.statement && <p className="text-sm">“{c.statement}”</p>}
                </div>
                {c.student_id !== me.id && (
                  <div className="flex flex-wrap gap-2">
                    {c.status === 'requested' && (
                      <>
                        <ActionButton projectId={project.id} body={{ action: 'approve', student_id: c.student_id }} label="Approve" variant="primary" />
                        <ActionButton projectId={project.id} body={{ action: 'reject', student_id: c.student_id }} label="Decline" />
                      </>
                    )}
                    {c.status === 'invited' && <ActionButton projectId={project.id} body={{ action: 'cancel', student_id: c.student_id }} label="Cancel invite" />}
                    {c.status === 'accepted' && (
                      <ActionButton
                        projectId={project.id}
                        body={{ action: 'remove', student_id: c.student_id }}
                        label="Remove"
                        variant="danger"
                        confirm="They'll be hidden from the project but kept on record, and you can restore them."
                      />
                    )}
                    {c.status === 'removed' && <ActionButton projectId={project.id} body={{ action: 'restore', student_id: c.student_id }} label="Restore" variant="primary" />}
                  </div>
                )}
              </li>
            ))}
          </ul>
          <h3 className="pt-2 font-bold">Invite a teammate</h3>
          <InviteForm projectId={project.id} roles={roles} />
          <h3 className="pt-2 font-bold">Maintainer</h3>
          <TransferForm projectId={project.id} candidates={transferCandidates} />
        </section>
      )}

      {is_maintainer ? (
        <section aria-labelledby="edit-h" className="space-y-3">
          <h2 id="edit-h" className="text-xl font-bold">
            Shared project details
          </h2>
          <p className="text-sm text-muted">As maintainer, you edit these for everyone. Each teammate&apos;s own statement is theirs to edit.</p>
          <ProjectForm mode="edit" projectId={project.id} initial={initial} initialVersion={project.version} roles={roles} />
        </section>
      ) : (
        my?.status === 'accepted' && (
          <section className={card}>
            <h2 className="text-lg font-bold">Shared project details</h2>
            <p className="text-sm text-muted">
              Only the maintainer edits the shared details (title, description, links). Ask them if something needs changing.
            </p>
            <p className="whitespace-pre-line break-words">{project.description}</p>
          </section>
        )
      )}
    </div>
  );
}
