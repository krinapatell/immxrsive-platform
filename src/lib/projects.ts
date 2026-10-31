import 'server-only';
import { randomBytes } from 'node:crypto';
import { db } from './db';
import { config } from './config';
import { cleanUrl, getOrCreateMyProfile, text } from './profile';
import { parseGithubRepo, repoKey, titleKey } from './repo';
import type { AppUser } from './users';
import type { StudentRow } from './students';

/**
 * Release 3: shared projects and contributors.
 *
 * Rules (also stated in docs/RELEASE-NOTES-R3.md):
 *  - One canonical project row, referenced by every contributor (R3.05).
 *  - The creator is the first maintainer (R3.06). ONLY the maintainer edits shared
 *    project fields; maintenance can be transferred (R3.07).
 *  - Each accepted contributor alone edits their own role statement and whether
 *    the project is featured on their profile (R3.11, R3.12).
 *  - Removing a contributor is a soft delete the maintainer can undo (R3.13).
 *  - Every write checks on the server that the signed-in student may do it (R3.24).
 *  - Shared edits carry a version number; a save from a stale version is refused
 *    instead of overwriting newer changes (R3.17).
 */

export const PROJECT_STATUSES = ['in-progress', 'completed'] as const;
const MAX_REPOS = 5;
const MAX_TECH = 15;

