import { NextResponse } from 'next/server';
import { config, mail } from '@/lib/config';
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
    email_provider: mail.brevoKey ? 'brevo' : mail.resendKey ? 'resend' : null,
    MAIL_FROM: !!mail.from,
    supabase_project: config.supabaseUrl.replace(/^https:\/\//, '').split('.')[0] || null,
  };

  const database: Record<string, unknown> = {};
  const check = async (table: string, columns: string) => {
    try {
      const { count, error } = await db().from(table).select(columns, { count: 'exact' }).limit(1);
      database[table] = error ? `ERROR ${error.code ?? ''} ${error.message ?? ''}`.trim() : `ok, ${count ?? 0} rows`;
    } catch (err) {
      database[table] = `ERROR ${err instanceof Error ? err.message : 'unknown'}`;
    }
  };
  await check('students', 'id, profile_status, section_order, user_id');
  await check('skills', 'name');
  await check('projects', 'id, domain');
  await check('project_contributors', 'project_id, role');
  await check('app_users', 'user_id, github_id');
  await check('verification_challenges', 'id, code_hash');
  await check('inquiries', 'id, source_type');

  return NextResponse.json({ settings, database }, { headers: { 'Cache-Control': 'no-store' } });
}
