import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { config } from './config';

/**
 * A tiny signed-cookie session. The cookie holds only our internal user id
 * and an expiry time, signed with SESSION_SECRET so it cannot be forged or
 * edited in the browser. It is httpOnly (JavaScript can't read it) and
 * secure in production.
 */
const COOKIE = 'imx_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 days

function sign(payload: string): string {
  if (!config.sessionSecret || config.sessionSecret.length < 32) {
    throw new Error('SESSION_SECRET must be set to a random string of at least 32 characters.');
  }
  return createHmac('sha256', config.sessionSecret).update(payload).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function encodeSession(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS }),
  ).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  try {
    if (!safeEqual(signature, sign(payload))) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof data.uid !== 'string' || typeof data.exp !== 'number') return null;
    if (data.exp < Math.floor(Date.now() / 1000)) return null;
    return data.uid;
  } catch {
    return null;
  }
}

/** The signed-in user's internal id, or null. */
export async function currentUserId(): Promise<string | null> {
  const store = await cookies();
  return decodeSession(store.get(COOKIE)?.value);
}

export async function startSession(userId: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, encodeSession(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

/** Hash used for verification codes and OAuth state, keyed by SESSION_SECRET. */
export function keyedHash(value: string): string {
  return sign(`hash:${value}`);
}

export { safeEqual };
