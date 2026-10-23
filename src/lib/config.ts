import 'server-only';
import { emailDomainAllowed } from './email-domain';

/**
 * All server-side settings in one place. Values come from environment
 * variables (set them in Vercel -> Project -> Settings -> Environment Variables).
 * See docs/SETUP.md for what each one means.
 */

function list(value: string | undefined, fallback: string[]): string[] {
  if (!value) return fallback;
  return value
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

function int(value: string | undefined, fallback: number): number {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const config = {
  /** Public base URL of the site, e.g. https://immxrsive-platform.vercel.app */
  siteUrl: (process.env.SITE_URL || '').replace(/\/$/, ''),

  /** Approved affiliation email domains (R2.04). Comma-separated, e.g. "algomau.ca". */
  allowedEmailDomains: list(process.env.ALLOWED_EMAIL_DOMAINS, ['algomau.ca']),

  /** Verification code lifetime in minutes (R2.07). Never more than 30. */
  verificationTtlMinutes: Math.min(int(process.env.VERIFICATION_TTL_MINUTES, 15), 30),

  /** R2.08: at most this many code emails per user, and per address, per window. */
  maxSendsPerWindow: int(process.env.VERIFICATION_MAX_SENDS, 3),
  sendWindowMinutes: int(process.env.VERIFICATION_SEND_WINDOW_MINUTES, 15),

  /** R2.08: wrong guesses allowed per code before it is cancelled. */
  maxWrongAttempts: int(process.env.VERIFICATION_MAX_ATTEMPTS, 5),

  /** Secret used to sign session cookies and hash codes. Long random string. */
  sessionSecret: process.env.SESSION_SECRET || '',

  githubClientId: process.env.GITHUB_CLIENT_ID || '',
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET || '',

  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
};

/** True when the email's domain is exactly one of the approved domains (R2.04, R2.05). */
export function isApprovedEmail(email: string): boolean {
  return emailDomainAllowed(email, config.allowedEmailDomains);
}