export class ProjectError extends Error {
  constructor(
    public status: number,
    message: string,
    public extra: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

export interface ProjectRow {
  id: string;
  title: string;
  description: string;
  domain: string;
  technologies: string[];
  links: Record<string, string>;
  maintainer_student_id: string | null;
  publish_status: 'draft' | 'published';
  project_status: 'in-progress' | 'completed';
  project_date: string;
  repositories: string[];
  repo_keys: string[];
  demo_url: string;
  video_url: string;
  fallback_image_url: string;
  fallback_text: string;
  version: number;
  updated_at: string;
}

export interface ContributorRow {
  project_id: string;
  student_id: string;
  role: string;
  statement: string;
  featured: boolean;
  status: 'invited' | 'requested' | 'accepted' | 'declined' | 'removed';
  invited_by: string | null;
  removed_at: string | null;
  removed_by: string | null;
  created_at: string;
}

export interface ContributorView extends ContributorRow {
  name: string;
  github_login: string | null;
}

// ---------------------------------------------------------------- helpers

async function me(user: AppUser): Promise<StudentRow> {
  if (!user.affiliation_verified_at) throw new ProjectError(403, 'Verify your Algoma email first.');
  return getOrCreateMyProfile(user);
}

export async function listRoles(): Promise<string[]> {
  const { data, error } = await db().from('project_roles').select('name');
  if (error) throw error;
  const order = [
    'Software Developer', 'XR Developer', 'Frontend Developer', 'Backend Developer', 'Game Developer', '3D Artist',
    'Technical Artist', 'UI/UX Designer', 'Project Manager', 'Researcher', 'QA/Tester', 'Data/AI Developer',
  ];
  const rank = (r: string) => (order.includes(r) ? order.indexOf(r) : order.length);
  return (data ?? []).map((r) => r.name as string).sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

async function checkRole(role: unknown): Promise<string> {
  const roles = await listRoles();
  const match = roles.find((r) => r.toLowerCase() === String(role ?? '').trim().toLowerCase());
  if (!match) throw new ProjectError(400, 'Choose a role from the list.', { errors: { role: 'Choose a role from the list.' } });
  return match;
}

async function loadProject(id: string): Promise<ProjectRow> {
  const { data, error } = await db().from('projects').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) throw new ProjectError(404, 'Project not found.');
  return data as ProjectRow;
}

async function loadContributors(projectId: string): Promise<ContributorView[]> {
  const { data, error } = await db().from('project_contributors').select('*').eq('project_id', projectId);
  if (error) throw error;
  const rows = (data ?? []) as ContributorRow[];
  const ids = rows.map((r) => r.student_id);
  const { data: students } = ids.length ? await db().from('students').select('id, name, user_id').in('id', ids) : { data: [] };
  const userIds = (students ?? []).map((s) => s.user_id).filter(Boolean) as string[];
  const { data: users } = userIds.length ? await db().from('app_users').select('user_id, github_login').in('user_id', userIds) : { data: [] };
  const login = new Map((users ?? []).map((u) => [u.user_id as string, u.github_login as string]));
  const byId = new Map((students ?? []).map((s) => [s.id as string, s]));
  return rows.map((r) => {
    const s = byId.get(r.student_id);
    return { ...r, name: (s?.name as string) ?? r.student_id, github_login: s?.user_id ? (login.get(s.user_id as string) ?? null) : null };
  });
}

async function membership(projectId: string, studentId: string): Promise<ContributorRow | null> {
  const { data, error } = await db()
    .from('project_contributors')
    .select('*')
    .eq('project_id', projectId)
    .eq('student_id', studentId)
    .maybeSingle();
  if (error) throw error;
  return (data as ContributorRow) ?? null;
}

function requireMaintainer(project: ProjectRow, student: StudentRow) {
  if (project.maintainer_student_id !== student.id) {
    throw new ProjectError(403, 'Only the project maintainer can change shared project information.');
  }
}

// ------------------------------------------------------------- validation

export interface SharedInput {
  title?: unknown;
  description?: unknown;
  domain?: unknown;
  technologies?: unknown;
  project_status?: unknown;
  project_date?: unknown;
  repositories?: unknown;
  demo_url?: unknown;
  video_url?: unknown;
  fallback_image_url?: unknown;
  fallback_text?: unknown;
}

type SharedFields = Pick<
  ProjectRow,
  | 'title'
  | 'description'
  | 'domain'
  | 'technologies'
  | 'project_status'
  | 'project_date'
  | 'repositories'
  | 'repo_keys'
  | 'demo_url'
  | 'video_url'
  | 'fallback_image_url'
  | 'fallback_text'
>;

/** Checks every shared field; returns clean values or field-level errors (R3.02, R3.19). */
export function validateShared(input: SharedInput): { ok: true; fields: SharedFields } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const title = text(input.title, 120);
  if (!title) errors.title = 'Enter a project title.';

  const technologies: string[] = [];
  for (const raw of Array.isArray(input.technologies) ? input.technologies : []) {
    const t = text(raw, 40);
    if (t && !technologies.some((x) => x.toLowerCase() === t.toLowerCase())) technologies.push(t);
  }
  if (technologies.length > MAX_TECH) errors.technologies = `List at most ${MAX_TECH} technologies.`;

  const repositories: string[] = [];
  const rawRepos = Array.isArray(input.repositories) ? input.repositories : [];
  rawRepos.forEach((raw, i) => {
    if (!String(raw ?? '').trim()) return;
    const url = cleanUrl(raw);
    if (!url) errors[`repositories.${i}`] = 'Enter a full web address, e.g. https://github.com/owner/repo';
    else if (!repositories.some((r) => repoKey(r) === repoKey(url))) repositories.push(url);
  });
  if (repositories.length > MAX_REPOS) errors.repositories = `Add at most ${MAX_REPOS} repository links.`;

  const url = (key: 'demo_url' | 'video_url' | 'fallback_image_url', label: string) => {
    const v = cleanUrl(input[key]);
    if (v === null) errors[key] = `${label} must be a full web address starting with https://`;
    return v ?? '';
  };
  const demo_url = url('demo_url', 'Playable demo link');
  const video_url = url('video_url', 'Video link');
  const fallback_image_url = url('fallback_image_url', 'Fallback image link');

  const status = String(input.project_status ?? 'completed');
  if (!(PROJECT_STATUSES as readonly string[]).includes(status)) errors.project_status = 'Choose a status.';

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    fields: {
      title,
      description: text(input.description, 1000),
      domain: text(input.domain, 80),
      technologies,
      project_status: status as ProjectRow['project_status'],
      project_date: text(input.project_date, 40),
      repositories,
      repo_keys: [...new Set(repositories.map(repoKey))],
      demo_url,
      video_url,
      fallback_image_url,
      fallback_text: text(input.fallback_text, 300),
    },
  };
}

// --------------------------------------------------------------- duplicates

export interface DuplicateReport {
  /** Projects already connected to one of these repositories: creating would duplicate them (R3.16). */
  sameRepository: { id: string; title: string; published: boolean }[];
  /** Same title, different repository: just a heads-up; never merged (fixture cases 2 and 3). */
  similarTitle: { id: string; title: string; domain: string }[];
}

