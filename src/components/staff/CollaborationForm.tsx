'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import Field from '../Field';
import { btn, send } from './api';

export interface CollaborationValues {
  title: string;
  year_start: string;
  year_end: string;
  status: 'current' | 'past';
  visibility: 'public' | 'limited' | 'private';
  public_summary: string;
  description: string;
  outcome: string;
  project_ids: string[];
  student_ids: string[];
}

export interface PickerProject {
  id: string;
  title: string;
  students: { id: string; name: string }[];
}

export const EMPTY_COLLABORATION: CollaborationValues = {
  title: '',
  year_start: String(new Date().getFullYear()),
  year_end: '',
  status: 'current',
  visibility: 'public',
  public_summary: '',
  description: '',
  outcome: '',
  project_ids: [],
  student_ids: [],
};

const VIS_HELP = {
  public: 'Everyone sees the title, details, projects and students.',
  limited: 'Visitors only see the year and the short public description below. No title, details, projects or names.',
  private: 'Only staff can see it. It never appears on the public site.',
};

/** Add or edit one collaboration with a company (R4.15 - R4.18). */
export default function CollaborationForm({
  companyId,
  collaborationId,
  initial,
  projects,
}: {
  companyId: string;
  collaborationId?: string;
  initial: CollaborationValues;
  projects: PickerProject[];
}) {
  const router = useRouter();
  const [v, setV] = useState<CollaborationValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof CollaborationValues>(k: K) => (val: CollaborationValues[K]) => setV((cur) => ({ ...cur, [k]: val }));

  const studentChoices = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of projects) if (v.project_ids.includes(p.id)) for (const s of p.students) map.set(s.id, s.name);
    for (const id of v.student_ids) if (!map.has(id)) map.set(id, id);
    return [...map];
  }, [projects, v.project_ids, v.student_ids]);

  const toggle = (k: 'project_ids' | 'student_ids', id: string) =>
    setV((cur) => ({ ...cur, [k]: cur[k].includes(id) ? cur[k].filter((x) => x !== id) : [...cur[k], id] }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setMsg('');
    const r = collaborationId
      ? await send(`/api/staff/collaborations/${collaborationId}`, 'PUT', v)
      : await send(`/api/staff/companies/${companyId}`, 'POST', { action: 'add_collaboration', ...v });
    setBusy(false);
    if (!r.ok) {
      setErrors(r.data.errors ?? {});
      return setMsg(r.data.error ?? 'Could not save.');
    }
    if (collaborationId) {
      setMsg('Saved.');
      router.refresh();
    } else {
      setV(EMPTY_COLLABORATION);
      setMsg('Collaboration added.');
      router.refresh();
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field id="col-title" label="Title" value={v.title} onChange={set('title')} error={errors.title} required hint="e.g. Industrial Safety Training Prototype" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="col-start" label="Year it started" type="number" value={v.year_start} onChange={set('year_start')} error={errors.year_start} required />
        <Field id="col-end" label="Year it ended (optional)" type="number" value={v.year_end} onChange={set('year_end')} error={errors.year_end} hint="Leave empty if it's ongoing or a single year" />
      </div>

      <fieldset className="min-w-0">
        <legend className="text-sm font-semibold">Is it still going?</legend>
        <div className="mt-1 flex flex-wrap gap-4 text-sm">
          {(['current', 'past'] as const).map((s) => (
            <label key={s} className="flex items-center gap-2">
              <input type="radio" name="col-status" checked={v.status === s} onChange={() => set('status')(s)} />
              {s === 'current' ? 'Current – we are working with them now' : 'Past – it has finished'}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="min-w-0">
        <legend className="text-sm font-semibold">Who can see it?</legend>
        <div className="mt-1 space-y-2 text-sm">
          {(['public', 'limited', 'private'] as const).map((vis) => (
            <label key={vis} className="flex items-start gap-2">
              <input type="radio" name="col-vis" className="mt-1" checked={v.visibility === vis} onChange={() => set('visibility')(vis)} />
              <span>
                <span className="font-semibold">{vis === 'public' ? 'Public' : vis === 'limited' ? 'Limited (anonymized)' : 'Private (staff only)'}</span>
                <span className="block text-muted">{VIS_HELP[vis]}</span>
              </span>
            </label>
          ))}
        </div>
        {errors.visibility && <p className="text-sm font-semibold text-red-700">{errors.visibility}</p>}
      </fieldset>

      {v.visibility === 'limited' && (
        <Field
          id="col-summary"
          label="Short public description"
          value={v.public_summary}
          onChange={set('public_summary')}
          error={errors.public_summary}
          required
          hint="The only text visitors see, e.g. “A confidential prototype for remote training.”"
        />
      )}

      <Field id="col-desc" label="What the collaboration was about" multiline value={v.description} onChange={set('description')} error={errors.description} />
      <Field id="col-outcome" label="Outcome or highlight" value={v.outcome} onChange={set('outcome')} error={errors.outcome} hint="e.g. Prototype used in a pilot training session" />

      <fieldset className="min-w-0">
        <legend className="text-sm font-semibold">Related projects</legend>
        {projects.length === 0 ? (
          <p className="text-sm text-muted">No published projects yet.</p>
        ) : (
          <div className="mt-1 max-h-48 space-y-1 overflow-y-auto rounded-lg border border-line p-2 text-sm">
            {projects.map((p) => (
              <label key={p.id} className="flex items-center gap-2">
                <input type="checkbox" checked={v.project_ids.includes(p.id)} onChange={() => toggle('project_ids', p.id)} />
                <span className="break-words">
                  {p.title} <span className="text-muted">({p.id})</span>
                </span>
              </label>
            ))}
          </div>
        )}
        {errors.project_ids && <p className="text-sm font-semibold text-red-700">{errors.project_ids}</p>}
      </fieldset>

      <fieldset className="min-w-0">
        <legend className="text-sm font-semibold">Participating students</legend>
        <p className="text-xs text-muted">Choose projects first. Only students with a public profile are listed.</p>
        {studentChoices.length > 0 && (
          <div className="mt-1 space-y-1 rounded-lg border border-line p-2 text-sm">
            {studentChoices.map(([id, name]) => (
              <label key={id} className="flex items-center gap-2">
                <input type="checkbox" checked={v.student_ids.includes(id)} onChange={() => toggle('student_ids', id)} />
                {name}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className={btn.primary} disabled={busy}>
          {busy ? 'Saving…' : collaborationId ? 'Save collaboration' : 'Add collaboration'}
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
