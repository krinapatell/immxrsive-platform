// Checks for repository helpers used by duplicate detection and GitHub import (R3.03, R3.16).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseGithubRepo, repoKey, titleKey } from '../src/lib/repo.ts';

test('repoKey treats different spellings of the same repository as one', () => {
  const same = [
    'https://github.com/example-org/xr-anatomy',
    'https://www.GitHub.com/Example-Org/XR-Anatomy/',
    'http://github.com/example-org/xr-anatomy.git',
    'github.com/example-org/xr-anatomy',
  ];
  for (const u of same) assert.equal(repoKey(u), 'github.com/example-org/xr-anatomy', u);
  assert.notEqual(repoKey('https://github.com/example-org/anatomy-learning'), repoKey(same[0]));
});

test('fixture duplicate cases: only the exact repository is a duplicate', () => {
  const cases = JSON.parse(fs.readFileSync(new URL('../fixtures/r3/project_duplicate_cases.json', import.meta.url), 'utf8'));
  const existing = repoKey('https://github.com/example-org/xr-anatomy'); // seeded on project P04
  for (const c of cases) {
    const dup = repoKey(c.repository) === existing;
    assert.equal(dup, c.expected === 'warn_existing_project', c.case);
  }
});

test('titleKey only normalizes case and spaces; it never merges different titles', () => {
  assert.equal(titleKey('  XR   Anatomy Lab '), titleKey('xr anatomy lab'));
  assert.notEqual(titleKey('XR Anatomy Learning Lab'), titleKey('XR Anatomy Lab'));
});

test('parseGithubRepo accepts owner/repo and GitHub URLs, rejects others', () => {
  assert.deepEqual(parseGithubRepo('krinapatell/immxrsive-platform'), { owner: 'krinapatell', repo: 'immxrsive-platform' });
  assert.deepEqual(parseGithubRepo('https://github.com/krinapatell/immxrsive-platform.git'), { owner: 'krinapatell', repo: 'immxrsive-platform' });
  assert.deepEqual(parseGithubRepo('github.com/vercel/next.js/'), { owner: 'vercel', repo: 'next.js' });
  assert.equal(parseGithubRepo('https://gitlab.com/a/b'), null);
  assert.equal(parseGithubRepo('just-a-name'), null);
  assert.equal(parseGithubRepo('a/b/c'), null);
});
