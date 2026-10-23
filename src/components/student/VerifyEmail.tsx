'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Field from '../Field';

/** Two steps: send a code to an @algomau.ca address, then enter it (R2.04 – R2.08). */
export default function VerifyEmail() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const call = async (body: object) => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.');
        return null;
      }
      return data;
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
      return null;
    } finally {
      setBusy(false);
    }
  };

  if (step === 'email') {
    return (
      <form
        noValidate
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const data = await call({ action: 'send', email });
          if (data) {
            setInfo(data.message);
            setStep('code');
          }
        }}
      >
        <p className="text-sm text-muted">We&apos;ll email you a 6-digit code. You only need to do this once.</p>
        <Field id="email" label="Algoma student email" type="email" value={email} onChange={setEmail} hint="Must end in @algomau.ca" error={error} required />
        <button type="submit" disabled={busy} className="rounded-lg bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-dark disabled:opacity-60">
          {busy ? 'Sending…' : 'Email me a code'}
        </button>
      </form>
    );
  }

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const data = await call({ action: 'confirm', code });
        if (data) router.refresh();
      }}
    >
      <p role="status" className="rounded-lg bg-accent-soft p-3 text-sm">
        {info}
      </p>
      <Field id="code" label="Verification code" value={code} onChange={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))} hint="6 digits, from the email" error={error} required />
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={busy} className="rounded-lg bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-dark disabled:opacity-60">
          {busy ? 'Checking…' : 'Verify'}
        </button>
        <button
          type="button"
          onClick={() => {
            setStep('email');
            setError('');
            setCode('');
          }}
          className="rounded-lg border border-line px-4 py-2 font-semibold"
        >
          Use a different email / send a new code
        </button>
      </div>
    </form>
  );
}
