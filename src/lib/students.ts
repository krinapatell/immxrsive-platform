import 'server-only';
import { db } from './db';
import { staleCutoff, talentState } from './talent';

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
  profile_status: 'draft' | 'published' | 'unpublished' | 'retired';
  availability: string[];
  talent_state: 'active' | 'showcase';
  availability_confirmed_at: string | null;
  legacy_id: string | null;
  merged_into: string | null;
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
  /**
   * active: looking for opportunities and confirmed within a year (F.13, F.14);
   * stale: was looking, but not confirmed for over 365 days;
   * showcase: portfolio only, not looking; hidden: student keeps availability private.
   */
  talent: 'active' | 'stale' | 'showcase' | 'hidden';
  availability_confirmed_at?: string;
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
export { STALE_AFTER_DAYS, staleCutoff } from './talent';

export function talentOf(row: Pick<StudentRow, 'talent_state' | 'availability_confirmed_at' | 'visibility' | 'availability'>): PublicStudent['talent'] {
  return talentState(row.talent_state, row.availability_confirmed_at, vis(row as StudentRow).availability);
}

export function toPublic(row: StudentRow, projects: ProjectRef[]): PublicStudent {
  const v = vis(row);
  const talent = talentOf(row);
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
    talent,
  };
  // Only current, confirmed job-seeking availability is presented as availability (F.13, F.14).
  if (talent === 'active') out.availability = row.availability ?? [];
  if (talent === 'active' || talent === 'stale') out.availability_confirmed_at = row.availability_confirmed_at ?? undefined;
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

/**
 * Projects shown on each student's profile: accepted contributions to
 * published projects that the student has chosen to feature (R3.09, R3.12).
 */
