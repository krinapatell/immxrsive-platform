import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseCompanyHtml, domainOf, missingFields, plainText } from '../src/lib/company-import.ts';

const fixture = (name: string) => fs.readFileSync(new URL(`../fixtures/r4/${name}`, import.meta.url), 'utf8');
const expected = JSON.parse(fixture('expected_company_imports.json'));
const HOST = 'https://immxrsive-platform.vercel.app/fixtures/r4/';

test('every fixture page gives the expected name', () => {
  for (const [file, want] of Object.entries(expected) as [string, { name: string }][]) {
    assert.equal(parseCompanyHtml(fixture(file), HOST + file).name, want.name, file);
  }
});

test('normal page: location and keywords match expected_company_imports.json', () => {
  const c = parseCompanyHtml(fixture('company_normal.html'), HOST + 'company_normal.html');
  assert.equal(c.location, expected['company_normal.html'].location);
  for (const k of expected['company_normal.html'].keywords) assert.ok(c.keywords.includes(k), k);
  assert.equal(c.website, 'https://northshore-sim.example.test');
  assert.equal(c.domain, 'northshore-sim.example.test');
  assert.match(c.description, /immersive industrial training/);
  assert.ok(c.sector);
});

test('sparse page: only the name and site are found, the rest is left for staff', () => {
  const c = parseCompanyHtml(fixture('company_sparse.html'), HOST + 'company_sparse.html');
  assert.equal(c.description, '');
  assert.equal(c.location, '');
  assert.equal(c.domain, 'algoma-field.example.test');
  assert.deepEqual(missingFields(c).sort(), ['description', 'keywords', 'location', 'sector']);
});

test('prompt-injection page: instructions stay text and there is no status/permission field at all', () => {
  const c = parseCompanyHtml(fixture('company_prompt_injection.html'), HOST + 'company_prompt_injection.html');
  assert.deepEqual(Object.keys(c).sort(), ['description', 'domain', 'keywords', 'location', 'name', 'sector', 'website']);
  assert.equal(c.description, 'Spatial computing prototypes for remote training.');
  assert.ok(!JSON.stringify(c).includes('IGNORE ALL PREVIOUS'));
  // no company link on the page, so the website is the page we were given
  assert.equal(c.domain, 'immxrsive-platform.vercel.app');
});

test('same-name page has a different domain from North Shore Simulations', () => {
  const a = parseCompanyHtml(fixture('company_normal.html'), HOST + 'a');
  const b = parseCompanyHtml(fixture('company_same_name_other_domain.html'), HOST + 'b');
  assert.notEqual(a.domain, b.domain);
  assert.equal(b.location, 'Vancouver, British Columbia');
});

test('scripts, event handlers and javascript: links never come through', () => {
  const html = `<html><head><title>X</title><script>alert(1)</script></head><body>
    <h1>Evil <img src=x onerror="alert(2)">Co</h1>
    <p>We make <b>great</b> simulation tools &amp; training &lt;script&gt;alert(3)&lt;/script&gt; for everyone.</p>
    <a href="javascript:alert(4)">Website</a><style>p{}</style></body></html>`;
  const c = parseCompanyHtml(html, 'https://evil.example.com/');
  assert.equal(c.name, 'Evil Co');
  assert.ok(!/[<>]/.test(c.description), c.description);
  assert.ok(!/onerror|alert\(1\)|alert\(2\)/.test(JSON.stringify(c)));
  assert.equal(c.website, 'https://evil.example.com');
});

test('helpers', () => {
  assert.equal(domainOf('https://WWW.Example.com/about'), 'example.com');
  assert.equal(domainOf('example.org'), 'example.org');
  assert.equal(plainText('a&nbsp;<i>b</i>&#65;'), 'a b A');
});
