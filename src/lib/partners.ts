import 'server-only';
import { randomBytes } from 'node:crypto';
import { db } from './db';
import { cleanUrl, getOrCreateMyProfile, text } from './profile';
import { ProjectError } from './projects';
import { CANDIDATE_FIELDS, domainOf, missingFields, parseCompanyHtml, type CompanyCandidates } from './company-import';
import { FetchPageError, fetchPublicPage } from './fetch-page';
import type { AppUser } from './users';

/**
 * Release 4: official project verification, industry partners (companies),
 * collaborations and student partner requests.
 *
 * Rules:
 *  - Only staff change anything institutional: verification, companies,
 *    collaborations and official project-partner relationships (R4.02, R4.06).
 *    Staff functions take the staff user from requireStaffApi(); students can't reach them.
 *  - A website import only fills a form. It never creates a published company
 *    and has no way to set status or verification (R4.09, R4.10).
 *  - Students can only REQUEST verification or a partner; nothing becomes
 *    official or public until staff approve it (R4.04, R4.20, R4.21).
 *  - Public readers get collaborations already filtered by visibility on the
 *    server: Private never leaves the server and Limited only as its public
 *    summary (R4.18).
 */

// ------------------------------------------------------------------ types

export type Visibility = 'public' | 'limited' | 'private';
export const VISIBILITIES: Visibility[] = ['public', 'limited', 'private'];

export interface FieldSource {
  source: 'website' | 'staff';
  url?: string;
  at: string;
  /** true when staff changed a value that first came from the website */
  edited?: boolean;
}

export interface CompanyRow {
  id: string;
  name: string;
  website: string;
  domain: string;
  description: string;
  sector: string;
  keywords: string[];
  location: string;
  status: 'draft' | 'published';
  provenance: Record<string, FieldSource>;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface CollaborationRow {
  id: string;
  company_id: string;
  title: string;
  year_start: number;
  year_end: number | null;
  description: string;
  outcome: string;
  status: 'current' | 'past';
  visibility: Visibility;
  public_summary: string;
  created_at: string;
}

const newId = (prefix: string) => prefix + randomBytes(3).toString('hex').toUpperCase();

function bad(message: string, errors?: Record<string, string>): never {
  throw new ProjectError(400, message, errors ? { errors } : {});
}

async function one<T>(table: string, id: string, label: string): Promise<T> {
  const { data, error } = await db().from(table).select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) throw new ProjectError(404, `${label} not found.`);
  return data as T;
}

async function names(studentIds: string[]): Promise<Map<string, { name: string; published: boolean }>> {
  const ids = [...new Set(studentIds)].filter(Boolean);
  if (!ids.length) return new Map();
  const { data, error } = await db().from('students').select('id, name, profile_status').in('id', ids);
  if (error) throw error;
  return new Map((data ?? []).map((s) => [s.id as string, { name: s.name as string, published: s.profile_status === 'published' }]));
}

async function projectTitles(ids: string[]): Promise<Map<string, { title: string; published: boolean }>> {
  const list = [...new Set(ids)].filter(Boolean);
  if (!list.length) return new Map();
  const { data, error } = await db().from('projects').select('id, title, publish_status').in('id', list);
  if (error) throw error;
  return new Map((data ?? []).map((p) => [p.id as string, { title: p.title as string, published: p.publish_status === 'published' }]));
}

// ------------------------------------------------------------ work queue

export interface WorkQueue {
  verifications: { id: string; project_id: string; project_title: string; requested_by: string; created_at: string }[];
  partnerRequests: { id: string; project_id: string; project_title: string; company: string; is_new_company: boolean; requested_by: string; created_at: string }[];
  draftCompanies: { id: string; name: string; domain: string; imported: boolean; updated_at: string }[];
  publishedCompanies: { id: string; name: string; collaborations: number }[];
}

