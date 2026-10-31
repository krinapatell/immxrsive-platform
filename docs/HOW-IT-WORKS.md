# How the platform works (for the team)

Short, plain-English notes so every team member can explain each part and find
the code for it. Requirement numbers are from the Project 1 requirements book.

## Big picture

- **Next.js** app on Vercel. Pages are in `src/app`, shared UI in `src/components`,
  and all the logic that touches data is in `src/lib`.
- **Supabase (Postgres)** stores everything. The tables are in `supabase/schema.sql`
  and the Release 1 fixtures are loaded by `supabase/seed.sql`.
- **The browser never talks to the database.** Every table has Row Level Security
  turned on with no public rules. Only our server code, using a secret key
  (`src/lib/db.ts`), can read or write. That's what makes privacy and ownership
  enforceable: the checks live on the server, where users can't skip them.

## Public side (Release 1)

| What | Where | How |
|---|---|---|
| Directory, search, filters (R1.01–R1.10) | `src/app/page.tsx`, `searchStudents()` in `src/lib/students.ts` | Filters are read from the URL and applied on the server. Skills use AND, availability and status use OR within their group, groups combine with AND. Results are sorted by id, so the same filters always return the same list. |
| Filter controls (R1.09, R1.23) | `src/components/DirectoryFilters.tsx` | Every control has a label; groups are fieldsets; active filters show as removable chips with "Clear all". |
| Profile page (R1.12, R1.13) | `src/app/students/[id]/page.tsx`, `src/components/ProfileView.tsx` | Stable URL `/students/S01`. Unknown or unpublished ids show "not found". |
| Project page (R1.16, R1.17) | `src/app/projects/[id]/page.tsx` | One project, many contributors with roles. Contributors without a public profile are listed by role only. |
| Employer inquiry (R1.18, R1.19) | `src/app/inquiry/page.tsx`, `src/app/api/inquiries/route.ts` | The student or project is looked up on the server from the URL and saved with the inquiry. No employer account. |

## Student side (Release 2)

**1. GitHub sign-in (R2.01–R2.03)** — `src/app/api/auth/github/...`
The student is sent to GitHub with *no scopes*, so GitHub only shares the public
profile. We find or create a row in `app_users` by GitHub's permanent numeric id,
so a username change doesn't create a new account. Ownership uses our own
`user_id`, not the GitHub username. The session is a signed, httpOnly cookie
(`src/lib/session.ts`).

**2. Algoma verification (R2.04–R2.09)** — `src/lib/verification.ts`
- Domain checked on the server: text after the last `@` must exactly equal an
  approved domain (`ALLOWED_EMAIL_DOMAINS`, default `algomau.ca`).
- A random 6-digit code is emailed. We store only a keyed hash of it.
- Expires after 15 minutes (configurable, capped at 30).
- Single use: a database function marks it used in one step, so it can't be
  used twice even by two requests at once.
- Limits: 3 code emails per user and per address every 15 minutes; 5 wrong
  guesses per code, then that code is cancelled.
- Once verified, `affiliation_verified_at` is saved, so later sign-ins skip this step.

**3. Profile editor (R2.10–R2.12, R2.18–R2.22)** — `src/components/student/ProfileEditor.tsx`, `src/lib/profile.ts`
- A private draft is created the first time a verified student opens the editor.
- Skills must come from the standard list (matched case-insensitively to the
  official spelling, so `c#` becomes `C#`). Anything else is saved as a private
  "suggestion" and never becomes a filter.
- Links must be `http(s)` addresses. The GitHub link comes from sign-in.
- Privacy toggles are stored per field and enforced on the server by `toPublic()`.
- Preview (`/student/preview`) uses the same `toPublic()` as the public API, so it
  shows exactly what visitors get, with private fields labelled.
- Publish / unpublish only changes `profile_status`; nothing is deleted.

**4. Ownership (R2.30)** — `src/app/api/me/profile/route.ts`
There is no way to name another profile: the server always edits the row whose
`user_id` is the signed-in user. If a request includes someone else's `id` or
`user_id`, it is refused with 403.

**5. Resume import (R2.13–R2.17, R2.31, R2.32)** — `src/lib/resume/`
- `pdf.ts` reads the text out of the PDF (keeping wide gaps so two-column
  layouts can be separated). The file is never stored.
- `parse.ts` looks for section headings (Skills, Education, Experience, Links…)
  and copies text from under them. No AI, no guessing. A final check removes
  any suggestion that doesn't literally appear in the file.
- Emails and phone numbers are never suggested. A sentence like "ignore previous
  instructions" is just text — the parser doesn't execute anything, and the
  result is only ever suggestions.
- The student ticks, edits or rejects each suggestion. Anything that would
  replace something they already wrote starts unticked and says what it replaces.

**6. Customization (R2.23–R2.25)** — theme preset (3 options), profile picture
(initials or GitHub), and section order. These only change CSS classes and the
order sections are drawn in; they never touch skills or availability. All text
is shown as plain text by React, so no one can inject HTML or scripts.

## Projects (Release 3)

All the logic is in `src/lib/projects.ts`; the pages are under `src/app/student/projects/`
and the public page is `src/app/projects/[id]/page.tsx`.

**1. One project, many people (R3.05–R3.07).** A project is one row in `projects`.
Each person on it is one row in `project_contributors` with a `status`:
invited → accepted / declined, requested → accepted / declined, accepted → removed.
Only *accepted* people appear publicly. The creator becomes the `maintainer`
and can hand that job to another accepted contributor; the project id (and URL)
never changes.

**2. Who can edit what (decision).** Only the maintainer edits shared fields
(title, description, links, demo…). Everyone edits only their *own* role,
contribution statement and "show on my profile" switch. The server checks this
on every request, not just the buttons.

**3. Invitations (R3.08–R3.10).** The maintainer types an exact GitHub username.
The person must already have signed in and verified, so nobody can browse a list
of students. Invited people see the invite under My projects and accept or decline.

**4. Removal (decision: reversible soft delete).** Removing someone only sets
`status = removed` (plus who/when). Their statement is kept and the maintainer
can Restore them. Nothing is hard-deleted.

**5. Duplicates (R3.16).** `src/lib/repo.ts` turns a repository URL into a key
(no `https://`, no `www.`, lowercase, no trailing `/` or `.git`). If a new
project uses a repository key that's already connected, the form warns and offers
View project / Ask to join / Save anyway. Similar titles are only a hint.

**6. No lost updates (R3.17).** Every project has a `version` number. A save
sends the version it loaded; the database update only matches if the version is
unchanged. If someone saved in between, the save is refused with 409 and the
form offers the newer version.

**7. GitHub import (R3.01–R3.03).** We call GitHub's public API for the repo and
its languages and *fill the form* with suggestions. Nothing is saved until the
student clicks Create.

**8. Demos (R3.18–R3.22).** Demo, video and source are separate links (http/https
only, no embed code). The public page shows Play demo / Watch video / View source
buttons that open in a new tab, plus a fallback image and text, so the page still
works if a demo is down.

## Tests

`npm test` runs `tests/resume-and-email.test.mts` and `tests/repo.test.mts`: the four resume fixtures
(including "no invented facts" and the untrusted-text fixture) and the email
domain rule.
