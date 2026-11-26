# Final release: launch notes and known issues

Deployment: https://immxrsive-platform.vercel.app · Tag: `FINAL-submission`

## Could this replace the existing site?

Yes, with the limits listed below. The old site's export imports through a
staff page, can be re-run safely, and reports every problem it finds. Imported
profiles stay public and unclaimed until their owners claim them. Staff can fix
the exceptional cases (claims, duplicates, owners, maintainers, broken demos,
retirement) without a developer.

## What's new in this release

- **Import from the old site** (`/staff/migrate`): dry run, import, re-run,
  downloadable report (F.01 – F.06). See `docs/MIGRATION.md`.
- **Claim a profile:** "Is this you?" on imported profiles. Approved straight
  away only when the claimant's **verified** Algoma email equals the email the
  old site had; everything else goes to staff with the student's note. A name,
  a GitHub username or just having an Algoma email is never enough (F.07 – F.10).
- **Staff → Student profiles** (`/staff/students`): student/alumni, Active
  Talent / Showcase Only, publish / hide / retire / restore, give the profile to
  an account or unlink the owner, merge a duplicate (F.10 – F.17).
- **Merge** students or companies. Projects, collaborations and requests move
  to the record kept; the old URL redirects to it (F.17, F.18).
- **Staff → Projects** (`/staff/projects`): choose a new maintainer among the
  accepted contributors; mark a demo working / not working / archived /
  replaced (F.19, F.37).
- **Active Talent vs Showcase Only, and stale availability.** Availability has a
  "last confirmed" date. After 365 days the public page says "Availability not
  confirmed since …" and availability filters skip the profile until the
  student presses **Confirm it's still current** (F.13, F.14).
- **Retire profile** (student or staff). Hidden, not deleted; the student's
  roles stay on shared projects as "a former contributor" (F.15, F.16).
- **Demos:** nothing loads until **Play**. Maintainers choose *new tab* or
  *inside the page*; inside the page means a sandboxed frame with scripts only
  (no access to our site, cookies, pop-ups, navigation, camera, microphone or
  XR). A WebGL check warns on unsupported devices; Close returns focus to Play
  (F.33 – F.38). Test demos: `/demos/working-demo.html`, `/demos/webgl-demo.html`.
- **Directory paging:** 24 profiles per page with filters in the database
  (F.27, F.28). See `docs/SCALE-TEST.md`.
- **Diagnostics** for staff at `/staff/diagnostics` (F.32), and `/api/health`
  now checks the new tables.

## Known issues and limits

- **Legacy emails are not Algoma addresses.** The fixture's emails are
  `@algoma.example`, but verification only accepts `@algomau.ca`, so in
  practice fixture profiles are claimed through **staff review**, not the
  automatic path. The automatic path works whenever the old site stored the
  student's real `@algomau.ca` address.
- **Legacy collaborations have no year.** They show "Year not recorded" and sort
  after dated ones. Staff can add a year by editing the collaboration.
- **Merges can't be undone from the website.** The merged record is kept (hidden)
  with `merged_into`, so a developer can reverse it in the database if needed.
- **Re-importing never overwrites records changed on the new site** (claimed,
  merged or edited). If the old export is corrected later, staff edit those
  records by hand. The report lists which records were left alone.
- **A demo that refuses to be framed** (its host sends `X-Frame-Options`) shows
  an empty frame when set to *inside the page*; the **Open demo in a new tab**
  button beside the frame still works. Maintainers should use
  *new tab* for those hosts and for headset (WebXR) demos, since the frame gets
  no XR permission by design.
- **The staff access code is shared.** Anyone given it can become staff after
  verifying an Algoma email. Change `STAFF_ACCESS_CODE` after the review period.
- **No email notifications** for claim decisions; students see the result on
  `/student`.
- Staff pages work on phones but were designed for a laptop or tablet.

## Operational assumptions

- One Vercel project and one Supabase project (see `docs/OPERATIONS.md`).
- The Final section of `supabase/schema.sql` has been run on the database.
- Fixture records (S01 – S20, P01 – P10, LS/LP/LC, SC/PC/CC) are sample data
  and are clearly named; QA practice records start with `QA`.
