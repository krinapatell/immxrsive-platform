import 'server-only';
import { db } from './db';
import { ProjectError } from './projects';
import type { StudentRow } from './students';
import type { AppUser } from './users';
import { logEvent } from './events';

/**
 * Final release: staff record management and profile claims.
 *  - Claims (F.07 - F.10): an imported profile with no owner can be claimed.
 *    It is approved automatically only when the claimant's VERIFIED Algoma
 *    email is the same as the email the old site had; everything else waits
 *    for staff. The private legacy email is never shown to the claimant.
 *  - Lifecycle (F.11 - F.16): staff can change status, talent state and
 *    publication, retire/restore, and reassign or unlink the owner.
 *  - Merge (F.17, F.18): duplicates are merged by staff, never automatically.
 *    The old public URL redirects to the record that was kept.
 *  - Maintainer recovery (F.19): staff can hand a project to another accepted
 *    contributor when the maintainer has left.
 */

type ClaimRow = {
  id: string;
  student_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  automatic: boolean;
  message: string;
  staff_note: string;
  reviewed_at: string | null;
  created_at: string;
};

const clean = (v: unknown, max: number) =>
  typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max) : '';

async function student(id: string) {
  const { data, error } = await db().from('students').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as (StudentRow & { legacy_email: string | null; legacy_claimed: boolean | null; created_at: string; updated_at: string }) | null;
}

async function update(table: string, values: Record<string, unknown>, col: string, val: string) {
  const { error } = await db().from(table).update(values).eq(col, val);
  if (error) throw error;
}

// ------------------------------------------------------------------ claims

/** Profiles that came from the old site and have no owner yet. */
export const isClaimable = (s: { legacy_id: string | null; user_id: string | null; merged_into: string | null }) =>
  !!s.legacy_id && !s.user_id && !s.merged_into;

/** What the claim box on a public profile should show this visitor. */
export async function claimState(studentId: string, user: AppUser | null) {
  const s = await student(studentId);
  if (!s || !isClaimable(s)) return { claimable: false as const };
  if (!user) return { claimable: true as const, signedIn: false, verified: false, pending: false, rejected: null as string | null };
  const { data } = await db()
    .from('profile_claims')
    .select('status, staff_note, created_at')
    .eq('student_id', studentId)
    .eq('user_id', user.user_id)
    .order('created_at', { ascending: false })
    .limit(1);
  const last = data?.[0];
  return {
    claimable: true as const,
    signedIn: true,
    verified: !!user.affiliation_verified_at,
    pending: last?.status === 'pending',
    rejected: last?.status === 'rejected' ? ((last.staff_note as string) || 'Staff could not confirm this profile is yours.') : null,
  };
}

/**
 * The signed-in student says an imported profile is theirs.
 * Returns 'approved' (verified email matched) or 'pending' (staff review).
 */
export async function submitClaim(user: AppUser, studentId: string, messageInput: unknown) {
  if (!user.affiliation_verified_at || !user.affiliation_email) {
    throw new ProjectError(403, 'Verify your Algoma email first, so we know you are a real Algoma student or alum.');
  }
  const s = await student(studentId);
  if (!s || !isClaimable(s)) throw new ProjectError(409, 'This profile already has an owner, or it cannot be claimed.');
  const message = clean(messageInput, 600);
  const emailMatches = !!s.legacy_email && s.legacy_email.toLowerCase() === user.affiliation_email.toLowerCase();
  if (!emailMatches && message.length < 10) {
    throw new ProjectError(400, 'Tell staff how they can tell this profile is yours (for example the projects you worked on).', {
      errors: { message: 'Write at least a short sentence for staff.' },
    });
  }
  const { data: open } = await db().from('profile_claims').select('id').eq('student_id', studentId).eq('user_id', user.user_id).eq('status', 'pending');
  if (open?.length) throw new ProjectError(409, 'You already asked to claim this profile. Staff will review it.');

  const { data: claim, error } = await db()
    .from('profile_claims')
    .insert({ student_id: studentId, user_id: user.user_id, message, automatic: emailMatches })
    .select('*')
    .single();
  if (error) throw error;
  if (emailMatches) {
    await approveClaim(null, claim.id as string, 'Approved automatically: the verified email matches the old profile.');
    return { status: 'approved' as const, profile_id: studentId };
  }
  return { status: 'pending' as const };
}

