/**
 * Turns the text of a resume into SUGGESTIONS the student reviews (R2.14).
 *
 * Rules that keep this safe:
 *  - No AI and no guessing. Every suggestion is copied from the resume text,
 *    and a final check drops anything that does not literally appear in the
 *    file (R2.32: no invented facts).
 *  - The resume text is only ever treated as data. Sentences in it are never
 *    run as commands, and nothing here can publish, reveal or change anything
 *    on its own: it only returns suggestions (R2.31).
 *  - Email addresses and phone numbers are never suggested, so a resume can't
 *    cause private contact details to be published.
 *
 * This file has no server-only imports so it can be unit-tested directly.
 */

export interface ResumeSuggestions {
  headline: string | null;
  skills: string[]; // in the standardized skill list
  otherSkills: string[]; // listed in the resume but not standardized (can be suggested, never auto-added)
  education: string[];
  experience: string[];
  links: { github?: string; linkedin?: string; portfolio?: string };
}

type Section = 'contact' | 'skills' | 'education' | 'experience' | 'projects' | 'links' | 'other';

const HEADERS: Record<string, Section> = {
  contact: 'contact',
  'contact information': 'contact',
  skills: 'skills',
  'technical skills': 'skills',
  education: 'education',
  experience: 'experience',
  'work experience': 'experience',
  employment: 'experience',
  projects: 'projects',
  links: 'links',
  interest: 'other',
  interests: 'other',
  summary: 'other',
  objective: 'other',
};

const EMAIL = /[^\s@|,;]+@[^\s@|,;]+\.[a-z]{2,}/gi;
const PHONE = /\+?\d[\d\s().-]{7,}\d/g;
const URLISH = /\b(?:https?:\/\/)?(?:www\.)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s|,;]*)?/gi;

function headerOf(text: string): Section | null {
  const key = text.toLowerCase().replace(/[:\s]+$/g, '').trim();
  return HEADERS[key] ?? null;
}

/**
 * Splits text into lines, and splits two-column lines (3+ spaces between
 * parts) into separate left/right streams so that columns aren't mixed up.
 */
function streams(raw: string): string[][] {
  const left: string[] = [];
  const right: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const parts = line.split(/\s{3,}/).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      left.push(parts[0]);
      right.push(parts.slice(1).join(' '));
    } else {
      left.push(line.trim());
    }
  }
  return right.length ? [left, right] : [left];
}

function splitList(value: string): string[] {
  return value
    .split(/[,|•·;\/]|\s{2,}/)
    .map((s) => s.trim().replace(/\.$/, ''))
    .filter((s) => s.length > 0 && s.length <= 40);
}

function cleanLine(value: string): string {
  return value.replace(EMAIL, '').replace(PHONE, '').replace(/\s{2,}/g, ' ').trim();
}

function normalizeUrl(found: string): string {
  const url = found.replace(/[).,]+$/, '');
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export function parseResumeText(rawText: string, standardSkills: string[]): ResumeSuggestions {
  const out: ResumeSuggestions = { headline: null, skills: [], otherSkills: [], education: [], experience: [], links: {} };
  const byLower = new Map(standardSkills.map((s) => [s.toLowerCase(), s]));
  const skillTokens: string[] = [];
  let firstContentLines: string[] = [];

  for (const stream of streams(rawText)) {
    let section: Section | null = null;
    const seenBeforeHeader: string[] = [];
    for (const line of stream) {
      // "SKILLS: a, b" style (label and value on one line)
      const inline = line.match(/^([A-Za-z ]{3,30}):\s*(.+)$/);
      if (inline && headerOf(inline[1])) {
        const sec = headerOf(inline[1])!;
        const value = inline[2].trim();
        if (sec === 'skills') skillTokens.push(...splitList(value));
        else if (sec === 'education') out.education.push(cleanLine(value));
        else if (sec === 'experience') out.experience.push(cleanLine(value));
        section = null; // one-line section: following lines don't belong to it
        continue;
      }
      if (inline) {
        // An unknown "Label: text" line (e.g. a note) ends any section and is ignored.
        section = null;
        continue;
      }
      const header = headerOf(line);
      if (header) {
        section = header;
        continue;
      }
      if (section === null) {
        seenBeforeHeader.push(line);
        continue;
      }
      if (section === 'skills') skillTokens.push(...splitList(line));
      else if (section === 'education') out.education.push(cleanLine(line));
      else if (section === 'experience') out.experience.push(cleanLine(line));
    }
    if (!firstContentLines.length) firstContentLines = seenBeforeHeader;
    else firstContentLines.push(...seenBeforeHeader);
  }

  // Skills: keep the official spelling for standardized ones; others are
  // offered only as "missing skill" suggestions (R2.12).
  for (const token of skillTokens) {
    const canonical = byLower.get(token.toLowerCase());
    if (canonical) {
      if (!out.skills.includes(canonical)) out.skills.push(canonical);
    } else if (/[a-z]/i.test(token) && !out.otherSkills.some((s) => s.toLowerCase() === token.toLowerCase())) {
      out.otherSkills.push(token);
    }
  }

  // Headline: the short line right under the name at the top, if any.
  const top = firstContentLines.filter((l) => !EMAIL.test(l) && !URLISH.test(l));
  EMAIL.lastIndex = 0;
  URLISH.lastIndex = 0;
  if (top.length >= 2 && top[1].length <= 80 && !/^\W*$/.test(top[1])) out.headline = top[1];

  // Links anywhere in the text. Emails are skipped on purpose.
  const withoutEmails = rawText.replace(EMAIL, ' ');
  for (const match of withoutEmails.match(URLISH) ?? []) {
    const url = normalizeUrl(match);
    const lower = url.toLowerCase();
    if (lower.includes('github.com/') && !out.links.github) out.links.github = url;
    else if (lower.includes('linkedin.com/') && !out.links.linkedin) out.links.linkedin = url;
    else if (!lower.includes('github.com') && !lower.includes('linkedin.com') && /\//.test(match) && !out.links.portfolio) out.links.portfolio = url;
  }

  out.education = [...new Set(out.education.filter(Boolean))];
  out.experience = [...new Set(out.experience.filter(Boolean))];
  return dropAnythingNotInFile(out, rawText);
}

/** Final safety net for R2.32: every suggestion must literally appear in the resume. */
function dropAnythingNotInFile(s: ResumeSuggestions, rawText: string): ResumeSuggestions {
  const hay = rawText.toLowerCase().replace(/\s+/g, ' ');
  const present = (v: string) => hay.includes(v.toLowerCase().replace(/\s+/g, ' '));
  const linkPresent = (v: string) => present(v.replace(/^https?:\/\//i, ''));
  return {
    headline: s.headline && present(s.headline) ? s.headline : null,
    skills: s.skills.filter(present),
    otherSkills: s.otherSkills.filter(present),
    education: s.education.filter(present),
    experience: s.experience.filter(present),
    links: Object.fromEntries(Object.entries(s.links).filter(([, v]) => v && linkPresent(v))) as ResumeSuggestions['links'],
  };
}

export function isEmpty(s: ResumeSuggestions): boolean {
  return !s.headline && !s.skills.length && !s.otherSkills.length && !s.education.length && !s.experience.length && !Object.keys(s.links).length;
}
