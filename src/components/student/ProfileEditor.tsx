'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { StudentRow } from '@/lib/students';
import Field from '../Field';
import ResumeImport, { type Applied } from './ResumeImport';

const AVAILABILITY = ['internship', 'full-time', 'contract'];
const THEMES = [
  { id: 'classic', label: 'Classic (light, warm accent)' },
  { id: 'midnight', label: 'Midnight (dark)' },
  { id: 'minimal', label: 'Minimal (black and white)' },
];
const SECTION_LABELS: Record<string, string> = { projects: 'Projects', experience: 'Experience', education: 'Education' };
const PRIVACY_FIELDS = [
  { id: 'availability', label: 'Availability' },
  { id: 'links', label: 'LinkedIn and portfolio links' },
  { id: 'location', label: 'Location' },
  { id: 'education', label: 'Education' },
  { id: 'experience', label: 'Experience' },
] as const;

type Draft = {
  name: string;
  headline: string;
  bio: string;
  program: string;
  status: string;
  availability: string[];
  skills: string[];
  suggested_skills: string[];
  linkedin: string;
  portfolio: string;
  location: string;
  education: string;
  experience: string[];
  visibility: Record<string, string>;
  theme: string;
  section_order: string[];
  avatar: string;
};

function fromRow(p: StudentRow): Draft {
  return {
    name: p.name ?? '',
    headline: p.headline ?? '',
    bio: p.bio ?? '',
    program: p.program ?? '',
    status: p.status ?? 'current',
    availability: p.availability ?? [],
    skills: p.skills ?? [],
    suggested_skills: p.suggested_skills ?? [],
    linkedin: p.links?.linkedin ?? '',
    portfolio: p.links?.portfolio ?? '',
    location: p.location ?? '',
    education: p.education ?? '',
    experience: p.experience ?? [],
    visibility: { ...(p.visibility ?? {}) },
    theme: p.theme ?? 'classic',
    section_order: p.section_order?.length ? p.section_order : ['projects', 'experience', 'education'],
    avatar: p.avatar ?? 'initials',
  };
}

const STATUS_TEXT: Record<string, string> = {
  draft: 'Draft — private, not in the directory',
  published: 'Published — visible in the public directory',
  unpublished: 'Unpublished — hidden from the directory (your profile is kept)',
};

