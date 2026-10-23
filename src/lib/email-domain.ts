/**
 * Exact domain match on the text after the final "@" (R2.04).
 * "student@algomau.ca" passes; "x@algomau.ca.evil.com", "x@notalgomau.ca"
 * and "algomau.ca@gmail.com" do not.
 */
export function emailDomainAllowed(email: string, allowedDomains: string[]): boolean {
  const value = email.trim();
  const at = value.lastIndexOf('@');
  if (at <= 0 || at === value.length - 1) return false;
  const local = value.slice(0, at);
  const domain = value.slice(at + 1).toLowerCase();
  if (/[\s@]/.test(local) || /\s/.test(domain)) return false;
  return allowedDomains.map((d) => d.toLowerCase()).includes(domain);
}
