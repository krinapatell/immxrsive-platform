# Release Submission

Release: R3
Team: team-09
Project Option: Project 1
Deployment: https://immxrsive-platform.vercel.app
Repository: https://github.com/krinapatell/immxrsive-platform
Release tag: R3-submission
Commit: COMMIT_SHA_GOES_HERE
Adapter: evaluation_adapter.json
Known issues: Teammates can only be invited after they have signed in once and verified their @algomau.ca email (we invite by exact GitHub username so no student list is exposed). GitHub import works for public repositories only and depends on GitHub's API rate limit. Demos open in a new tab rather than being embedded.
Test notes: Fixture projects (P01–P10) have no maintainer account, so they can't be edited; use them for public pages, the broken-demo case (P07) and the duplicate warning (P04). Release notes: docs/RELEASE-NOTES-R3.md.

## Test accounts

- **Public / employer:** no account needed. Directory at `/`, project pages at `/projects/<id>`.
- **Student:** each tester signs in with their own GitHub account and verifies
  their own `@algomau.ca` email (a 6-digit code is emailed). No shared passwords.
- **Two-student scenarios** (invite, accept, conflict, removal): use two testers,
  or one tester with two GitHub accounts. The second account must sign in and
  verify once before it can be invited by its GitHub username.
- **Fixture setup:** `supabase/schema.sql` then `supabase/seed.sql` load the R1 fixtures; schema.sql adds the R3
  standard roles, and connects P04 to `https://github.com/example-org/xr-anatomy`
  for the duplicate cases. Nothing else needs to be set up.

## Release-specific evidence

- **Shared published project with two accepted contributors:**
  https://immxrsive-platform.vercel.app/projects/P90C43945
- **Project with a working demo and fallback:** same project. Play demo opens
  https://immxrsive-platform.vercel.app/demos/working-demo.html; fallback image
  https://immxrsive-platform.vercel.app/demos/fallback.svg with a text description.
- **Public repository for the GitHub import test:**
  https://github.com/krinapatell/immxrsive-platform (enter `krinapatell/immxrsive-platform`).
- **Duplicate warning:** add a project with any spelling of
  `https://github.com/example-org/xr-anatomy` (e.g. `github.com/Example-Org/XR-Anatomy.git`).
- **Broken demo:** https://immxrsive-platform.vercel.app/projects/P07 links to
  `https://example.invalid/demo`; the page itself still loads and shows the fallback.
- **Decision, who may edit shared fields:** only the current maintainer.
  Other accepted contributors edit only their own role, statement and
  "show on my profile" choice.
- **Decision, removal protection:** reversible soft delete. A removed
  contributor's row and statement are kept with status `removed`, hidden
  publicly, and the maintainer can Restore them.
- **Concurrent edits:** every save sends the version it loaded; a stale save is
  refused (409) and the editor offers the newer version, so nothing is silently lost.
