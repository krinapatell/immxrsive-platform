import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/users';
import { getOrCreateMyProfile } from '@/lib/profile';
import { db } from '@/lib/db';
import { toPublic, type ProjectRef } from '@/lib/students';
import ProfileView from '@/components/ProfileView';

export const dynamic = 'force-dynamic';

/**
 * Preview (R2.20): shows the student's saved profile exactly as visitors will
 * see it, built with the same toPublic() function the public API uses, plus
 * labels where a field is private.
 */
export default async function PreviewPage() {
  const user = await currentUser();
  if (!user || !user.affiliation_verified_at) redirect('/student');
  const row = await getOrCreateMyProfile(user);

  const { data } = await db().from('project_contributors').select('role, projects(id, title)').eq('student_id', row.id);
  const projects: ProjectRef[] = (data ?? []).flatMap((r) => {
    const p = r.projects as unknown as { id: string; title: string } | null;
    return p ? [{ id: p.id, title: p.title, role: r.role }] : [];
  });

  const privateFields = Object.fromEntries(Object.entries(row.visibility ?? {}).filter(([, v]) => v === 'private'));
  const statusText =
    row.profile_status === 'published' ? 'Your profile is published. This is what visitors see.' : 'Your profile is not public yet. This is what visitors will see after you publish.';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-accent-soft p-4">
        <p className="text-sm font-medium">
          <strong>Preview.</strong> {statusText} Fields marked 🔒 are private and are not sent to visitors.
        </p>
        <Link href="/student" className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white hover:bg-accent-dark">
          Back to editing
        </Link>
      </div>
      <ProfileView student={toPublic(row, projects)} privateFields={privateFields} showInquiry={false} />
    </div>
  );
}
