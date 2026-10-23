import 'server-only';
import { db } from './db';

export const AVAILABILITY = ['internship', 'full-time', 'contract'] as const;
export const STATUSES = ['current', 'alumni'] as const;
export const THEMES = ['classic', 'midnight', 'minimal'] as const;
export const SECTIONS = ['projects', 'experience', 'education'] as const;
export const PRIVATE_FIELDS = ['availability', 'links', 'location', 'education', 'experience'] as const;

export type Visibility = Record<(typeof PRIVATE_FIELDS)[number], 'public' | 'private'>;

/** A full student row, as stored. Only used on the server. */
export interface StudentRow {
  id: string;
  user_id: string | null;
  name: string;
  headline: string;
  bio: string;
  program: string;
  status: 'current' | 'alumni';
  profile_status: 'draft' | 'published' | 'unpublished';
  availability: string[];
  skills: string[];
  suggested_skills: string[];
  links: { github?: string; linkedin?: string; portfolio?: string };
  location: string;
  education: string;
  experience: string[];
  visibility: Visibility;
  theme: (typeof THEMES)[number];
  section_order: string[];
  avatar: 'initials' | 'github';
  avatar_url: string;
}

export interface ProjectRef {
  id: string;
  title: string;
  role: string;
}

/** What an unauthenticated visitor is allowed to receive (R2.19). */
export interface PublicStudent {
  id: string;
  name: string;
  headline: string;
  bio: string;
  program: string;
  status: string;
  skills: string[];
  availability?: string[];
  links?: { github?: string; linkedin?: string; portfolio?: string };
  location?: string;
  education?: string;
  experience?: string[];
  theme: string;
  section_order: string[];
  avatar_url: string;
  projects: ProjectRef[];
}

export const DEFAULT_VISIBILITY: Visibility = {
  availability: 'public',
  links: 'public',
  location: 'private',
  education: 'public',
  experience: 'public',
};

function vis(row: StudentRow): Visibility {
  return { ...DEFAULT_VISIBILITY, ...(row.visibility ?? {}) };
}

/**
 * Build the public version of a profile. Private fields are left out of the
 * object entirely, so they never reach the browser (R2.19). The GitHub link
 * is part of the student's identity and stays public.
 */
export function toPublic(row: StudentRow, projects: ProjectRef[]): PublicStudent {
  const v = vis(row);
  const out: PublicStudent = {
    id: row.id,
    name: row.name,
    headline: row.headline,
    bio: row.bio,
    program: row.program,
    status: row.status,
    skills: row.skills ?? [],
    theme: row.theme,
    section_order: row.section_order,
    avatar_url: row.avatar === 'github' ? row.avatar_url : '',
    projects,
  };
  if (v.availability === 'public') out.availability = row.availability ?? [];
  const github = row.links?.github ? { github: row.links.github } : {};
  out.links =
    v.links === 'public'
      ? { ...github, ...(row.links?.linkedin ? { linkedin: row.links.linkedin } : {}), ...(row.links?.portfolio ? { portfolio: row.links.portfolio } : {}) }
      : github;
  if (v.location === 'public' && row.location) out.location = row.location;
  if (v.education === 'public' && row.education) out.education = row.education;
  if (v.experience === 'public' && row.experience?.length) out.experience = row.experience;
  return out;
}

async function projectsFor(studentIds: string[]): Promise<Map<string, ProjectRef[]>> {
  const map = new Map<string, ProjectRef[]>();
  if (!studentIds.length) return map;
  const { data, error } = await db()
    .from('project_contributors')
    .select('student_id, role, projects(id, title)')
    .in('student_id', studentIds);
  if (error) throw error;
  for (const row of data ?? []) {
    const p = row.projects as unknown as { id: string; title: string } | null;
    if (!p) continue;
    const list = map.get(row.student_id) ?? [];
    list.push({ id: p.id, title: p.title, role: row.role });
    map.set(row.student_id, list);
  }
  for (const list of map.values()) list.sort((a, b) => a.id.localeCompare(b.id));
  return map;
}

export interface DirectoryQuery {
  q: string;
  skills: string[];
  availability: string[];
  status: string[];
}