/** Everything that needs staff attention, in task groups rather than tables (R4.03). */
export async function workQueue(): Promise<WorkQueue> {
  const [v, p, c, col] = await Promise.all([
    db().from('project_verification_requests').select('*').eq('status', 'pending').order('created_at'),
    db().from('partner_requests').select('*').eq('status', 'pending').order('created_at'),
    db().from('companies').select('id, name, domain, status, provenance, updated_at').order('updated_at', { ascending: false }),
    db().from('collaborations').select('company_id'),
  ]);
  for (const r of [v, p, c, col]) if (r.error) throw r.error;
  const vr = v.data ?? [];
  const pr = p.data ?? [];
  const companies = (c.data ?? []) as CompanyRow[];
  const titles = await projectTitles([...vr, ...pr].map((r) => r.project_id as string));
  const people = await names([...vr, ...pr].map((r) => r.requested_by as string));
  const companyName = new Map(companies.map((x) => [x.id, x.name]));
  const count = new Map<string, number>();
  for (const x of col.data ?? []) count.set(x.company_id as string, (count.get(x.company_id as string) ?? 0) + 1);

  return {
    verifications: vr.map((r) => ({
      id: r.id,
      project_id: r.project_id,
      project_title: titles.get(r.project_id)?.title ?? r.project_id,
      requested_by: people.get(r.requested_by)?.name ?? r.requested_by,
      created_at: r.created_at,
    })),
    partnerRequests: pr.map((r) => ({
      id: r.id,
      project_id: r.project_id,
      project_title: titles.get(r.project_id)?.title ?? r.project_id,
      company: r.company_id ? (companyName.get(r.company_id) ?? 'a company') : r.suggested_name,
      is_new_company: !r.company_id,
      requested_by: people.get(r.requested_by)?.name ?? r.requested_by,
      created_at: r.created_at,
    })),
    draftCompanies: companies
      .filter((x) => x.status === 'draft')
      .map((x) => ({
        id: x.id,
        name: x.name,
        domain: x.domain,
        imported: Object.values(x.provenance ?? {}).some((s) => s.source === 'website'),
        updated_at: x.updated_at,
      })),
    publishedCompanies: companies
      .filter((x) => x.status === 'published')
      .map((x) => ({ id: x.id, name: x.name, collaborations: count.get(x.id) ?? 0 })),
  };
}

// ---------------------------------------------------- project verification

interface VerificationRequestRow {
  id: string;
  project_id: string;
  requested_by: string;
  note: string;
  evidence_url: string;
  status: 'pending' | 'approved' | 'rejected';
  staff_note: string;
  created_at: string;
  reviewed_at: string | null;
}

interface PartnerRequestRow {
  id: string;
  project_id: string;
  requested_by: string;
  company_id: string | null;
  suggested_name: string;
  suggested_website: string;
  explanation: string;
  status: 'pending' | 'approved' | 'rejected';
  staff_note: string;
  created_at: string;
}

export async function verificationReview(id: string) {
  const req = await one<VerificationRequestRow>('project_verification_requests', id, 'Request');
  const { data: project, error } = await db().from('projects').select('*').eq('id', req.project_id).maybeSingle();
  if (error) throw error;
  if (!project) throw new ProjectError(404, 'Project not found.');
  const { data: links, error: lErr } = await db()
    .from('project_contributors')
    .select('student_id, role, statement, status')
    .eq('project_id', req.project_id)
    .eq('status', 'accepted');
  if (lErr) throw lErr;
  const people = await names([...(links ?? []).map((l) => l.student_id as string), req.requested_by]);
  const { data: history } = await db()
    .from('project_verification_requests')
    .select('id, status, note, staff_note, created_at, reviewed_at')
    .eq('project_id', req.project_id)
    .order('created_at', { ascending: false });
  return {
    request: { ...req, requested_by_name: people.get(req.requested_by)?.name ?? req.requested_by },
    project,
    contributors: (links ?? []).map((l) => ({
      student_id: l.student_id as string,
      name: people.get(l.student_id as string)?.name ?? (l.student_id as string),
      role: l.role as string,
      statement: (l.statement as string) ?? '',
      is_maintainer: project.maintainer_student_id === l.student_id,
    })),
    history: history ?? [],
  };
}

export async function decideVerification(staff: AppUser, id: string, approve: boolean, staffNote: unknown) {
  const req = await one<{ id: string; project_id: string; status: string }>('project_verification_requests', id, 'Request');
  if (req.status !== 'pending') throw new ProjectError(409, 'This request was already decided.');
  const note = text(staffNote, 600);
  if (!approve && note.length < 5) bad('Tell the student why, so they know what to fix.', { staff_note: 'Write a short reason for the student.' });
  const now = new Date().toISOString();
  const { error } = await db()
    .from('project_verification_requests')
    .update({ status: approve ? 'approved' : 'rejected', staff_note: note, reviewed_by: staff.user_id, reviewed_at: now })
    .eq('id', id)
    .eq('status', 'pending');
  if (error) throw error;
  if (approve) {
    const { error: pErr } = await db().from('projects').update({ verified_at: now, verified_by: staff.user_id }).eq('id', req.project_id);
    if (pErr) throw pErr;
  }
  return { ok: true };
}

export async function removeVerification(staff: AppUser, projectId: string) {
  const { error } = await db().from('projects').update({ verified_at: null, verified_by: null }).eq('id', projectId);
  if (error) throw error;
  void staff;
  return { ok: true };
}

