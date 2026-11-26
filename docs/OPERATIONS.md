# Operations note

One page for whoever runs the site after launch.

## Deployment

- **Hosting:** Vercel project `immxrsive-platform`, production URL
  https://immxrsive-platform.vercel.app. Every push to `main` deploys
  automatically; pull requests get preview deployments.
- **Database:** Supabase (Postgres). The whole schema is `supabase/schema.sql`.
  It is safe to run more than once; each release adds a section at the end.
  After running SQL, run `notify pgrst, 'reload schema';` so the API sees new
  columns. Release 1 sample data is `supabase/seed.sql`.
- **Check after a deploy:** open `/api/health`. Every table should say
  `ok, N rows` and `final_release_ready` should be `true`. Settings are shown
  as true/false only, never their values.
- **Rollback:** in Vercel, *Deployments* → choose the previous good deployment →
  *Promote to Production*. Schema changes are additive (new columns/tables), so
  an older build keeps working with the newer database.

## Settings (Vercel → Settings → Environment Variables)

| Name | Used for | If missing |
|---|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Database (server only) | Pages show "temporarily unavailable" |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | Student sign-in | Sign-in shows "not set up on this deployment" |
| `SESSION_SECRET` (32+ characters) | Signing the session cookie | Sign-in fails |
| `SITE_URL` | GitHub callback and links in emails | Sign-in redirect fails |
| `BREVO_API_KEY`, `MAIL_FROM` | Sending verification codes | Student sees "We couldn't send the email"; error logged |
| `ALLOWED_EMAIL_DOMAINS` | Which emails count as Algoma (default `algomau.ca`) | Default used |
| `STAFF_ACCESS_CODE` (12+ characters) | Turning on staff tools | `/staff` says staff access is not set up |

None of these are in the repository or sent to the browser. `.env.example`
lists the names only. To change the staff code, change the variable and
redeploy; existing staff keep their role (remove someone with **Turn off staff
tools** while signed in as them, or delete their row in `staff_members`).

## External services and what happens when they fail

| Service | Used for | When it fails |
|---|---|---|
| GitHub OAuth | Sign-in | Clear message on `/student`; public site unaffected |
| GitHub API | "Start from a GitHub repository" | Message; the student fills the form by hand |
| Brevo | Verification emails | Message with "send a new code"; logged as an error |
| Company websites | "Fill from website" | Message; staff type the details; typed values kept |
| Demo hosts | Playable demos | Demo runs in a sandboxed frame or new tab; the page, fallback preview and navigation keep working; staff or the maintainer can mark a demo *not working* or *archived* |

## Diagnostics

- **`/staff/diagnostics`** (staff only): the last 150 events with time, level,
  area and context — failed emails, failed GitHub/company imports, unexpected
  server errors (with the first lines of the stack), migrations, merges, claim
  approvals, maintainer and demo changes.
- **Vercel → Logs**: the same lines (prefixed with level and area) plus normal
  request logs.
- Context keys that look like secrets (`secret`, `token`, `password`, `code`,
  `key`, `cookie`, `authorization`, `session`) are dropped before anything is
  logged. Users only ever see a plain message, never a stack trace.
- The `app_events` table can be cleared at any time; nothing depends on it.

## Routine tasks

- **Import old data:** `/staff/migrate` (see `docs/MIGRATION.md`).
- **Claims, duplicates, verifications, partner requests:** all on `/staff`.
- **A maintainer left:** `/staff/projects` → project → *New maintainer*.
- **A demo broke:** `/staff/projects` → project → *Demo status*.