export async function findDuplicates(repositories: string[], title: string, excludeId?: string): Promise<DuplicateReport> {
  const keys = [...new Set(repositories.filter(Boolean).map(repoKey))];
  let sameRepository: DuplicateReport['sameRepository'] = [];
  if (keys.length) {
    const { data, error } = await db().from('projects').select('id, title, publish_status').overlaps('repo_keys', keys);
    if (error) throw error;
    sameRepository = (data ?? [])
      .filter((p) => p.id !== excludeId)
      .map((p) => ({ id: p.id as string, title: p.title as string, published: p.publish_status === 'published' }));
  }
  let similarTitle: DuplicateReport['similarTitle'] = [];
  const tk = titleKey(title);
  if (tk) {
    const { data, error } = await db().from('projects').select('id, title, domain').ilike('title', tk.replace(/[%_]/g, '\\$&'));
    if (error) throw error;
    similarTitle = (data ?? [])
      .filter((p) => p.id !== excludeId && !sameRepository.some((s) => s.id === p.id) && titleKey(p.title as string) === tk)
      .map((p) => ({ id: p.id as string, title: p.title as string, domain: (p.domain as string) ?? '' }));
  }
  return { sameRepository, similarTitle };
}

// -------------------------------------------------------------- my projects

export interface MyProjectItem {
  project: Pick<ProjectRow, 'id' | 'title' | 'publish_status' | 'domain'>;
  membership: ContributorRow;
  is_maintainer: boolean;
}

export async function myProjects(user: AppUser): Promise<{ me: StudentRow; items: MyProjectItem[] }> {
  const student = await me(user);
  const { data, error } = await db().from('project_contributors').select('*').eq('student_id', student.id);
  if (error) throw error;
  const rows = (data ?? []) as ContributorRow[];
  const ids = rows.map((r) => r.project_id);
  const { data: projects, error: pErr } = ids.length
    ? await db().from('projects').select('id, title, publish_status, domain, maintainer_student_id').in('id', ids)
    : { data: [], error: null };
  if (pErr) throw pErr;
  const byId = new Map((projects ?? []).map((p) => [p.id as string, p]));
  const items = rows
    .filter((r) => byId.has(r.project_id))
    .map((r) => {
      const p = byId.get(r.project_id)!;
      return {
        project: { id: p.id as string, title: p.title as string, publish_status: p.publish_status as ProjectRow['publish_status'], domain: p.domain as string },
        membership: r,
        is_maintainer: p.maintainer_student_id === student.id,
      };
    })
    .sort((a, b) => a.project.title.localeCompare(b.project.title));
  return { me: student, items };
}

// ------------------------------------------------------------------- create

export async function createProject(
  user: AppUser,
  input: SharedInput & { my_role?: unknown; confirm_duplicate?: unknown },
): Promise<{ project: ProjectRow } | { duplicates: DuplicateReport }> {
  const student = await me(user);
  const v = validateShared(input);
  if (!v.ok) throw new ProjectError(400, 'Please fix the highlighted fields.', { errors: v.errors });
  const role = await checkRole(input.my_role);

  const dup = await findDuplicates(v.fields.repositories, v.fields.title);
  if (dup.sameRepository.length && input.confirm_duplicate !== true) return { duplicates: dup };

  const id = `P${randomBytes(4).toString('hex').toUpperCase()}`;
  const { data, error } = await db()
    .from('projects')
    .insert({ id, ...v.fields, links: {}, maintainer_student_id: student.id, publish_status: 'draft', version: 1 })
    .select('*')
    .single();
  if (error) throw error;
  const { error: cErr } = await db()
    .from('project_contributors')
    .insert({ project_id: id, student_id: student.id, role, status: 'accepted', featured: true, invited_by: student.id });
  if (cErr) throw cErr;
  return { project: data as ProjectRow };
}

// --------------------------------------------------------------- editor view

export interface EditorView {
  project: ProjectRow;
  contributors: ContributorView[];
  me: StudentRow;
  my: ContributorRow | null;
  is_maintainer: boolean;
}

/** Only people connected to the project (any status) can open its editor page. */
export async function editorView(user: AppUser, projectId: string): Promise<EditorView> {
  const student = await me(user);
  const project = await loadProject(projectId);
  const my = await membership(projectId, student.id);
  const isMaintainer = project.maintainer_student_id === student.id;
  if (!my && !isMaintainer) throw new ProjectError(404, 'Project not found.');
  const contributors = await loadContributors(projectId);
  // A contributor who isn't the maintainer doesn't need to see who else was invited or declined.
  const visible = isMaintainer ? contributors : contributors.filter((c) => c.status === 'accepted' || c.student_id === student.id);
  return { project, contributors: visible, me: student, my, is_maintainer: isMaintainer };
}

