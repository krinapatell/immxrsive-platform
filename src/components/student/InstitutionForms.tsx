'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Field from '../Field';

async function post(projectId: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/me/projects/${projectId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { ok: res.ok, data: await res.json().catch(() => ({})) };
}

const primary = 'rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60';

/** Ask ImmXrsive staff to officially verify this project (R4.04). */
export function VerificationRequestForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [evidence, setEvidence] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const r = await post(projectId, { action: 'request_verification', note, evidence_url: evidence });
    setBusy(false);
    if (!r.ok) {
      setErrors(r.data.errors ?? {});
      return setMsg(r.data.error ?? 'Could not send the request.');
    }
    setMsg('');
    router.refresh();
  };
  return (
    <form onSubmit={submit} className="space-y-3">
      <Field
        id="verify-note"
        label="Why should ImmXrsive verify this project?"
        multiline
        required
        value={note}
        onChange={setNote}
        error={errors.note}
        hint="e.g. Built in COSC-3506 under Prof. X; demoed at the XR showcase."
      />
      <Field id="verify-evidence" label="Evidence link (optional)" value={evidence} onChange={setEvidence} error={errors.evidence_url} hint="A course page, demo video, poster…" />
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} className={primary}>
          {busy ? 'Sending…' : 'Request verification'}
        </button>
        {msg && (
          <span role="status" className="text-sm font-semibold text-red-700">
            {msg}
          </span>
        )}
      </div>
    </form>
  );
}

/** Ask staff to record an industry partner on this project (R4.20). */
export function PartnerRequestForm({ projectId, companies }: { projectId: string; companies: { id: string; name: string }[] }) {
  const router = useRouter();
  const [choice, setChoice] = useState(companies[0]?.id ?? 'new');
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [explanation, setExplanation] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setMsg('');
    const body =
      choice === 'new'
        ? { action: 'request_partner', suggested_name: name, suggested_website: website, explanation }
        : { action: 'request_partner', company_id: choice, explanation };
    const r = await post(projectId, body);
    setBusy(false);
    if (!r.ok) {
      setErrors(r.data.errors ?? {});
      return setMsg(r.data.error ?? 'Could not send the request.');
    }
    setName('');
    setWebsite('');
    setExplanation('');
    setMsg('Request sent. Staff will review it before it appears publicly.');
    router.refresh();
  };
  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label htmlFor="partner-choice" className="block text-sm font-semibold">
          Company
        </label>
        <select id="partner-choice" value={choice} onChange={(e) => setChoice(e.target.value)} className="mt-1 w-full rounded-lg border border-line px-3 py-2">
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value="new">The company isn&apos;t listed – suggest it</option>
        </select>
        {errors.company_id && <p className="mt-1 text-sm font-semibold text-red-700">{errors.company_id}</p>}
      </div>
      {choice === 'new' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="partner-name" label="Company name" required value={name} onChange={setName} error={errors.suggested_name} />
          <Field id="partner-website" label="Company website" value={website} onChange={setWebsite} error={errors.suggested_website} />
        </div>
      )}
      <Field
        id="partner-explanation"
        label="How was the company involved?"
        multiline
        required
        value={explanation}
        onChange={setExplanation}
        error={errors.explanation}
        hint="e.g. They gave us the brief and tested our prototype with their trainers."
      />
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} className={primary}>
          {busy ? 'Sending…' : 'Send partner request'}
        </button>
        {msg && (
          <span role="status" className="text-sm font-medium">
            {msg}
          </span>
        )}
      </div>
    </form>
  );
}
