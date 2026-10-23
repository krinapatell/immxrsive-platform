import 'server-only';

/**
 * Sends one email. Supports two providers so the team can use whichever
 * works for them (see docs/SETUP.md):
 *  - Brevo:  BREVO_API_KEY + MAIL_FROM (a sender address verified in Brevo)
 *  - Resend: RESEND_API_KEY + MAIL_FROM (an address on a domain verified in Resend)
 * The code is never logged, returned to the browser or shown on screen.
 */
export class MailNotConfiguredError extends Error {}

export async function sendMail(to: string, subject: string, text: string): Promise<void> {
  const from = process.env.MAIL_FROM || '';
  const fromName = process.env.MAIL_FROM_NAME || 'ImmXrsive Talent Platform';

  if (process.env.BREVO_API_KEY && from) {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ sender: { email: from, name: fromName }, to: [{ email: to }], subject, textContent: text }),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Brevo send failed with status ${res.status}`);
    return;
  }

  if (process.env.RESEND_API_KEY && from) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: `${fromName} <${from}>`, to: [to], subject, text }),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Resend send failed with status ${res.status}`);
    return;
  }

  throw new MailNotConfiguredError('No email provider is configured.');
}
