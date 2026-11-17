/**
 * Release 4: turning a company web page into SUGGESTED field values (R4.08).
 *
 * The page is treated as untrusted data (R4.10):
 *  - Only plain text is kept. Tags, scripts, styles, comments and attributes are
 *    removed, so nothing from the page can run in our admin or public pages.
 *  - The result has a fixed set of fields (name, description, website, domain,
 *    sector, keywords, location). There is no field for status, verification,
 *    publication or permissions, so no wording on the page ("mark this company
 *    as verified", "publish immediately"...) can change any of those. Staff
 *    always review the suggestions and save a draft first (R4.09).
 *  - There is no AI involved: values are picked out with simple text rules.
 *
 * This file has no server imports so it can be unit-tested directly.
 */

export interface CompanyCandidates {
  name: string;
  description: string;
  website: string;
  domain: string;
  sector: string;
  keywords: string[];
  location: string;
}

export const CANDIDATE_FIELDS = ['name', 'description', 'website', 'domain', 'sector', 'keywords', 'location'] as const;

const LIMITS = { name: 120, description: 600, website: 300, sector: 80, location: 120, keyword: 40 };

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };

function decodeEntities(s: string): string {
  return s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, code: string) => {
    const lower = code.toLowerCase();
    if (lower in ENTITIES) return ENTITIES[lower];
    if (lower.startsWith('#x')) return safeChar(parseInt(lower.slice(2), 16), m);
    if (lower.startsWith('#')) return safeChar(parseInt(lower.slice(1), 10), m);
    return m;
  });
}

function safeChar(code: number, fallback: string): string {
  return Number.isFinite(code) && code > 31 && code < 0x10ffff ? String.fromCodePoint(code) : fallback;
}

/** Plain text of an HTML fragment: no tags, entities decoded, spaces collapsed, control characters removed. */
export function plainText(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, ' '))
    .replace(/[<>]/g, ' ')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Removes parts of a page that are never content. */
function stripNonContent(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|template|iframe|object|svg)\b[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<(script|style|noscript|template|iframe|object|svg)\b[^>]*>/gi, ' ');
}

function firstMatch(html: string, re: RegExp): string {
  const m = html.match(re);
  return m ? plainText(m[1]) : '';
}

function allMatches(html: string, re: RegExp): string[] {
  return [...html.matchAll(re)].map((m) => plainText(m[1])).filter(Boolean);
}

function metaContent(html: string, name: string): string {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const key = tag.match(/\b(?:name|property)\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
    if (key === name) return plainText(tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i)?.[1] ?? '');
  }
  return '';
}

function cut(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

/** Words we recognise, mapped to the keyword staff will see. */
const KEYWORD_RULES: [RegExp, string][] = [
  [/\bsimulations?\b/i, 'simulation'],
  [/\b(xr|extended reality|virtual reality|vr|augmented reality|ar|mixed reality|spatial computing)\b/i, 'XR'],
  [/\b(training|onboarding)\b/i, 'training'],
  [/\b(game|games|gaming)\b/i, 'games'],
  [/\bvisuali[sz]ation\b/i, 'visualization'],
  [/\barchitectur(e|al)\b/i, 'architecture'],
  [/\b(healthcare|medical|health)\b/i, 'healthcare'],
  [/\b(education|learning)\b/i, 'education'],
  [/\b(prototype|prototypes|prototyping)\b/i, 'prototyping'],
];

function keywordsFrom(text: string): string[] {
  return KEYWORD_RULES.filter(([re]) => re.test(text)).map(([, k]) => k).slice(0, 10);
}

function sectorFrom(keywords: string[]): string {
  if (keywords.includes('XR') || keywords.includes('simulation')) return 'Immersive technology & simulation';
  if (keywords.includes('games')) return 'Games';
  if (keywords.includes('visualization')) return 'Visualization';
  return '';
}

/** "Location: Sault Ste. Marie, Ontario, Canada" or "located in Vancouver, British Columbia". */
function locationFrom(paragraphs: string[]): string {
  for (const p of paragraphs) {
    const labelled = p.match(/^(?:location|address|based in|headquarters)\s*[:\-]\s*(.+)$/i);
    if (labelled) return cleanLocation(labelled[1]);
  }
  for (const p of paragraphs) {
    const inline = p.match(/\b(?:located|based) in ([A-Z][\w.'-]*(?: [A-Z][\w.'-]*)*(?:, [A-Z][\w.'-]*(?: [A-Z][\w.'-]*)*)?)/);
    if (inline) return cleanLocation(inline[1]);
  }
  return '';
}

function cleanLocation(raw: string): string {
  return cut(raw.replace(/[.;]+$/, '').replace(/,\s*(canada|ca)$/i, '').trim(), LIMITS.location);
}

const BOILERPLATE = /^(contact us|home|welcome|location\s*:|address\s*:|services\s*:|email|phone|copyright|©)/i;

/** The company's own site: a link labelled website/home, otherwise the page we were given. */
function websiteFrom(html: string, sourceUrl: string): string {
  const links = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)];
  for (const [, attrs, inner] of links) {
    const label = plainText(inner);
    const href = attrs.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1] ?? '';
    if (/\b(company )?(website|home ?page|home|visit us)\b/i.test(label)) {
      const url = safeHttpUrl(href, sourceUrl);
      if (url) return url;
    }
  }
  return safeHttpUrl(sourceUrl, sourceUrl) ?? '';
}

function safeHttpUrl(href: string, base: string): string | null {
  try {
    const url = new URL(decodeEntities(href.trim()), base);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!url.hostname.includes('.')) return null;
    return cut(url.origin + (url.pathname === '/' ? '' : url.pathname), LIMITS.website);
  } catch {
    return null;
  }
}

/** "https://www.Example.com/about" -> "example.com". Used to spot the same company twice. */
export function domainOf(url: string): string {
  try {
    return new URL(/^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `https://${url}`).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** Suggested values from one page. Empty strings mean "not found": staff fill them in by hand (R4.11). */
export function parseCompanyHtml(rawHtml: string, sourceUrl: string): CompanyCandidates {
  const html = stripNonContent(rawHtml.slice(0, 1_000_000));
  const body = html.match(/<body\b[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? html;

  const name = cut(
    firstMatch(body, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i) || metaContent(html, 'og:site_name') || firstMatch(html, /<title\b[^>]*>([\s\S]*?)<\/title>/i),
    LIMITS.name,
  );

  const paragraphs = allMatches(body, /<p\b[^>]*>([\s\S]*?)<\/p>/gi);
  const meta = metaContent(html, 'description') || metaContent(html, 'og:description');
  const firstReal = paragraphs.find((p) => p.length >= 20 && !BOILERPLATE.test(p)) ?? '';
  const description = cut(meta || firstReal, LIMITS.description);

  const allText = [name, ...paragraphs, meta].join(' ');
  const keywords = keywordsFrom(allText).map((k) => cut(k, LIMITS.keyword));
  const website = websiteFrom(body, sourceUrl);

  return {
    name,
    description,
    website,
    domain: domainOf(website),
    sector: cut(sectorFrom(keywords), LIMITS.sector),
    keywords,
    location: locationFrom(paragraphs),
  };
}

/** Which suggested fields came back empty, in plain words for staff. */
export function missingFields(c: CompanyCandidates): string[] {
  const labels: Record<string, string> = { name: 'name', description: 'description', sector: 'sector', keywords: 'keywords', location: 'location' };
  return Object.entries(labels)
    .filter(([k]) => {
      const v = c[k as keyof CompanyCandidates];
      return Array.isArray(v) ? v.length === 0 : !v;
    })
    .map(([, label]) => label);
}
