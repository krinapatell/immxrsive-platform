import { currentUser, type AppUser } from '@/lib/users';
import { getOrCreateMyProfile } from '@/lib/profile';
import { listSkills } from '@/lib/students';
import VerifyEmail from '@/components/student/VerifyEmail';
import ProfileEditor from '@/components/student/ProfileEditor';

export const dynamic = 'force-dynamic';

const ERRORS: Record<string, string> = {
  signin_failed: 'GitHub sign-in did not complete. Please try again.',
  github_not_configured: 'GitHub sign-in is not set up on this deployment yet.',
};

/**
 * Student portal (R2 student journey):
 *   signed out  -> "Sign in with GitHub"
 *   signed in   -> verify Algoma email (once)
 *   verified    -> profile editor (draft, resume import, privacy, preview, publish)
 */
export default async function StudentPortal({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const error = typeof sp.error === 'string' ? ERRORS[sp.error] : undefined;
  const signedOut = sp.signed_out === '1';

  let user: AppUser | null = null;
  let unavailable = false;
  try {
    user = await currentUser();
  } catch (err) {
    unavailable = true;
    console.error('Portal failed to load user:', err instanceof Error ? err.message : err);
  }

  if (unavailable) {
    return <Panel title="Student portal">The student portal is temporarily unavailable. Please try again shortly.</Panel>;
  }

  if (!user) {
    return (
      <Panel title="Student portal">
        <p>Create and manage your professional profile in the ImmXrsive talent directory.</p>
        <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-muted">
          <li>Sign in with your GitHub account.</li>
          <li>Confirm you&apos;re an Algoma student with your @algomau.ca email (only once).</li>
          <li>Build your profile, preview it, and publish when you&apos;re ready.</li>
        </ol>
        {signedOut && (
          <p role="status" className="mt-4 rounded-lg bg-accent-soft p-3 text-sm">
            You&apos;re signed out of the ImmXrsive portal. On a shared computer, also sign out of{' '}
            <a href="https://github.com/logout" className="font-semibold underline" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            . The next person can pick &quot;Use a different account&quot; when signing in.
          </p>
        )}
        {error && (
          <p role="alert" className="mt-4 font-semibold text-red-700">
            {error}
          </p>
        )}
        <a href="/api/auth/github" className="mt-6 inline-block rounded-lg bg-ink px-5 py-3 font-semibold text-white hover:bg-black">
          Sign in with GitHub
        </a>
        <p className="mt-3 text-xs text-muted">We only read your public GitHub profile. We never ask for access to your repositories.</p>
      </Panel>
    );
  }

  const signOut = (
    <form action="/api/auth/signout" method="post">
      <button type="submit" className="text-sm font-semibold text-accent-dark underline">
        Sign out ({user.github_login})
      </button>
    </form>
  );

  if (!user.affiliation_verified_at) {
    return (
      <Panel title="Verify you're an Algoma student" aside={signOut}>
        <VerifyEmail />
      </Panel>
    );
  }

  const [profile, skills] = await Promise.all([getOrCreateMyProfile(user), listSkills()]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-3xl font-extrabold">Your profile</h1>
        {signOut}
      </div>
      <ProfileEditor initial={profile} standardSkills={skills} githubLogin={user.github_login} />
    </div>
  );
}

function Panel({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-line bg-white p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h1 className="text-2xl font-extrabold">{title}</h1>
        {aside}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}
