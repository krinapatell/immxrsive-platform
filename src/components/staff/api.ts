'use client';

/** Small fetch helper for staff forms. Errors come back as plain-language messages. */
export async function send(url: string, method: string, body?: unknown) {
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: 'Could not reach the server. Check your connection and try again.' } };
  }
}

export const btn = {
  primary: 'rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60',
  secondary: 'rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold disabled:opacity-60',
  danger: 'rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-800 disabled:opacity-60',
};
