'use client';

import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import { btn, send } from './api';

/**
 * One small staff form: a single text box or choice, sent as { action, [name]: value }.
 * Errors come back in plain words and are announced to screen readers.
 */
export default function StaffActionForm({
  url,
  action,
  name,
  label,
  hint,
  options,
  initial = '',
  submitLabel,
  confirm,
  redirectField,
  redirectBase = '',
  extra,
}: {
  url: string;
  action: string;
  name: string;
  label: string;
  hint?: string;
  options?: { value: string; label: string }[];
  initial?: string;
  submitLabel: string;
  confirm?: string;
  /** After success, go to `${redirectBase}${response[redirectField]}` when that field is in the reply. */
  redirectField?: string;
  redirectBase?: string;
  extra?: { name: string; label: string; hint?: string };
}) {
  const router = useRouter();
  const id = useId();
  const [value, setValue] = useState(initial);
  const [extraValue, setExtraValue] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (confirm && !window.confirm(confirm)) return;
    setBusy(true);
    setError('');
    setMsg('');
    const body: Record<string, unknown> = { action, [name]: value };
    if (extra) body[extra.name] = extraValue;
    const r = await send(url, 'POST', body);
    setBusy(false);
    if (!r.ok) return setError(r.data.errors?.[name] ? `${r.data.error} ${r.data.errors[name]}` : (r.data.error ?? 'Something went wrong.'));
    setMsg('Saved.');
    const next = redirectField ? r.data[redirectField] : null;
    if (typeof next === 'string' && next) router.push(redirectBase + encodeURIComponent(next));
    router.refresh();
  }

  const field = 'mt-1 w-full rounded-lg border border-line bg-white px-3 py-2';
  return (
    <form onSubmit={submit} className="space-y-2" noValidate>
      <label htmlFor={`${id}-v`} className="block text-sm font-semibold">
        {label}
      </label>
      {hint && (
        <p id={`${id}-h`} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {options ? (
        <select id={`${id}-v`} value={value} onChange={(e) => setValue(e.target.value)} className={field} aria-describedby={hint ? `${id}-h` : undefined}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={`${id}-v`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={field}
          aria-invalid={!!error}
          aria-describedby={[hint ? `${id}-h` : '', error ? `${id}-e` : ''].filter(Boolean).join(' ') || undefined}
        />
      )}
      {extra && (
        <>
          <label htmlFor={`${id}-x`} className="block text-sm font-semibold">
            {extra.label}
          </label>
          <input id={`${id}-x`} value={extraValue} onChange={(e) => setExtraValue(e.target.value)} className={field} />
        </>
      )}
      {error && (
        <p id={`${id}-e`} role="alert" className="text-sm font-semibold text-red-800">
          {error}
        </p>
      )}
      {msg && (
        <p role="status" className="text-sm">
          {msg}
        </p>
      )}
      <button type="submit" disabled={busy} className={btn.secondary}>
        {busy ? 'Working…' : submitLabel}
      </button>
    </form>
  );
}