export default function ProfileEditor({ initial, standardSkills, githubLogin }: { initial: StudentRow; standardSkills: string[]; githubLogin: string }) {
  const router = useRouter();
  const [saved, setSaved] = useState<StudentRow>(initial);
  const [draft, setDraft] = useState<Draft>(fromRow(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [skillMsg, setSkillMsg] = useState('');

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(fromRow(saved)), [draft, saved]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const put = async (body: object): Promise<boolean> => {
    setBusy(true);
    setNotice('');
    try {
      const res = await fetch('/api/me/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.errors ?? { form: data.error ?? 'Could not save.' });
        setNotice('Please fix the highlighted fields.');
        return false;
      }
      setErrors({});
      setSaved(data.profile);
      setDraft(fromRow(data.profile));
      return true;
    } catch {
      setErrors({ form: 'Could not reach the server. Your changes are still here — try again.' });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const save = () =>
    put({
      ...draft,
      links: { linkedin: draft.linkedin, portfolio: draft.portfolio },
    });

  const onSave = async () => {
    if (await save()) setNotice('Saved.');
  };
  const onPreview = async () => {
    if (!dirty || (await save())) router.push('/student/preview');
  };
  const onPublish = async (publish: boolean) => {
    if (dirty && !(await save())) return;
    if (await put({ action: publish ? 'publish' : 'unpublish' })) {
      setNotice(publish ? 'Your profile is now public in the directory.' : 'Your profile is hidden from the directory. Nothing was deleted.');
    }
  };

  const addSkill = () => {
    const value = newSkill.trim();
    if (!value) return;
    const match = standardSkills.find((s) => s.toLowerCase() === value.toLowerCase());
    if (match) {
      if (!draft.skills.includes(match)) set('skills', [...draft.skills, match]);
      setSkillMsg(`Added ${match}.`);
    } else if (!draft.suggested_skills.some((s) => s.toLowerCase() === value.toLowerCase())) {
      set('suggested_skills', [...draft.suggested_skills, value]);
      setSkillMsg(`"${value}" isn't in the standard list, so it was saved as a suggestion for staff. It won't appear as a directory filter.`);
    }
    setNewSkill('');
  };

  const apply = (a: Applied) => {
    setDraft((d) => ({
      ...d,
      headline: a.headline ?? d.headline,
      skills: [...new Set([...d.skills, ...a.skills])],
      suggested_skills: [...new Set([...d.suggested_skills, ...a.suggestedSkills])],
      education: a.education ?? d.education,
      experience: [...d.experience, ...a.experience.filter((e) => !d.experience.includes(e))],
      linkedin: a.linkedin ?? d.linkedin,
      portfolio: a.portfolio ?? d.portfolio,
    }));
    setNotice('Suggestions applied to the form below. Review them, then Save.');
  };

  const move = (i: number, dir: -1 | 1) => {
    const order = [...draft.section_order];
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    set('section_order', order);
  };

  const card = 'rounded-2xl border border-line bg-white p-5 sm:p-6 space-y-4';
  return (
    <div className="space-y-5">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white/95 p-4 backdrop-blur">
        <p className="text-sm">
          <span className="font-semibold">Status:</span> {STATUS_TEXT[saved.profile_status]}
          {dirty && <span className="ml-2 font-semibold text-accent-dark">· Unsaved changes</span>}
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onSave} disabled={busy} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold disabled:opacity-60">
            Save draft
          </button>
          <button type="button" onClick={onPreview} disabled={busy} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold disabled:opacity-60">
            Preview
          </button>
          {saved.profile_status === 'published' ? (
            <button type="button" onClick={() => onPublish(false)} disabled={busy} className="rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
              Unpublish
            </button>
          ) : (
            <button type="button" onClick={() => onPublish(true)} disabled={busy} className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60">
              Publish
            </button>
          )}
        </div>
      </div>

      <div aria-live="polite" role="status">
        {notice && <p className="rounded-lg bg-accent-soft p-3 text-sm font-medium">{notice}</p>}
      </div>
      {(errors.form || errors.publish) && (
        <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm font-semibold text-red-800">
          {errors.form || errors.publish}
        </p>
      )}

      <ResumeImport current={draft} onApply={apply} />

      <section className={card} aria-labelledby="basics-h">
        <h2 id="basics-h" className="text-lg font-bold">
          Basics
        </h2>
        <Field id="name" label="Name" value={draft.name} onChange={(v) => set('name', v)} error={errors.name} required maxLength={80} />
        <Field id="headline" label="Professional headline" value={draft.headline} onChange={(v) => set('headline', v)} error={errors.headline} hint="e.g. XR developer focused on training simulations" required maxLength={120} />
        <Field id="bio" label="About you" multiline value={draft.bio} onChange={(v) => set('bio', v)} hint="Plain text, up to 2000 characters." maxLength={2000} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="program" label="Program" value={draft.program} onChange={(v) => set('program', v)} maxLength={80} />
          <div>
            <label htmlFor="status" className="block text-sm font-semibold">
              Status
            </label>
            <select id="status" value={draft.status} onChange={(e) => set('status', e.target.value)} className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2">
              <option value="current">Current student</option>
              <option value="alumni">Alumni</option>
            </select>
          </div>
        </div>
        <Field id="location" label="Location (optional)" value={draft.location} onChange={(v) => set('location', v)} hint="e.g. Sault Ste. Marie, ON" maxLength={80} />
        <fieldset>
          <legend className="text-sm font-semibold">Availability</legend>
          <div className="mt-2 flex flex-wrap gap-4">
            {AVAILABILITY.map((a) => (
              <label key={a} className="flex items-center gap-2 capitalize">
                <input type="checkbox" checked={draft.availability.includes(a)} onChange={() => set('availability', toggle(draft.availability, a))} />
                {a}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className={card} aria-labelledby="skills-h">
        <h2 id="skills-h" className="text-lg font-bold">
          Skills
        </h2>
        <p className="text-sm text-muted">Employers filter by these. Choose from the standard list.</p>
        <fieldset>
          <legend className="sr-only">Standard skills</legend>
          <div className="flex flex-wrap gap-2">
            {standardSkills.map((s) => {
              const id = `my-skill-${s.replace(/[^a-z0-9]/gi, '-')}`;
              const on = draft.skills.includes(s);
              return (
                <label key={s} htmlFor={id} className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${on ? 'border-accent bg-accent-soft font-semibold' : 'border-line'}`}>
                  <input id={id} type="checkbox" checked={on} onChange={() => set('skills', toggle(draft.skills, s))} />
                  {s}
                </label>
              );
            })}
          </div>
        </fieldset>
        {errors.skills && <p className="text-sm font-semibold text-red-700">{errors.skills}</p>}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="new-skill" className="block text-sm font-semibold">
              Suggest a missing skill
            </label>
            <input
              id="new-skill"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSkill();
                }
              }}
              className="mt-1 w-full rounded-lg border border-line px-3 py-2"
              maxLength={40}
            />
          </div>
          <button type="button" onClick={addSkill} className="rounded-lg border border-line px-3 py-2 font-semibold">
            Add
          </button>
        </div>
        <p className="text-sm text-muted" aria-live="polite">
          {skillMsg}
        </p>
        {draft.suggested_skills.length > 0 && (
          <div>
            <p className="text-sm font-semibold">Your suggestions (not used as filters):</p>
            <ul className="mt-1 flex flex-wrap gap-2">
              {draft.suggested_skills.map((s) => (
                <li key={s} className="flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1 text-sm">
                  {s}
                  <button type="button" aria-label={`Remove suggestion ${s}`} onClick={() => set('suggested_skills', draft.suggested_skills.filter((x) => x !== s))}>
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className={card} aria-labelledby="links-h">
        <h2 id="links-h" className="text-lg font-bold">
          Links
        </h2>
        <p className="text-sm">
          GitHub: <a className="underline" href={`https://github.com/${githubLogin}`} target="_blank" rel="noopener noreferrer">github.com/{githubLogin}</a>{' '}
          <span className="text-muted">(from your sign-in)</span>
        </p>
        <Field id="linkedin" label="LinkedIn" value={draft.linkedin} onChange={(v) => set('linkedin', v)} error={errors.linkedin} hint="https://www.linkedin.com/in/your-name" />
        <Field id="portfolio" label="Portfolio or website" value={draft.portfolio} onChange={(v) => set('portfolio', v)} error={errors.portfolio} />
      </section>

      <section className={card} aria-labelledby="exp-h">
        <h2 id="exp-h" className="text-lg font-bold">
          Education and experience
        </h2>
        <Field id="education" label="Education" multiline value={draft.education} onChange={(v) => set('education', v)} maxLength={300} />
        <fieldset>
          <legend className="text-sm font-semibold">Experience</legend>
          <ul className="mt-2 space-y-2">
            {draft.experience.map((e, i) => (
              <li key={i} className="flex gap-2">
                <label htmlFor={`exp-${i}`} className="sr-only">
                  Experience entry {i + 1}
                </label>
                <input
                  id={`exp-${i}`}
                  value={e}
                  maxLength={300}
                  onChange={(ev) => set('experience', draft.experience.map((x, j) => (j === i ? ev.target.value : x)))}
                  className="flex-1 rounded-lg border border-line px-3 py-2"
                />
                <button type="button" onClick={() => set('experience', draft.experience.filter((_, j) => j !== i))} className="rounded-lg border border-line px-3" aria-label={`Remove experience entry ${i + 1}`}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => set('experience', [...draft.experience, ''])} className="mt-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold">
            Add experience entry
          </button>
        </fieldset>
      </section>

      <section className={card} aria-labelledby="privacy-h">
        <h2 id="privacy-h" className="text-lg font-bold">
          Privacy
        </h2>
        <p className="text-sm text-muted">
          Private fields are never sent to visitors — not on the page and not in the public data. Your name, headline, skills and GitHub link are always public when published.
        </p>
        <ul className="space-y-2">
          {PRIVACY_FIELDS.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor={`vis-${f.id}`} className="font-medium">
                {f.label}
              </label>
              <select
                id={`vis-${f.id}`}
                value={draft.visibility[f.id] ?? 'public'}
                onChange={(e) => set('visibility', { ...draft.visibility, [f.id]: e.target.value })}
                className="rounded-lg border border-line bg-white px-3 py-2"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted">Resume files: your uploaded PDF is read once to make suggestions and is never stored, so it can&apos;t be downloaded by anyone.</p>
      </section>

      <section className={card} aria-labelledby="look-h">
        <h2 id="look-h" className="text-lg font-bold">
          Look and layout
        </h2>
        <p className="text-sm text-muted">This only changes how your page looks. Your skills, availability and directory results stay the same.</p>
        <fieldset>
          <legend className="text-sm font-semibold">Theme</legend>
          <div className="mt-2 space-y-1">
            {THEMES.map((t) => (
              <label key={t.id} className="flex items-center gap-2">
                <input type="radio" name="theme" value={t.id} checked={draft.theme === t.id} onChange={() => set('theme', t.id)} />
                {t.label}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm font-semibold">Profile picture</legend>
          <div className="mt-2 space-y-1">
            <label className="flex items-center gap-2">
              <input type="radio" name="avatar" checked={draft.avatar === 'initials'} onChange={() => set('avatar', 'initials')} />
              Initials (default)
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="avatar" checked={draft.avatar === 'github'} onChange={() => set('avatar', 'github')} />
              My GitHub picture
            </label>
          </div>
        </fieldset>
        <div>
          <p className="text-sm font-semibold" id="order-label">
            Section order
          </p>
          <ol className="mt-2 space-y-2" aria-labelledby="order-label">
            {draft.section_order.map((s, i) => (
              <li key={s} className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2">
                <span>
                  {i + 1}. {SECTION_LABELS[s] ?? s}
                </span>
                <span className="flex gap-1">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded border border-line px-2 disabled:opacity-40" aria-label={`Move ${SECTION_LABELS[s]} up`}>
                    ↑
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === draft.section_order.length - 1} className="rounded border border-line px-2 disabled:opacity-40" aria-label={`Move ${SECTION_LABELS[s]} down`}>
                    ↓
                  </button>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="flex flex-wrap gap-2 pb-8">
        <button type="button" onClick={onSave} disabled={busy} className="rounded-lg bg-accent px-4 py-3 font-semibold text-white hover:bg-accent-dark disabled:opacity-60">
          Save draft
        </button>
        <button type="button" onClick={onPreview} disabled={busy} className="rounded-lg border border-line bg-white px-4 py-3 font-semibold disabled:opacity-60">
          Save and preview
        </button>
      </div>
    </div>
  );
}
