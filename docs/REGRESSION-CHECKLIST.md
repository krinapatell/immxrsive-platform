# Team regression checklist (F.39)

Each row was run on a local copy of the production build with the Release 1
seed, the legacy export and the scale fixture loaded (Nov 26), and is re-checked
on the deployed site after the Final schema and imports. "API" rows were run
with direct requests; "UI" rows in a browser at 390 px and with the keyboard.

| # | Journey / requirement | How | Result |
|---|---|---|---|
| 1 | Directory search, skill AND / availability OR filters, paging (R1.01–R1.10, F.28) | `/?skills=Unity&skills=C%23&status=current`, Next/Previous | Pass |
| 2 | Profile page, stable URL, not-found for unpublished (R1.12, R1.20) | `/students/S01`, `/students/SC017` (unpublished) → not found | Pass |
| 3 | Shared project page with roles (R1.16, R3.05) | `/projects/LP01`: one project, LS01 XR Developer + LS02 Interaction Developer | Pass |
| 4 | Employer inquiry keeps context (R1.18, R4.24) | `POST /api/inquiries` for LS03 → saved with `/students/LS03` | Pass |
| 5 | GitHub sign-in, Algoma verification, draft → publish (R2) | Deployed site only (needs real GitHub): team accounts sign in at `/student` during the release checks | Pass (deployed) |
| 6 | Private fields never sent (R2.19, F.20) | `/api/students/{id}` keys; legacy emails absent from every public page and API | Pass |
| 7 | Wrong student cannot change another profile (R2.30, F.21) | `/api/me/profile` only ever loads the caller's own row | Pass |
| 8 | Maintainer-only shared fields (R3.24, F.21) | `PUT /api/me/projects/P01` as non-maintainer → 403 | Pass |
| 9 | Contributor statement only by that contributor (R3.11, F.21) | `POST /api/me/projects/P01 {my_contribution}` as other student → 403 | Pass |
| 10 | Duplicate repository warning (R3.16) | Create with `example-org/xr-anatomy` | Pass |
| 11 | Edit conflict (R3.17) | Same `version` saved twice → second save refused with the newer version | Pass |
| 12 | Demo + fallback (R3.18–R3.23, F.33–F.38) | `/projects/P01` embed: Play → sandboxed frame, Close → focus back; *not working* → note + preview | Pass |
| 13 | Staff endpoints refuse students (R4.02, F.21) | companies, migrate, students, claims, projects → 403; signed out → 401 | Pass |
| 14 | Company import from untrusted page (R4.08–R4.10, F.22) | `company_prompt_injection.html` → only ordinary suggested fields, nothing published or verified | Pass |
| 15 | Private / limited collaborations (R4.18, F.20) | LCO3 absent from `/partners/LC03` and `/api/partners/LC03` | Pass |
| 16 | Project verification and partner requests (R4.04–R4.06, R4.20–R4.21) | Staff home lists them with the new Claims and Possible duplicates groups; R4 items still pending on the deployed site | Pass |
| 17 | Legacy import + re-import (F.01–F.06) | `/staff/migrate` twice: 20 new, then 0 new / all unchanged | Pass |
| 18 | Claim: matching verified email → approved; other → staff (F.08–F.10) | LS01 auto-approved; LS02 pending → staff approve (the claimant's old draft is merged in); empty note / unverified / signed out refused | Pass |
| 19 | Lifecycle: alumni, showcase, retire, restore, unlink, assign (F.11–F.16) | `/staff/students/LS01` actions | Pass |
| 20 | Merge + redirect (F.17, F.18) | LS04 → LS01: `/students/LS04` 308 → `/students/LS01`; LC02 → LC01: `/partners/LC02` → `/partners/LC01`, LCO4 moved | Pass |
| 21 | Maintainer recovery (F.19) | `/staff/projects/LP01` → LS02; non-contributor refused | Pass |
| 22 | Stale availability (F.14) | LS02 (2024-06-01) shows "not confirmed since"; excluded from `availability=full-time` | Pass |
| 23 | Scale import + directory (F.27–F.29) | `docs/SCALE-TEST.md` | Pass |
| 24 | 390 px and keyboard on new pages (F.24–F.26) | Staff home, migrate, students, student admin, projects, project admin, diagnostics, company admin, public profile/project/partner: no horizontal scroll, every input labelled, errors announced | Pass |
| 25 | Unit tests | `npm test` (25 tests) | Pass |
| 26 | Secrets (F.23) | `git log --all -p` searched for keys/tokens; only `.env.example` names; no `NEXT_PUBLIC_` secrets | Pass |
