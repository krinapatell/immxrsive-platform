'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { DirectoryQuery } from '@/lib/students';

const AVAILABILITY = ['internship', 'full-time', 'contract'];
const STATUSES = ['current', 'alumni'];

function toUrl(q: DirectoryQuery): string {
  const params = new URLSearchParams();
  if (q.q) params.set('q', q.q);
  if (q.skills.length) params.set('skills', q.skills.join(','));
  if (q.availability.length) params.set('availability', q.availability.join(','));
  if (q.status.length) params.set('status', q.status.join(','));
  const s = params.toString();
  return s ? `/?${s}` : '/';
}

/**
 * Search and filter controls (R1.04 – R1.09, R1.23). Every change updates
 * the URL; the server does the filtering. Works with keyboard and screen
 * readers: every control has a label, and filter groups are fieldsets.
 */
export default function DirectoryFilters({ skills, query }: { skills: string[]; query: DirectoryQuery }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState(query.q);

  const go = (next: DirectoryQuery) => startTransition(() => router.replace(toUrl(next), { scroll: false }));
  const toggle = (list: string[], value: string) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const active = [
    ...(query.q ? [{ label: `Text: “${query.q}”`, clear: { ...query, q: '' } }] : []),
    ...query.skills.map((s) => ({ label: `Skill: ${s}`, clear: { ...query, skills: query.skills.filter((x) => x !== s) } })),
    ...query.availability.map((a) => ({ label: `Availability: ${a}`, clear: { ...query, availability: query.availability.filter((x) => x !== a) } })),
    ...query.status.map((s) => ({ label: `Status: ${s}`, clear: { ...query, status: query.status.filter((x) => x !== s) } })),
  ];

  return (
    <section aria-label="Search and filters" className="space-y-4 rounded-2xl border border-line bg-white p-4 sm:p-5">
      <form
        role="search"
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          go({ ...query, q: text.trim() });
        }}
      >
        <div className="flex-1">
          <label htmlFor="q" className="block text-sm font-semibold">
            Search by name, headline or skill
          </label>
          <input
            id="q"
            name="q"
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Unity, Avery, accessible"
            className="mt-1 w-full rounded-lg border border-line px-3 py-2"
          />
        </div>
        <button type="submit" className="rounded-lg bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-dark">
          Search
        </button>
      </form>

      <fieldset>
        <legend className="text-sm font-semibold">Skills (students must have all selected skills)</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {skills.map((skill) => {
            const id = `skill-${skill.replace(/[^a-z0-9]/gi, '-')}`;
            const on = query.skills.includes(skill);
            return (
              <label
                key={skill}
                htmlFor={id}
                className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${on ? 'border-accent bg-accent-soft font-semibold' : 'border-line'}`}
              >
                <input id={id} type="checkbox" checked={on} onChange={() => go({ ...query, skills: toggle(query.skills, skill) })} />
                {skill}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset>
          <legend className="text-sm font-semibold">Availability (any selected)</legend>
          <div className="mt-2 flex flex-wrap gap-3">
            {AVAILABILITY.map((a) => (
              <label key={a} className="flex items-center gap-1.5 text-sm capitalize">
                <input type="checkbox" checked={query.availability.includes(a)} onChange={() => go({ ...query, availability: toggle(query.availability, a) })} />
                {a}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm font-semibold">Status (any selected)</legend>
          <div className="mt-2 flex flex-wrap gap-3">
            {STATUSES.map((s) => (
              <label key={s} className="flex items-center gap-1.5 text-sm capitalize">
                <input type="checkbox" checked={query.status.includes(s)} onChange={() => go({ ...query, status: toggle(query.status, s) })} />
                {s === 'current' ? 'Current student' : 'Alumni'}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {active.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3" aria-label="Active filters">
          <span className="text-sm font-semibold">Active filters:</span>
          {active.map((f) => (
            <button
              key={f.label}
              type="button"
              onClick={() => go(f.clear)}
              className="rounded-full bg-stone-100 px-3 py-1 text-sm hover:bg-stone-200"
              aria-label={`Remove filter ${f.label}`}
            >
              {f.label} <span aria-hidden="true">×</span>
            </button>
          ))}
          <button type="button" onClick={() => go({ q: '', skills: [], availability: [], status: [] })} className="text-sm font-semibold text-accent-dark underline">
            Clear all filters
          </button>
        </div>
      )}
      {pending && <p className="text-xs text-muted">Updating…</p>}
    </section>
  );
}