async function projectsFor(studentIds: string[]): Promise<Map<string, ProjectRef[]>> {
  const map = new Map<string, ProjectRef[]>();
  if (!studentIds.length) return map;
  const { data: links, error } = await db()
    .from('project_contributors')
    .select('student_id, project_id, role')
    .in('student_id', studentIds)
    .eq('status', 'accepted')
    .eq('featured', true);
  if (error) throw error;
  const projectIds = [...new Set((links ?? []).map((l) => l.project_id as string))];
  if (!projectIds.length) return map;
  const { data: projects, error: pErr } = await db()
    .from('projects')
    .select('id, title')
    .in('id', projectIds)
    .eq('publish_status', 'published');
  if (pErr) throw pErr;
  const titles = new Map((projects ?? []).map((p) => [p.id as string, p.title as string]));
  for (const l of links ?? []) {
    const title = titles.get(l.project_id as string);
    if (!title) continue;
    const list = map.get(l.student_id as string) ?? [];
    list.push({ id: l.project_id as string, title, role: l.role as string });
    map.set(l.student_id as string, list);
  }
  for (const list of map.values()) list.sort((x, y) => x.id.localeCompare(y.id));
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

export const PAGE_SIZE = 24;

export interface DirectoryPage {
  students: PublicStudent[];
  total: number;
  page: number;
  pageSize: number;
}

/** Characters that would change the meaning of a PostgREST filter. */
const unsafe = /[,()*%\\:."]/g;

/**
 * Public directory search (R1.01 - R1.10, R2.22, F.28).
 * All filtering, sorting and paging happen in the database, so a page always
 * returns at most PAGE_SIZE profiles however many students exist.
 *  - only published, non-merged profiles
 *  - text: case-insensitive substring of name, headline or a standardized skill
 *  - skills: ALL selected (AND), exact match on structured skills
 *  - availability: ANY selected (OR); only Active Talent whose availability is
 *    public and confirmed in the last 365 days can match (F.13, F.14)
 *  - status: ANY selected (OR); categories combine with AND; sorted by id
 */
export async function searchStudents(query: DirectoryQuery, page = 1): Promise<DirectoryPage> {
  const standard = await listSkills();
  const canon = new Map(standard.map((s) => [s.toLowerCase(), s]));
  const wanted = query.skills.map((s) => canon.get(s.toLowerCase()));
  const safePage = Math.max(1, Math.min(1000, Math.floor(page) || 1));
  if (wanted.some((w) => !w)) return { students: [], total: 0, page: safePage, pageSize: PAGE_SIZE };

  let q = db()
    .from('students')
    .select('*', { count: 'exact' })
    .eq('profile_status', 'published')
    .is('merged_into', null);

  const term = query.q.replace(unsafe, ' ').trim();
  if (term) {
    const skillHits = standard.filter((s) => s.toLowerCase().includes(term.toLowerCase()));
    const ors = [`name.ilike.*${term}*`, `headline.ilike.*${term}*`];
    if (skillHits.length) ors.push(`skills.ov.{${skillHits.map((s) => `"${s}"`).join(',')}}`);
    q = q.or(ors.join(','));
  }
  if (wanted.length) q = q.contains('skills', wanted as string[]);
  if (query.availability.length) {
    q = q
      .overlaps('availability', query.availability)
      .eq('talent_state', 'active')
      .eq('visibility->>availability', 'public')
      .gte('availability_confirmed_at', staleCutoff());
  }
  if (query.status.length) q = q.in('status', query.status);

  const from = (safePage - 1) * PAGE_SIZE;
  const { data, error, count } = await q.order('id').range(from, from + PAGE_SIZE - 1);
  if (error) throw error;
  const rows = (data ?? []) as StudentRow[];
  const projects = await projectsFor(rows.map((r) => r.id));
  return {
    students: rows.map((row) => toPublic(row, projects.get(row.id) ?? [])),
    total: count ?? rows.length,
    page: safePage,
    pageSize: PAGE_SIZE,
  };
}

/** One published profile for the public page/API, or null (R1.12, R1.20, R1.21). */
export async function getPublicStudent(id: string): Promise<PublicStudent | null> {
  const { data, error } = await db()
    .from('students')
    .select('*')
    .eq('id', id)
    .eq('profile_status', 'published')
    .is('merged_into', null)
    .maybeSingle();
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

export interface PublicContributor {
  /** null when the contributor's own profile isn't public: shown by role only (R1.20). */
  student_id: string | null;
  name: string | null;
  role: string;
  statement: string;
  is_maintainer: boolean;
  /** The contributor retired their profile: the role stays on the project, without their name (F.16). */
  former: boolean;
}

export interface PublicProject {
  id: string;
  title: string;
  description: string;
  domain: string;
  technologies: string[];
  project_status: string;
  project_date: string;
  repositories: string[];
  demo_url: string;
  video_url: string;
  fallback_image_url: string;
  fallback_text: string;
  /** How the demo opens and whether it still works (F.33 - F.38). */
  demo_type: 'link' | 'embed';
  demo_status: 'available' | 'unavailable' | 'archived' | 'replaced';
  demo_note: string;
  /** Accepted contributors only. Invited, requested, declined and removed are never public (R3.09). */
  contributors: PublicContributor[];
}

export async function getPublicProject(id: string): Promise<PublicProject | null> {
  const { data, error } = await db().from('projects').select('*').eq('id', id).eq('publish_status', 'published').maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { data: links, error: linkError } = await db()
    .from('project_contributors')
    .select('student_id, role, statement, created_at')
    .eq('project_id', id)
    .eq('status', 'accepted');
  if (linkError) throw linkError;
  const studentIds = (links ?? []).map((l) => l.student_id as string);
  const { data: people, error: peopleError } = studentIds.length
    ? await db().from('students').select('id, name, profile_status').in('id', studentIds)
    : { data: [], error: null };
  if (peopleError) throw peopleError;
  const byId = new Map((people ?? []).map((p) => [p.id as string, p as { id: string; name: string; profile_status: string }]));

  const contributors: PublicContributor[] = (links ?? [])
    .map((l) => {
      const s = byId.get(l.student_id as string);
      const visible = s?.profile_status === 'published';
      return {
        student_id: visible ? s!.id : null,
        name: visible ? s!.name : null,
        role: l.role as string,
        statement: visible ? ((l.statement as string) ?? '') : '',
        is_maintainer: data.maintainer_student_id === l.student_id,
        former: s?.profile_status === 'retired',
      };
    })
    .sort((a, b) => Number(b.is_maintainer) - Number(a.is_maintainer) || (a.student_id ?? 'ZZZ').localeCompare(b.student_id ?? 'ZZZ'));

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    domain: data.domain,
    technologies: data.technologies ?? [],
    project_status: data.project_status,
    project_date: data.project_date ?? '',
    repositories: data.repositories ?? [],
    demo_url: data.demo_url ?? '',
    video_url: data.video_url ?? '',
    fallback_image_url: data.fallback_image_url ?? '',
    fallback_text: data.fallback_text ?? '',
    demo_type: data.demo_type === 'embed' ? 'embed' : 'link',
    demo_status: data.demo_status ?? 'available',
    demo_note: data.demo_note ?? '',
    contributors,
  };
}