// ------------------------------------------------------------- shared edits

/** Saves shared fields only if nobody else saved since `version` was loaded (R3.17). */
export async function updateShared(user: AppUser, projectId: string, input: SharedInput & { version?: unknown; confirm_duplicate?: unknown }) {
  const student = await me(user);
  const project = await loadProject(projectId);
  requireMaintainer(project, student);
  const version = Number(input.version);
  if (!Number.isInteger(version)) throw new ProjectError(400, 'Missing version. Reload the page and try again.');

  // Fields left out of the request keep their current values (a partial save never blanks them).
  const keys: (keyof SharedInput)[] = ['title', 'description', 'domain', 'technologies', 'project_status', 'project_date', 'repositories', 'demo_url', 'video_url', 'fallback_image_url', 'fallback_text'];
  const merged: SharedInput = {};
  for (const k of keys) merged[k] = input[k] !== undefined ? input[k] : (project as unknown as Record<string, unknown>)[k];
  const v = validateShared(merged);
  if (!v.ok) throw new ProjectError(400, 'Please fix the highlighted fields.', { errors: v.errors });

  const newKeys = v.fields.repo_keys.filter((k) => !project.repo_keys.includes(k));
  if (newKeys.length && input.confirm_duplicate !== true) {
    const dup = await findDuplicates(v.fields.repositories.filter((r) => newKeys.includes(repoKey(r))), '', projectId);
    if (dup.sameRepository.length) return { duplicates: dup };
  }

  const { data, error } = await db()
    .from('projects')
    .update({ ...v.fields, version: version + 1, updated_at: new Date().toISOString() })
    .eq('id', projectId)
    .eq('version', version)
    .select('*');
  if (error) throw error;
  if (!data?.length) {
    const latest = await loadProject(projectId);
    throw new ProjectError(409, 'Someone saved this project after you opened it. Your changes were NOT saved, so nothing of theirs was lost.', {
      latest,
    });
  }
  return { project: data[0] as ProjectRow };
}

/**
 * Publish / unpublish. This doesn't touch the shared text fields, so it doesn't
 * change the edit version (an open edit form stays valid).
 */
export async function setPublished(user: AppUser, projectId: string, published: boolean) {
  const student = await me(user);
  const project = await loadProject(projectId);
  requireMaintainer(project, student);
  const { data, error } = await db()
    .from('projects')
    .update({ publish_status: published ? 'published' : 'draft', updated_at: new Date().toISOString() })
    .eq('id', projectId)
    .eq('maintainer_student_id', student.id)
    .select('*');
  if (error) throw error;
  if (!data?.length) throw new ProjectError(409, 'The project changed while you were publishing. Reload and try again.');
  return { project: data[0] as ProjectRow };
}

// ------------------------------------------------------------- contributors

async function studentByGithubLogin(login: string): Promise<StudentRow | null> {
  const clean = login.trim().replace(/^@/, '');
  if (!/^[A-Za-z0-9-]{1,39}$/.test(clean)) return null;
  const { data: users, error } = await db().from('app_users').select('user_id, affiliation_verified_at').ilike('github_login', clean);
  if (error) throw error;
  const u = (users ?? []).find((x) => x.affiliation_verified_at);
  if (!u) return null;
  const { data } = await db().from('students').select('*').eq('user_id', u.user_id).maybeSingle();
  return (data as StudentRow) ?? null;
}

