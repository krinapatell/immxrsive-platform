import Link from 'next/link';
import { notFound } from 'next/navigation';
import { staffState } from '@/lib/staff';
import { pendingClaims } from '@/lib/admin';
import StaffGate from '@/components/staff/StaffGate';
import StaffNav from '@/components/staff/StaffNav';
import DecisionForm from '@/components/staff/DecisionForm';

export const dynamic = 'force-dynamic';

/** Staff: review one "this profile is mine" request (F.09, F.10). */
export default async function ClaimReview({ params }: { params: Promise<{ id: string }> }) {
  const { state } = await staffState();
  if (state !== 'staff') return <StaffGate state={state} />;
  const { id } = await params;
  const c = (await pendingClaims()).find((x) => x.id === id);
  if (!c) notFound();
  const match = !!c.legacy_email && !!c.verified_email && c.legacy_email.toLowerCase() === c.verified_email.toLowerCase();
  return (
    <div className="space-y-5">
      <StaffNav />
      <h1 className="text-3xl font-extrabold">Profile claim</h1>
      <section className="space-y-2 rounded-2xl border border-line bg-white p-5 sm:p-6">
        <p>
          GitHub account <strong>{c.github_login}</strong> says the imported profile{' '}
          <Link className="font-semibold underline" href={`/staff/students/${encodeURIComponent(c.student_id)}`}>
            {c.student_name} ({c.student_id})
          </Link>{' '}
          is theirs.
        </p>
        <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[max-content_1fr]">
          <dt className="font-semibold">Their verified email</dt>
          <dd>{c.verified_email ?? 'none'}</dd>
          <dt className="font-semibold">Email on the old site</dt>
          <dd>{c.legacy_email ?? 'not recorded'}</dd>
          <dt className="font-semibold">Their note</dt>
          <dd className="whitespace-pre-line break-words">{c.message || '—'}</dd>
        </dl>
        <p className="rounded-lg bg-stone-100 p-3 text-sm">
          {match
            ? 'The emails match.'
            : 'The emails do not match, so this was not approved automatically. Approve only if the note convinces you (for example they can name the projects and teammates).'}{' '}
          If they already had a profile on the new site, approving merges it into this one.
        </p>
      </section>
      <DecisionForm url={`/api/staff/claims/${c.id}`} approveLabel="Approve: give them this profile" />
    </div>
  );
}
