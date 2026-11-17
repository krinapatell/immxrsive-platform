import Link from 'next/link';
import { notFound } from 'next/navigation';
import { staffState } from '@/lib/staff';
import { verificationReview } from '@/lib/partners';
import { ProjectError } from '@/lib/projects';
import StaffGate from '@/components/staff/StaffGate';
import StaffNav from '@/components/staff/StaffNav';
import StaffButton from '@/components/staff/StaffButton';
import DecisionForm from '@/components/staff/DecisionForm';

export const dynamic = 'force-dynamic';

/** Review a project verification request: the project, its people, and the student's reason (R4.05). */
export default async function VerificationReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { state } = await staffState();
  if (state !== 'staff') return <StaffGate state={state} />;
  const { id } = await params;
  let r;
  try {
    r = await verificationReview(id);
  } catch (err) {
    if (err instanceof ProjectError && err.status === 404) notFound();
    throw err;
  }
  const { request, project, contributors, history } = r;
  const card = 'space-y-3 rounded-2xl border border-line bg-white p-5 sm:p-6';
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <StaffNav />
      <h1 className="break-words text-3xl font-extrabold">Verify “{project.title}”</h1>

      <section className={card}>
        <h2 className="text-lg font-bold">What the student said</h2>
        <p className="text-sm text-muted">
          Asked by {request.requested_by_name} on {new Date(request.created_at).toLocaleDateString('en-CA')}
        </p>
        <p className="whitespace-pre-line break-words">{request.note}</p>
        {request.evidence_url && (
          <p className="text-sm">
            Evidence:{' '}
            <a href={request.evidence_url} target="_blank" rel="noopener noreferrer nofollow" className="break-all font-semibold underline">
              {request.evidence_url}
            </a>
          </p>
        )}
      </section>

      <section className={card}>
        <h2 className="text-lg font-bold">The project</h2>
        <p className="text-sm text-muted">
          {project.publish_status === 'published' ? (
            <Link href={`/projects/${project.id}`} className="underline" target="_blank">
              Open the public page
            </Link>
          ) : (
            'Not published yet (only the team can see it)'
          )}
          {project.verified_at && ' · already verified'}
        </p>
        <p className="whitespace-pre-line break-words">{project.description || 'No description.'}</p>
        {(project.repositories ?? []).length > 0 && (
          <p className="break-all text-sm">Source: {(project.repositories as string[]).join(', ')}</p>
        )}
        {project.demo_url && <p className="break-all text-sm">Demo: {project.demo_url}</p>}
        <h3 className="pt-1 font-bold">Contributors</h3>
        <ul className="space-y-1 text-sm">
          {contributors.map((c) => (
            <li key={c.student_id}>
              <span className="font-semibold">{c.name}</span> – {c.role}
              {c.is_maintainer && ' (maintainer)'}
              {c.statement && <span className="text-muted"> · “{c.statement}”</span>}
            </li>
          ))}
        </ul>
      </section>

      <section className={card}>
        <h2 className="text-lg font-bold">Your decision</h2>
        {request.status === 'pending' ? (
          <DecisionForm url={`/api/staff/verifications/${request.id}`} approveLabel="Approve – mark as verified" />
        ) : (
          <p className="text-sm">
            Already {request.status}.{' '}
            {project.verified_at && (
              <StaffButton
                url={`/api/staff/projects/${project.id}`}
                body={{ action: 'remove_verification' }}
                label="Remove verification"
                variant="danger"
                confirm="The project will no longer show as verified."
                done="Verification removed."
              />
            )}
          </p>
        )}
      </section>

      {history.length > 1 && (
        <section className={card}>
          <h2 className="text-lg font-bold">Earlier requests for this project</h2>
          <ul className="space-y-1 text-sm">
            {history
              .filter((h) => h.id !== request.id)
              .map((h) => (
                <li key={h.id}>
                  {new Date(h.created_at).toLocaleDateString('en-CA')} · {h.status}
                  {h.staff_note && ` · “${h.staff_note}”`}
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  );
}
