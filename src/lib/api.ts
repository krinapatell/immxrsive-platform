import 'server-only';
import { NextResponse } from 'next/server';
import { ProjectError } from './projects';
import { currentUser, type AppUser } from './users';

/** Signed-in user or a 401 response. */
export async function requireUser(): Promise<{ user: AppUser; error: null } | { user: null; error: NextResponse }> {
  const user = await currentUser();
  if (!user) return { user: null, error: NextResponse.json({ error: 'Sign in with GitHub first.' }, { status: 401 }) };
  return { user, error: null };
}

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Turns known errors into clear JSON responses; logs anything unexpected. */
export function errorResponse(err: unknown): NextResponse {
  if (err instanceof ProjectError) return NextResponse.json({ error: err.message, ...err.extra }, { status: err.status });
  console.error('Unexpected error:', err instanceof Error ? err.message : err);
  return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
}
