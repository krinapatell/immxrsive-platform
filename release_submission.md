Chosen challenge: R4.10 - Untrusted Website Content

# Release Submission

Release: R4
Team: team-09
Project Option: Project 1
Deployment: https://immxrsive-platform.vercel.app
Repository: https://github.com/krinapatell/immxrsive-platform
Release tag: R4-submission
Commit: COMMIT_SHA_GOES_HERE
Adapter: evaluation_adapter.json
Known issues: A company page with no "website" link gets the page address itself as its website until staff correct it. Re-importing shows the website's values as suggestions beside the current ones and never overwrites by itself, but there is no separate refresh-review queue (R4.13 not chosen). Same-domain companies get a warning but there is no merge tool (R4.14 not chosen). Staff tools work on phones but are designed for a laptop or tablet.
Test notes: Release notes: docs/RELEASE-NOTES-R4.md. Fixture projects P01-P10 have no maintainer account; to test student requests use a project you create or maintain.

## Test accounts

- **Public visitor:** no account. Industry partners at `/partners`, talent directory at `/`.
- **Student:** sign in at `/student` with your own GitHub account and verify your own
  `@algomau.ca` email (a 6-digit code is emailed). No shared passwords.
- **Staff:** use a verified account as above, open `/staff` and enter the **staff
  access code**. The code is sent privately in the instructor's QA email thread
  and is not in this repository. **Turn off staff tools** on `/staff` makes that
  account an ordinary student again, so one person can test both roles; for
  Scenario K, use a second account that never entered the code.
- **Student partner request (Scenario I):** create a project at `/student/projects/new`
  (you become its maintainer), then use **Industry partners** on its page.

## Fixture source URLs (hosted unchanged)

| Fixture | URL |
|---|---|
| company_normal.html | https://immxrsive-platform.vercel.app/fixtures/r4/company_normal.html |
| company_sparse.html | https://immxrsive-platform.vercel.app/fixtures/r4/company_sparse.html |
| company_prompt_injection.html | https://immxrsive-platform.vercel.app/fixtures/r4/company_prompt_injection.html |
| company_same_name_other_domain.html | https://immxrsive-platform.vercel.app/fixtures/r4/company_same_name_other_domain.html |

To repeat an import: `/staff` -> **+ Add a company** -> paste a URL above -> **Fill from website**.
Expected values are in `fixtures/r4/expected_company_imports.json`.

## Release-specific evidence

- **Published fixture partner imported from a supplied page:** PARTNER_NORMAL_URL
  (from company_normal.html).
- **Company with at least two collaborations:** same partner. COL01 "Industrial
  Safety Training Prototype" (2025, Past, Public, P01) and COL02 "XR Maintenance
  Training Study" (2026, Current, Public, P04), from `collaboration_seed.json`.
- **Visibility examples:** COL03 "Confidential Spatial Prototype" (Private) is on
  Superior Immersive Labs, imported from company_prompt_injection.html; a Limited
  collaboration is described in the release notes.
- **Student-requested relationship, pending -> staff review:** PARTNER_REQUEST_EVIDENCE
- **Prompt-injection import (chosen challenge):** importing company_prompt_injection.html
  gives a draft with only ordinary fields; it was not verified, published or given
  any permission by the page text.
- **Decisions:** only staff create or change institutional records (verification,
  companies, collaborations, official partners). Students only send requests.
