'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

async function post(projectId: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/me/projects/${projectId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

/** A button that runs one project action on the server, then refreshes the page. */
export function ActionButton({
  projectId,
  body,
  label,
  confirm,
  variant = 'secondary',
  done,
}: {
  projectId: string;
  body: Record<string, unknown>;
  label: string;
  confirm?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  done?: string;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);
  const cls =
    variant === 'primary'
      ? 'bg-accent text-white hover:bg-accent-dark'
      : variant === 'danger'
        ? 'border border-red-300 text-red-800 bg-white'
        : 'border border-line bg-white';
  const run = async () => {
    setBusy(true);
    const { ok, data } = await post(projectId, body);
    setBusy(false);
    setAsking(false);
    setMsg(ok ? (done ?? '') : (data.error ?? 'Something went wrong.'));
    if (ok) router.refresh();
  };
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {asking ? (
        <>
          <span className="text-sm">{confirm}</span>
          <button type="button" onClick={run} disabled={busy} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${cls}`}>
            Yes, {label.toLowerCase()}
          </button>
          <button type="button" onClick={() => setAsking(false)} className="rounded-lg border border-line px-3 py-1.5 text-sm">
            Cancel
          </button>
        </>
      ) : (
        <button type="button" onClick={() => (confirm ? setAsking(true) : run())} disabled={busy} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${cls} disabled:opacity-60`}>
          {busy ? 'Working…' : label}
        </button>
      )}
      {msg && (
        <span role="status" className="text-sm">
          {msg}
        </span>
      )}
    </span>
  );
}

/** R3.08: invite a teammate by GitHub username with a proposed standard role. */
export function InviteForm({ projectId, roles }: { projectId: string; roles: string[] }) {
  const router = useRouter();
  const [login, setLogin] = useState('');
  const [role, setRole] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const { ok, data } = await post(projectId, { action: 'invite', github_login: login, role });
        setBusy(false);
        setMsg(ok ? `Invitation sent to ${data.invited}. They'll see it under My projects.` : (data.error ?? 'Could not invite.'));
        if (ok) {
          setLogin('');
          setRole('');
          router.refresh();
        }
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="invite-login" className="block text-sm font-semibold">
            Teammate&apos;s GitHub username
          </label>
          <input id="invite-login" value={login} onChange={(e) => setLogin(e.target.value)} required placeholder="e.g. octocat" className="mt-1 w-full rounded-lg border border-line px-3 py-2" />
          <p className="text-xs text-muted">They must have signed in to the student portal and verified their Algoma email.</p>
        </div>
        <div>
          <label htmlFor="invite-role" className="block text-sm font-semibold">
            Proposed role
          </label>
          <select id="invite-role" value={role} onChange={(e) => setRole(e.target.value)} required className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2">
            <option value="">Choose a role…</option>
            {roles.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>
      <button type="submit" disabled={busy} className="rounded-lg bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-dark disabled:opacity-60">
        {busy ? 'Sending…' : 'Invite teammate'}
      </button>
      <p role="status" className="text-sm">
        {msg}
      </p>
    </form>
  );
}

