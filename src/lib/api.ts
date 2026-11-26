import 'server-only';
import { NextResponse } from 'next/server';
import { ProjectError } from './projects';
import { currentUser, type AppUser } from './users';
import { logEvent } from './events';

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
export function errorResponse(err: unknown, area = 'api'): NextResponse {
  if (err instanceof ProjectError) return NextResponse.json({ error: err.message, ...err.extra }, { status: err.status });
  // Database errors are plain objects ({ code, message, details, hint }), not Error instances.
  const e = (err && typeof err === 'object' ? err : {}) as Record<string, unknown>;
  const text = (v: unknown) => (typeof v === 'string' && v ? v.slice(0, 300) : undefined);
  void logEvent('error', area, err instanceof Error ? err.message : (text(e.message) ?? 'Unexpected error'), {
    kind: err instanceof Error ? err.name : typeof err,
    db_sqlstate: text(e.code),
    db_details: text(e.details),
    db_hint: text(e.hint),
    stack: err instanceof Error ? (err.stack ?? '').split('\n').slice(0, 4).join(' | ') : undefined,
  });
  return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
}
