import 'server-only';
import { db } from './db';
import { listSkills, type StudentRow } from './students';
import { repoKey } from './repo';
import type { AppUser } from './users';
import { logEvent } from './events';
import { normalizeExport, zero, type MigrationReport } from './migration-parse';

export type { MigrationReport };

/**
 * Legacy migration (F.01 - F.06).
 *
 * Staff upload an export (the course's legacy_export.json, or a file in the
 * same shape as scale_fixture.json). Every record is matched by its LEGACY id,
 * which is stored once in `legacy_id` and never changes, so:
 *  - running the same file again creates nothing new (F.02);
 *  - renaming a student/project/company, or changing an email or domain,
 *    never breaks the link between the old and new record (F.06).
 * Problems are reported, never silently fixed: missing references are listed
 * and skipped, possible duplicates are flagged for staff to merge (F.03, F.17).
 * Students/projects/companies created here are ordinary rows read by the same
 * pages and queries as everything else (F.27).
 */

const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** Changed on the new site since it was imported (claimed, merged, edited by staff or the owner). */
const editedHere = (row: { created_at?: string; updated_at?: string; merged_into?: string | null }) =>
  !!row.merged_into || (!!row.created_at && !!row.updated_at && Date.parse(row.updated_at) - Date.parse(row.created_at) > 5000);

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const sorted = (a: string[] | null | undefined) => [...(a ?? [])].sort();

async function byLegacy<T extends { legacy_id: string | null }>(table: string, ids: string[]): Promise<Map<string, T>> {
  const map = new Map<string, T>();
  for (let i = 0; i < ids.length; i += 200) {
    const { data, error } = await db().from(table).select('*').in('legacy_id', ids.slice(i, i + 200));
    if (error) throw error;
    for (const row of (data ?? []) as T[]) if (row.legacy_id) map.set(row.legacy_id, row);
  }
  return map;
}

async function takenIds(table: string, ids: string[]): Promise<Set<string>> {
  const out = new Set<string>();
  for (let i = 0; i < ids.length; i += 200) {
    const { data, error } = await db().from(table).select('id').in('id', ids.slice(i, i + 200));
    if (error) throw error;
    for (const r of data ?? []) out.add(r.id as string);
  }
  return out;
}

async function insertMany(table: string, rows: Record<string, unknown>[]) {
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await db().from(table).insert(rows.slice(i, i + 200));
    if (error) throw error;
  }
}

