'use client';

import { useState } from 'react';
import type { ResumeSuggestions } from '@/lib/resume/parse';

export interface Applied {
  headline: string | null;
  skills: string[];
  suggestedSkills: string[];
  education: string | null;
  experience: string[];
  linkedin: string | null;
  portfolio: string | null;
}

type Current = { headline: string; skills: string[]; education: string; experience: string[]; linkedin: string; portfolio: string };

type Item = { key: string; label: string; value: string; selected: boolean; replaces?: string; editable: boolean };

/**
 * Resume import with human review (R2.13 – R2.17).
 * Suggestions only change the form when the student ticks them and clicks
 * "Apply selected". Anything that would replace something the student already
 * wrote starts unticked and says what it would replace (no silent overwrite).
 */
export default function ResumeImport({ current, onApply }: { current: Current; onApply: (a: Applied) => void }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [items, setItems] = useState<Item[] | null>(null);
  const [otherSkills, setOtherSkills] = useState<string[]>([]);

  const upload = async (file: File) => {
    setError('');
    setMessage('');
    setItems(null);
    if (file.size > 4 * 1024 * 1024) {
      setError(`That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 4 MB — try exporting your resume again without images. Your profile hasn't changed.`);
      return;
    }
    if (file.type && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please choose a PDF file. Your profile hasn\'t changed.');
      return;
    }
    setBusy(true);
    try {
      const body = new FormData();
      body.append('resume', file);
      const res = await fetch('/api/me/resume', { method: 'POST', body });
      const data = await res.json().catch(() => ({ error: `The upload failed (error ${res.status}). Your profile hasn't changed — please try again.` }));
      if (!res.ok) {
        setError(data.error ?? 'Could not read that file.');
        return;
      }
      const s: ResumeSuggestions = data.suggestions;
      const list: Item[] = [];
      if (s.headline) {
        list.push({ key: 'headline', label: 'Headline', value: s.headline, selected: !current.headline, replaces: current.headline || undefined, editable: true });
      }
      for (const skill of s.skills) {
        if (!current.skills.includes(skill)) list.push({ key: `skill:${skill}`, label: 'Skill', value: skill, selected: true, editable: false });
      }
      if (s.education.length) {
        list.push({ key: 'education', label: 'Education', value: s.education.join('\n'), selected: !current.education, replaces: current.education || undefined, editable: true });
      }
      s.experience.forEach((e, i) => {
        if (!current.experience.includes(e)) list.push({ key: `exp:${i}`, label: 'Experience', value: e, selected: true, editable: true });
      });
      if (s.links.linkedin) {
        list.push({ key: 'linkedin', label: 'LinkedIn', value: s.links.linkedin, selected: !current.linkedin, replaces: current.linkedin || undefined, editable: true });
      }
      if (s.links.portfolio) {
        list.push({ key: 'portfolio', label: 'Portfolio', value: s.links.portfolio, selected: !current.portfolio, replaces: current.portfolio || undefined, editable: true });
      }
      setItems(list);
      setOtherSkills(s.otherSkills);
      setMessage(
        data.message ??
          (list.length || s.otherSkills.length
            ? 'Review the suggestions below. Nothing changes until you click “Apply selected”.'
            : 'Everything we found is already in your profile.'),
      );
    } catch {
      setError("We couldn't upload that file. Your profile hasn't changed.");
    } finally {
      setBusy(false);
    }
  };

  const [pickedOther, setPickedOther] = useState<string[]>([]);
  const update = (key: string, patch: Partial<Item>) => setItems((list) => list?.map((it) => (it.key === key ? { ...it, ...patch } : it)) ?? null);

  const apply = () => {
    if (!items) return;
    const chosen = items.filter((i) => i.selected && i.value.trim());
    const get = (key: string) => chosen.find((i) => i.key === key)?.value.trim() ?? null;
    onApply({
      headline: get('headline'),
      skills: chosen.filter((i) => i.key.startsWith('skill:')).map((i) => i.value),
      suggestedSkills: pickedOther,
      education: get('education'),
      experience: chosen.filter((i) => i.key.startsWith('exp:')).map((i) => i.value.trim()),
      linkedin: get('linkedin'),
      portfolio: get('portfolio'),
    });
    setItems(null);
    setOtherSkills([]);
    setPickedOther([]);
    setMessage('');
  };

  return (
    <section className="space-y-4 rounded-2xl border border-line bg-white p-5 sm:p-6" aria-labelledby="resume-h">
      <h2 id="resume-h" className="text-lg font-bold">
        Import from your resume (optional)
      </h2>
      <p className="text-sm text-muted">Upload a PDF and we&apos;ll suggest fields from it. You choose what to use. The file isn&apos;t stored.</p>
      <div>
        <label htmlFor="resume-file" className="block text-sm font-semibold">
          Choose your resume (PDF, up to 4 MB)
        </label>
        <input
          id="resume-file"
          type="file"
          accept="application/pdf,.pdf"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = '';
          }}
          className="mt-2 block w-full cursor-pointer text-sm text-muted file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-accent file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-accent-dark disabled:opacity-60"
        />
      </div>
      <div aria-live="polite">
        {busy && <p className="text-sm">Reading your resume…</p>}
        {error && (
          <p role="alert" className="text-sm font-semibold text-red-700">
            {error}
          </p>
        )}
        {message && <p className="text-sm">{message}</p>}
      </div>

      {items && (items.length > 0 || otherSkills.length > 0) && (
        <div className="space-y-3">
          <ul className="space-y-3">
            {items.map((it) => (
              <li key={it.key} className="rounded-lg border border-line p-3">
                <label className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" checked={it.selected} onChange={(e) => update(it.key, { selected: e.target.checked })} />
                  <span>
                    <span className="font-semibold">{it.label}</span>
                    {it.replaces && <span className="block text-xs text-accent-dark">Ticking this replaces your current value: “{it.replaces}”</span>}
                    {!it.editable && <span className="block">{it.value}</span>}
                  </span>
                </label>
                {it.editable && (
                  <div className="mt-2 pl-6">
                    <label htmlFor={`sug-${it.key}`} className="sr-only">
                      Edit suggested {it.label}
                    </label>
                    {it.key === 'education' ? (
                      <textarea id={`sug-${it.key}`} value={it.value} onChange={(e) => update(it.key, { value: e.target.value })} rows={2} className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
                    ) : (
                      <input id={`sug-${it.key}`} value={it.value} onChange={(e) => update(it.key, { value: e.target.value })} className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
          {otherSkills.length > 0 && (
            <fieldset className="rounded-lg border border-line p-3">
              <legend className="px-1 text-sm font-semibold">Skills not in the standard list</legend>
              <p className="text-xs text-muted">These can be saved as suggestions for staff. They won&apos;t become directory filters.</p>
              <div className="mt-2 flex flex-wrap gap-3">
                {otherSkills.map((s) => (
                  <label key={s} className="flex items-center gap-1.5 text-sm">
                    <input type="checkbox" checked={pickedOther.includes(s)} onChange={() => setPickedOther((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]))} />
                    Suggest “{s}”
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={apply} className="rounded-lg bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-dark">
              Apply selected
            </button>
            <button
              type="button"
              onClick={() => {
                setItems(null);
                setOtherSkills([]);
                setMessage('Suggestions discarded. Nothing was changed.');
              }}
              className="rounded-lg border border-line px-4 py-2 font-semibold"
            >
              Discard all
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
