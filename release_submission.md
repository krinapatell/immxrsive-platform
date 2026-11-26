# Release Submission

Release: FINAL
Team: team-09
Project Option: Project 1
Deployment: https://immxrsive-platform.vercel.app
Repository: https://github.com/krinapatell/immxrsive-platform
Release tag: FINAL-submission
Commit: COMMIT_SHA_GOES_HERE
Adapter: evaluation_adapter.json
Known issues: The fixture's legacy emails are @algoma.example, but verification only accepts @algomau.ca, so fixture profiles are claimed through staff review (automatic approval needs an exact verified-email match). Legacy collaborations have no year and show "Year not recorded". Merges cannot be undone from the website. A re-import never overwrites records that were claimed, merged or edited on the new site. Demo hosts that refuse framing show an empty frame when set to open inside the page; "Open demo in a new tab" is always beside it. No email notifications for claim decisions (shown on /student). Full list: docs/LAUNCH-NOTES.md.
Test notes: Launch notes docs/LAUNCH-NOTES.md · migration instructions and result docs/MIGRATION.md · scale evidence docs/SCALE-TEST.md · regression checklist docs/REGRESSION-CHECKLIST.md · operations docs/OPERATIONS.md. Staff access details are in the Moodle Online text under "Reviewer test access", not in this repository.

## Test accounts

- **Public visitor / employer:** no account. Directory `/`, partners `/partners`.
- **Student / contributor:** sign in at `/student` with your own GitHub account and
  verify your own `@algomau.ca` email (a 6-digit code is emailed). No shared
  passwords. Create a project at `/student/projects/new` to be its maintainer;
  invite a second reviewer account to test the contributor journey.
- **Staff:** use a verified account as above, open `/staff` and enter the staff
  access code from the Moodle Online text ("Reviewer test access"). **Turn off
  staff tools** on `/staff` makes the account an ordinary student again; for
  authorization checks use an account that never entered the code.
- **Do not claim a real person's profile.** Imported fixture profiles (LS03,
  LS05, and the scale records SC001 – SC220) are synthetic and can be claimed for
  testing; staff approve or reject at `/staff`.

## Release-specific evidence

- **Migration tool:** `/staff/migrate` (staff). Instructions and the result for
  `legacy_export.json`: `docs/MIGRATION.md`. The import was run twice on the
  deployed site (second run: 0 new). Both runs and their downloadable reports
  are listed under *Earlier runs*.
- **Migration result:** 6 students, 3 projects, 3 companies, 4 collaborations;
  duplicate LS04 → LS01 (same email); missing reference LP02 → LS99;
  unclaimed LS02, LS05, LS06; also flagged LC02 → LC01 (same domain).
- **Shared legacy project:** https://immxrsive-platform.vercel.app/projects/LP01
- **Partner history (current + past, private hidden):** https://immxrsive-platform.vercel.app/partners/LC01 and /partners/LC03
- **Stale availability:** https://immxrsive-platform.vercel.app/students/LS02 · **Showcase Only:** /students/LS05
- **Retired contributor kept on a project:** https://immxrsive-platform.vercel.app/projects/LP03
- **Duplicates for Scenario D:** LS04/LS01 and LC02/LC01 are left unmerged for
  reviewers. Staff can make more with **Create a practice duplicate pair** on
  `/staff/students` (each pair comes with a shared practice project for the
  maintainer check).
- **Claims for Scenario C:** claim LS03 or LS05 from its public page; it waits
  for staff at `/staff` → *Profile claims*.
- **Demos for Scenario I:** P01 (WebGL demo inside the page), P07 (broken build
  inside the page), P06 (archived demo), set by `supabase/final-demo-examples.sql`.
- **Scale fixture:** imported through the same staff page; evidence in
  `docs/SCALE-TEST.md`.
- **Regression checklist:** `docs/REGRESSION-CHECKLIST.md`.

## Operational note (Final Release only)

- **Deployment:** Vercel (auto-deploys `main`), Supabase Postgres. Schema:
  `supabase/schema.sql` (safe to re-run; then `notify pgrst, 'reload schema'`).
  Health check: `/api/health` (`final_release_ready: true`). Rollback: promote
  the previous Vercel deployment.
- **External dependencies:** GitHub OAuth (sign-in) and API (repository import),
  Brevo (verification email), company websites (import), external demo hosts.
  Each failure gives the user a plain message and a manual or fallback path; the
  rest of the site keeps working.
- **Diagnostics:** `/staff/diagnostics` (staff only) lists timestamped errors and
  key actions with context; the same lines are in Vercel logs. Secret-looking
  values are never logged. Settings are environment variables on Vercel; none
  are in the repository or sent to the browser. Details: `docs/OPERATIONS.md`.
