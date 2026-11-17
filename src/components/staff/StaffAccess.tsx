'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { btn, send } from './api';

/** Enter the staff access code (given privately by the ImmXrsive team) to turn on staff tools for this account. */
export default function StaffAccess() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const r = await send('/api/staff/access', 'POST', { code });
    setBusy(false);
    if (!r.ok) return setError(r.data.error ?? 'That did not work. Try again.');
    router.refresh();
  };
  return (
    <form onSubmit={submit} className="space-y-3">
      <label htmlFor="staff-code" className="block text-sm font-semibold">
        Staff access code
      </label>
      <input
        id="staff-code"
        type="password"
        autoComplete="off"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'staff-code-error' : undefined}
        className={`w-full rounded-lg border px-3 py-2 ${error ? 'border-red-600' : 'border-line'}`}
      />
      {error && (
        <p id="staff-code-error" className="text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy || !code} className={btn.primary}>
        {busy ? 'Checking…' : 'Turn on staff tools'}
      </button>
    </form>
  );
}
