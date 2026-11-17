import Link from 'next/link';
import StaffAccess from './StaffAccess';
import type { StaffState } from '@/lib/staff';

/** What a non-staff visitor sees on any /staff page. The server decides; nothing staff-only is loaded. */
export default function StaffGate({ state }: { state: Exclude<StaffState, 'staff'> }) {
  return (
    <div className="mx-auto max-w-xl space-y-4 rounded-2xl border border-line bg-white p-6 sm:p-8">
      <h1 className="text-2xl font-extrabold">ImmXrsive staff</h1>
      {state === 'signed-out' && (
        <>
          <p>Staff tools are for ImmXrsive team members. Sign in first.</p>
          <a href="/api/auth/github" className="inline-block rounded-lg bg-ink px-5 py-3 font-semibold text-white hover:bg-black">
            Sign in with GitHub
          </a>
        </>
      )}
      {state === 'unverified' && (
        <p>
          Confirm your @algomau.ca email in the{' '}
          <Link href="/student" className="font-semibold underline">
            portal
          </Link>{' '}
          first, then come back here.
        </p>
      )}
      {state === 'not-staff' && (
        <>
          <p>This account doesn&apos;t have staff tools yet. If you&apos;re on the ImmXrsive team, enter the staff access code you were given.</p>
          <StaffAccess />
        </>
      )}
    </div>
  );
}
