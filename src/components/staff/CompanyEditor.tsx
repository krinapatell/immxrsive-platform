'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Field from '../Field';
import { btn, send } from './api';

export interface CompanyValues {
  name: string;
  website: string;
  description: string;
  sector: string;
  keywords: string;
  location: string;
}

type Key = keyof CompanyValues;
const LABELS: Record<Key, string> = {
  name: 'Company name',
  website: 'Website',
  description: 'Short description',
  sector: 'Sector',
  keywords: 'Keywords',
  location: 'Location',
};

interface ImportInfo {
  import_id: string;
  source_url: string;
  fetched_at: string;
  missing: string[];
}

interface Duplicate {
  id: string;
  name: string;
  domain: string;
  status: string;
}

/**
 * Add or edit a company. "Fill from website" only suggests values: empty
 * boxes are filled in, and anything you already typed is kept, with the
 * website's version shown next to it to use if you want (R4.08, R4.11).
 * Saving always keeps the company as a draft; publishing is a separate step (R4.09).
 */
export default function CompanyEditor({ companyId, initial, published = false }: { companyId?: string; initial: CompanyValues; published?: boolean }) {
  const router = useRouter();
  const [values, setValues] = useState<CompanyValues>(initial);
  const [url, setUrl] = useState(initial.website);
  const [importing, setImporting] = useState(false);
  const [importInfo, setImportInfo] = useState<ImportInfo | null>(null);
  const [importError, setImportError] = useState('');
  const [suggestions, setSuggestions] = useState<Partial<CompanyValues>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicates, setDuplicates] = useState<Duplicate[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const set = (k: Key) => (v: string) => setValues((cur) => ({ ...cur, [k]: v }));

  const runImport = async () => {
    setImporting(true);
    setImportError('');
    setMessage('');
    const r = await send('/api/staff/companies/import', 'POST', { url, company_id: companyId });
    setImporting(false);
    if (!r.ok) return setImportError(r.data.errors?.url ?? r.data.error ?? 'Import failed.');
    if (!r.data.ok) {
      setImportInfo(null);
      return setImportError(`${r.data.error} Nothing you typed has been changed.`);
    }
    const c = r.data.candidates as Record<Key | 'keywords', string | string[]>;
    const found: CompanyValues = {
      name: String(c.name ?? ''),
      website: String(c.website ?? ''),
      description: String(c.description ?? ''),
      sector: String(c.sector ?? ''),
      keywords: Array.isArray(c.keywords) ? c.keywords.join(', ') : '',
      location: String(c.location ?? ''),
    };
    const next = { ...values };
    const offer: Partial<CompanyValues> = {};
    (Object.keys(found) as Key[]).forEach((k) => {
      if (!found[k]) return;
      if (!values[k].trim()) next[k] = found[k];
      else if (values[k].trim() !== found[k]) offer[k] = found[k];
    });
    setValues(next);
    setSuggestions(offer);
    setDuplicates(r.data.duplicates ?? []);
    setImportInfo({ import_id: r.data.import_id, source_url: r.data.source_url, fetched_at: r.data.fetched_at, missing: r.data.missing ?? [] });
  };

  const save = async (confirmDuplicate = false) => {
    setSaving(true);
    setErrors({});
    setMessage('');
    const body = {
      ...values,
      keywords: values.keywords.split(',').map((k) => k.trim()).filter(Boolean),
      import_id: importInfo?.import_id,
      confirm_duplicate: confirmDuplicate,
    };
    const r = companyId ? await send(`/api/staff/companies/${companyId}`, 'PUT', body) : await send('/api/staff/companies', 'POST', body);
    setSaving(false);
    if (r.status === 409 && r.data.duplicates) {
      setDuplicates(r.data.duplicates);
      return setMessage('Another company already uses this website. Check below before saving.');
    }
    if (!r.ok) {
      setErrors(r.data.errors ?? {});
      return setMessage(r.data.error ?? 'Could not save.');
    }
    setDuplicates([]);
    if (!companyId) return router.push(`/staff/companies/${r.data.company.id}?saved=1`);
    setMessage(published ? 'Saved. The public partner page now shows these details.' : 'Saved as a draft. Visitors can’t see it until you publish it.');
    setImportInfo(null);
    setSuggestions({});
    router.refresh();
  };

  return (
    <div className="space-y-5">
      <section className="space-y-3 rounded-xl border border-line bg-accent-soft/40 p-4" aria-labelledby="import-h">
        <h2 id="import-h" className="font-bold">
          Fill in from the company&apos;s website (optional)
        </h2>
        <p className="text-sm text-muted">
          We read the page and suggest values. Nothing is published: you check everything and save a draft first. Text on the page
          is treated as plain information, never as instructions.
        </p>
        <div className="flex flex-wrap gap-2">
          <label htmlFor="import-url" className="sr-only">
            Company website address
          </label>
          <input
            id="import-url"
            type="url"
            inputMode="url"
            placeholder="https://company.example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-line px-3 py-2"
          />
          <button type="button" className={btn.primary} onClick={runImport} disabled={importing || !url.trim()}>
            {importing ? 'Reading website…' : 'Fill from website'}
          </button>
        </div>
        {importError && (
          <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm font-medium text-amber-900">
            {importError}
          </p>
        )}
        {importInfo && (
          <div role="status" className="rounded-lg bg-white p-3 text-sm">
            <p>
              Suggestions loaded from <span className="break-all font-semibold">{importInfo.source_url}</span>. Check them below, change
              anything that&apos;s wrong, then save.
            </p>
            {importInfo.missing.length > 0 && (
              <p className="mt-1 text-amber-900">Not found on the page: {importInfo.missing.join(', ')}. Please fill these in yourself.</p>
            )}
          </div>
        )}
      </section>

      {duplicates.length > 0 && (
        <section role="alert" className="space-y-2 rounded-xl border-2 border-amber-400 bg-amber-50 p-4">
          <h2 className="font-bold">This website is already linked to a company</h2>
          <ul className="space-y-1 text-sm">
            {duplicates.map((d) => (
              <li key={d.id}>
                <Link href={`/staff/companies/${d.id}`} className="font-semibold underline">
                  {d.name}
                </Link>{' '}
                ({d.domain}, {d.status === 'published' ? 'published' : 'draft'})
              </li>
            ))}
          </ul>
          <p className="text-sm">Use the existing company instead of making a second one. Companies are never merged just because their names look alike.</p>
          <button type="button" className={btn.secondary} onClick={() => save(true)} disabled={saving}>
            It&apos;s a different company, save anyway
          </button>
        </section>
      )}

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          save(false);
        }}
      >
        {(Object.keys(LABELS) as Key[]).map((k) => (
          <div key={k}>
            <Field
              id={`company-${k}`}
              label={LABELS[k]}
              value={values[k]}
              onChange={set(k)}
              error={errors[k]}
              required={k === 'name'}
              multiline={k === 'description'}
              hint={k === 'keywords' ? 'Separate with commas, e.g. simulation, XR, training' : k === 'website' ? 'The company’s own website' : undefined}
            />
            {suggestions[k] && (
              <p className="mt-1 flex flex-wrap items-center gap-2 rounded-lg bg-amber-50 p-2 text-sm">
                <span>
                  Website says: <span className="font-semibold">{suggestions[k]}</span>
                </span>
                <button
                  type="button"
                  className="rounded border border-line bg-white px-2 py-0.5 text-xs font-semibold"
                  onClick={() => {
                    set(k)(suggestions[k]!);
                    setSuggestions((s) => ({ ...s, [k]: undefined }));
                  }}
                >
                  Use this
                </button>
                <button type="button" className="text-xs underline" onClick={() => setSuggestions((s) => ({ ...s, [k]: undefined }))}>
                  Keep mine
                </button>
              </p>
            )}
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className={btn.primary} disabled={saving}>
            {saving ? 'Saving…' : companyId ? 'Save changes' : 'Save as draft'}
          </button>
          {message && (
            <span role="status" className="text-sm font-medium">
              {message}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
