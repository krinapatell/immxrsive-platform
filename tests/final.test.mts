import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeExport, normalizeDomain, zero, type MigrationReport } from '../src/lib/migration-parse.ts';
import { talentState, staleCutoff } from '../src/lib/talent.ts';

const legacy = JSON.parse(fs.readFileSync(new URL('../fixtures/final/legacy_export.json', import.meta.url), 'utf8'));

function report(): MigrationReport {
  return {
    source: 't',
    format: 'legacy_export',
    dry_run: true,
    source_counts: {},
    counts: { students: zero(), projects: zero(), contributors: zero(), companies: zero(), collaborations: zero() },
    duplicate_student_candidates: [],
    duplicate_company_candidates: [],
    broken_references: [],
    unclaimed_profiles: [],
    conflicts: [],
    kept_site_changes: [],
    notes: [],
  };
}

test('legacy export: every record is read with its legacy id', () => {
  const r = report();
  const x = normalizeExport(legacy, r);
  assert.deepEqual(
    [x.students.length, x.projects.length, x.companies.length, x.collaborations.length],
    [6, 3, 3, 4],
  );
  assert.equal(r.conflicts.length, 0);
  assert.deepEqual(x.students.map((s) => s.legacy_id), ['LS01', 'LS02', 'LS03', 'LS04', 'LS05', 'LS06']);
});

test('legacy export: publication, alumni, availability and claimed are kept', () => {
  const x = normalizeExport(legacy, report());
  const by = Object.fromEntries(x.students.map((s) => [s.legacy_id, s]));
  assert.equal(by.LS02.status, 'alumni');
  assert.deepEqual(by.LS02.availability, ['full-time']);
  assert.equal(by.LS02.availability_confirmed_at, '2024-06-01');
  assert.equal(by.LS02.claimed, false);
  assert.equal(by.LS06.profile_status, 'retired');
  assert.equal(by.LS05.email, null);
  assert.deepEqual(by.LS05.availability, []);
  assert.equal(by.LS04.possible_duplicate_of, 'LS01');
});

test('legacy export: shared project contributors and private collaborations are kept', () => {
  const x = normalizeExport(legacy, report());
  const lp01 = x.projects.find((p) => p.legacy_id === 'LP01')!;
  assert.deepEqual(lp01.contributors, [
    { student: 'LS01', role: 'XR Developer' },
    { student: 'LS02', role: 'Interaction Developer' },
  ]);
  assert.deepEqual(lp01.repositories, ['https://github.com/example-org/xr-anatomy']);
  const lp02 = x.projects.find((p) => p.legacy_id === 'LP02')!;
  assert.deepEqual(lp02.repositories, []);
  const lco3 = x.collaborations.find((c) => c.legacy_id === 'LCO3')!;
  assert.equal(lco3.visibility, 'private');
  assert.equal(lco3.company, 'LC03');
  assert.deepEqual(x.collaborations.find((c) => c.legacy_id === 'LCO4')!.projects, []);
});

test('company domains match with or without www', () => {
  assert.equal(normalizeDomain('www.northshore-sim.example.test'), 'northshore-sim.example.test');
  assert.equal(normalizeDomain('https://WWW.Example.test/about'), 'example.test');
  assert.equal(normalizeDomain(''), '');
});

test('scale fixture shape is read the same way', () => {
  const x = normalizeExport(
    {
      students: [{ id: 'SC001', name: 'Synthetic Student 001', status: 'current', publication: 'unpublished', availability: ['internship'], skills: ['OpenXR'] }],
      projects: [{ id: 'PC001', title: 'P', technologies: ['C#'], contributors: [{ student_id: 'SC001', role: 'Contributor' }], demo_url: null }],
      companies: [{ id: 'CC01', name: 'C', domain: 'partner01.example.test' }],
    },
    report(),
  );
  assert.equal(x.students[0].legacy_id, 'SC001');
  assert.equal(x.students[0].profile_status, 'unpublished');
  assert.deepEqual(x.projects[0].contributors, [{ student: 'SC001', role: 'Contributor' }]);
  assert.equal(x.projects[0].demo_url, '');
});

test('bad and repeated records are reported, not imported', () => {
  const r = report();
  const x = normalizeExport({ students: [{ legacy_id: 'A1', name: 'A' }, { legacy_id: 'A1', name: 'A again' }, { name: 'no id' }, 'junk'] }, r);
  assert.equal(x.students.length, 1);
  assert.equal(r.conflicts.length, 3);
});

test('availability older than a year is stale; showcase hides it', () => {
  const now = new Date('2026-11-26T12:00:00Z');
  assert.equal(staleCutoff(now), '2025-11-26');
  assert.equal(talentState('active', '2026-08-01', 'public', now), 'active');
  assert.equal(talentState('active', '2024-06-01', 'public', now), 'stale');
  assert.equal(talentState('active', null, 'public', now), 'stale');
  assert.equal(talentState('showcase', '2026-08-01', 'public', now), 'showcase');
  assert.equal(talentState('active', '2026-08-01', 'private', now), 'hidden');
});
