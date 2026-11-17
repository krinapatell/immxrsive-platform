import { staffState } from '@/lib/staff';
import StaffGate from '@/components/staff/StaffGate';
import StaffNav from '@/components/staff/StaffNav';
import CompanyEditor from '@/components/staff/CompanyEditor';

export const dynamic = 'force-dynamic';

/** Add a company by hand or from its website (R4.07, R4.08). It is saved as a draft. */
export default async function NewCompanyPage() {
  const { state } = await staffState();
  if (state !== 'staff') return <StaffGate state={state} />;
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <StaffNav />
      <h1 className="text-3xl font-extrabold">Add a company</h1>
      <p className="text-muted">Type the details, or start from the company&apos;s website. It stays a private draft until you publish it.</p>
      <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
        <CompanyEditor initial={{ name: '', website: '', description: '', sector: '', keywords: '', location: '' }} />
      </div>
    </div>
  );
}
