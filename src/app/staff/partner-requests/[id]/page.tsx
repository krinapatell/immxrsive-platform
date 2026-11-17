import Link from 'next/link';
import { notFound } from 'next/navigation';
import { staffState } from '@/lib/staff';
import { partnerRequestReview } from '@/lib/partners';
import { ProjectError } from '@/lib/projects';
import StaffGate from '@/components/staff/StaffGate';
import StaffNav from '@/components/staff/StaffNav';
import DecisionForm from '@/components/staff/DecisionForm';

export const dynamic = 'force-dynamic';

/** Review a student's request to list a company as an industry partner on their project (R4.21). */
export default async function PartnerRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { state } = await staffState();
  if (state !== 'staff') return <StaffGate state={state} />;
  const { id } = await params;
  let r;
  try {
    r = await partnerRequestReview(id);
  } catch (err) {
    if (err instanceof ProjectError && err.status === 404) notFound();
    throw err;
  }
  const { request, project, company, sameDomainCompanies, companies } = r;
  const card = 'space-y-3 rounded-2xl border border-line bg-white p-5 sm:p-6';
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <StaffNav />
      <h1 className="break-words text-3xl font-extrabold">Partner request</h1>

      <section className={card}>
        <h2 className="text-lg font-bold">What the student is asking</h2>
        <p>
          <span className="font-semibold">{String(request.requested_by_name)}</span> says{' '}
          <span className="font-semibold">{company ? company.name : request.suggested_name}</span>
          {!company && ' (a company we don’t have yet)'} worked with them on{' '}
          {project?.publish_status === 'published' ? (
            <Link href={`/projects/${project.id}`} className="font-semibold underline" target="_blank">
              {project.title}
            </Link>
          ) : (
            <span className="font-semibold">{project?.title}</span>
          )}
          .
        </p>
        {!company && request.suggested_website && <p className="break-all text-sm">Suggested website: {request.suggested_website}</p>}
        <blockquote className="whitespace-pre-line break-words border-l-4 border-line pl-3">{request.explanation}</blockquote>
        {sameDomainCompanies.length > 0 && (
          <p className="rounded-lg bg-amber-50 p-3 text-sm">
            We already have a company with that website: {sameDomainCompanies.map((c) => c.name).join(', ')}. You probably want to use it below.
          </p>
        )}
      </section>

      <section className={card}>
        <h2 className="text-lg font-bold">Your decision</h2>
        {request.status !== 'pending' ? (
          <p className="text-sm">Already {request.status}.</p>
        ) : (
          <>
            <p className="text-sm text-muted">
              Approving makes this an official partnership. It shows on the project page, and on the company page once the company is published.
            </p>
            <DecisionForm
              url={`/api/staff/partner-requests/${request.id}`}
              approveLabel="Approve partnership"
              companyChoice={company ? undefined : { suggestedName: String(request.suggested_name), companies }}
            />
          </>
        )}
        {company && (
          <p className="text-sm">
            <Link href={`/staff/companies/${company.id}`} className="underline">
              Open {company.name} in staff tools
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}