/** R3.08: invite an existing platform student (by GitHub username) with a proposed standard role. */
export async function invite(user: AppUser, projectId: string, githubLogin: unknown, role: unknown) {
  const student = await me(user);
  const project = await loadProject(projectId);
  requireMaintainer(project, student);
  const cleanRole = await checkRole(role);
  const invitee = await studentByGithubLogin(String(githubLogin ?? ''));
  if (!invitee) {
    throw new ProjectError(404, "No verified student with that GitHub username has joined yet. Ask them to sign in to the student portal first.", {
      errors: { github_login: 'No verified student with that GitHub username.' },
    });
  }
  const existing = await membership(projectId, invitee.id);
  if (existing) {
    const msg: Record<string, string> = {
      accepted: `${invitee.name} is already a contributor.`,
      invited: `${invitee.name} has already been invited.`,
      requested: `${invitee.name} has asked to join. Approve their request below instead.`,
      removed: `${invitee.name} was removed earlier. Use "Restore" below instead.`,
    };
    if (existing.status !== 'declined') throw new ProjectError(409, msg[existing.status]);
    const { error } = await db()
      .from('project_contributors')
      .update({ status: 'invited', role: cleanRole, invited_by: student.id, updated_at: new Date().toISOString() })
      .eq('project_id', projectId)
      .eq('student_id', invitee.id);
    if (error) throw error;
  } else {
    const { error } = await db()
      .from('project_contributors')
      .insert({ project_id: projectId, student_id: invitee.id, role: cleanRole, status: 'invited', featured: true, invited_by: student.id });
    if (error) throw error;
  }
  return { invited: invitee.name };
}

/** R3.09: the invited student accepts (optionally adjusting the proposed role) or declines. */
export async function respond(user: AppUser, projectId: string, accept: boolean, role?: unknown) {
  const student = await me(user);
  const my = await membership(projectId, student.id);
  if (!my || my.status !== 'invited') throw new ProjectError(404, 'There is no open invitation for you on this project.');
  const update: Record<string, unknown> = { status: accept ? 'accepted' : 'declined', updated_at: new Date().toISOString() };
  if (accept && role !== undefined && role !== '') update.role = await checkRole(role);
  const { error } = await db().from('project_contributors').update(update).eq('project_id', projectId).eq('student_id', student.id).eq('status', 'invited');
  if (error) throw error;
  return { status: update.status };
}

/** R3.16 "join instead": ask the maintainer to add you to an existing project. */
export async function requestJoin(user: AppUser, projectId: string, role: unknown) {
  const student = await me(user);
  const project = await loadProject(projectId);
  if (!project.maintainer_student_id) throw new ProjectError(409, 'This project has no maintainer on the platform yet, so it cannot accept requests.');
  const cleanRole = await checkRole(role);
  const existing = await membership(projectId, student.id);
  if (existing && existing.status !== 'declined') {
    throw new ProjectError(409, existing.status === 'accepted' ? "You're already a contributor." : 'You already have a pending invitation or request for this project.');
  }
  const row = { project_id: projectId, student_id: student.id, role: cleanRole, status: 'requested', featured: true, invited_by: null };
  const { error } = existing
    ? await db().from('project_contributors').update({ ...row, updated_at: new Date().toISOString() }).eq('project_id', projectId).eq('student_id', student.id)
    : await db().from('project_contributors').insert(row);
  if (error) throw error;
  return { status: 'requested' };
}

type MaintainerAction = 'approve' | 'reject' | 'cancel' | 'remove' | 'restore';

/** Maintainer decisions about other contributors. Removal is a soft delete that can be restored (R3.13). */
export async function maintainerAction(user: AppUser, projectId: string, targetStudentId: string, action: MaintainerAction) {
  const student = await me(user);
  const project = await loadProject(projectId);
  requireMaintainer(project, student);
  if (targetStudentId === student.id) throw new ProjectError(400, "You can't do that to yourself. Transfer maintenance first.");
  const target = await membership(projectId, targetStudentId);
  if (!target) throw new ProjectError(404, 'That student is not connected to this project.');

  const allowed: Record<MaintainerAction, ContributorRow['status'][]> = {
    approve: ['requested'],
    reject: ['requested'],
    cancel: ['invited'],
    remove: ['accepted'],
    restore: ['removed'],
  };
  if (!allowed[action].includes(target.status)) throw new ProjectError(409, `Can't ${action} a contributor whose status is "${target.status}".`);

  const now = new Date().toISOString();
  const next: Record<MaintainerAction, Record<string, unknown>> = {
    approve: { status: 'accepted' },
    reject: { status: 'declined' },
    cancel: { status: 'declined' },
    remove: { status: 'removed', removed_at: now, removed_by: student.id },
    restore: { status: 'accepted', removed_at: null, removed_by: null },
  };
  const { error } = await db()
    .from('project_contributors')
    .update({ ...next[action], updated_at: now })
    .eq('project_id', projectId)
    .eq('student_id', targetStudentId)
    .eq('status', target.status);
  if (error) throw error;
  return { status: next[action].status };
}