/** Read the directory filters from URL search params (shared by the page and the API). */
export function parseDirectoryQuery(params: Record<string, string | string[] | undefined>): DirectoryQuery {
  const many = (key: string) => {
    const raw = params[key];
    const values = (Array.isArray(raw) ? raw : raw ? [raw] : []).flatMap((v) => v.split(','));
    return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
  };
  const q = params.q;
  return {
    q: (Array.isArray(q) ? q[0] : q ?? '').trim().slice(0, 100),
    skills: many('skills'),
    availability: many('availability').map((a) => a.toLowerCase()).filter((a) => (AVAILABILITY as readonly string[]).includes(a)),
    status: many('status').map((s) => s.toLowerCase()).filter((s) => (STATUSES as readonly string[]).includes(s)),
  };
}

/**
 * Public directory search (R1.01 – R1.10, R2.22).
 *  - only published profiles
 *  - text search: case-insensitive substring of name, headline or a standardized skill
 *  - skills: ALL selected skills required (AND), matched exactly against structured skills
 *  - availability: ANY selected value (OR); hidden availability never matches a filter
 *  - status: ANY selected value (OR)
 *  - categories combine with AND; results are always sorted by id (deterministic)
 */
export async function searchStudents(query: DirectoryQuery): Promise<PublicStudent[]> {
  const { data, error } = await db().from('students').select('*').eq('profile_status', 'published').order('id');
  if (error) throw error;
  const rows = (data ?? []) as StudentRow[];

  const term = query.q.toLowerCase();
  const wanted = query.skills.map((s) => s.toLowerCase());
  const matches = rows.filter((row) => {
    const skills = (row.skills ?? []).map((s) => s.toLowerCase());
    if (term) {
      const hit =
        row.name.toLowerCase().includes(term) ||
        row.headline.toLowerCase().includes(term) ||
        skills.some((s) => s.includes(term));
      if (!hit) return false;
    }
    if (wanted.length && !wanted.every((w) => skills.includes(w))) return false;
    if (query.availability.length) {
      if (vis(row).availability !== 'public') return false;
      const avail = (row.availability ?? []).map((a) => a.toLowerCase());
      if (!query.availability.some((a) => avail.includes(a))) return false;
    }
    if (query.status.length && !query.status.includes(row.status)) return false;
    return true;
  });

  const projects = await projectsFor(matches.map((m) => m.id));
  return matches.map((row) => toPublic(row, projects.get(row.id) ?? []));
}

/** One published profile for the public page/API, or null (R1.12, R1.20, R1.21). */
export async function getPublicStudent(id: string): Promise<PublicStudent | null> {
  const { data, error } = await db().from('students').select('*').eq('id', id).eq('profile_status', 'published').maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const projects = await projectsFor([id]);
  return toPublic(data as StudentRow, projects.get(id) ?? []);
}

export async function listSkills(): Promise<string[]> {
  const { data, error } = await db().from('skills').select('name').order('name');
  if (error) throw error;
  return (data ?? []).map((r) => r.name as string);
}

export interface PublicProject {
  id: string;
  title: string;
  description: string;
  domain: string;
  technologies: string[];
  links: Record<string, string>;
  /** Contributors with unpublished profiles are listed by role only, with no name or link (R1.20). */
  contributors: { student_id: string | null; name: string | null; role: string }[];
}

export async function getPublicProject(id: string): Promise<PublicProject | null> {
  const { data, error } = await db().from('projects').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { data: links, error: linkError } = await db().from('project_contributors').select('student_id, role').eq('project_id', id);
  if (linkError) throw linkError;
  const studentIds = (links ?? []).map((l) => l.student_id as string);
  const { data: people, error: peopleError } = studentIds.length
    ? await db().from('students').select('id, name, profile_status').in('id', studentIds)
    : { data: [], error: null };
  if (peopleError) throw peopleError;
  const byId = new Map((people ?? []).map((p) => [p.id as string, p as { id: string; name: string; profile_status: string }]));

  const contributors = (links ?? [])
    .map((l) => {
      const s = byId.get(l.student_id as string);
      return s?.profile_status === 'published'
        ? { student_id: s.id, name: s.name, role: l.role as string }
        : { student_id: null, name: null, role: l.role as string };
    })
    .sort((a, b) => (a.student_id ?? 'ZZZ').localeCompare(b.student_id ?? 'ZZZ'));

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    domain: data.domain,
    technologies: data.technologies ?? [],
    links: data.links ?? {},
    contributors,
  };
}