/** Gives the profile to the claimant. Their own earlier profile (if any) is merged in, so nothing is lost. */
async function approveClaim(staff: AppUser | null, claimId: string, note: string) {
  const { data: c, error } = await db().from('profile_claims').select('*').eq('id', claimId).maybeSingle();
  if (error) throw error;
  const claim = c as ClaimRow | null;
  if (!claim || claim.status !== 'pending') throw new ProjectError(409, 'This claim was already decided.');
  const target = await student(claim.student_id);
  if (!target || !isClaimable(target)) throw new ProjectError(409, 'This profile already has an owner. Reject the claim or unlink the owner first.');

  const { data: mine } = await db().from('students').select('*').eq('user_id', claim.user_id).maybeSingle();
  const own = mine as StudentRow | null;
  if (own) {
    // The claimant already made a profile on the new site: fold it into the imported one.
    await mergeStudentRecords(own.id, target.id, { moveOwner: false });
    await update('students', { user_id: null }, 'id', own.id);
  }
  await update('students', { user_id: claim.user_id, legacy_claimed: true, updated_at: new Date().toISOString() }, 'id', target.id);
  const now = new Date().toISOString();
  await db()
    .from('profile_claims')
    .update({ status: 'approved', staff_note: note, reviewed_by: staff?.user_id ?? null, reviewed_at: now })
    .eq('id', claimId);
  // Anyone else waiting on the same profile is told it was given to someone else.
  await db()
    .from('profile_claims')
    .update({ status: 'rejected', staff_note: 'This profile was given to another account. Contact ImmXrsive staff if you think that is wrong.', reviewed_at: now })
    .eq('student_id', target.id)
    .eq('status', 'pending');
  await logEvent('info', 'claims', 'Profile claim approved', { claim_id: claimId, student_id: target.id, automatic: !staff });
}

export async function decideClaim(staff: AppUser, claimId: string, approve: boolean, noteInput: unknown) {
  const note = clean(noteInput, 600);
  if (approve) return approveClaim(staff, claimId, note || 'Approved by staff.');
  if (note.length < 5) throw new ProjectError(400, 'Tell the student why the claim was rejected.', { errors: { staff_note: 'Write a short reason.' } });
  const { data, error } = await db()
    .from('profile_claims')
    .update({ status: 'rejected', staff_note: note, reviewed_by: staff.user_id, reviewed_at: new Date().toISOString() })
    .eq('id', claimId)
    .eq('status', 'pending')
    .select('id');
  if (error) throw error;
  if (!data?.length) throw new ProjectError(409, 'This claim was already decided.');
}

/** Pending claims for the staff queue, with what staff need to judge them. */
export async function pendingClaims(studentId?: string) {
  let q = db().from('profile_claims').select('*').eq('status', 'pending').order('created_at');
  if (studentId) q = q.eq('student_id', studentId);
  const { data, error } = await q;
  if (error) throw error;
  const claims = (data ?? []) as ClaimRow[];
  if (!claims.length) return [];
  const [{ data: s }, { data: u }] = await Promise.all([
    db().from('students').select('id, name, legacy_id, legacy_email').in('id', [...new Set(claims.map((c) => c.student_id))]),
    db().from('app_users').select('user_id, github_login, affiliation_email, affiliation_verified_at').in('user_id', [...new Set(claims.map((c) => c.user_id))]),
  ]);
  const sm = new Map((s ?? []).map((x) => [x.id as string, x]));
  const um = new Map((u ?? []).map((x) => [x.user_id as string, x]));
  return claims.map((c) => ({
    id: c.id,
    student_id: c.student_id,
    student_name: (sm.get(c.student_id)?.name as string) ?? c.student_id,
    legacy_email: (sm.get(c.student_id)?.legacy_email as string | null) ?? null, // staff only
    github_login: (um.get(c.user_id)?.github_login as string) ?? 'unknown account',
    verified_email: (um.get(c.user_id)?.affiliation_email as string | null) ?? null,
    message: c.message,
    created_at: c.created_at,
  }));
}

