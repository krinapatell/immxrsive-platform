import { notFound } from 'next/navigation';
import Link from 'next/link';
import { resolveInquirySource } from '@/lib/inquiry';
import InquiryForm from '@/components/InquiryForm';

export const dynamic = 'force-dynamic';

/**
 * Contextual employer inquiry (R1.18, R1.19). The student or project this is
 * about is looked up on the server and shown on the form, and is sent with
 * the inquiry automatically. The employer doesn't need an account.
 */
export default async function InquiryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const type = String(sp.source_type ?? '');
  const id = String(sp.source_id ?? '');
  const source = await resolveInquirySource(type, id);
  if (!source) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href={source.source_url} className="text-sm font-semibold text-accent-dark underline">
        ← Back to {source.source_name}
      </Link>
      <div className="rounded-2xl border border-line bg-white p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold">Company inquiry</h1>
        <p className="mt-2 rounded-lg bg-accent-soft p-3 text-sm">
          You&apos;re asking about the {source.source_type === 'student' ? 'student' : 'project'}{' '}
          <strong>{source.source_name}</strong> ({source.source_id}). This is included with your inquiry automatically.
        </p>
        <InquiryForm sourceType={source.source_type} sourceId={source.source_id} sourceName={source.source_name} />
      </div>
    </div>
  );
}
