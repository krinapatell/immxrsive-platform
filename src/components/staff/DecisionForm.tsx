'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { btn, send } from './api';

/**
 * Approve / reject with a message to the student. For partner requests that
 * suggest a new company, staff also choose which company it is (R4.05, R4.21).
 */
export default function DecisionForm({
  url,
  approveLabel,
  companyChoice,
}: {
  url: string;
  approveLabel: string;
  companyChoice?: { suggestedName: string; companies: { id: string; name: string; status: string }[] };
}) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [company, setCompany] = useState(companyChoice ? 'new' : '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const decide = async (action: 'approve' | 'reject') => {
    setBusy(true);
    setError('');
    const body: Record<string, unknown> = { action, staff_note: note };
    if (companyChoice && action === 'approve') {
      if (company === 'new') body.create_company = true;
      else body.company_id = company;
    }
    const r = await send(url, 'POST', body);
    setBusy(false);
    if (!r.ok) return setError(r.data.errors?.staff_note ?? r.data.error ?? 'Something went wrong.');
    router.push('/staff?done=' + action);
    router.refresh();
  };

  return (
    <div className="space-y-3">
      {companyChoice && (
        <div>
          <label htmlFor="decision-company" className="block text-sm font-semibold">
            Which company is this?
          </label>
          <select id="decision-company" value={company} onChange={(e) => setCompany(e.target.value)} className="mt-1 w-full rounded-lg border border-line px-3 py-2">
            <option value="new">Create a new draft company called “{companyChoice.suggestedName}”</option>
            {companyChoice.companies.map((c) => (
              <option key={c.id} value={c.id}>
                Use existing: {c.name}
                {c.status === 'draft' ? ' (draft)' : ''}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted">A new company stays a draft: review and publish it before it appears on the public site.</p>
        </div>
      )}
      <div>
        <label htmlFor="decision-note" className="block text-sm font-semibold">
          Message to the student
        </label>
        <p className="text-xs text-muted">Required when you reject, so they know what to change.</p>
        <textarea id="decision-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 w-full rounded-lg border border-line px-3 py-2" />
      </div>
      {error && (
        <p role="alert" className="text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button type="button" className={btn.primary} disabled={busy} onClick={() => decide('approve')}>
          {approveLabel}
        </button>
        <button type="button" className={btn.danger} disabled={busy} onClick={() => decide('reject')}>
          Reject
        </button>
      </div>
    </div>
  );
}