/** The signed-in student's own claims, so they can see the decision. */
export async function myClaims(user: AppUser) {
  const { data, error } = await db().from('profile_claims').select('id, student_id, status, staff_note, created_at').eq('user_id', user.user_id).order('created_at', { ascending: false }).limit(10);
  if (error) throw error;
  return data ?? [];
}

// ------------------------------------------------------- student records

/**
 * Moves everything attached to `fromId` onto `toId`: project roles,
 * collaboration links, requests. If both were on the same project, the kept
 * record's role stays. Then `fromId` is hidden and points at `toId`.
 */
async function mergeStudentRecords(fromId: string, toId: string, opts: { moveOwner: boolean }) {
  const [{ data: fromLinks }, { data: toLinks }] = await Promise.all([
    db().from('project_contributors').select('project_id').eq('student_id', fromId),
    db().from('project_contributors').select('project_id').eq('student_id', toId),
  ]);
  const toProjects = new Set((toLinks ?? []).map((l) => l.project_id as string));
  for (const l of fromLinks ?? []) {
    const pid = l.project_id as string;
    if (toProjects.has(pid)) {
      const { error } = await db().from('project_contributors').delete().eq('project_id', pid).eq('student_id', fromId);
      if (error) throw error;
    } else {
      const { error } = await db().from('project_contributors').update({ student_id: toId }).eq('project_id', pid).eq('student_id', fromId);
      if (error) throw error;
    }
  }
  await update('projects', { maintainer_student_id: toId }, 'maintainer_student_id', fromId);
  const { data: cs } = await db().from('collaboration_students').select('collaboration_id').eq('student_id', fromId);
  const { data: ct } = await db().from('collaboration_students').select('collaboration_id').eq('student_id', toId);
  const have = new Set((ct ?? []).map((x) => x.collaboration_id as string));
  for (const x of cs ?? []) {
    const cid = x.collaboration_id as string;
    if (have.has(cid)) await db().from('collaboration_students').delete().eq('collaboration_id', cid).eq('student_id', fromId);
    else await db().from('collaboration_students').update({ student_id: toId }).eq('collaboration_id', cid).eq('student_id', fromId);
  }
  await update('project_verification_requests', { requested_by: toId }, 'requested_by', fromId);
  await update('partner_requests', { requested_by: toId }, 'requested_by', fromId);
  await db()
    .from('profile_claims')
    .update({ status: 'rejected', staff_note: 'This profile was merged into another one.', reviewed_at: new Date().toISOString() })
    .eq('student_id', fromId)
    .eq('status', 'pending');

  const from = await student(fromId);
  const to = await student(toId);
  const patch: Record<string, unknown> = {
    merged_into: toId,
    profile_status: from?.profile_status === 'draft' ? 'draft' : 'unpublished',
    updated_at: new Date().toISOString(),
  };
  if (opts.moveOwner && from?.user_id && to && !to.user_id) {
    await update('students', { user_id: null, ...patch }, 'id', fromId);
    await update('students', { user_id: from.user_id }, 'id', toId);
    return;
  }
  await update('students', patch, 'id', fromId);
  // Skills from both records are kept on the merged profile.
  if (from && to) {
    const skills = [...new Set([...(to.skills ?? []), ...(from.skills ?? [])])];
    if (skills.length !== (to.skills ?? []).length) await update('students', { skills }, 'id', toId);
  }
}

