import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/users';
import { listRoles } from '@/lib/projects';
import ProjectForm, { EMPTY_PROJECT } from '@/components/student/ProjectForm';

export const dynamic = 'force-dynamic';

/** R3.01: one clear Add Project workflow (manual or from GitHub). */
export default async function NewProjectPage() {
  const user = await currentUser();
  if (!user || !user.affiliation_verified_at) redirect('/student');
  const roles = await listRoles();
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-extrabold">Add a project</h1>
      <p className="text-muted">You&apos;ll be the project&apos;s maintainer. It stays a private draft until you publish it, and you can invite teammates after saving.</p>
      <ProjectForm mode="create" initial={EMPTY_PROJECT} roles={roles} />
    </div>
  );
}
