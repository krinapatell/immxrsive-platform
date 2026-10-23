# Setup guide

Everything the deployed site needs, in the order to do it. Nothing here needs
the command line. Allow about 20 minutes.

You will end up with these settings (environment variables) in Vercel:

| Name | What it is | Where it comes from |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project address | Supabase, step 1 |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only database key (keep secret) | Supabase, step 1 |
| `GITHUB_CLIENT_ID` | Identifies the GitHub sign-in app | GitHub, step 2 |
| `GITHUB_CLIENT_SECRET` | GitHub sign-in secret (keep secret) | GitHub, step 2 |
| `BREVO_API_KEY` | Lets the site send verification emails (keep secret) | Brevo, step 3 |
| `MAIL_FROM` | The address emails come from | Brevo, step 3 |
| `SESSION_SECRET` | Random text used to sign sign-in cookies (keep secret) | Step 4 |
| `SITE_URL` | The site's public address, e.g. `https://immxrsive-platform.vercel.app` | Step 4 |
| `ALLOWED_EMAIL_DOMAINS` | Approved student email domains, e.g. `algomau.ca` | Step 4 |

Optional: `VERIFICATION_TTL_MINUTES` (default 15, never more than 30),
`VERIFICATION_MAX_SENDS` (default 3 per 15 minutes), `VERIFICATION_MAX_ATTEMPTS` (default 5).

Never put any of these values in GitHub, Moodle, issues or chat.

## 1. Supabase (database)

1. Open your project at https://supabase.com/dashboard.
2. Go to **SQL Editor → New query**. Open `supabase/schema.sql` from this repository,
   copy all of it into the editor and click **Run**. It should say "Success".
   (If your old `students` table has a different shape, it is renamed to
   `students_legacy` so nothing is lost.)
3. Make another **New query**, paste all of `supabase/seed.sql`, and click **Run**.
   This loads the 18 fixture students, 9 projects and 24 skills.
4. Go to **Project Settings → API** (or **Data API**). Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role** key (click "Reveal") → `SUPABASE_SERVICE_ROLE_KEY`

## 2. GitHub sign-in

1. Go to https://github.com/settings/developers → **OAuth Apps → New OAuth App**.
2. Fill in:
   - Application name: `ImmXrsive Talent Platform`
   - Homepage URL: your site, e.g. `https://immxrsive-platform.vercel.app`
   - Authorization callback URL: the same address plus `/api/auth/github/callback`,
     e.g. `https://immxrsive-platform.vercel.app/api/auth/github/callback`
3. Click **Register application**. Copy the **Client ID** → `GITHUB_CLIENT_ID`.
4. Click **Generate a new client secret** and copy it → `GITHUB_CLIENT_SECRET`.

The site asks GitHub for no permissions at all, only the public profile.

## 3. Email (verification codes)

Brevo's free plan sends up to 300 emails a day to any address, with no domain setup.

1. Create a free account at https://www.brevo.com.
2. Go to **Senders, domains & dedicated IPs → Senders → Add a sender**. Use an
   address you can open (your own email is fine) and confirm it from the email Brevo sends.
   That address → `MAIL_FROM`.
3. Go to **SMTP & API → API keys → Generate a new API key**. Copy it → `BREVO_API_KEY`.

(If your team already has a Resend account **with a verified domain**, you can use
`RESEND_API_KEY` instead of `BREVO_API_KEY`, with `MAIL_FROM` on that domain.)

## 4. Vercel

1. Open the Vercel project that serves your main site.
2. Go to **Settings → Environment Variables** and add every value from the table above.
   For `SESSION_SECRET`, use any random string of at least 32 characters
   (for example from a password manager's generator).
3. Make sure **Settings → Git** deploys the `main` branch.
4. Redeploy (**Deployments → ⋯ → Redeploy**) so the new settings take effect.

## 5. Check it works

1. Open the site in a private window: the directory should list 17 students
   (Nora Evans is unpublished and must not appear).
2. Open `/student`, sign in with GitHub, and verify with an `@algomau.ca` address.
3. Create a profile, set a field to Private, preview, publish, and check it appears
   in the directory. Then unpublish and check it disappears.

## Running locally (developers)

Copy `.env.example` to `.env.local`, fill in the values, then `npm install` and
`npm run dev`. For local GitHub sign-in, create a second OAuth App whose callback is
`http://localhost:3000/api/auth/github/callback`. Run the automated checks with `npm test`.
