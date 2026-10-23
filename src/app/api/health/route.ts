import { NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { db } from '@/lib/db';

/**
 * Setup check. Shows which settings are present (never their values) and
 * whether the database answers, so the team can tell what's missing.
 */
export async function GET() {
  const settings = {
    SUPABASE_URL: !!config.supabaseUrl,
    SUPABASE_URL_looks_right: /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(config.supabaseUrl),
    SUPABASE_SERVICE_ROLE_KEY: !!config.supabaseServiceKey,
    GITHUB_CLIENT_ID: !!config.githubClientId,
    GITHUB_CLIENT_SECRET: !!config.githubClientSecret,
    SESSION_SECRET_long_enough: config.sessionSecret.length >= 32,
    SITE_URL: config.siteUrl || null,
    ALLOWED_EMAIL_DOMAINS: config.allowedEmailDomains,
    email_provider: process.env.BREVO_API_KEY ? 'brevo' : process.env.RESEND_API_KEY ? 'resend' : null,
    MAIL_FROM: !!process.env.MAIL_FROM,
  };

  let database: { ok: boolean; students?: number; error?: string } = { ok: false };
  try {
    const { count, error } = await db().from('students').select('id', { count: 'exact', head: true });
    database = error ? { ok: false, error: `${error.code ?? ''} ${error.message ?? ''}`.trim() || 'unknown error' } : { ok: true, students: count ?? 0 };
  } catch (err) {
    database = { ok: false, error: err instanceof Error ? err.message : 'unknown error' };
  }

  return NextResponse.json({ settings, database }, { headers: { 'Cache-Control': 'no-store' } });
}
