'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type State = { signedIn: boolean; verified: boolean; pending: boolean; rejected: string | null };

/**
 * "Is this you?" on a profile imported from the old site with no owner (F.08).
 * The old email is never shown here. A matching VERIFIED Algoma email is
 * approved straight away; anything else goes to staff with the student's note.
 */
export default function ClaimBox({ studentId, name, state }: { studentId: string; name: string; state: State }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState<'' | 'approved' | 'pending'>(state.pending ? 'pending' : '');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/students/${encodeURIComponent(studentId)}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.errors?.message ?? data.error ?? 'Something went wrong. Try again.');
      else {
        setDone(data.status);
        if (data.status === 'approved') router.refresh();
      }
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    }
    setBusy(false);
  }

  const box = 'rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm sm:p-5';
  if (done === 'approved')
    return (
      <p role="status" className={box}>
        This profile is now yours. <a className="font-semibold underline" href="/student">Open your profile editor</a> to update it.
      </p>
    );
  if (done === 'pending')
    return (
      <p role="status" className={box}>
        Thanks. Your request to claim this profile is waiting for ImmXrsive staff. You&apos;ll see the decision on your student page.
      </p>
    );

  return (
    <section className={box} aria-labelledby="claim-h">
      <h2 id="claim-h" className="font-bold">
        Is this you?
      </h2>
      <p>This profile was moved from the old ImmXrsive site and nobody has claimed it yet.</p>
      {state.rejected && <p className="mt-1">Your last request was not approved: “{state.rejected}”</p>}
      {!state.signedIn ? (
        <p className="mt-2">
          <a className="font-semibold underline" href="/api/auth/github">
            Sign in with GitHub
          </a>{' '}
          and verify your Algoma email, then come back to this page to claim it.
        </p>
      ) : !state.verified ? (
        <p className="mt-2">
          <a className="font-semibold underline" href="/student">
            Verify your Algoma email
          </a>{' '}
          first, then come back to claim this profile.
        </p>
      ) : !open ? (
        <button type="button" onClick={() => setOpen(true)} className="mt-2 rounded-lg bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-dark">
          Claim this profile
        </button>
      ) : (
        <form onSubmit={submit} className="mt-2 space-y-2" noValidate>
          <label htmlFor="claim-msg" className="block font-semibold">
            How can staff tell this is you, {name.split(' ')[0]}?
          </label>
          <p id="claim-hint" className="text-xs text-muted">
            If your verified Algoma email is the one the old site had, it is approved straight away. Otherwise staff check your note, for example the projects you worked on.
          </p>
          <textarea
            id="claim-msg"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            aria-describedby={error ? 'claim-hint claim-err' : 'claim-hint'}
            aria-invalid={!!error}
            className="w-full rounded-lg border border-line bg-white px-3 py-2"
          />
          {error && (
            <p id="claim-err" role="alert" className="font-semibold text-red-800">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={busy} className="rounded-lg bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-dark disabled:opacity-60">
              {busy ? 'Sending…' : 'Send claim'}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-line bg-white px-4 py-2 font-semibold">
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