/** Staff merge (F.17). The kept record keeps its id, so its URL never changes; the other URL redirects to it. */
export async function mergeStudents(staff: AppUser, fromId: string, toIdInput: unknown) {
  const toId = clean(toIdInput, 40);
  if (!toId || toId === fromId) throw new ProjectError(400, 'Choose the other profile to keep.', { errors: { merge_into: 'Enter the id of the profile to keep, for example LS01.' } });
  const [from, to] = await Promise.all([student(fromId), student(toId)]);
  if (!from || !to) throw new ProjectError(404, 'One of the profiles was not found.', { errors: { merge_into: `There is no profile with id ${toId}.` } });
  if (from.merged_into || to.merged_into) throw new ProjectError(409, 'One of these profiles was already merged. Use the profile it was merged into.');
  if (from.user_id && to.user_id) {
    throw new ProjectError(409, 'Both profiles have an owner. Unlink one owner first, then merge.', { errors: { merge_into: 'Both profiles belong to different accounts.' } });
  }
  await mergeStudentRecords(fromId, toId, { moveOwner: true });
  await logEvent('info', 'staff', 'Student profiles merged', { from: fromId, to: toId, by: staff.user_id });
  return { merged_into: toId };
}

/** Follows merges so old links keep working (F.18). Returns null when the id was never merged. */
export async function studentRedirect(id: string): Promise<string | null> {
  let current = id;
  for (let i = 0; i < 5; i++) {
    const { data } = await db().from('students').select('merged_into').eq('id', current).maybeSingle();
    if (!data?.merged_into) return current === id ? null : current;
    current = data.merged_into as string;
  }
  return current;
}

export async function companyRedirect(id: string): Promise<string | null> {
  let current = id;
  for (let i = 0; i < 5; i++) {
    const { data } = await db().from('companies').select('merged_into').eq('id', current).maybeSingle();
    if (!data?.merged_into) return current === id ? null : current;
    current = data.merged_into as string;
  }
  return current;
}

const PAGE = 50;

/** Staff list of every profile (all states), with duplicate hints. */
export async function staffStudents(qInput: string, page = 1) {
  const q = clean(qInput, 60).replace(/[,()*%\\:."]/g, ' ').trim();
  let query = db()
    .from('students')
    .select('id, name, status, profile_status, talent_state, user_id, legacy_id, legacy_email, merged_into, availability_confirmed_at', { count: 'exact' })
    .order('id')
    .range((page - 1) * PAGE, page * PAGE - 1);
  if (q) query = query.or(`name.ilike.*${q}*,id.ilike.*${q}*,legacy_id.ilike.*${q}*`);
  const { data, count, error } = await query;
  if (error) throw error;
  const rows = data ?? [];
  const emails = [...new Set(rows.map((r) => r.legacy_email as string | null).filter((e): e is string => !!e))];
  const shared = new Map<string, string[]>();
  if (emails.length) {
    const { data: same } = await db().from('students').select('id, legacy_email').in('legacy_email', emails).is('merged_into', null);
    for (const s of same ?? []) shared.set(s.legacy_email as string, [...(shared.get(s.legacy_email as string) ?? []), s.id as string]);
  }
  return {
    total: count ?? 0,
    page,
    pageSize: PAGE,
    students: rows.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      status: r.status as string,
      profile_status: r.profile_status as string,
      talent_state: r.talent_state as string,
      owned: !!r.user_id,
      legacy_id: r.legacy_id as string | null,
      merged_into: r.merged_into as string | null,
      possible_duplicates: r.merged_into ? [] : (shared.get(r.legacy_email as string) ?? []).filter((id) => id !== r.id),
    })),
  };
}

/** Possible duplicate pairs still waiting for a staff decision (for the staff home). */
export async function duplicateHints() {
  const { data: s } = await db().from('students').select('id, name, legacy_email').not('legacy_email', 'is', null).is('merged_into', null);
  const byEmail = new Map<string, { id: string; name: string }[]>();
  for (const r of s ?? []) byEmail.set(r.legacy_email as string, [...(byEmail.get(r.legacy_email as string) ?? []), { id: r.id as string, name: r.name as string }]);
  const students = [...byEmail.values()].filter((g) => g.length > 1);
  const { data: c } = await db().from('companies').select('id, name, domain').neq('domain', '').is('merged_into', null);
  const byDomain = new Map<string, { id: string; name: string }[]>();
  for (const r of c ?? []) byDomain.set(r.domain as string, [...(byDomain.get(r.domain as string) ?? []), { id: r.id as string, name: r.name as string }]);
  const companies = [...byDomain.values()].filter((g) => g.length > 1);
  return { students, companies };
}

