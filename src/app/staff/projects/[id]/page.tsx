import Link from 'next/link';
import { notFound } from 'next/navigation';
import { staffState } from '@/lib/staff';
import { projectAdmin } from '@/lib/admin';
import StaffGate from '@/components/staff/StaffGate';
import StaffNav from '@/components/staff/StaffNav';
import StaffActionForm from '@/components/staff/StaffActionForm';

export const dynamic = 'force-dynamic';

/** Staff: hand a project to a new maintainer (F.19) or mark its demo broken/archived (F.36). */
export default async function StaffProject({ params }: { params: Promise<{ id: string }> }) {
  const { state } = await staffState();
  if (state !== 'staff') return <StaffGate state={state} />;
  const { id } = await params;
  const a = await projectAdmin(id);
  if (!a) notFound();
  const p = a.project;
  const url = `/api/staff/projects/${encodeURIComponent(p.id)}`;
  const accepted = a.contributors.filter((c) => c.status === 'accepted');
  const card = 'rounded-2xl border border-line bg-white p-5 sm:p-6';
  return (
    <div className="space-y-5">
      <StaffNav />
      <div>
        <h1 className="break-words text-3xl font-extrabold">{p.title}</h1>
        <p className="text-muted">
          Project {p.id} ·{' '}
          {p.publish_status === 'published' ? (
            <Link className="underline" href={`/projects/${encodeURIComponent(p.id)}`}>
              View public page
            </Link>
          ) : (
            'Draft'
          )}
        </p>
      </div>
      <section className={card} aria-labelledby="m-h">
        <h2 id="m-h" className="text-lg font-bold">
          Maintainer
        </h2>
        <p className="text-sm text-muted">
          The maintainer edits the shared project and invites contributors. If they have left, choose another accepted contributor.
        </p>
        <ul className="mt-2 space-y-1 text-sm">
          {a.contributors.map((c) => (
            <li key={c.student_id}>
              <Link className="font-semibold underline" href={`/staff/students/${encodeURIComponent(c.student_id)}`}>
                {c.name}
              </Link>{' '}
              ({c.student_id}) — {c.role} · {c.status}
              {c.student_id === p.maintainer_student_id ? ' · current maintainer' : ''}
              {!c.has_account ? ' · no account yet' : ''}
              {c.profile_status === 'retired' ? ' · retired' : ''}
            </li>
          ))}
        </ul>
        {accepted.length > 0 ? (
          <div className="mt-3 max-w-md">
            <StaffActionForm
              url={url}
              action="set_maintainer"
              name="student_id"
              label="New maintainer"
              initial={p.maintainer_student_id ?? accepted[0].student_id}
              options={accepted.map((c) => ({ value: c.student_id, label: `${c.name} (${c.student_id})${c.has_account ? '' : ' – no account yet'}` }))}
              submitLabel="Make maintainer"
            />
          </div>
        ) : (
          <p className="mt-2 text-sm">There are no accepted contributors to choose from.</p>
        )}
      </section>
      <section className={card} aria-labelledby="d-h">
        <h2 id="d-h" className="text-lg font-bold">
          Demo
        </h2>
        <p className="text-sm">{p.demo_url ? <>Demo link: {p.demo_url}</> : 'This project has no demo link.'}</p>
        <div className="mt-3 max-w-md">
          <StaffActionForm
            url={url}
            action="demo_status"
            name="demo_status"
            label="Demo status"
            initial={p.demo_status}
            options={[
              { value: 'available', label: 'Working' },
              { value: 'unavailable', label: 'Not working right now (hide Play, show preview)' },
              { value: 'archived', label: 'Archived (no longer online)' },
              { value: 'replaced', label: 'Replaced by a new version' },
            ]}
            extra={{ name: 'demo_note', label: 'Note shown to visitors (optional)' }}
            submitLabel="Save demo status"
          />
        </div>
      </section>
    </div>
  );
}
