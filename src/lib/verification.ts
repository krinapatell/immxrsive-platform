import 'server-only';
import { randomInt } from 'node:crypto';
import { config, isApprovedEmail } from './config';
import { db } from './db';
import { sendMail, MailNotConfiguredError } from './mail';
import { keyedHash, safeEqual } from './session';

/**
 * Algoma affiliation verification (R2.04 – R2.09).
 *
 *  - Domain is checked here on the server, against a configurable list (R2.04, R2.05).
 *  - Codes are 6 random digits; only a keyed hash is stored (never the code itself).
 *  - Codes expire after VERIFICATION_TTL_MINUTES, capped at 30 (R2.07).
 *  - A code works once: consume_challenge() marks it used atomically (R2.06).
 *  - Sending is limited per user and per address; wrong guesses are limited
 *    per code, after which it is cancelled (R2.08).
 *  - Once verified, the account stays verified for future sign-ins (R2.09).
 */

export type Result = { ok: true; message: string } | { ok: false; status: number; message: string };

export async function requestCode(userId: string, rawEmail: string): Promise<Result> {
  const email = rawEmail.trim().toLowerCase();
  if (!isApprovedEmail(email)) {
    const domains = config.allowedEmailDomains.map((d) => `@${d}`).join(' or ');
    return { ok: false, status: 400, message: `Use your Algoma student email address (ending in ${domains}).` };
  }

  const since = new Date(Date.now() - config.sendWindowMinutes * 60_000).toISOString();
  const [{ count: byUser }, { count: byEmail }] = await Promise.all([
    db().from('verification_challenges').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', since),
    db().from('verification_challenges').select('id', { count: 'exact', head: true }).eq('email', email).gte('created_at', since),
  ]);
  if ((byUser ?? 0) >= config.maxSendsPerWindow || (byEmail ?? 0) >= config.maxSendsPerWindow) {
    return {
      ok: false,
      status: 429,
      message: `Too many codes requested. Please wait ${config.sendWindowMinutes} minutes, then request a new code. Your most recent code still works until it expires.`,
    };
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const expiresAt = new Date(Date.now() + config.verificationTtlMinutes * 60_000);

  const { data: challenge, error } = await db()
    .from('verification_challenges')
    .insert({ user_id: userId, email, code_hash: keyedHash(code), expires_at: expiresAt.toISOString() })
    .select('id')
    .single();
  if (error) throw error;

  try {
    await sendMail(
      email,
      'Your ImmXrsive verification code',
      `Your ImmXrsive verification code is ${code}.\n\n` +
        `It expires in ${config.verificationTtlMinutes} minutes and can only be used once.\n` +
        `If you didn't request this, you can ignore this email.`,
    );
  } catch (err) {
    // Remove the unsent challenge so it doesn't count against the student's limit.
    await db().from('verification_challenges').delete().eq('id', challenge.id);
    if (err instanceof MailNotConfiguredError) {
      return { ok: false, status: 503, message: 'Email sending is not set up on this deployment yet. Please contact the team.' };
    }
    console.error('Verification email failed:', err instanceof Error ? err.message : err);
    return { ok: false, status: 502, message: 'We could not send the email. Please try again in a minute.' };
  }

  return { ok: true, message: `We sent a 6-digit code to ${email}. It expires in ${config.verificationTtlMinutes} minutes.` };
}

export async function confirmCode(userId: string, rawCode: string): Promise<Result> {
  const code = rawCode.trim();
  if (!/^\d{6}$/.test(code)) {
    return { ok: false, status: 400, message: 'Enter the 6-digit code from the email.' };
  }

  // Only the most recent code for this user counts.
  const { data: challenge, error } = await db()
    .from('verification_challenges')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;

  if (!challenge) return { ok: false, status: 400, message: 'Request a code first.' };
  if (challenge.used_at) return { ok: false, status: 400, message: 'This code has already been used. Request a new code.' };
  if (new Date(challenge.expires_at) <= new Date()) {
    return { ok: false, status: 400, message: 'This code has expired. Request a new code.' };
  }
  if (challenge.attempts >= config.maxWrongAttempts) {
    return { ok: false, status: 429, message: 'Too many wrong attempts for this code. Request a new code.' };
  }

  if (!safeEqual(keyedHash(code), challenge.code_hash)) {
    const attempts = challenge.attempts + 1;
    await db().from('verification_challenges').update({ attempts }).eq('id', challenge.id);
    const left = config.maxWrongAttempts - attempts;
    return {
      ok: false,
      status: 400,
      message: left > 0 ? `That code is not correct. ${left} attempt${left === 1 ? '' : 's'} left.` : 'Too many wrong attempts for this code. Request a new code.',
    };
  }

  const { data: consumed, error: consumeError } = await db().rpc('consume_challenge', { p_id: challenge.id });
  if (consumeError) throw consumeError;
  if (consumed !== true) return { ok: false, status: 400, message: 'This code has already been used or has expired. Request a new code.' };

  const { error: updateError } = await db()
    .from('app_users')
    .update({ affiliation_email: challenge.email, affiliation_verified_at: new Date().toISOString() })
    .eq('user_id', userId);
  if (updateError) throw updateError;

  return { ok: true, message: 'Your Algoma affiliation is verified.' };
}