/** Everything staff see on one profile's admin page. */
export async function studentAdmin(id: string) {
  const s = await student(id);
  if (!s) return null;
  const [{ data: owner }, { data: links }, claims] = await Promise.all([
    s.user_id
      ? db().from('app_users').select('github_login, affiliation_email, affiliation_verified_at').eq('user_id', s.user_id).maybeSingle()
      : Promise.resolve({ data: null }),
    db().from('project_contributors').select('project_id, role, status').eq('student_id', id),
    pendingClaims(id),
  ]);
  const pids = (links ?? []).map((l) => l.project_id as string);
  const { data: projects } = pids.length ? await db().from('projects').select('id, title, maintainer_student_id').in('id', pids) : { data: [] };
  const pm = new Map((projects ?? []).map((p) => [p.id as string, p]));
  const { data: dupes } = s.legacy_email
    ? await db().from('students').select('id, name').eq('legacy_email', s.legacy_email).neq('id', id).is('merged_into', null)
    : { data: [] };
  return {
    student: s,
    owner: owner as { github_login: string; affiliation_email: string | null; affiliation_verified_at: string | null } | null,
    projects: (links ?? []).map((l) => ({
      id: l.project_id as string,
      title: (pm.get(l.project_id as string)?.title as string) ?? l.project_id,
      role: l.role as string,
      status: l.status as string,
      maintainer: pm.get(l.project_id as string)?.maintainer_student_id === id,
    })),
    claims,
    possible_duplicates: (dupes ?? []) as { id: string; name: string }[],
  };
}

const LIFECYCLE: Record<string, StudentRow['profile_status']> = {
  publish: 'published',
  unpublish: 'unpublished',
  retire: 'retired',
  restore: 'published',
};

/** One staff change to a profile. Every change is checked here, on the server. */
export async function staffUpdateStudent(staff: AppUser, id: string, body: Record<string, unknown>) {
  const s = await student(id);
  if (!s) throw new ProjectError(404, 'Profile not found.');
  if (s.merged_into && body.action !== 'unmerge') throw new ProjectError(409, `This profile was merged into ${s.merged_into}. Make changes there.`);
  const now = new Date().toISOString();
  switch (body.action) {
    case 'status': {
      const status = body.status === 'alumni' ? 'alumni' : body.status === 'current' ? 'current' : null;
      if (!status) throw new ProjectError(400, 'Choose Current student or Alumni.');
      await update('students', { status, updated_at: now }, 'id', id);
      break;
    }
    case 'talent': {
      const talent = body.talent_state === 'showcase' ? 'showcase' : body.talent_state === 'active' ? 'active' : null;
      if (!talent) throw new ProjectError(400, 'Choose Active Talent or Showcase Only.');
      await update('students', { talent_state: talent, updated_at: now }, 'id', id);
      break;
    }
    case 'publish':
    case 'unpublish':
    case 'retire':
    case 'restore': {
      const next = LIFECYCLE[body.action as string];
      if (next === 'published' && !s.name.trim()) throw new ProjectError(400, 'The profile needs a name before it can be published.');
      await update('students', { profile_status: next, updated_at: now }, 'id', id);
      break;
    }
    case 'unlink_owner': {
      if (!s.user_id) throw new ProjectError(409, 'This profile has no owner.');
      await update('students', { user_id: null, updated_at: now }, 'id', id);
      break;
    }
    case 'assign_owner': {
      const login = clean(body.github_login, 60).replace(/^@/, '');
      if (!login) throw new ProjectError(400, 'Enter the GitHub username of the new owner.', { errors: { github_login: 'Enter a GitHub username.' } });
      const { data: u } = await db().from('app_users').select('user_id').ilike('github_login', login).maybeSingle();
      if (!u) {
        throw new ProjectError(404, `No one has signed in with the GitHub account ${login} yet. Ask them to sign in once, then try again.`, {
          errors: { github_login: 'This person has not signed in to ImmXrsive yet.' },
        });
      }
      const { data: theirs } = await db().from('students').select('id').eq('user_id', u.user_id).maybeSingle();
      if (theirs && theirs.id !== id) {
        throw new ProjectError(409, `${login} already owns profile ${theirs.id}. Merge that profile into this one instead, or unlink it first.`, {
          errors: { github_login: `Already owns ${theirs.id}.` },
        });
      }
      await update('students', { user_id: u.user_id, legacy_claimed: s.legacy_id ? true : s.legacy_claimed, updated_at: now }, 'id', id);
      break;
    }
    case 'merge':
      return mergeStudents(staff, id, body.merge_into);
    default:
      throw new ProjectError(400, 'Unknown action.');
  }
  await logEvent('info', 'staff', `Profile change: ${String(body.action)}`, { student_id: id, by: staff.user_id });
  return { ok: true };
}