// ------------------------------------------------------------- companies

export interface CompanyInput {
  name?: unknown;
  website?: unknown;
  description?: unknown;
  sector?: unknown;
  keywords?: unknown;
  location?: unknown;
}

type CompanyFields = Omit<CompanyCandidates, 'domain'> & { domain: string };

function validateCompany(input: CompanyInput): CompanyFields {
  const errors: Record<string, string> = {};
  const name = text(input.name, 120);
  if (!name) errors.name = 'Enter the company name.';
  const website = cleanUrl(input.website);
  if (website === null) errors.website = 'Enter a website starting with http:// or https://.';
  const description = text(input.description, 1200);
  const sector = text(input.sector, 80);
  const location = text(input.location, 120);
  const rawKeywords = Array.isArray(input.keywords) ? input.keywords : typeof input.keywords === 'string' ? input.keywords.split(',') : [];
  const keywords = [...new Set(rawKeywords.map((k) => text(k, 40)).filter(Boolean))].slice(0, 12);
  if (Object.keys(errors).length) bad('Please fix the highlighted fields.', errors);
  const site = (website ?? '').replace(/\/$/, '');
  return { name, website: site, domain: site ? domainOf(site) : '', description, sector, keywords, location };
}

async function sameDomain(domain: string, excludeId?: string) {
  if (!domain) return [];
  let q = db().from('companies').select('id, name, domain, status').eq('domain', domain);
  if (excludeId) q = q.neq('id', excludeId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

/** Fetches a company page and returns suggested values only. Nothing is saved to a company here (R4.08, R4.09). */
export async function importCompany(staff: AppUser, urlInput: unknown, companyId?: string) {
  const url = cleanUrl(urlInput);
  if (!url) bad('Enter the company website address, for example https://example.com.', { url: 'Enter a full website address.' });
  let candidates: CompanyCandidates | null = null;
  let failure = '';
  let finalUrl = url;
  try {
    const page = await fetchPublicPage(url);
    finalUrl = page.finalUrl;
    candidates = parseCompanyHtml(page.html, page.finalUrl);
  } catch (err) {
    failure = err instanceof FetchPageError ? err.message : 'We couldn’t read that website. You can fill in the details by hand.';
    if (!(err instanceof FetchPageError)) console.error('Import failed:', err instanceof Error ? err.message : err);
  }
  const { data, error } = await db()
    .from('company_imports')
    .insert({
      company_id: companyId ?? null,
      source_url: finalUrl,
      ok: !!candidates && !!candidates.name,
      error: failure,
      candidates: candidates ?? {},
      imported_by: staff.user_id,
    })
    .select('id, fetched_at')
    .single();
  if (error) throw error;
  if (!candidates) return { ok: false as const, error: failure, import_id: data.id as string };
  const duplicates = await sameDomain(candidates.domain, companyId);
  return {
    ok: true as const,
    import_id: data.id as string,
    source_url: finalUrl,
    fetched_at: data.fetched_at as string,
    candidates,
    missing: missingFields(candidates),
    duplicates,
  };
}

/** Marks each saved field as coming from the website (unchanged import value) or from staff. */
async function provenanceFor(
  fields: CompanyFields,
  previous: CompanyRow | null,
  importId: unknown,
): Promise<Record<string, FieldSource>> {
  const now = new Date().toISOString();
  const prov: Record<string, FieldSource> = { ...(previous?.provenance ?? {}) };
  type Imported = { source_url: string; fetched_at: string; candidates: CompanyCandidates };
  let imported: Imported | null = null;
  if (typeof importId === 'string' && /^[0-9a-f-]{36}$/i.test(importId)) {
    const { data } = await db().from('company_imports').select('source_url, fetched_at, candidates, ok').eq('id', importId).maybeSingle();
    if (data?.ok) imported = data as unknown as Imported;
  }
  const same = (a: unknown, b: unknown) => JSON.stringify(a ?? '') === JSON.stringify(b ?? '');
  for (const f of CANDIDATE_FIELDS) {
    const value = fields[f];
    const empty = Array.isArray(value) ? value.length === 0 : !value;
    if (empty) {
      delete prov[f];
      continue;
    }
    const fromImport = imported?.candidates?.[f];
    const importHadValue = !!fromImport && !(Array.isArray(fromImport) && fromImport.length === 0);
    if (imported && importHadValue && same(fromImport, value)) {
      prov[f] = { source: 'website', url: imported.source_url, at: imported.fetched_at }; // taken as suggested
    } else if (previous && same(previous[f], value)) {
      continue; // unchanged: keep where it came from
    } else if (imported && importHadValue) {
      prov[f] = { source: 'staff', url: imported.source_url, at: now, edited: true }; // suggestion changed by staff
    } else {
      const was = prov[f];
      prov[f] = was?.source === 'website' ? { source: 'staff', url: was.url, at: now, edited: true } : { source: 'staff', at: now };
    }
  }
  return prov;
}

export async function createCompany(staff: AppUser, input: CompanyInput & { import_id?: unknown; confirm_duplicate?: unknown }) {
  const fields = validateCompany(input);
  const duplicates = await sameDomain(fields.domain);
  if (duplicates.length && input.confirm_duplicate !== true) return { duplicates };
  const id = newId('C');
  const provenance = await provenanceFor(fields, null, input.import_id);
  const { data, error } = await db()
    .from('companies')
    .insert({ id, ...fields, status: 'draft', provenance, created_by: staff.user_id })
    .select('*')
    .single();
  if (error) throw error;
  if (typeof input.import_id === 'string') await db().from('company_imports').update({ company_id: id }).eq('id', input.import_id);
  return { company: data as CompanyRow };
}

export async function updateCompany(staff: AppUser, id: string, input: CompanyInput & { import_id?: unknown; confirm_duplicate?: unknown }) {
  const current = await one<CompanyRow>('companies', id, 'Company');
  const fields = validateCompany(input);
  if (fields.domain !== current.domain) {
    const duplicates = await sameDomain(fields.domain, id);
    if (duplicates.length && input.confirm_duplicate !== true) return { duplicates };
  }
  const provenance = await provenanceFor(fields, current, input.import_id);
  const { data, error } = await db()
    .from('companies')
    .update({ ...fields, provenance, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  if (typeof input.import_id === 'string') await db().from('company_imports').update({ company_id: id }).eq('id', input.import_id);
  void staff;
  return { company: data as CompanyRow };
}

export async function setCompanyPublished(staff: AppUser, id: string, publish: boolean) {
  const current = await one<CompanyRow>('companies', id, 'Company');
  if (publish) {
    const missing = [!current.name && 'name', !current.description && 'description', !current.website && 'website'].filter(Boolean);
    if (missing.length) bad(`Add a ${missing.join(', ')} before publishing.`);
  }
  const { error } = await db()
    .from('companies')
    .update(
      publish
        ? { status: 'published', published_at: new Date().toISOString(), published_by: staff.user_id }
        : { status: 'draft', published_at: null, published_by: null },
    )
    .eq('id', id);
  if (error) throw error;
  return { ok: true };
}

export async function companyAdmin(id: string) {
  const company = await one<CompanyRow>('companies', id, 'Company');
  const [imports, collabs, partners] = await Promise.all([
    db().from('company_imports').select('id, source_url, ok, error, fetched_at').eq('company_id', id).order('fetched_at', { ascending: false }),
    db().from('collaborations').select('*').eq('company_id', id).order('year_start', { ascending: false }),
    db().from('project_partners').select('project_id, approved_at').eq('company_id', id),
  ]);
  for (const r of [imports, collabs, partners]) if (r.error) throw r.error;
  const collaborations = await withLinks((collabs.data ?? []) as CollaborationRow[]);
  const titles = await projectTitles((partners.data ?? []).map((p) => p.project_id as string));
  return {
    company,
    imports: imports.data ?? [],
    collaborations,
    partnerProjects: (partners.data ?? []).map((p) => ({ id: p.project_id as string, title: titles.get(p.project_id as string)?.title ?? p.project_id })),
  };
}

export async function listCompaniesForPicker(publishedOnly: boolean) {
  let q = db().from('companies').select('id, name, domain, status').order('name');
  if (publishedOnly) q = q.eq('status', 'published');
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as { id: string; name: string; domain: string; status: string }[];
}

// -------------------------------------------------------- collaborations

async function withLinks(rows: CollaborationRow[]) {
  const ids = rows.map((r) => r.id);
  if (!ids.length) return [];
  const [p, s] = await Promise.all([
    db().from('collaboration_projects').select('*').in('collaboration_id', ids),
    db().from('collaboration_students').select('*').in('collaboration_id', ids),
  ]);
  if (p.error) throw p.error;
  if (s.error) throw s.error;
  const titles = await projectTitles((p.data ?? []).map((x) => x.project_id as string));
  const people = await names((s.data ?? []).map((x) => x.student_id as string));
  return rows.map((r) => ({
    ...r,
    projects: (p.data ?? [])
      .filter((x) => x.collaboration_id === r.id)
      .map((x) => ({ id: x.project_id as string, title: titles.get(x.project_id as string)?.title ?? x.project_id, published: !!titles.get(x.project_id as string)?.published })),
    students: (s.data ?? [])
      .filter((x) => x.collaboration_id === r.id)
      .map((x) => ({ id: x.student_id as string, name: people.get(x.student_id as string)?.name ?? x.student_id, published: !!people.get(x.student_id as string)?.published })),
  }));
}

export interface CollaborationInput {
  title?: unknown;
  year_start?: unknown;
  year_end?: unknown;
  description?: unknown;
  outcome?: unknown;
  status?: unknown;
  visibility?: unknown;
  public_summary?: unknown;
  project_ids?: unknown;
  student_ids?: unknown;
}

function year(v: unknown): number | null {
  const n = typeof v === 'number' ? v : Number.parseInt(String(v ?? ''), 10);
  return Number.isInteger(n) ? n : null;
}

async function validateCollaboration(input: CollaborationInput) {
  const errors: Record<string, string> = {};
  const title = text(input.title, 140);
  if (!title) errors.title = 'Give the collaboration a short title.';
  const start = year(input.year_start);
  const thisYear = new Date().getFullYear();
  if (!start || start < 1990 || start > thisYear + 2) errors.year_start = 'Enter the year it started, for example 2025.';
  const endRaw = String(input.year_end ?? '').trim();
  const end = endRaw ? year(endRaw) : null;
  if (endRaw && (!end || (start && end < start) || end > thisYear + 5)) errors.year_end = 'The end year must be the same as or after the start year.';
  const status = input.status === 'past' ? 'past' : input.status === 'current' ? 'current' : null;
  if (!status) errors.status = 'Choose Current or Past.';
  const visibility = VISIBILITIES.find((v) => v === input.visibility) ?? null;
  if (!visibility) errors.visibility = 'Choose who can see this collaboration.';
  const public_summary = text(input.public_summary, 300);
  if (visibility === 'limited' && public_summary.length < 10) {
    errors.public_summary = 'Write the short public description that visitors will see instead of the details.';
  }
  const description = text(input.description, 1200);
  const outcome = text(input.outcome, 600);
  const projectIds = [...new Set((Array.isArray(input.project_ids) ? input.project_ids : []).map((x) => text(x, 20)).filter(Boolean))].slice(0, 20);
  const studentIds = [...new Set((Array.isArray(input.student_ids) ? input.student_ids : []).map((x) => text(x, 20)).filter(Boolean))].slice(0, 40);
  if (projectIds.length) {
    const t = await projectTitles(projectIds);
    if (t.size !== projectIds.length) errors.project_ids = 'One of the chosen projects no longer exists.';
  }
  if (studentIds.length) {
    const n = await names(studentIds);
    if (n.size !== studentIds.length) errors.student_ids = 'One of the chosen students no longer exists.';
  }
  if (Object.keys(errors).length) bad('Please fix the highlighted fields.', errors);
  return {
    row: { title, year_start: start!, year_end: end, description, outcome, status: status!, visibility: visibility!, public_summary },
    projectIds,
    studentIds,
  };
}

export async function saveCollaboration(staff: AppUser, companyId: string, input: CollaborationInput, collaborationId?: string) {
  await one<CompanyRow>('companies', companyId, 'Company');
  const { row, projectIds, studentIds } = await validateCollaboration(input);
  let id = collaborationId;
  if (id) {
    const existing = await one<CollaborationRow>('collaborations', id, 'Collaboration');
    if (existing.company_id !== companyId) throw new ProjectError(404, 'Collaboration not found.');
    const { error } = await db().from('collaborations').update({ ...row, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    await db().from('collaboration_projects').delete().eq('collaboration_id', id);
    await db().from('collaboration_students').delete().eq('collaboration_id', id);
  } else {
    id = newId('L');
    const { error } = await db().from('collaborations').insert({ id, company_id: companyId, ...row });
    if (error) throw error;
  }
  if (projectIds.length) {
    const { error } = await db().from('collaboration_projects').insert(projectIds.map((p) => ({ collaboration_id: id, project_id: p })));
    if (error) throw error;
  }
  if (studentIds.length) {
    const { error } = await db().from('collaboration_students').insert(studentIds.map((s) => ({ collaboration_id: id, student_id: s })));
    if (error) throw error;
  }
  void staff;
  return { id };
}

export async function collaborationAdmin(id: string) {
  const row = await one<CollaborationRow>('collaborations', id, 'Collaboration');
  const [full] = await withLinks([row]);
  return full;
}

/** Published projects and their publicly listed students, for the collaboration form. */
export async function projectPicker() {
  const { data, error } = await db().from('projects').select('id, title').eq('publish_status', 'published').order('title');
  if (error) throw error;
  const ids = (data ?? []).map((p) => p.id as string);
  const { data: links } = ids.length
    ? await db().from('project_contributors').select('project_id, student_id').in('project_id', ids).eq('status', 'accepted')
    : { data: [] };
  const people = await names((links ?? []).map((l) => l.student_id as string));
  return (data ?? []).map((p) => ({
    id: p.id as string,
    title: p.title as string,
    students: (links ?? [])
      .filter((l) => l.project_id === p.id && people.get(l.student_id as string)?.published)
      .map((l) => ({ id: l.student_id as string, name: people.get(l.student_id as string)!.name })),
  }));
}

// --------------------------------------------------- student partner requests

async function maintainerOf(user: AppUser, projectId: string) {
  if (!user.affiliation_verified_at) throw new ProjectError(403, 'Verify your Algoma email first.');
  const student = await getOrCreateMyProfile(user);
  const { data: project, error } = await db().from('projects').select('id, title, maintainer_student_id, verified_at').eq('id', projectId).maybeSingle();
  if (error) throw error;
  if (!project) throw new ProjectError(404, 'Project not found.');
  if (project.maintainer_student_id !== student.id) throw new ProjectError(403, 'Only the project maintainer can send this request.');
  return { student, project };
}

export async function requestVerification(user: AppUser, projectId: string, input: { note?: unknown; evidence_url?: unknown }) {
  const { student, project } = await maintainerOf(user, projectId);
  if (project.verified_at) throw new ProjectError(409, 'This project is already verified by ImmXrsive.');
  const note = text(input.note, 1000);
  const evidence = cleanUrl(input.evidence_url);
  const errors: Record<string, string> = {};
  if (note.length < 10) errors.note = 'Tell staff briefly why this project should be verified (at least a sentence).';
  if (evidence === null) errors.evidence_url = 'Evidence must be a link starting with http:// or https://.';
  if (Object.keys(errors).length) bad('Please fix the highlighted fields.', errors);
  const { error } = await db()
    .from('project_verification_requests')
    .insert({ project_id: projectId, requested_by: student.id, note, evidence_url: evidence ?? '' });
  if (error) {
    if (error.code === '23505') throw new ProjectError(409, 'A verification request is already waiting for staff.');
    throw error;
  }
  return { ok: true };
}

export async function requestPartner(
  user: AppUser,
  projectId: string,
  input: { company_id?: unknown; suggested_name?: unknown; suggested_website?: unknown; explanation?: unknown },
) {
  const { student } = await maintainerOf(user, projectId);
  const explanation = text(input.explanation, 1000);
  const errors: Record<string, string> = {};
  if (explanation.length < 10) errors.explanation = 'Explain in a sentence or two how the company was involved.';
  const companyId = text(input.company_id, 20);
  let suggested_name = '';
  let suggested_website = '';
  if (companyId) {
    const { data } = await db().from('companies').select('id, status').eq('id', companyId).maybeSingle();
    if (!data || data.status !== 'published') errors.company_id = 'Choose a company from the list.';
  } else {
    suggested_name = text(input.suggested_name, 120);
    const site = cleanUrl(input.suggested_website);
    if (!suggested_name) errors.suggested_name = 'Enter the company name, or choose one from the list.';
    if (site === null) errors.suggested_website = 'The website must start with http:// or https://.';
    suggested_website = site ?? '';
  }
  if (Object.keys(errors).length) bad('Please fix the highlighted fields.', errors);

  if (companyId) {
    const { data: already } = await db().from('project_partners').select('company_id').eq('project_id', projectId).eq('company_id', companyId).maybeSingle();
    if (already) throw new ProjectError(409, 'This company is already an official partner on this project.');
  }
  const { data: pending } = await db().from('partner_requests').select('id, company_id, suggested_name').eq('project_id', projectId).eq('status', 'pending');
  const dup = (pending ?? []).some((r) =>
    companyId ? r.company_id === companyId : !r.company_id && (r.suggested_name as string).toLowerCase() === suggested_name.toLowerCase(),
  );
  if (dup) throw new ProjectError(409, 'You already asked about this company. Staff will review it soon.');

  const { error } = await db().from('partner_requests').insert({
    project_id: projectId,
    requested_by: student.id,
    company_id: companyId || null,
    suggested_name,
    suggested_website,
    explanation,
  });
  if (error) throw error;
  return { ok: true };
}

/** What the project's own page in the student portal shows about R4. */
export async function projectInstitutionalView(projectId: string) {
  const [proj, verif, partners, requests] = await Promise.all([
    db().from('projects').select('verified_at').eq('id', projectId).maybeSingle(),
    db().from('project_verification_requests').select('status, note, staff_note, created_at, reviewed_at').eq('project_id', projectId).order('created_at', { ascending: false }).limit(1),
    db().from('project_partners').select('company_id').eq('project_id', projectId),
    db().from('partner_requests').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
  ]);
  for (const r of [proj, verif, partners, requests]) if (r.error) throw r.error;
  const companyIds = [...(partners.data ?? []).map((p) => p.company_id as string), ...(requests.data ?? []).map((r) => r.company_id as string).filter(Boolean)];
  const { data: comps } = companyIds.length ? await db().from('companies').select('id, name, status').in('id', companyIds) : { data: [] };
  const cname = new Map((comps ?? []).map((c) => [c.id as string, c as { id: string; name: string; status: string }]));
  return {
    verified_at: (proj.data?.verified_at as string) ?? null,
    latestVerification: verif.data?.[0] ?? null,
    partners: (partners.data ?? []).map((p) => ({
      id: p.company_id as string,
      name: cname.get(p.company_id as string)?.name ?? '',
      public: cname.get(p.company_id as string)?.status === 'published',
    })),
    requests: (requests.data ?? []).map((r) => ({
      id: r.id as string,
      company: r.company_id ? (cname.get(r.company_id)?.name ?? '') : (r.suggested_name as string),
      is_new_company: !r.company_id,
      explanation: r.explanation as string,
      status: r.status as string,
      staff_note: r.staff_note as string,
      created_at: r.created_at as string,
    })),
    companies: await listCompaniesForPicker(true),
  };
}

// ------------------------------------------------ staff: partner requests

export async function partnerRequestReview(id: string) {
  const req = await one<PartnerRequestRow>('partner_requests', id, 'Request');
  const { data: project } = await db().from('projects').select('id, title, description, publish_status, maintainer_student_id').eq('id', req.project_id).maybeSingle();
  const people = await names([req.requested_by]);
  const company = req.company_id ? await one<CompanyRow>('companies', req.company_id, 'Company') : null;
  const sameDomainCompanies = !company && req.suggested_website ? await sameDomain(domainOf(req.suggested_website)) : [];
  return {
    request: { ...req, requested_by_name: people.get(req.requested_by)?.name ?? req.requested_by },
    project,
    company,
    sameDomainCompanies,
    companies: await listCompaniesForPicker(false),
  };
}

export async function decidePartnerRequest(
  staff: AppUser,
  id: string,
  approve: boolean,
  input: { company_id?: unknown; create_company?: unknown; staff_note?: unknown },
) {
  const req = await one<{ id: string; project_id: string; status: string; company_id: string | null; suggested_name: string; suggested_website: string }>(
    'partner_requests',
    id,
    'Request',
  );
  if (req.status !== 'pending') throw new ProjectError(409, 'This request was already decided.');
  const note = text(input.staff_note, 600);
  if (!approve && note.length < 5) bad('Tell the student why, so they understand the decision.', { staff_note: 'Write a short reason for the student.' });

  let companyId = req.company_id;
  if (approve && !companyId) {
    if (input.create_company === true) {
      const created = await createCompany(staff, { name: req.suggested_name, website: req.suggested_website, confirm_duplicate: true });
      companyId = created.company?.id ?? null;
    } else {
      companyId = text(input.company_id, 20) || null;
      if (!companyId) bad('Choose which company this is, or create a new draft company from the suggestion.');
      await one<CompanyRow>('companies', companyId, 'Company');
    }
  }
  const now = new Date().toISOString();
  const { error } = await db()
    .from('partner_requests')
    .update({ status: approve ? 'approved' : 'rejected', staff_note: note, reviewed_by: staff.user_id, reviewed_at: now, company_id: companyId })
    .eq('id', id)
    .eq('status', 'pending');
  if (error) throw error;
  if (approve) {
    const { error: pErr } = await db()
      .from('project_partners')
      .upsert({ project_id: req.project_id, company_id: companyId, request_id: id, approved_by: staff.user_id, approved_at: now }, { onConflict: 'project_id,company_id' });
    if (pErr) throw pErr;
  }
  return { ok: true, company_id: companyId };
}

export async function removeProjectPartner(staff: AppUser, projectId: string, companyId: string) {
  const { error } = await db().from('project_partners').delete().eq('project_id', projectId).eq('company_id', companyId);
  if (error) throw error;
  void staff;
  return { ok: true };
}

// ------------------------------------------------------------- public side

export interface PublicCollaboration {
  id: string;
  kind: 'public' | 'limited';
  year_start: number;
  year_end: number | null;
  status: 'current' | 'past';
  /** public only */
  title?: string;
  description?: string;
  outcome?: string;
  projects?: { id: string; title: string }[];
  students?: { id: string; name: string }[];
  /** limited only: the one sentence staff chose to show */
  public_summary?: string;
}

export interface PublicPartner {
  id: string;
  name: string;
  website: string;
  description: string;
  sector: string;
  keywords: string[];
  location: string;
  collaborations: PublicCollaboration[];
  projects: { id: string; title: string }[];
  has_current: boolean;
}

/**
 * The only way public pages read collaborations. Private ones are dropped
 * here and Limited ones are reduced to their public summary, so the details
 * never reach a visitor's browser (R4.18).
 */
function toPublicCollaboration(c: Awaited<ReturnType<typeof withLinks>>[number]): PublicCollaboration | null {
  if (c.visibility === 'private') return null;
  const base = { id: c.id, year_start: c.year_start, year_end: c.year_end, status: c.status };
  if (c.visibility === 'limited') return { ...base, kind: 'limited', public_summary: c.public_summary };
  return {
    ...base,
    kind: 'public',
    title: c.title,
    description: c.description,
    outcome: c.outcome,
    projects: c.projects.filter((p) => p.published).map(({ id, title }) => ({ id, title: String(title) })),
    students: c.students.filter((s) => s.published).map(({ id, name }) => ({ id, name: String(name) })),
  };
}

async function publicCompanies(id?: string): Promise<PublicPartner[]> {
  let q = db().from('companies').select('*').eq('status', 'published').order('name');
  if (id) q = q.eq('id', id);
  const { data, error } = await q;
  if (error) throw error;
  const companies = (data ?? []) as CompanyRow[];
  if (!companies.length) return [];
  const ids = companies.map((c) => c.id);
  const { data: collabs, error: cErr } = await db()
    .from('collaborations')
    .select('*')
    .in('company_id', ids)
    .neq('visibility', 'private')
    .order('year_start', { ascending: false });
  if (cErr) throw cErr;
  const linked = await withLinks((collabs ?? []) as CollaborationRow[]);
  const { data: pp } = await db().from('project_partners').select('project_id, company_id').in('company_id', ids);
  const titles = await projectTitles((pp ?? []).map((p) => p.project_id as string));
  return companies.map((c) => {
    const collaborations = linked
      .filter((x) => x.company_id === c.id)
      .map(toPublicCollaboration)
      .filter((x): x is PublicCollaboration => !!x)
      .sort((a, b) => Number(b.status === 'current') - Number(a.status === 'current') || b.year_start - a.year_start);
    const projectMap = new Map<string, string>();
    for (const p of pp ?? []) {
      const t = titles.get(p.project_id as string);
      if (p.company_id === c.id && t?.published) projectMap.set(p.project_id as string, t.title);
    }
    for (const col of collaborations) for (const p of col.projects ?? []) projectMap.set(p.id, p.title);
    return {
      id: c.id,
      name: c.name,
      website: c.website,
      description: c.description,
      sector: c.sector,
      keywords: c.keywords ?? [],
      location: c.location,
      collaborations,
      projects: [...projectMap].map(([pid, title]) => ({ id: pid, title })),
      has_current: collaborations.some((x) => x.status === 'current'),
    };
  });
}

export const listPublicPartners = () => publicCompanies();
export async function getPublicPartner(id: string): Promise<PublicPartner | null> {
  return (await publicCompanies(id))[0] ?? null;
}

/** Public extras for a project page: official verification and published partners only. */
export async function publicProjectInstitution(projectId: string) {
  const [{ data: p }, { data: pp }] = await Promise.all([
    db().from('projects').select('verified_at').eq('id', projectId).maybeSingle(),
    db().from('project_partners').select('company_id').eq('project_id', projectId),
  ]);
  const ids = (pp ?? []).map((x) => x.company_id as string);
  const { data: comps } = ids.length ? await db().from('companies').select('id, name').in('id', ids).eq('status', 'published') : { data: [] };
  return { verified_at: (p?.verified_at as string) ?? null, partners: (comps ?? []) as { id: string; name: string }[] };
}

/** A public collaboration with its company, for inquiries (limited/private can't be asked about by id). */
export async function getPublicCollaboration(id: string) {
  const { data } = await db().from('collaborations').select('id, title, company_id, visibility').eq('id', id).maybeSingle();
  if (!data || data.visibility !== 'public') return null;
  const partner = await getPublicPartner(data.company_id as string);
  return partner ? { id: data.id as string, title: data.title as string, partner } : null;
}
