import Link from 'next/link';
import { staffState } from '@/lib/staff';
import { workQueue } from '@/lib/partners';
import StaffGate from '@/components/staff/StaffGate';
import StaffButton from '@/components/staff/StaffButton';

export const dynamic = 'force-dynamic';

const when = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });

/**
 * Staff home (R4.03): what needs attention, grouped as tasks.
 * Staff never see tables, ids or internal states here.
 */
export default async function StaffHome({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { state } = await staffState();
  if (state !== 'staff') return <StaffGate state={state} />;
  const q = await workQueue();
  const done = (await searchParams).done;
  const total = q.verifications.length + q.partnerRequests.length + q.draftCompanies.length;
  const card = 'rounded-2xl border border-line bg-white p-5 sm:p-6';
  const item = 'flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line p-3';
  const open = 'rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-dark';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Staff home</h1>
          <p className="text-muted">{total === 0 ? 'Nothing is waiting for you right now.' : `${total} ${total === 1 ? 'thing needs' : 'things need'} your attention.`}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/staff/companies/new" className={open}>
            + Add a company
          </Link>
          <StaffButton url="/api/staff/access" method="DELETE" label="Turn off staff tools" confirm="This account goes back to being an ordinary student." redirectTo="/student" />
        </div>
      </div>
      {done && (
        <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm font-medium">
          {done === 'approve' ? 'Approved. The student can see your decision.' : 'Rejected. The student can see your message.'}
        </p>
      )}

      <section className={card} aria-labelledby="q-verify">
        <h2 id="q-verify" className="text-lg font-bold">
          Verify projects <span className="text-muted">({q.verifications.length})</span>
        </h2>
        <p className="text-sm text-muted">Students asking for their project to be marked as officially verified by ImmXrsive.</p>
        {q.verifications.length === 0 ? (
          <p className="mt-2 text-sm">No projects waiting.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {q.verifications.map((v) => (
              <li key={v.id} className={item}>
                <span>
                  <span className="font-semibold">{v.project_title}</span>
                  <span className="block text-sm text-muted">
                    Asked by {v.requested_by} · {when(v.created_at)}
                  </span>
                </span>
                <Link href={`/staff/verifications/${v.id}`} className={open}>
                  Review project
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={card} aria-labelledby="q-partner">
        <h2 id="q-partner" className="text-lg font-bold">
          Review partner requests <span className="text-muted">({q.partnerRequests.length})</span>
        </h2>
        <p className="text-sm text-muted">Students saying a company was involved in their project. Nothing is official until you approve it.</p>
        {q.partnerRequests.length === 0 ? (
          <p className="mt-2 text-sm">No requests waiting.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {q.partnerRequests.map((r) => (
              <li key={r.id} className={item}>
                <span>
                  <span className="font-semibold">{r.company}</span>
                  {r.is_new_company && <span className="ml-1 rounded bg-amber-100 px-1.5 text-xs font-semibold">new company</span>}
                  <span className="block text-sm text-muted">
                    for “{r.project_title}” · asked by {r.requested_by} · {when(r.created_at)}
                  </span>
                </span>
                <Link href={`/staff/partner-requests/${r.id}`} className={open}>
                  Review request
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={card} aria-labelledby="q-company">
        <h2 id="q-company" className="text-lg font-bold">
          Review companies <span className="text-muted">({q.draftCompanies.length})</span>
        </h2>
        <p className="text-sm text-muted">Company drafts (added by hand, from a website, or from a student suggestion) that aren&apos;t public yet.</p>
        {q.draftCompanies.length === 0 ? (
          <p className="mt-2 text-sm">No drafts.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {q.draftCompanies.map((c) => (
              <li key={c.id} className={item}>
                <span>
                  <span className="font-semibold">{c.name}</span>
                  <span className="block text-sm text-muted">
                    {c.imported ? 'Filled from website' : 'Entered by staff'}
                    {c.domain && ` · ${c.domain}`} · last changed {when(c.updated_at)}
                  </span>
                </span>
                <Link href={`/staff/companies/${c.id}`} className={open}>
                  Review & publish
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={card} aria-labelledby="q-partners">
        <h2 id="q-partners" className="text-lg font-bold">
          Published partners <span className="text-muted">({q.publishedCompanies.length})</span>
        </h2>
        <p className="text-sm text-muted">Open a partner to edit it or add a collaboration.</p>
        {q.publishedCompanies.length === 0 ? (
          <p className="mt-2 text-sm">None yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {q.publishedCompanies.map((c) => (
              <li key={c.id} className={item}>
                <span>
                  <span className="font-semibold">{c.name}</span>
                  <span className="block text-sm text-muted">
                    {c.collaborations} {c.collaborations === 1 ? 'collaboration' : 'collaborations'}
                  </span>
                </span>
                <span className="flex flex-wrap gap-2">
                  <Link href={`/partners/${c.id}`} className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold">
                    View public page
                  </Link>
                  <Link href={`/staff/companies/${c.id}#collaborations`} className={open}>
                    Add collaboration
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