// --------------------------------------------------------------- companies

/** Staff merge of two companies (F.17): collaborations, partner links and requests move to the kept company. */
export async function mergeCompanies(staff: AppUser, fromId: string, toIdInput: unknown) {
  const toId = clean(toIdInput, 40);
  if (!toId || toId === fromId) throw new ProjectError(400, 'Choose the company to keep.', { errors: { merge_into: 'Choose the company to keep.' } });
  const { data: rows } = await db().from('companies').select('id, merged_into, status').in('id', [fromId, toId]);
  if ((rows ?? []).length !== 2) throw new ProjectError(404, 'One of the companies was not found.');
  if ((rows ?? []).some((r) => r.merged_into)) throw new ProjectError(409, 'One of these companies was already merged.');

  await update('collaborations', { company_id: toId, updated_at: new Date().toISOString() }, 'company_id', fromId);
  const [{ data: fromP }, { data: toP }] = await Promise.all([
    db().from('project_partners').select('project_id').eq('company_id', fromId),
    db().from('project_partners').select('project_id').eq('company_id', toId),
  ]);
  const has = new Set((toP ?? []).map((p) => p.project_id as string));
  for (const p of fromP ?? []) {
    const pid = p.project_id as string;
    if (has.has(pid)) await db().from('project_partners').delete().eq('project_id', pid).eq('company_id', fromId);
    else await db().from('project_partners').update({ company_id: toId }).eq('project_id', pid).eq('company_id', fromId);
  }
  await update('partner_requests', { company_id: toId }, 'company_id', fromId);
  await update('company_imports', { company_id: toId }, 'company_id', fromId);
  await update('companies', { merged_into: toId, status: 'draft', updated_at: new Date().toISOString() }, 'id', fromId);
  await logEvent('info', 'staff', 'Companies merged', { from: fromId, to: toId, by: staff.user_id });
  return { merged_into: toId };
}

// -------------------------------------------------------- maintainer (F.19)

export async function projectAdmin(id: string) {
  const { data: p, error } = await db().from('projects').select('id, title, maintainer_student_id, publish_status, demo_url, demo_status, demo_note').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!p) return null;
  const { data: links } = await db().from('project_contributors').select('student_id, role, status').eq('project_id', id);
  const ids = (links ?? []).map((l) => l.student_id as string);
  const { data: people } = ids.length ? await db().from('students').select('id, name, user_id, profile_status').in('id', ids) : { data: [] };
  const pm = new Map((people ?? []).map((x) => [x.id as string, x]));
  return {
    project: p,
    contributors: (links ?? []).map((l) => ({
      student_id: l.student_id as string,
      name: (pm.get(l.student_id as string)?.name as string) ?? l.student_id,
      role: l.role as string,
      status: l.status as string,
      has_account: !!pm.get(l.student_id as string)?.user_id,
      profile_status: (pm.get(l.student_id as string)?.profile_status as string) ?? '',
    })),
  };
}

