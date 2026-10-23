'use client';

import { useState } from 'react';
import Field from './Field';

export default function InquiryForm({ sourceType, sourceId, sourceName }: { sourceType: string; sourceId: string; sourceName: string }) {
  const [form, setForm] = useState({ company_name: '', contact_name: '', contact_email: '', description: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('sending');
    setErrors({});
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source_type: sourceType, source_id: sourceId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.errors ?? {});
        setState(data.errors ? 'idle' : 'failed');
        return;
      }
      setState('sent');
    } catch {
      setState('failed');
    }
  };

  if (state === 'sent') {
    return (
      <div role="status" className="mt-6 rounded-lg border border-emerald-300 bg-emerald-50 p-4">
        <p className="font-semibold">Thanks — your inquiry about {sourceName} was received.</p>
        <p className="text-sm">The ImmXrsive team will follow up by email.</p>
      </div>
    );
  }

  const set = (key: keyof typeof form) => (value: string) => setForm({ ...form, [key]: value });
  return (
    <form onSubmit={submit} noValidate className="mt-6 space-y-4">
      <Field id="company_name" label="Company name" value={form.company_name} onChange={set('company_name')} error={errors.company_name} required />
      <Field id="contact_name" label="Your name" value={form.contact_name} onChange={set('contact_name')} error={errors.contact_name} required />
      <Field id="contact_email" label="Your email" type="email" value={form.contact_email} onChange={set('contact_email')} error={errors.contact_email} required />
      <Field id="description" label="What would you like to discuss?" multiline value={form.description} onChange={set('description')} error={errors.description} required />
      {state === 'failed' && (
        <p role="alert" className="text-sm font-semibold text-red-700">
          Something went wrong. Please try again.
        </p>
      )}
      <button type="submit" disabled={state === 'sending'} className="rounded-lg bg-accent px-4 py-3 font-semibold text-white hover:bg-accent-dark disabled:opacity-60">
        {state === 'sending' ? 'Sending…' : 'Send inquiry'}
      </button>
    </form>
  );
}
