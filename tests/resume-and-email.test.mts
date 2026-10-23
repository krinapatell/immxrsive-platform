// Automated checks for the resume parser and email domain rule.
// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseResumeText } from '../src/lib/resume/parse.ts';
import { emailDomainAllowed } from '../src/lib/email-domain.ts';

const skills: string[] = JSON.parse(fs.readFileSync(new URL('../fixtures/r1/skills.json', import.meta.url), 'utf8'));

/** Same line-by-line text the server gets from these simple fixture PDFs. */
function fixtureText(name: string): string {
  const raw = fs.readFileSync(new URL(`../fixtures/r2/${name}`, import.meta.url)).toString('latin1');
  return [...raw.matchAll(/\((.*?)\) Tj/g)].map((m) => m[1].replace(/\\([()\\])/g, '$1')).join('\n');
}

test('clean resume: suggests only what is in the file', () => {
  const s = parseResumeText(fixtureText('resume_clean_single_column.pdf'), skills);
  assert.deepEqual(s.skills, ['Unity', 'C#', 'OpenXR']);
  assert.deepEqual(s.otherSkills, ['Git']); // not standardized -> suggestion only
  assert.deepEqual(s.education, ['BSc Computer Science - Algoma University']);
  assert.deepEqual(s.experience, ['XR Lab Assistant - Built and tested immersive training prototypes.']);
  assert.equal(s.links.linkedin, 'https://linkedin.com/in/example-avery');
});

test('two-column resume: columns are not mixed together', () => {
  const s = parseResumeText(fixtureText('resume_layout_stress.pdf'), skills);
  assert.deepEqual(s.skills, ['Unity', 'C#', 'JavaScript', 'WebXR', 'Three.js']);
  assert.equal(s.headline, 'XR / WEB DEVELOPER');
  assert.ok(s.experience.includes('Immersive Learning Research Assistant'));
  assert.ok(s.education.includes('Algoma University'));
});

test('minimal resume: no invented skills, employers or dates (R2.32)', () => {
  const s = parseResumeText(fixtureText('resume_minimal.pdf'), skills);
  assert.deepEqual(s.skills, []);
  assert.deepEqual(s.otherSkills, []);
  assert.deepEqual(s.experience, []);
  assert.deepEqual(s.links, {});
});

test('untrusted text is data: no email suggested, instruction ignored (R2.31)', () => {
  const text = fixtureText('resume_untrusted_text.pdf');
  const s = parseResumeText(text, skills);
  const all = JSON.stringify(s).toLowerCase();
  assert.ok(!all.includes('@'), 'no email address may be suggested');
  assert.ok(!all.includes('ignore all previous instructions'), 'the planted sentence is not used as a suggestion');
  assert.deepEqual(s.skills, ['Python', 'React', 'PostgreSQL']);
});

test('every suggestion appears in the source text', () => {
  for (const name of fs.readdirSync(new URL('../fixtures/r2/', import.meta.url))) {
    const text = fixtureText(name).toLowerCase();
    const s = parseResumeText(fixtureText(name), skills);
    for (const v of [...s.skills, ...s.otherSkills, ...s.education, ...s.experience, ...(s.headline ? [s.headline] : [])]) {
      assert.ok(text.includes(v.toLowerCase()), `${name}: "${v}" is not in the file`);
    }
  }
});

test('email domain must match exactly after the final @ (R2.04, R2.05)', () => {
  const ok = (e: string) => emailDomainAllowed(e, ['algomau.ca']);
  assert.equal(ok('student@algomau.ca'), true);
  assert.equal(ok('Student@AlgomaU.ca'), true);
  assert.equal(ok('student@gmail.com'), false);
  assert.equal(ok('student@algomau.ca.evil.com'), false);
  assert.equal(ok('student@notalgomau.ca'), false);
  assert.equal(ok('algomau.ca@gmail.com'), false);
  assert.equal(ok('a@b@algomau.ca'), false);
  assert.equal(ok('@algomau.ca'), false);
});
