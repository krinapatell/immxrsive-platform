'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { btn, send } from './api';

/** One staff action (publish, unpublish, remove...). Asks first when `confirm` is set. */
export default function StaffButton({
  url,
  body,
  label,
  confirm,
  variant = 'secondary',
  done,
  method = 'POST',
  redirectTo,
}: {
  url: string;
  body?: Record<string, unknown>;
  label: string;
  confirm?: string;
  variant?: keyof typeof btn;
  done?: string;
  method?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);
  const [msg, setMsg] = useState('');
  const run = async () => {
    setBusy(true);
    const r = await send(url, method, body);
    setBusy(false);
    setAsking(false);
    setMsg(r.ok ? (done ?? 'Done.') : (r.data.error ?? 'Something went wrong.'));
    if (r.ok) {
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    }
  };
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {asking ? (
        <>
          <span className="text-sm">{confirm}</span>
          <button type="button" className={btn[variant]} onClick={run} disabled={busy}>
            Yes, {label.toLowerCase()}
          </button>
          <button type="button" className={btn.secondary} onClick={() => setAsking(false)}>
            Cancel
          </button>
        </>
      ) : (
        <button type="button" className={btn[variant]} disabled={busy} onClick={() => (confirm ? setAsking(true) : run())}>
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
