import 'server-only';
import { db } from './db';

/**
 * Non-public diagnostics (F.32). Records what went wrong, where and when,
 * so staff/developers can investigate failed integrations and server errors
 * at /staff/diagnostics. Never pass secrets, codes, tokens, cookies or file
 * contents in `context`: values that look like secrets are dropped.
 */
type Level = 'info' | 'warn' | 'error';

const SECRET_KEY = /(secret|token|password|code|key|cookie|authorization|session)/i;

function clean(context: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(context)) {
    if (SECRET_KEY.test(k)) continue;
    if (v === undefined) continue;
    out[k] = typeof v === 'string' ? v.slice(0, 500) : v;
  }
  return out;
}

export async function logEvent(level: Level, area: string, message: string, context: Record<string, unknown> = {}) {
  const line = `[${new Date().toISOString()}] ${level.toUpperCase()} ${area}: ${message}`;
  if (level === 'error') console.error(line, clean(context));
  else console.warn(line, clean(context));
  try {
    await db().from('app_events').insert({ level, area, message: message.slice(0, 500), context: clean(context) });
  } catch {
    // diagnostics must never break the request that is being diagnosed
  }
}

export async function recentEvents(limit = 100) {
  const { data, error } = await db().from('app_events').select('*').order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return (data ?? []) as { id: number; created_at: string; level: Level; area: string; message: string; context: Record<string, unknown> }[];
}
