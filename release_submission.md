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

- **Published fixture partner imported from a supplied page:** https://immxrsive-platform.vercel.app/partners/C60512B
  (from company_normal.html).
- **Company with at least two collaborations:** same partner. COL01 "Industrial
  Safety Training Prototype" (2025, Past, Public, P01) and COL02 "XR Maintenance
  Training Study" (2026, Current, Public, P04), from `collaboration_seed.json`.
- **Visibility example:** COL03 "Confidential Spatial Prototype" (Private) is on
  Superior Immersive Labs (imported from company_prompt_injection.html and left as
  a draft for Scenario A). Public and Limited collaborations can be added from any
  company page under **Add a collaboration** -> **Who can see it?**.
- **Student-requested relationship, pending -> staff review:** project "ImmXrsive Talent Platform"
  (https://immxrsive-platform.vercel.app/projects/P90C43945). Its maintainer
  requested North Shore Simulations as a partner (pending), staff reviewed and
  approved it, and the project and partner pages now show the relationship. A
  second request (suggested company "Lakehead XR Studio") and a project
  verification request on the same project are left pending for Scenario A.
- **Items waiting on the staff home for Scenario A:** one project verification
  request, one student partner request (Lakehead XR Studio), and two company
  drafts (Superior Immersive Labs, Algoma Field Systems).
- **Prompt-injection import (chosen challenge):** importing company_prompt_injection.html
  gives a draft with only ordinary fields; it was not verified, published or given
  any permission by the page text.
- **Decisions:** only staff create or change institutional records (verification,
  companies, collaborations, official partners). Students only send requests.
