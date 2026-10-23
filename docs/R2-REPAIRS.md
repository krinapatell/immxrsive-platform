# Release 2 — post-freeze response and repair log

The frozen Release 2 Product Result identifies commit
`7a8772895802d99bef89250f9d5afe477cb7e9d1`. The `R2-submission` tag currently
resolves to `d317af3c7652a6289ec2f93c396446721554fdd0`, which was tagged after
the freeze; both are preserved unchanged (see issue #12 and our email to the
instructor). Everything below is **post-freeze repair work** and does not
replace the frozen version.

Repairs were developed on branch `r2-repairs` and merged to `main` through a
pull request. Each issue is answered in GitHub with the fixing commit, the
deployment it went out in, and the retest result.

| Issue | Finding | Response | Fix |
|---|---|---|---|
| #7 | Code returned to browser; universal code accepted | Accept | Codes are random, emailed only, stored as a keyed hash; no fixed code exists (`src/lib/verification.ts`) |
| #8 | No GitHub sign-in / internal account | Accept | GitHub OAuth with no scopes; `app_users` keyed by GitHub numeric id (`src/app/api/auth/github`) |
| #9 | Resume import uses the file name, invents skills | Accept | PDF text is read and parsed; suggestions must appear in the file (`src/lib/resume`, `tests/`) |
| #10 | Resume overwrites edits; no accept/edit/reject | Accept | Review panel: tick, edit or reject each suggestion; replacements start unticked |
| #11 | R1 regressions: skill search/filter, inquiry | Accept | Server-side search and AND skill filter; inquiry pages for students and projects |
| #12 | Tag moved after freeze; SHA doesn't exist | Accept (explained) | Tags left as-is per instructor; explanation sent by email; this log |
| #13 | Publish never reaches directory/API | Accept | Publish sets `profile_status`; directory and API read it live |
| #14 | No visibility controls | Accept | Per-field Public/Private, enforced on the server (`toPublic()`) |
| #15 | Verification and draft not kept on reload | Accept | Verification saved on the account; draft saved in the database |
| #16 | No preview | Accept | `/student/preview` renders the public view with private fields labelled |
| #17 | Missing structured fields | Accept | Bio, availability, LinkedIn/portfolio, GitHub, location added |
| #18 | Domain checked only in browser | Accept | Server checks exact domain after the final `@`; configurable list |
| #19 | Case-variant and free-text skills | Accept | Skills must be in the standard set (case-insensitive to official spelling); others are private suggestions |
| #20 | Profile links go to GitHub home page | Accept | GitHub link built from the signed-in account |
| #21 | Codes never expire; no limits | Accept | 15-minute expiry (max 30), single use, send and attempt limits |

Retest results are recorded on each issue after deployment.
