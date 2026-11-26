/**
 * Reading a legacy export (F.01 - F.06). No server imports, so it can be
 * unit-tested directly. Both the course's legacy_export.json shape (legacy_id,
 * publication, student_legacy_id...) and the scale_fixture.json shape
 * (id, student_id...) are read into one normal form.
 */
export type Counts = { created: number; updated: number; skipped: number; conflict: number };
export const zero = (): Counts => ({ created: 0, updated: 0, skipped: 0, conflict: 0 });

export interface MigrationReport {
  source: string;
  format: 'legacy_export' | 'scale_fixture';
  dry_run: boolean;
  source_counts: Record<string, number>;
  counts: Record<'students' | 'projects' | 'contributors' | 'companies' | 'collaborations', Counts>;
  duplicate_student_candidates: { legacy_id: string; possible_duplicate_of: string; reason: string }[];
  duplicate_company_candidates: { legacy_id: string; possible_duplicate_of: string; reason: string }[];
  broken_references: Record<string, string>[];
  unclaimed_profiles: string[];
  conflicts: { record: string; problem: string }[];
  /** Records changed on the new site since they were imported: a re-run leaves them alone. */
  kept_site_changes: string[];
  notes: string[];
}

interface InStudent {
  legacy_id: string;
  name: string;
  email: string | null;
  status: 'current' | 'alumni';
  profile_status: 'published' | 'unpublished' | 'retired';
  availability: string[];
  availability_confirmed_at: string | null;
  claimed: boolean | null;
  skills: string[];
  possible_duplicate_of?: string;
}
interface InProject {
  legacy_id: string;
  title: string;
  contributors: { student: string; role: string }[];
  repositories: string[];
  technologies: string[];
  demo_url: string;
}
interface InCompany {
  legacy_id: string;
  name: string;
  domain: string;
  possible_duplicate_of?: string;
}
interface InCollaboration {
  legacy_id: string;
  company: string;
  title: string;
  status: 'current' | 'past';
  visibility: 'public' | 'limited' | 'private';
  projects: string[];
}

const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max) : '');
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const AVAILABILITY = ['internship', 'full-time', 'contract'];
const isDate = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

/** "https://WWW.Example.test/" or "www.example.test" -> "example.test" */
export function normalizeDomain(v: unknown): string {
  const s = str(v, 300).toLowerCase();
  if (!s) return '';
  try {
    return new URL(/^[a-z]+:\/\//.test(s) ? s : `https://${s}`).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** Reads either file shape into one normal form, recording anything malformed. */
export function normalizeExport(raw: unknown, report: MigrationReport) {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const students: InStudent[] = [];
  const projects: InProject[] = [];
  const companies: InCompany[] = [];
  const collaborations: InCollaboration[] = [];
  const seen = new Set<string>();
  const once = (kind: string, id: string) => {
    const key = `${kind}:${id}`;
    if (seen.has(key)) {
      report.conflicts.push({ record: id, problem: `The file lists ${kind} ${id} more than once; only the first was used.` });
      return false;
    }
    seen.add(key);
    return true;
  };

  for (const r of arr(o.students)) {
    const x = (r ?? {}) as Record<string, unknown>;
    const legacy_id = str(x.legacy_id ?? x.id, 40);
    const name = str(x.name, 80);
    if (!legacy_id || !name) {
      report.conflicts.push({ record: legacy_id || '(student without id)', problem: 'Student is missing an id or a name, so it was not imported.' });
      continue;
    }
    if (!once('student', legacy_id)) continue;
    const pub = str(x.publication ?? x.profile_status, 20);
    const availability = (Array.isArray(x.availability) ? x.availability : x.availability ? [x.availability] : [])
      .map((a) => str(a, 20).toLowerCase())
      .filter((a) => AVAILABILITY.includes(a));
    students.push({
      legacy_id,
      name,
      email: str(x.email, 200).toLowerCase() || null,
      status: x.status === 'alumni' ? 'alumni' : 'current',
      profile_status: pub === 'retired' ? 'retired' : pub === 'unpublished' ? 'unpublished' : 'published',
      availability,
      availability_confirmed_at: isDate(x.availability_confirmed) ? (x.availability_confirmed as string) : null,
      claimed: typeof x.claimed === 'boolean' ? x.claimed : null,
      skills: arr(x.skills).map((s) => str(s, 40)).filter(Boolean),
      possible_duplicate_of: str(x.possible_duplicate_of, 40) || undefined,
    });
  }
  for (const r of arr(o.projects)) {
    const x = (r ?? {}) as Record<string, unknown>;
    const legacy_id = str(x.legacy_id ?? x.id, 40);
    const title = str(x.title, 120);
    if (!legacy_id || !title) {
      report.conflicts.push({ record: legacy_id || '(project without id)', problem: 'Project is missing an id or a title, so it was not imported.' });
      continue;
    }
    if (!once('project', legacy_id)) continue;
    projects.push({
      legacy_id,
      title,
      contributors: arr(x.contributors)
        .map((c) => {
          const cc = (c ?? {}) as Record<string, unknown>;
          return { student: str(cc.student_legacy_id ?? cc.student_id, 40), role: str(cc.role, 60) || 'Contributor' };
        })
        .filter((c) => c.student),
      repositories: (x.repository ? [x.repository] : arr(x.repositories)).map((u) => str(u, 300)).filter((u) => /^https?:\/\//.test(u)),
      technologies: arr(x.technologies).map((t) => str(t, 40)).filter(Boolean).slice(0, 15),
      demo_url: /^https?:\/\//.test(str(x.demo_url, 300)) ? str(x.demo_url, 300) : '',
    });
  }
  for (const r of arr(o.companies)) {
    const x = (r ?? {}) as Record<string, unknown>;
    const legacy_id = str(x.legacy_id ?? x.id, 40);
    const name = str(x.name, 120);
    if (!legacy_id || !name) {
      report.conflicts.push({ record: legacy_id || '(company without id)', problem: 'Company is missing an id or a name, so it was not imported.' });
      continue;
    }
    if (!once('company', legacy_id)) continue;
    companies.push({ legacy_id, name, domain: normalizeDomain(x.domain ?? x.website), possible_duplicate_of: str(x.possible_duplicate_of, 40) || undefined });
  }
  for (const r of arr(o.collaborations)) {
    const x = (r ?? {}) as Record<string, unknown>;
    const legacy_id = str(x.legacy_id ?? x.id, 40);
    const title = str(x.title, 140);
    if (!legacy_id || !title) {
      report.conflicts.push({ record: legacy_id || '(collaboration without id)', problem: 'Collaboration is missing an id or a title, so it was not imported.' });
      continue;
    }
    if (!once('collaboration', legacy_id)) continue;
    const vis = str(x.visibility, 20);
    collaborations.push({
      legacy_id,
      company: str(x.company_legacy_id ?? x.company_id, 40),
      title,
      status: x.status === 'past' ? 'past' : 'current',
      visibility: vis === 'private' ? 'private' : vis === 'limited' ? 'limited' : 'public',
      projects: arr(x.project_legacy_ids ?? x.project_ids).map((p) => str(p, 40)).filter(Boolean),
    });
  }
  return { students, projects, companies, collaborations };
}