/** Runs (or, with dryRun, only checks) an import and returns its report. */
export async function runMigration(staff: AppUser, raw: unknown, source: string, dryRun: boolean) {
  const report: MigrationReport = {
    source,
    format: 'legacy_export',
    dry_run: dryRun,
    source_counts: {},
    counts: { students: zero(), projects: zero(), contributors: zero(), companies: zero(), collaborations: zero() },
    duplicate_student_candidates: [],
    duplicate_company_candidates: [],
    broken_references: [],
    unclaimed_profiles: [],
    conflicts: [],
    kept_site_changes: [],
    notes: [],
  };
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  report.format = arr(o.students).some((s) => (s as Record<string, unknown>)?.legacy_id) ? 'legacy_export' : 'scale_fixture';
  report.source_counts = {
    students: arr(o.students).length,
    projects: arr(o.projects).length,
    companies: arr(o.companies).length,
    collaborations: arr(o.collaborations).length,
  };
  const input = normalizeExport(raw, report);
  const standard = await listSkills();
  const canon = new Map(standard.map((s) => [s.toLowerCase(), s]));
  const today = new Date().toISOString().slice(0, 10);

  // ------------------------------------------------------------ students
  const existingStudents = await byLegacy<StudentRow & { legacy_email: string | null; legacy_claimed: boolean | null }>(
    'students',
    input.students.map((s) => s.legacy_id),
  );
  const newIds = input.students.filter((s) => !existingStudents.has(s.legacy_id)).map((s) => s.legacy_id);
  const taken = await takenIds('students', newIds);
  const studentId = new Map<string, string>(); // legacy id -> students.id
  // A record merged into another one now means the one it was merged into.
  for (const [lid, row] of existingStudents) studentId.set(lid, row.merged_into ?? row.id);

  // Possible duplicates: the file says so, or two records share an email (in the
  // file or already in the database). They are flagged, never merged automatically.
  const emails = new Map<string, string>();
  const { data: emailRows } = await db().from('students').select('legacy_id, legacy_email').not('legacy_email', 'is', null);
  for (const r of emailRows ?? []) if (r.legacy_id && r.legacy_email) emails.set(r.legacy_email as string, r.legacy_id as string);
  const dupStudents = new Set<string>();
  for (const s of input.students) {
    const byEmail = s.email ? emails.get(s.email) : undefined;
    const other = byEmail && byEmail !== s.legacy_id ? byEmail : s.possible_duplicate_of;
    if (other) {
      dupStudents.add(s.legacy_id);
      report.duplicate_student_candidates.push({
        legacy_id: s.legacy_id,
        possible_duplicate_of: other,
        reason: byEmail && byEmail !== s.legacy_id ? 'same email' : 'marked as a possible duplicate in the export',
      });
    }
    if (s.email && !emails.has(s.email)) emails.set(s.email, s.legacy_id);
  }

  const toInsert: Record<string, unknown>[] = [];
  for (const s of input.students) {
    const skills = s.skills.map((k) => canon.get(k.toLowerCase())).filter((k): k is string => !!k);
    const suggested = s.skills.filter((k) => !canon.has(k.toLowerCase()));
    const fields = {
      name: s.name,
      status: s.status,
      profile_status: s.profile_status,
      availability: s.availability,
      availability_confirmed_at: s.availability_confirmed_at ?? (report.format === 'scale_fixture' ? today : null),
      talent_state: s.availability.length ? 'active' : 'showcase',
      legacy_email: s.email,
      legacy_claimed: s.claimed,
      skills,
      suggested_skills: suggested,
    };
    if (s.claimed === false && !dupStudents.has(s.legacy_id)) report.unclaimed_profiles.push(s.legacy_id);
    const existing = existingStudents.get(s.legacy_id);
    if (existing) {
      if (existing.user_id || editedHere(existing as unknown as Parameters<typeof editedHere>[0])) {
        // Claimed, merged or edited on the new site: those changes win over the old export.
        report.counts.students.skipped++;
        report.kept_site_changes.push(s.legacy_id);
        continue;
      }
      const changed = (Object.keys(fields) as (keyof typeof fields)[]).filter((k) =>
        Array.isArray(fields[k]) ? !same(sorted(fields[k] as string[]), sorted(existing[k as keyof StudentRow] as string[])) : !same(fields[k], existing[k as keyof typeof existing]),
      );
      if (!changed.length) {
        report.counts.students.skipped++;
        continue;
      }
      report.counts.students.updated++;
      if (!dryRun) {
        const { error } = await db().from('students').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', existing.id);
        if (error) throw error;
      }
      continue;
    }
    const id = taken.has(s.legacy_id) ? `M${s.legacy_id}` : s.legacy_id;
    studentId.set(s.legacy_id, id);
    report.counts.students.created++;
    toInsert.push({
      id,
      legacy_id: s.legacy_id,
      ...fields,
      headline: s.status === 'alumni' ? 'Algoma University alumni' : 'Algoma University student',
      program: 'Computer Science',
      visibility: { availability: 'public', links: 'public', location: 'private', education: 'public', experience: 'public' },
    });
  }
  if (!dryRun) await insertMany('students', toInsert);

  // Students named in projects but not in this file may already exist from an earlier run.
  const referenced = [...new Set(input.projects.flatMap((p) => p.contributors.map((c) => c.student)))].filter((id) => !studentId.has(id));
  if (referenced.length) {
    const more = await byLegacy<StudentRow>('students', referenced);
    for (const [lid, row] of more) studentId.set(lid, row.merged_into ?? row.id);
  }

  // ------------------------------------------------------------ projects
  const existingProjects = await byLegacy<{ id: string; legacy_id: string; title: string; repositories: string[]; technologies: string[]; demo_url: string; maintainer_student_id: string | null }>(
    'projects',
    input.projects.map((p) => p.legacy_id),
  );
  const takenP = await takenIds('projects', input.projects.filter((p) => !existingProjects.has(p.legacy_id)).map((p) => p.legacy_id));
  const projectId = new Map<string, string>();
  for (const [lid, row] of existingProjects) projectId.set(lid, row.id);
  const newProjects: Record<string, unknown>[] = [];
  const wantedLinks: { project_id: string; student_id: string; role: string }[] = [];
  for (const p of input.projects) {
    const valid = p.contributors.filter((c) => {
      if (studentId.has(c.student)) return true;
      report.broken_references.push({ project_legacy_id: p.legacy_id, student_legacy_id: c.student });
      return false;
    });
    const fields = {
      title: p.title,
      repositories: p.repositories,
      repo_keys: p.repositories.map(repoKey),
      technologies: p.technologies,
      demo_url: p.demo_url,
    };
    const existing = existingProjects.get(p.legacy_id);
    let id: string;
    if (existing) {
      id = existing.id;
      const changed = !editedHere(existing as Parameters<typeof editedHere>[0]) && (existing.title !== fields.title || !same(sorted(existing.repositories), sorted(fields.repositories)) || !same(sorted(existing.technologies), sorted(fields.technologies)) || (existing.demo_url ?? '') !== fields.demo_url);
      if (editedHere(existing as Parameters<typeof editedHere>[0])) report.kept_site_changes.push(p.legacy_id);
      if (changed) {
        report.counts.projects.updated++;
        if (!dryRun) {
          const { error } = await db().from('projects').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id);
          if (error) throw error;
        }
      } else report.counts.projects.skipped++;
    } else {
      id = takenP.has(p.legacy_id) ? `M${p.legacy_id}` : p.legacy_id;
      report.counts.projects.created++;
      newProjects.push({
        id,
        legacy_id: p.legacy_id,
        ...fields,
        description: '',
        publish_status: 'published',
        // The first listed contributor maintains it until staff assign someone else (F.19).
        maintainer_student_id: valid[0] ? studentId.get(valid[0].student) : null,
      });
    }
    projectId.set(p.legacy_id, id);
    // One shared project, with every valid contributor accepted once (F.04).
    for (const c of valid) wantedLinks.push({ project_id: id, student_id: studentId.get(c.student)!, role: c.role });
  }
  if (!dryRun) await insertMany('projects', newProjects);

  const linkProjects = [...new Set(wantedLinks.map((l) => l.project_id))];
  const existingLinks = new Set<string>();
  for (let i = 0; i < linkProjects.length; i += 200) {
    const { data, error } = await db().from('project_contributors').select('project_id, student_id').in('project_id', linkProjects.slice(i, i + 200));
    if (error) throw error;
    for (const l of data ?? []) existingLinks.add(`${l.project_id}|${l.student_id}`);
  }
  const newLinks = wantedLinks
    .filter((l) => {
      const key = `${l.project_id}|${l.student_id}`;
      if (existingLinks.has(key)) {
        report.counts.contributors.skipped++;
        return false;
      }
      existingLinks.add(key);
      report.counts.contributors.created++;
      return true;
    })
    .map((l) => ({ ...l, status: 'accepted', featured: true }));
  if (!dryRun) await insertMany('project_contributors', newLinks);

  // ------------------------------------------------------------ companies
  const existingCompanies = await byLegacy<{ id: string; legacy_id: string; name: string; domain: string }>(
    'companies',
    input.companies.map((c) => c.legacy_id),
  );
  const { data: allCompanies } = await db().from('companies').select('id, legacy_id, name, domain').is('merged_into', null);
  const domains = new Map<string, string>(); // domain -> legacy id or "existing company <name>"
  for (const c of allCompanies ?? []) if (c.domain) domains.set(c.domain as string, (c.legacy_id as string) || `${c.name} (${c.id}, already on the site)`);
  const takenC = await takenIds('companies', input.companies.filter((c) => !existingCompanies.has(c.legacy_id)).map((c) => c.legacy_id));
  const companyId = new Map<string, string>();
  for (const [lid, row] of existingCompanies) companyId.set(lid, (row as { merged_into?: string | null }).merged_into ?? row.id);
  const newCompanies: Record<string, unknown>[] = [];
  for (const c of input.companies) {
    const owner = c.domain ? domains.get(c.domain) : undefined;
    const other = owner && owner !== c.legacy_id ? owner : c.possible_duplicate_of;
    if (other) {
      report.duplicate_company_candidates.push({
        legacy_id: c.legacy_id,
        possible_duplicate_of: other,
        reason: owner && owner !== c.legacy_id ? 'same website domain' : 'marked as a possible duplicate in the export',
      });
    }
    if (c.domain && !domains.has(c.domain)) domains.set(c.domain, c.legacy_id);
    const fields = { name: c.name, domain: c.domain, website: c.domain ? `https://${c.domain}` : '' };
    const existing = existingCompanies.get(c.legacy_id);
    if (existing) {
      if (editedHere(existing as Parameters<typeof editedHere>[0])) {
        report.counts.companies.skipped++;
        report.kept_site_changes.push(c.legacy_id);
      } else if (existing.name === fields.name && existing.domain === fields.domain) report.counts.companies.skipped++;
      else {
        report.counts.companies.updated++;
        if (!dryRun) {
          const { error } = await db().from('companies').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', existing.id);
          if (error) throw error;
        }
      }
      continue;
    }
    const id = takenC.has(c.legacy_id) ? `M${c.legacy_id}` : c.legacy_id;
    companyId.set(c.legacy_id, id);
    report.counts.companies.created++;
    newCompanies.push({
      id,
      legacy_id: c.legacy_id,
      ...fields,
      description: '',
      status: 'published', // they were public partners on the old site
      published_at: new Date().toISOString(),
      published_by: staff.user_id,
      provenance: { name: { source: 'staff', at: new Date().toISOString(), url: `migration: ${source}` } },
      created_by: staff.user_id,
    });
  }
  if (!dryRun) await insertMany('companies', newCompanies);

  // ------------------------------------------------------- collaborations
  const missingCompanies = [...new Set(input.collaborations.map((c) => c.company))].filter((id) => id && !companyId.has(id));
  if (missingCompanies.length) {
    const more = await byLegacy<{ id: string; legacy_id: string }>('companies', missingCompanies);
    for (const [lid, row] of more) companyId.set(lid, (row as { merged_into?: string | null }).merged_into ?? row.id);
  }
  const missingProjects = [...new Set(input.collaborations.flatMap((c) => c.projects))].filter((id) => !projectId.has(id));
  if (missingProjects.length) {
    const more = await byLegacy<{ id: string; legacy_id: string }>('projects', missingProjects);
    for (const [lid, row] of more) projectId.set(lid, row.id);
  }
  const existingCollabs = await byLegacy<{ id: string; legacy_id: string; title: string; status: string; visibility: string; company_id: string }>(
    'collaborations',
    input.collaborations.map((c) => c.legacy_id),
  );
  const takenL = await takenIds('collaborations', input.collaborations.filter((c) => !existingCollabs.has(c.legacy_id)).map((c) => c.legacy_id));
  const newCollabs: Record<string, unknown>[] = [];
  const collabLinks: { collaboration_id: string; project_id: string }[] = [];
  for (const c of input.collaborations) {
    const cid = companyId.get(c.company);
    if (!cid) {
      report.broken_references.push({ collaboration_legacy_id: c.legacy_id, company_legacy_id: c.company || '(none)' });
      report.counts.collaborations.conflict++;
      continue;
    }
    const projects = c.projects.filter((p) => {
      if (projectId.has(p)) return true;
      report.broken_references.push({ collaboration_legacy_id: c.legacy_id, project_legacy_id: p });
      return false;
    });
    const fields = { title: c.title, status: c.status, visibility: c.visibility, company_id: cid };
    const existing = existingCollabs.get(c.legacy_id);
    const id = existing?.id ?? (takenL.has(c.legacy_id) ? `M${c.legacy_id}` : c.legacy_id);
    if (existing) {
      if (editedHere(existing as Parameters<typeof editedHere>[0])) {
        report.counts.collaborations.skipped++;
        report.kept_site_changes.push(c.legacy_id);
      } else if (existing.title === c.title && existing.status === c.status && existing.visibility === c.visibility && existing.company_id === cid) {
        report.counts.collaborations.skipped++;
      } else {
        report.counts.collaborations.updated++;
        if (!dryRun) {
          const { error } = await db().from('collaborations').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id);
          if (error) throw error;
        }
      }
    } else {
      report.counts.collaborations.created++;
      // Legacy history has no year: it is kept without one rather than guessed.
      newCollabs.push({ id, legacy_id: c.legacy_id, ...fields, year_start: null, public_summary: c.visibility === 'limited' ? 'A confidential collaboration.' : '' });
    }
    for (const p of projects) collabLinks.push({ collaboration_id: id, project_id: projectId.get(p)! });
  }
  if (!dryRun) {
    await insertMany('collaborations', newCollabs);
    const ids = [...new Set(collabLinks.map((l) => l.collaboration_id))];
    const have = new Set<string>();
    if (ids.length) {
      const { data } = await db().from('collaboration_projects').select('collaboration_id, project_id').in('collaboration_id', ids);
      for (const l of data ?? []) have.add(`${l.collaboration_id}|${l.project_id}`);
    }
    await insertMany(
      'collaboration_projects',
      collabLinks.filter((l) => !have.has(`${l.collaboration_id}|${l.project_id}`)),
    );
  }

  report.counts.students.conflict += report.conflicts.filter((c) => /^Student|student/.test(c.problem)).length;
  report.counts.projects.conflict += report.broken_references.filter((r) => r.project_legacy_id && r.student_legacy_id).length;
  if (report.duplicate_student_candidates.length || report.duplicate_company_candidates.length) {
    report.notes.push('Possible duplicates were imported as separate records and flagged. Review them in Staff > Students or the company page and merge if they are the same.');
  }
  if (report.broken_references.length) report.notes.push('Missing references were skipped and listed here; nothing was invented to fill them.');
  report.notes.push('Imported profiles keep their legacy ids and stay unclaimed until their owner claims them.');

  const { data: run, error: runErr } = await db()
    .from('migration_runs')
    .insert({ source, kind: report.format, dry_run: dryRun, counts: report.counts, report, run_by: staff.user_id })
    .select('id, created_at')
    .single();
  if (runErr) throw runErr;
  if (!dryRun) await logEvent('info', 'migration', `Imported ${source}`, { run_id: run.id, counts: report.counts });
  return { run_id: run.id as string, created_at: run.created_at as string, report };
}

export async function listRuns(limit = 20) {
  const { data, error } = await db()
    .from('migration_runs')
    .select('id, source, kind, dry_run, counts, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getRun(id: string) {
  const { data, error } = await db().from('migration_runs').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}
