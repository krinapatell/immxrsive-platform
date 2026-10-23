import 'server-only';
import { db } from './db';
import { currentUserId } from './session';

export interface AppUser {
  user_id: string;
  github_id: number;
  github_login: string;
  github_avatar_url: string;
  affiliation_email: string | null;
  affiliation_verified_at: string | null;
}

/**
 * Find the internal account for a GitHub account, or create one.
 * Matching uses GitHub's permanent numeric id (R2.01, R2.02), so signing in
 * again — even after a username change — returns the same account.
 */
export async function upsertGithubUser(github: {
  id: number;
  login: string;
  avatar_url: string;
}): Promise<AppUser> {
  const { data: existing, error: findError } = await db()
    .from('app_users')
    .select('*')
    .eq('github_id', github.id)
    .maybeSingle();
  if (findError) throw findError;

  if (existing) {
    const { data, error } = await db()
      .from('app_users')
      .update({ github_login: github.login, github_avatar_url: github.avatar_url })
      .eq('user_id', existing.user_id)
      .select('*')
      .single();
    if (error) throw error;
    return data as AppUser;
  }

  const { data, error } = await db()
    .from('app_users')
    .insert({ github_id: github.id, github_login: github.login, github_avatar_url: github.avatar_url })
    .select('*')
    .single();
  if (error) throw error;
  return data as AppUser;
}

export async function getUser(userId: string): Promise<AppUser | null> {
  const { data, error } = await db().from('app_users').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return (data as AppUser) ?? null;
}

/** The signed-in user, or null when signed out (or the account no longer exists). */
export async function currentUser(): Promise<AppUser | null> {
  const id = await currentUserId();
  if (!id) return null;
  return getUser(id);
}

export function isVerified(user: AppUser | null): boolean {
  return !!user?.affiliation_verified_at;
}