/** R3.09: accept (optionally changing the proposed role) or decline an invitation. */
export function InvitationResponse({ projectId, proposedRole, roles }: { projectId: string; proposedRole: string; roles: string[] }) {
  const router = useRouter();
  const [role, setRole] = useState(proposedRole);
  const [msg, setMsg] = useState('');
  const go = async (action: 'accept' | 'decline') => {
    const { ok, data } = await post(projectId, { action, role });
    setMsg(ok ? (action === 'accept' ? 'Accepted. You now appear on the project.' : 'Declined.') : (data.error ?? 'Something went wrong.'));
    if (ok) router.refresh();
  };
  return (
    <div className="flex flex-wrap items-end gap-2">
      <div>
        <label htmlFor={`accept-role-${projectId}`} className="block text-xs font-semibold">
          Your role
        </label>
        <select id={`accept-role-${projectId}`} value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 rounded-lg border border-line bg-white px-2 py-1.5 text-sm">
          {roles.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </div>
      <button type="button" onClick={() => go('accept')} className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white">
        Accept
      </button>
      <button type="button" onClick={() => go('decline')} className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-semibold">
        Decline
      </button>
      {msg && (
        <span role="status" className="text-sm">
          {msg}
        </span>
      )}
    </div>
  );
}

/** R3.10–R3.12: the signed-in contributor's own role, statement and "feature on my profile". */
export function MyContribution({
  projectId,
  roles,
  initial,
}: {
  projectId: string;
  roles: string[];
  initial: { role: string; statement: string; featured: boolean };
}) {
  const router = useRouter();
  const [role, setRole] = useState(roles.includes(initial.role) ? initial.role : '');
  const [statement, setStatement] = useState(initial.statement);
  const [featured, setFeatured] = useState(initial.featured);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const { ok, data } = await post(projectId, { action: 'my_contribution', role: role || undefined, statement, featured });
        setBusy(false);
        setMsg(ok ? 'Saved.' : (data.error ?? 'Could not save.'));
        if (ok) router.refresh();
      }}
    >
      <div>
        <label htmlFor="my-contrib-role" className="block text-sm font-semibold">
          My role
        </label>
        <select id="my-contrib-role" value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 sm:w-auto">
          {!role && <option value="">{initial.role} (keep)</option>}
          {roles.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="my-contrib-statement" className="block text-sm font-semibold">
          What I did (my contribution statement)
        </label>
        <p className="text-xs text-muted">Only you can change this. The maintainer can&apos;t edit it.</p>
        <textarea id="my-contrib-statement" value={statement} maxLength={600} rows={3} onChange={(e) => setStatement(e.target.value)} className="mt-1 w-full rounded-lg border border-line px-3 py-2" />
      </div>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
        Show this project on my profile
      </label>
      <p className="text-xs text-muted">Hiding it only removes it from your profile. You stay a contributor on the project page.</p>
      <button type="submit" disabled={busy} className="rounded-lg bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-dark disabled:opacity-60">
        {busy ? 'Saving…' : 'Save my contribution'}
      </button>
      <span role="status" className="ml-2 text-sm">
        {msg}
      </span>
    </form>
  );
}

/** R3.07: transfer maintenance to an accepted contributor. */
export function TransferForm({ projectId, candidates }: { projectId: string; candidates: { id: string; name: string }[] }) {
  const router = useRouter();
  const [target, setTarget] = useState('');
  const [msg, setMsg] = useState('');
  const [asking, setAsking] = useState(false);
  if (!candidates.length) return <p className="text-sm text-muted">Once a teammate accepts, you can hand maintenance to them here.</p>;
  return (
    <div className="space-y-2">
      <label htmlFor="transfer-to" className="block text-sm font-semibold">
        Make someone else the maintainer
      </label>
      <div className="flex flex-wrap gap-2">
        <select id="transfer-to" value={target} onChange={(e) => setTarget(e.target.value)} className="rounded-lg border border-line bg-white px-3 py-2">
          <option value="">Choose a contributor…</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {!asking ? (
          <button type="button" disabled={!target} onClick={() => setAsking(true)} className="rounded-lg border border-line bg-white px-3 py-2 font-semibold disabled:opacity-50">
            Transfer
          </button>
        ) : (
          <>
            <span className="self-center text-sm">You&apos;ll no longer be able to edit shared details.</span>
            <button
              type="button"
              onClick={async () => {
                const { ok, data } = await post(projectId, { action: 'transfer', student_id: target });
                setAsking(false);
                setMsg(ok ? 'Maintenance transferred. The project URL is unchanged.' : (data.error ?? 'Could not transfer.'));
                if (ok) router.refresh();
              }}
              className="rounded-lg bg-ink px-3 py-2 font-semibold text-white"
            >
              Yes, transfer
            </button>
            <button type="button" onClick={() => setAsking(false)} className="rounded-lg border border-line px-3 py-2">
              Cancel
            </button>
          </>
        )}
      </div>
      <p role="status" className="text-sm">
        {msg}
      </p>
    </div>
  );
}