export async function setMaintainer(staff: AppUser, projectId: string, studentIdInput: unknown) {
  const sid = clean(studentIdInput, 40);
  const { data: link } = await db().from('project_contributors').select('status').eq('project_id', projectId).eq('student_id', sid).maybeSingle();
  if (!link || link.status !== 'accepted') {
    throw new ProjectError(400, 'The new maintainer must be an accepted contributor on this project.', { errors: { maintainer: 'Choose an accepted contributor.' } });
  }
  await update('projects', { maintainer_student_id: sid, updated_at: new Date().toISOString() }, 'id', projectId);
  await logEvent('info', 'staff', 'Project maintainer changed', { project_id: projectId, student_id: sid, by: staff.user_id });
  return { maintainer_student_id: sid };
}

export async function staffProjects(qInput: string) {
  const q = clean(qInput, 60).replace(/[,()*%\\:."]/g, ' ').trim();
  let query = db().from('projects').select('id, title, maintainer_student_id, publish_status, demo_status').order('id').limit(50);
  if (q) query = query.or(`title.ilike.*${q}*,id.ilike.*${q}*`);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

// ------------------------------------------------------------ demos (F.36)

const DEMO_STATUSES = ['available', 'unavailable', 'archived', 'replaced'] as const;

/** Staff can mark a demo as broken or archived so visitors get the fallback instead (F.36, F.37). */
export async function setDemoStatus(staff: AppUser, projectId: string, statusInput: unknown, noteInput: unknown) {
  const status = DEMO_STATUSES.find((s) => s === statusInput);
  if (!status) throw new ProjectError(400, 'Choose a demo status.');
  const demo_note = clean(noteInput, 300);
  const { data, error } = await db().from('projects').update({ demo_status: status, demo_note, updated_at: new Date().toISOString() }).eq('id', projectId).select('id');
  if (error) throw error;
  if (!data?.length) throw new ProjectError(404, 'Project not found.');
  await logEvent('info', 'staff', 'Demo status changed', { project_id: projectId, status, by: staff.user_id });
  return { demo_status: status, demo_note };
}

// ------------------------------------------------------ practice data (QA)

/**
 * Creates a fresh, clearly labelled pair of duplicate profiles and a shared
 * project, so each reviewer can test merge, redirect and maintainer recovery
 * (Final Peer QA scenario D) without using up the one duplicate in the fixture.
 */
export async function createPracticePair(staff: AppUser) {
  const tag = Math.random().toString(36).slice(2, 6).toUpperCase();
  const email = `qa-practice-${tag.toLowerCase()}@example.test`;
  const base = {
    status: 'current',
    profile_status: 'published',
    talent_state: 'active',
    availability: ['internship'],
    availability_confirmed_at: new Date().toISOString().slice(0, 10),
    legacy_email: email,
    legacy_claimed: false,
    program: 'Computer Science',
    headline: 'QA practice record (not a real person)',
    skills: ['Unity'],
  };
  const a = `QA${tag}A`;
  const b = `QA${tag}B`;
  const { error: sErr } = await db()
    .from('students')
    .insert([
      { id: a, legacy_id: a, name: `QA Practice Student ${tag}`, ...base },
      { id: b, legacy_id: b, name: `QA Practice Student ${tag} (duplicate)`, ...base },
    ]);
  if (sErr) throw sErr;
  const pid = `QAP${tag}`;
  const { error: pErr } = await db().from('projects').insert({
    id: pid,
    title: `QA Practice Project ${tag}`,
    description: 'A practice project for testing merge and maintainer recovery. Not real work.',
    technologies: ['Unity'],
    publish_status: 'published',
    maintainer_student_id: b,
  });
  if (pErr) throw pErr;
  const { error: lErr } = await db()
    .from('project_contributors')
    .insert([
      { project_id: pid, student_id: b, role: 'XR Developer', status: 'accepted' },
      { project_id: pid, student_id: 'S02', role: '3D Artist', status: 'accepted' },
    ]);
  if (lErr) {
    // S02 may not exist on every database: keep the pair with one contributor.
    await db().from('project_contributors').insert({ project_id: pid, student_id: b, role: 'XR Developer', status: 'accepted' });
  }
  await logEvent('info', 'staff', 'Practice duplicate pair created', { a, b, project: pid, by: staff.user_id });
  return { keep: a, duplicate: b, project: pid };
}