/** R3.07: hand maintenance to another accepted contributor. Same project row, same URL (R3.26). */
export async function transferMaintenance(user: AppUser, projectId: string, targetStudentId: string) {
  const student = await me(user);
  const project = await loadProject(projectId);
  requireMaintainer(project, student);
  const target = await membership(projectId, targetStudentId);
  if (!target || target.status !== 'accepted') throw new ProjectError(400, 'Choose an accepted contributor.');
  const { data: t } = await db().from('students').select('user_id').eq('id', targetStudentId).maybeSingle();
  if (!t?.user_id) throw new ProjectError(400, 'That contributor has no platform account, so they could not maintain the project.');
  const { data, error } = await db()
    .from('projects')
    .update({ maintainer_student_id: targetStudentId, updated_at: new Date().toISOString() })
    .eq('id', projectId)
    .eq('maintainer_student_id', student.id)
    .select('id');
  if (error) throw error;
  if (!data?.length) throw new ProjectError(409, 'Maintenance changed while you were doing this. Reload and try again.');
  return { maintainer_student_id: targetStudentId };
}

/** R3.10–R3.12: an accepted contributor edits their OWN role, statement and featured choice. */
export async function updateMyContribution(user: AppUser, projectId: string, input: { role?: unknown; statement?: unknown; featured?: unknown }) {
  const student = await me(user);
  const my = await membership(projectId, student.id);
  if (!my || my.status !== 'accepted') throw new ProjectError(403, 'Only accepted contributors can edit their contribution.');
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.role !== undefined) update.role = await checkRole(input.role);
  if (input.statement !== undefined) update.statement = text(input.statement, 600);
  if (input.featured !== undefined) update.featured = input.featured === true;
  const { data, error } = await db()
    .from('project_contributors')
    .update(update)
    .eq('project_id', projectId)
    .eq('student_id', student.id) // always the signed-in student's own row
    .select('*')
    .single();
  if (error) throw error;
  return { my: data as ContributorRow };
}

// ------------------------------------------------------------- GitHub import

export interface ImportSuggestions {
  title: string;
  description: string;
  repository: string;
  technologies: string[];
  demo_url: string;
}

/**
 * R3.03: read a PUBLIC repository's metadata from the GitHub API and return
 * editable suggestions. Nothing is saved here. The app's OAuth credentials are
 * used only to raise the API rate limit; no user token is involved.
 */
export async function importFromGithub(input: unknown): Promise<ImportSuggestions> {
  const parsed = parseGithubRepo(String(input ?? ''));
  if (!parsed) throw new ProjectError(400, 'Enter a GitHub repository like owner/repo or https://github.com/owner/repo');
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json', 'User-Agent': 'immxrsive-platform' };
  if (config.githubClientId && config.githubClientSecret) {
    headers.Authorization = `Basic ${Buffer.from(`${config.githubClientId}:${config.githubClientSecret}`).toString('base64')}`;
  }
  const base = `https://api.github.com/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}`;
  const res = await fetch(base, { headers, cache: 'no-store' });
  if (res.status === 404) throw new ProjectError(404, "We couldn't find that repository. Check the name, and make sure it's public.");
  if (res.status === 403 || res.status === 429) throw new ProjectError(503, 'GitHub is limiting requests right now. Try again in a few minutes, or fill the fields by hand.');
  if (!res.ok) throw new ProjectError(502, "GitHub didn't respond. Try again, or fill the fields by hand.");
  const repo = await res.json();
  if (repo.private) throw new ProjectError(400, 'That repository is private. Only public repositories can be imported.');

  let technologies: string[] = [];
  const langRes = await fetch(`${base}/languages`, { headers, cache: 'no-store' });
  if (langRes.ok) {
    const langs = (await langRes.json()) as Record<string, number>;
    technologies = Object.entries(langs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name]) => name);
  } else if (repo.language) {
    technologies = [String(repo.language)];
  }
  const homepage = typeof repo.homepage === 'string' ? cleanUrl(repo.homepage) : '';
  return {
    title: String(repo.name ?? '').replace(/[-_]+/g, ' ').trim().slice(0, 120),
    description: String(repo.description ?? '').slice(0, 1000),
    repository: String(repo.html_url ?? `https://github.com/${parsed.owner}/${parsed.repo}`),
    technologies,
    demo_url: homepage ?? '',
  };
}
