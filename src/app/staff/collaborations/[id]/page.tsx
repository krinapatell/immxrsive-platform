import Link from 'next/link';
import { notFound } from 'next/navigation';
import { staffState } from '@/lib/staff';
import { collaborationAdmin, projectPicker } from '@/lib/partners';
import { ProjectError } from '@/lib/projects';
import StaffGate from '@/components/staff/StaffGate';
import CollaborationForm from '@/components/staff/CollaborationForm';

export const dynamic = 'force-dynamic';

export default async function EditCollaborationPage({ params }: { params: Promise<{ id: string }> }) {
  const { state } = await staffState();
  if (state !== 'staff') return <StaffGate state={state} />;
  const { id } = await params;
  let c;
  try {
    c = await collaborationAdmin(id);
  } catch (err) {
    if (err instanceof ProjectError && err.status === 404) notFound();
    throw err;
  }
  const projects = await projectPicker();
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href={`/staff/companies/${c.company_id}#collaborations`} className="text-sm font-semibold text-accent-dark underline">
        ← Back to the company
      </Link>
      <h1 className="break-words text-3xl font-extrabold">Edit collaboration</h1>
      <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
        <CollaborationForm
          companyId={c.company_id}
          collaborationId={c.id}
          projects={projects}
          initial={{
            title: c.title,
            year_start: c.year_start == null ? '' : String(c.year_start),
            year_end: c.year_end ? String(c.year_end) : '',
            status: c.status,
            visibility: c.visibility,
            public_summary: c.public_summary,
            description: c.description,
            outcome: c.outcome,
            project_ids: c.projects.map((p) => p.id),
            student_ids: c.students.map((s) => s.id),
          }}
        />
      </div>
    </div>
  );
}
