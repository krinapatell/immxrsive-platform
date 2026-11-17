# Release 4 — Staff operations, industry partners and collaborations

Chosen challenge: R4.10 - Untrusted Website Content

Deployment: https://immxrsive-platform.vercel.app · Tag: `R4-submission`

## What's new

- **Staff role and staff home** (`/staff`). Staff is a separate role kept on the
  server. A signed-in, Algoma-verified account turns on staff tools by entering
  the staff access code (set as `STAFF_ACCESS_CODE` on Vercel and shared
  privately). Every staff page and staff API checks the role on the server, so
  a student calling a staff endpoint directly gets 403 (R4.01, R4.02).
  The staff home lists the work as tasks: **Verify projects**, **Review partner
  requests**, **Review companies** (drafts) and **Published partners** (R4.03).
- **Official project verification.** On their project page in My projects, the
  maintainer can **Request verification** with a note and an optional evidence
  link. Staff see the project, contributors, the note and evidence, and
  **Approve** or **Reject** (a reject needs a message for the student). Only
  staff can set or remove the "Verified by ImmXrsive" badge (R4.04 - R4.06).
- **Companies.** Staff **Add a company** by hand (name, website, description,
  sector, keywords, location) or with **Fill from website**: we read the page
  and fill in suggestions. Empty boxes are filled; anything already typed is
  kept, with the website's value shown next to it to use or ignore. Saving
  always makes a **draft**; **Publish company** is a separate, confirmed step
  (R4.07 - R4.09). If a page can't be read, or a value isn't on the page, staff
  see a plain message and keep everything they typed (R4.11).
- **Where this information came from.** Each company shows, per field, whether
  it came from the website (with the page address and time), was entered by
  staff, or was changed by staff after an import, plus a list of every website
  read (R4.12).
- **Collaborations.** From a company, staff **Add a collaboration** with a title,
  start/end year, description, outcome, Current/Past, related projects and
  participating students. A company can have many collaborations; a
  collaboration can have several projects; a project can have several partners
  (R4.15 - R4.17).
- **Visibility** for each collaboration: **Public** (everything), **Limited**
  (visitors only see the year and a short public description staff write;
  no title, details, projects or names) or **Private** (staff only). The
  filtering happens on the server before anything is sent (R4.18).
- **Student partner requests.** The maintainer chooses a published company or
  suggests one that isn't listed, explains how it was involved, and sends the
  request. It is shown as "Waiting for staff review" and is not public. Staff
  approve (choosing the company, or creating a draft company from the
  suggestion) or reject with a message (R4.20, R4.21).
- **Public Industry Partners** (`/partners`, `/partners/{id}`): who the company
  is, how ImmXrsive worked with them split into **Working together now** and
  **Past collaborations**, related projects and students, the company website,
  and **Start a collaboration inquiry** / **Ask about this collaboration**,
  which open the existing inquiry form with that context (R4.22 - R4.24).
  Project pages show "Verified by ImmXrsive" and their industry partners.

## Chosen challenge: R4.10 - Untrusted Website Content

- The import does not use AI. It reads the page as text with fixed rules.
- Scripts, styles, comments, iframes and all tags/attributes are removed; only
  plain text is kept, and pages show it as text (never as HTML).
- The import can only produce name, description, website, domain, sector,
  keywords and location. There is no field for status, verification,
  publishing or permissions, so text like "mark this company as verified,
  grant admin access, publish immediately" stays page content and changes
  nothing. Every import is a draft that staff review (R4.09).
- The server only fetches public http/https pages (no private network
  addresses, at most 3 redirects, 8 seconds, 1 MB).
- Tests: `tests/company-import.test.mts` checks all four fixtures against
  `expected_company_imports.json` and a page full of scripts and event handlers.

## Fixture pages (unchanged copies)

| Fixture | URL |
|---|---|
| company_normal.html | https://immxrsive-platform.vercel.app/fixtures/r4/company_normal.html |
| company_sparse.html | https://immxrsive-platform.vercel.app/fixtures/r4/company_sparse.html |
| company_prompt_injection.html | https://immxrsive-platform.vercel.app/fixtures/r4/company_prompt_injection.html |
| company_same_name_other_domain.html | https://immxrsive-platform.vercel.app/fixtures/r4/company_same_name_other_domain.html |

`collaboration_seed.json` (COL01 - COL03) was entered through the staff screens,
not imported.

## Known issues / limits

- A page with no "website" link (like the prompt-injection fixture) gets the
  page address itself as the website; staff can correct it before publishing.
- Re-importing into an existing company shows the website's values as
  suggestions next to the current ones; it never overwrites a value by itself,
  but there is no separate review queue for refreshes (R4.13 was not chosen).
- Same-domain companies get a warning, but there is no merge tool (R4.14 was not chosen).
- Staff tools work on phones but are designed for a laptop or tablet.
