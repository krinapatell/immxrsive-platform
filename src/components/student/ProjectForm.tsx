'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Field from '../Field';

export interface ProjectFormValues {
  title: string;
  description: string;
  domain: string;
  technologies: string[];
  project_status: 'in-progress' | 'completed';
  project_date: string;
  repositories: string[];
  demo_url: string;
  video_url: string;
  fallback_image_url: string;
  fallback_text: string;
}

export const EMPTY_PROJECT: ProjectFormValues = {
  title: '',
  description: '',
  domain: '',
  technologies: [],
  project_status: 'completed',
  project_date: '',
  repositories: [''],
  demo_url: '',
  video_url: '',
  fallback_image_url: '',
  fallback_text: '',
};

type Dup = { sameRepository: { id: string; title: string; published: boolean }[]; similarTitle: { id: string; title: string; domain: string }[] };

/**
 * One form for "Add project" and "Edit project".
 * - GitHub import fills the form with suggestions the student can change (R3.03).
 * - Saving with a repository another project already uses shows a warning with
 *   "View" and "Ask to join" instead of quietly creating a duplicate (R3.16).
 * - When editing, the form sends the version it loaded. If someone saved in the
 *   meantime the server refuses, and the form shows both versions (R3.17).
 */
export default function ProjectForm({
  mode,
  projectId,
  initial,
  initialVersion,
  roles,
}: {
  mode: 'create' | 'edit';
  projectId?: string;
  initial: ProjectFormValues;
  initialVersion?: number;
  roles: string[];
}) {
  const router = useRouter();
  const [v, setV] = useState<ProjectFormValues>({ ...initial, repositories: initial.repositories.length ? initial.repositories : [''] });
  const [version, setVersion] = useState(initialVersion ?? 1);
  const [techInput, setTechInput] = useState('');
  const [myRole, setMyRole] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [dup, setDup] = useState<Dup | null>(null);
  const [conflict, setConflict] = useState<(ProjectFormValues & { version: number }) | null>(null);
  const [importRepo, setImportRepo] = useState('');
  const [importMsg, setImportMsg] = useState('');
  const [joinRole, setJoinRole] = useState('');

  const set = <K extends keyof ProjectFormValues>(k: K, value: ProjectFormValues[K]) => setV((x) => ({ ...x, [k]: value }));

  const addTech = () => {
    const t = techInput.trim();
    if (t && !v.technologies.some((x) => x.toLowerCase() === t.toLowerCase())) set('technologies', [...v.technologies, t]);
    setTechInput('');
  };

  const doImport = async () => {
    setImportMsg('Reading repository…');
    try {
      const res = await fetch('/api/me/projects/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ repository: importRepo }) });
      const data = await res.json();
      if (!res.ok) {
        setImportMsg(data.error ?? 'Import failed.');
        return;
      }
      const s = data.suggestions;
      setV((x) => ({
        ...x,
        title: x.title || s.title,
        description: x.description || s.description,
        technologies: [...x.technologies, ...s.technologies.filter((t: string) => !x.technologies.some((y) => y.toLowerCase() === t.toLowerCase()))],
        repositories: x.repositories.some((r) => r.trim().toLowerCase() === s.repository.toLowerCase())
          ? x.repositories
          : [...x.repositories.filter((r) => r.trim()), s.repository],
        demo_url: x.demo_url || s.demo_url,
      }));
      setImportMsg('Imported. These are suggestions: check and change anything below before saving. Fields you had already filled were kept.');
    } catch {
      setImportMsg("Couldn't reach the server. Try again, or fill the form by hand.");
    }
  };

  const save = async (confirmDuplicate = false) => {
    setBusy(true);
    setErrors({});
    setNotice('');
    const body = { ...v, repositories: v.repositories.filter((r) => r.trim()), confirm_duplicate: confirmDuplicate };
    try {
      const res =
        mode === 'create'
          ? await fetch('/api/me/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, my_role: myRole }) })
          : await fetch(`/api/me/projects/${projectId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, version }) });
      const data = await res.json();
      if (res.status === 409 && data.duplicates) {
        setDup(data.duplicates);
        return;
      }
      if (res.status === 409 && data.latest) {
        setConflict({ ...data.latest, repositories: data.latest.repositories ?? [] });
        setNotice(data.error);
        return;
      }
      if (!res.ok) {
        setErrors(data.errors ?? {});
        setNotice(data.error ?? 'Could not save.');
        return;
      }
      setDup(null);
      if (mode === 'create') {
        router.push(`/student/projects/${data.project.id}?created=1`);
      } else {
        setVersion(data.project.version);
        setNotice('Saved.');
        router.refresh();
      }
    } catch {
      setNotice('Could not reach the server. Your changes are still here; try again.');
    } finally {
      setBusy(false);
    }
  };

  const askToJoin = async (id: string) => {
    if (!joinRole) {
      setNotice('Choose your role first.');
      return;
    }
    const res = await fetch(`/api/me/projects/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'join', role: joinRole }) });
    const data = await res.json();
    setNotice(res.ok ? 'Request sent. The maintainer will see it on their project page.' : data.error);
  };

  const useLatest = () => {
    if (!conflict) return;
    const pick = Object.fromEntries(Object.keys(EMPTY_PROJECT).map((k) => [k, (conflict as unknown as Record<string, unknown>)[k] ?? EMPTY_PROJECT[k as keyof ProjectFormValues]])) as unknown as ProjectFormValues;
    setV({ ...pick, repositories: pick.repositories.length ? pick.repositories : [''] });
    setVersion(conflict.version);
    setConflict(null);
    setNotice('Loaded the latest version. Re-apply your change and save again.');
  };

  const card = 'space-y-4 rounded-2xl border border-line bg-white p-5 sm:p-6';
  return (
    <div className="space-y-5">
      <div aria-live="polite" role="status">
        {notice && <p className={`rounded-lg p-3 text-sm font-medium ${notice === 'Saved.' ? 'bg-emerald-50' : 'bg-accent-soft'}`}>{notice}</p>}
      </div>

      {conflict && (
        <section role="alert" className="space-y-3 rounded-2xl border-2 border-amber-500 bg-amber-50 p-5">
          <h2 className="font-bold">Someone else saved this project after you opened it</h2>
          <p className="text-sm">Your changes were not saved, so nothing they wrote was lost. Their newer version:</p>
          <dl className="grid gap-1 text-sm sm:grid-cols-[10rem_1fr]">
            <dt className="font-semibold">Title</dt>
            <dd className="break-words">{conflict.title}</dd>
            <dt className="font-semibold">Description</dt>
            <dd className="whitespace-pre-line break-words">{conflict.description || '—'}</dd>
          </dl>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={useLatest} className="rounded-lg bg-ink px-4 py-2 font-semibold text-white">
              Load their version, then re-apply my change
            </button>
          </div>
        </section>
      )}

      {dup && dup.sameRepository.length > 0 && (
        <section role="alert" className="space-y-3 rounded-2xl border-2 border-amber-500 bg-amber-50 p-5">
          <h2 className="font-bold">This repository is already connected to a project</h2>
          <p className="text-sm">To avoid two copies of the same project, view the existing one or ask its maintainer to add you.</p>
          <div>
            <label htmlFor="join-role" className="block text-sm font-semibold">
              Your role (for joining)
            </label>
            <select id="join-role" value={joinRole} onChange={(e) => setJoinRole(e.target.value)} className="mt-1 rounded-lg border border-line bg-white px-3 py-2">
              <option value="">Choose a role…</option>
              {roles.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
          <ul className="space-y-2">
            {dup.sameRepository.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{p.title}</span>
                {p.published && (
                  <Link href={`/projects/${p.id}`} className="rounded-lg border border-line bg-white px-3 py-1 text-sm font-semibold" target="_blank">
                    View project
                  </Link>
                )}
                <button type="button" onClick={() => askToJoin(p.id)} className="rounded-lg bg-accent px-3 py-1 text-sm font-semibold text-white">
                  Ask to join
                </button>
              </li>
            ))}
          </ul>
          <p className="text-sm">
            Sure it&apos;s a different project?{' '}
            <button type="button" onClick={() => save(true)} className="font-semibold underline">
              Save anyway
            </button>
          </p>
        </section>
      )}

      {mode === 'create' && (
        <section className={card} aria-labelledby="import-h">
          <h2 id="import-h" className="text-lg font-bold">
            Start from a GitHub repository (optional)
          </h2>
          <p className="text-sm text-muted">We read the public repository&apos;s name, description and languages and fill the form. You can change everything.</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="import-repo" className="block text-sm font-semibold">
                Public repository
              </label>
              <input id="import-repo" value={importRepo} onChange={(e) => setImportRepo(e.target.value)} placeholder="owner/repo or https://github.com/owner/repo" className="mt-1 w-full rounded-lg border border-line px-3 py-2" />
            </div>
            <button type="button" onClick={doImport} className="rounded-lg bg-ink px-4 py-2 font-semibold text-white">
              Import
            </button>
          </div>
          <p className="text-sm" aria-live="polite">
            {importMsg}
          </p>
        </section>
      )}

      <section className={card} aria-labelledby="details-h">
        <h2 id="details-h" className="text-lg font-bold">
          Project details
        </h2>
        <Field id="title" label="Title" value={v.title} onChange={(x) => set('title', x)} error={errors.title} required maxLength={120} />
        <Field id="description" label="Short description" multiline value={v.description} onChange={(x) => set('description', x)} maxLength={1000} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="domain" label="Domain / type" value={v.domain} onChange={(x) => set('domain', x)} hint="e.g. Healthcare, Game" maxLength={80} />
          <div>
            <label htmlFor="project_status" className="block text-sm font-semibold">
              Status
            </label>
            <select id="project_status" value={v.project_status} onChange={(e) => set('project_status', e.target.value as ProjectFormValues['project_status'])} className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2">
              <option value="completed">Completed</option>
              <option value="in-progress">In progress</option>
            </select>
          </div>
          <Field id="project_date" label="Date" value={v.project_date} onChange={(x) => set('project_date', x)} hint="e.g. Fall 2026" maxLength={40} />
        </div>
        {mode === 'create' && (
          <div>
            <label htmlFor="my-role" className="block text-sm font-semibold">
              Your role on this project <span className="text-red-700">*</span>
            </label>
            <select id="my-role" value={myRole} onChange={(e) => setMyRole(e.target.value)} aria-invalid={errors.role ? true : undefined} aria-describedby={errors.role ? 'my-role-error' : undefined} className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 sm:w-auto">
              <option value="">Choose a role…</option>
              {roles.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            {errors.role && (
              <p id="my-role-error" className="mt-1 text-sm font-semibold text-red-700">
                {errors.role}
              </p>
            )}
          </div>
        )}
      </section>

      <section className={card} aria-labelledby="tech-h">
        <h2 id="tech-h" className="text-lg font-bold">
          Technologies used in the project
        </h2>
        <p className="text-sm text-muted">These describe the project. They are not added to anyone&apos;s personal skills.</p>
        <ul className="flex flex-wrap gap-2">
          {v.technologies.map((t) => (
            <li key={t} className="flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1 text-sm">
              {t}
              <button type="button" aria-label={`Remove ${t}`} onClick={() => set('technologies', v.technologies.filter((x) => x !== t))}>
                ×
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <label htmlFor="tech-input" className="sr-only">
            Add a technology
          </label>
          <input
            id="tech-input"
            value={techInput}
            maxLength={40}
            placeholder="e.g. Unity"
            onChange={(e) => setTechInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTech();
              }
            }}
            className="min-w-0 flex-1 rounded-lg border border-line px-3 py-2"
          />
          <button type="button" onClick={addTech} className="rounded-lg border border-line px-3 py-2 font-semibold">
            Add
          </button>
        </div>
        {errors.technologies && <p className="text-sm font-semibold text-red-700">{errors.technologies}</p>}
      </section>

      <section className={card} aria-labelledby="links-h">
        <h2 id="links-h" className="text-lg font-bold">
          Source code, demo and preview
        </h2>
        <fieldset className="min-w-0">
          <legend className="text-sm font-semibold">Repository links (zero, one or more)</legend>
          <ul className="mt-2 space-y-2">
            {v.repositories.map((r, i) => (
              <li key={i} className="flex gap-2">
                <label htmlFor={`repo-${i}`} className="sr-only">
                  Repository link {i + 1}
                </label>
                <input
                  id={`repo-${i}`}
                  value={r}
                  placeholder="https://github.com/owner/repo"
                  onChange={(e) => set('repositories', v.repositories.map((x, j) => (j === i ? e.target.value : x)))}
                  aria-invalid={errors[`repositories.${i}`] ? true : undefined}
                  className={`min-w-0 flex-1 rounded-lg border px-3 py-2 ${errors[`repositories.${i}`] ? 'border-red-600' : 'border-line'}`}
                />
                <button type="button" onClick={() => set('repositories', v.repositories.filter((_, j) => j !== i))} className="rounded-lg border border-line px-3" aria-label={`Remove repository link ${i + 1}`}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
          {Object.entries(errors)
            .filter(([k]) => k.startsWith('repositories'))
            .map(([k, m]) => (
              <p key={k} className="mt-1 text-sm font-semibold text-red-700">
                {m}
              </p>
            ))}
          <button type="button" onClick={() => set('repositories', [...v.repositories, ''])} className="mt-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold">
            Add repository link
          </button>
        </fieldset>
        <Field id="demo_url" label="Playable demo link" value={v.demo_url} onChange={(x) => set('demo_url', x)} error={errors.demo_url} hint="A web page people can open and use. Links only, no embed code." />
        <Field id="video_url" label="Video link" value={v.video_url} onChange={(x) => set('video_url', x)} error={errors.video_url} />
        <Field id="fallback_image_url" label="Preview image link" value={v.fallback_image_url} onChange={(x) => set('fallback_image_url', x)} error={errors.fallback_image_url} hint="Shown so the project still makes sense if the demo doesn't load." />
        <Field id="fallback_text" label="Preview description" multiline value={v.fallback_text} onChange={(x) => set('fallback_text', x)} maxLength={300} hint="What the demo shows, in a sentence or two." />
      </section>

      <div className="flex flex-wrap gap-2 pb-8">
        <button type="button" onClick={() => save(false)} disabled={busy} className="rounded-lg bg-accent px-5 py-3 font-semibold text-white hover:bg-accent-dark disabled:opacity-60">
          {busy ? 'Saving…' : mode === 'create' ? 'Create project' : 'Save project'}
        </button>
        <Link href="/student/projects" className="rounded-lg border border-line bg-white px-5 py-3 font-semibold">
          Back to my projects
        </Link>
      </div>
    </div>
  );
}
