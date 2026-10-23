import 'server-only';
import { randomBytes } from 'node:crypto';
import { db } from './db';
import type { AppUser } from './users';
import {
  AVAILABILITY,
  DEFAULT_VISIBILITY,
  PRIVATE_FIELDS,
  SECTIONS,
  THEMES,
  listSkills,
  type StudentRow,
  type Visibility,
} from './students';

/**
 * Everything a student can do to their own profile. Every function takes the
 * signed-in AppUser and only ever touches the row whose user_id matches it,
 * so one student can never change another student's profile (R2.30).
 */

export async function getMyProfile(user: AppUser): Promise<StudentRow | null> {
  const { data, error } = await db().from('students').select('*').eq('user_id', user.user_id).maybeSingle();
  if (error) throw error;
  return (data as StudentRow) ?? null;
}

/** Creates the student's private draft the first time they open the editor (R2.10). */
export async function getOrCreateMyProfile(user: AppUser): Promise<StudentRow> {
  const existing = await getMyProfile(user);
  if (existing) return existing;
  const id = `U${randomBytes(4).toString('hex').toUpperCase()}`;
  const { data, error } = await db()
    .from('students')
    .insert({
      id,
      user_id: user.user_id,
      name: user.github_login,
      program: 'Computer Science',
      profile_status: 'draft',
      links: { github: `https://github.com/${user.github_login}` },
      avatar_url: user.github_avatar_url,
      visibility: DEFAULT_VISIBILITY,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as StudentRow;
}

// ---- input cleaning -------------------------------------------------------

/** Plain text only: removes control characters and trims to a maximum length. */
function text(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
}

/** Only http(s) links are accepted, so "javascript:" and similar can't be stored (R2.25). */
export function cleanUrl(value: unknown): string | null {
  const raw = text(value, 300);
  if (!raw) return '';
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (!url.hostname.includes('.')) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export interface ProfileInput {
  name?: unknown;
  headline?: unknown;
  bio?: unknown;
  program?: unknown;
  status?: unknown;
  availability?: unknown;
  skills?: unknown;
  suggested_skills?: unknown;
  links?: { linkedin?: unknown; portfolio?: unknown };
  location?: unknown;
  education?: unknown;
  experience?: unknown;
  visibility?: Partial<Record<string, unknown>>;
  theme?: unknown;
  section_order?: unknown;
  avatar?: unknown;
}

export type SaveResult = { ok: true; profile: StudentRow } | { ok: false; errors: Record<string, string> };

/**
 * Validates and saves the student's own profile. Returns field-level errors
 * the editor shows next to each field (R2.27).
 */
export async function saveMyProfile(user: AppUser, input: ProfileInput): Promise<SaveResult> {
  const current = await getOrCreateMyProfile(user);
  const errors: Record<string, string> = {};

  const name = text(input.name, 80);
  if (!name) errors.name = 'Enter your name.';
  const headline = text(input.headline, 120);
  if (!headline) errors.headline = 'Enter a short professional headline.';

  const status = input.status === 'alumni' ? 'alumni' : 'current';

  const availability = Array.isArray(input.availability)
    ? [...new Set(input.availability.map((a) => String(a).toLowerCase()))].filter((a) => (AVAILABILITY as readonly string[]).includes(a))
    : [];

  // Skills: only values from the standardized set are stored as filterable
  // skills, matched case-insensitively to the official spelling (R2.12).
  const standard = await listSkills();
  const byLower = new Map(standard.map((s) => [s.toLowerCase(), s]));
  const skills: string[] = [];
  const rejected: string[] = [];
  for (const raw of Array.isArray(input.skills) ? input.skills : []) {
    const canonical = byLower.get(String(raw).trim().toLowerCase());
    if (canonical) {
      if (!skills.includes(canonical)) skills.push(canonical);
    } else if (String(raw).trim()) {
      rejected.push(String(raw).trim());
    }
  }
  if (rejected.length) errors.skills = `Not in the standard skill list: ${rejected.join(', ')}. Use "Suggest a missing skill" instead.`;

  // Suggestions: kept privately for staff review, never used as public filters.
  const suggested: string[] = [];
  for (const raw of Array.isArray(input.suggested_skills) ? input.suggested_skills : []) {
    const s = text(raw, 40);
    if (!s || byLower.has(s.toLowerCase())) continue;
    if (!suggested.some((x) => x.toLowerCase() === s.toLowerCase())) suggested.push(s);
  }

  const linkedin = cleanUrl(input.links?.linkedin);
  if (linkedin === null) errors.linkedin = 'Enter a full web address, e.g. https://www.linkedin.com/in/your-name';
  const portfolio = cleanUrl(input.links?.portfolio);
  if (portfolio === null) errors.portfolio = 'Enter a full web address, e.g. https://your-site.com';

  const experience = (Array.isArray(input.experience) ? input.experience : [])
    .map((e) => text(e, 300))
    .filter(Boolean)
    .slice(0, 10);

  const visibility = { ...DEFAULT_VISIBILITY } as Visibility;
  for (const field of PRIVATE_FIELDS) {
    const v = input.visibility?.[field];
    visibility[field] = v === 'private' ? 'private' : v === 'public' ? 'public' : (current.visibility?.[field] ?? DEFAULT_VISIBILITY[field]);
  }

  const theme = (THEMES as readonly string[]).includes(String(input.theme)) ? (input.theme as StudentRow['theme']) : 'classic';
  const order = Array.isArray(input.section_order) ? input.section_order.map(String) : [];
  const section_order = [...new Set([...order.filter((s) => (SECTIONS as readonly string[]).includes(s)), ...SECTIONS])];
  const avatar = input.avatar === 'github' ? 'github' : 'initials';

  if (Object.keys(errors).length) return { ok: false, errors };

  const { data, error } = await db()
    .from('students')
    .update({
      name,
      headline,
      bio: text(input.bio, 2000),
      program: text(input.program, 80) || 'Computer Science',
      status,
      availability,
      skills,
      suggested_skills: suggested,
      links: { github: `https://github.com/${user.github_login}`, ...(linkedin ? { linkedin } : {}), ...(portfolio ? { portfolio } : {}) },
      location: text(input.location, 80),
      education: text(input.education, 300),
      experience,
      visibility,
      theme,
      section_order,
      avatar,
      avatar_url: user.github_avatar_url,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.user_id) // ownership: only the signed-in student's row
    .select('*')
    .single();
  if (error) throw error;
  return { ok: true, profile: data as StudentRow };
}

/** Publish or unpublish without deleting anything (R2.21, R2.22). */
export async function setPublished(user: AppUser, published: boolean): Promise<SaveResult> {
  const current = await getOrCreateMyProfile(user);
  if (published && (!current.name.trim() || !current.headline.trim())) {
    return { ok: false, errors: { publish: 'Add your name and headline, and save, before publishing.' } };
  }
  const { data, error } = await db()
    .from('students')
    .update({ profile_status: published ? 'published' : 'unpublished', updated_at: new Date().toISOString() })
    .eq('user_id', user.user_id)
    .select('*')
    .single();
  if (error) throw error;
  return { ok: true, profile: data as StudentRow };
}
