'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { btn, send } from './api';

type Counts = { created: number; updated: number; skipped: number; conflict: number };
interface Report {
  format: string;
  dry_run: boolean;
  source_counts: Record<string, number>;
  counts: Record<string, Counts>;
  duplicate_student_candidates: { legacy_id: string; possible_duplicate_of: string; reason: string }[];
  duplicate_company_candidates: { legacy_id: string; possible_duplicate_of: string; reason: string }[];
  broken_references: Record<string, string>[];
  unclaimed_profiles: string[];
  conflicts: { record: string; problem: string }[];
  kept_site_changes?: string[];
  notes: string[];
}

const LABELS: Record<string, string> = {
  students: 'Student profiles',
  projects: 'Projects',
  contributors: 'Project contributors',
  companies: 'Companies',
  collaborations: 'Collaborations',
};

function describeRef(r: Record<string, string>) {
  if (r.student_legacy_id) return `Project ${r.project_legacy_id} lists student ${r.student_legacy_id}, who is not in the export. That contributor was skipped.`;
  if (r.company_legacy_id) return `Collaboration ${r.collaboration_legacy_id} belongs to company ${r.company_legacy_id}, which is not in the export. It was skipped.`;
  if (r.project_legacy_id) return `Collaboration ${r.collaboration_legacy_id} links project ${r.project_legacy_id}, which is not in the export. That link was skipped.`;
  return JSON.stringify(r);
}

export default function MigrationUploader() {
  const router = useRouter();
  const [file, setFile] = useState<{ name: string; data: unknown } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ run_id: string; report: Report } | null>(null);

  async function pick(f: File | undefined) {
    setError('');
    setResult(null);
    setFile(null);
    if (!f) return;
    if (f.size > 5_000_000) return setError('That file is larger than 5 MB. Export files are much smaller; check you picked the right one.');
    try {
      setFile({ name: f.name, data: JSON.parse(await f.text()) });
    } catch {
      setError('That file is not valid JSON. Upload the export file exactly as you downloaded it.');
    }
  }

  async function run(dryRun: boolean) {
    if (!file) return;
    setBusy(true);
    setError('');
    const res = await send('/api/staff/migrate', 'POST', { source: file.name, dry_run: dryRun, data: file.data });
    setBusy(false);
    if (!res.ok) return setError(res.data.error ?? 'The import did not finish. Nothing was changed.');
    setResult(res.data);
    router.refresh();
  }

  const r = result?.report;
  return (
    <section className="rounded-2xl border border-line bg-white p-5 sm:p-6" aria-labelledby="upload">
      <h2 id="upload" className="text-lg font-bold">
        1. Choose the export file
      </h2>
      <label htmlFor="export-file" className="mt-2 block text-sm font-semibold">
        Export file (.json)
      </label>
      <input
        id="export-file"
        type="file"
        accept="application/json,.json"
        onChange={(e) => pick(e.target.files?.[0])}
        aria-describedby={error ? 'migrate-error' : undefined}
        className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border file:border-line file:bg-white file:px-3 file:py-2 file:font-semibold"
      />
      <h2 className="mt-5 text-lg font-bold">2. Check it, then import</h2>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" className={btn.secondary} disabled={!file || busy} onClick={() => run(true)}>
          {busy ? 'Working…' : 'Check file (no changes)'}
        </button>
        <button type="button" className={btn.primary} disabled={!file || busy} onClick={() => run(false)}>
          {busy ? 'Working…' : 'Import'}
        </button>
      </div>
      {error && (
        <p id="migrate-error" role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-900">
          {error}
        </p>
      )}
      {r && (
        <div className="mt-5 space-y-4" role="status">
          <p className="rounded-lg bg-emerald-50 p-3 text-sm font-medium">
            {r.dry_run ? 'Check finished. Nothing was saved. If this looks right, choose Import.' : 'Import finished. The report below was saved.'}{' '}
            <a className="underline" href={`/api/staff/migrate/${result!.run_id}`}>
              Download this report
            </a>
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <caption className="sr-only">What {r.dry_run ? 'would happen' : 'happened'} to each kind of record</caption>
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className="py-2">Records</th>
                  <th scope="col">New</th>
                  <th scope="col">Updated</th>
                  <th scope="col">Unchanged</th>
                  <th scope="col">Problems</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(r.counts).map(([k, c]) => (
                  <tr key={k} className="border-b border-line">
                    <th scope="row" className="py-2 font-semibold">{LABELS[k] ?? k}</th>
                    <td>{c.created}</td>
                    <td>{c.updated}</td>
                    <td>{c.skipped}</td>
                    <td>{c.conflict}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted">
            In the file: {Object.entries(r.source_counts).map(([k, n]) => `${n} ${k}`).join(', ')}.
          </p>
          <ReportList title="Possible duplicate students" items={r.duplicate_student_candidates.map((d) => `${d.legacy_id} may be the same person as ${d.possible_duplicate_of} (${d.reason}). Both were kept; merge them in Staff › Students if they are.`)} />
          <ReportList title="Possible duplicate companies" items={r.duplicate_company_candidates.map((d) => `${d.legacy_id} may be the same company as ${d.possible_duplicate_of} (${d.reason}). Both were kept; merge them from the company page if they are.`)} />
          <ReportList title="Missing references" items={r.broken_references.map(describeRef)} />
          <ReportList title="Unclaimed profiles" items={r.unclaimed_profiles.length ? [`${r.unclaimed_profiles.join(', ')}: imported without an owner. Their owners can claim them from the profile page.`] : []} />
          <ReportList
            title="Kept as changed on the new site"
            items={r.kept_site_changes?.length ? [`${r.kept_site_changes.join(', ')}: claimed, merged or edited since they were imported, so the old export did not overwrite them.`] : []}
          />
          <ReportList title="Records that could not be read" items={r.conflicts.map((c) => `${c.record}: ${c.problem}`)} />
          {r.notes.length > 0 && (
            <ul className="list-disc pl-5 text-sm text-muted">
              {r.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

function ReportList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="font-bold">
        {title} <span className="text-muted">({items.length})</span>
      </h3>
      {items.length === 0 ? (
        <p className="text-sm">None.</p>
      ) : (
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
          {items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
