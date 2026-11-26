/**
 * Active Talent vs Showcase Only, and stale availability (F.13, F.14).
 * No server imports, so it can be unit-tested directly.
 */

/** Availability older than this is not presented as current. */
export const STALE_AFTER_DAYS = 365;

export function staleCutoff(now = new Date()): string {
  return new Date(now.getTime() - STALE_AFTER_DAYS * 86_400_000).toISOString().slice(0, 10);
}

export type Talent = 'active' | 'stale' | 'showcase' | 'hidden';

/**
 * showcase: the student is not looking (work is shown, availability is not);
 * hidden:   the student keeps availability private;
 * stale:    looking, but not confirmed in the last year, so it is not shown as current;
 * active:   looking and recently confirmed.
 */
export function talentState(
  talent_state: string,
  confirmed_at: string | null,
  availabilityVisibility: string,
  now = new Date(),
): Talent {
  if (talent_state === 'showcase') return 'showcase';
  if (availabilityVisibility !== 'public') return 'hidden';
  if (!confirmed_at || confirmed_at < staleCutoff(now)) return 'stale';
  return 'active';
}
