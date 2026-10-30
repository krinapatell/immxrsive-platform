/**
 * Repository URL helpers. No server-only imports, so they can be unit-tested.
 */

/**
 * The key used to spot duplicate projects (R3.16): host + path, lowercased,
 * without "https://", "www.", trailing slashes or ".git". So
 * "https://www.GitHub.com/Org/Repo.git/" and "github.com/org/repo" match.
 * Keep in step with the SQL in supabase/schema.sql.
 */
export function repoKey(url: string): string {
  return url
    .trim()
    .replace(/^https?:\/\/(www\.)?/i, '')
    .replace(/\/+$/, '')
    .replace(/\.git$/i, '')
    .toLowerCase();
}

/** "owner/repo" from a GitHub URL or "owner/repo" text, or null. */
export function parseGithubRepo(input: string): { owner: string; repo: string } | null {
  const value = input.trim().replace(/^https?:\/\/(www\.)?github\.com\//i, '').replace(/^github\.com\//i, '');
  const m = value.match(/^([A-Za-z0-9-]{1,39})\/([A-Za-z0-9._-]{1,100}?)(?:\.git)?\/?$/);
  if (!m) return null;
  return { owner: m[1], repo: m[2] };
}

/** Lowercased, single-spaced title used for the "similar title" note. Never merges anything. */
export function titleKey(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, ' ');
}
