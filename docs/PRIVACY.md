# Privacy and visibility summary

**What visitors can see.** Only *published* profiles appear anywhere public:
the directory, profile pages, project pages and the public API (`/api/students`,
`/api/students/{id}`). Drafts and unpublished profiles return "not found".

**Always public on a published profile:** name, headline, about text, program,
status (current/alumni), standardized skills, GitHub link and project evidence.

**Student-controlled (Public / Private):** availability, LinkedIn and portfolio
links, location, education and experience. Location is private by default.

**How privacy is enforced.** Private fields are removed on the server before any
data leaves it (`toPublic()` in `src/lib/students.ts`). They are not hidden with
CSS: they are simply not in the page or in any public API response. When
availability is private, the student is not matched by availability filters,
so a filter can't reveal it indirectly.

**Database access.** Row Level Security is on for every table, with no public
policies, so the browser cannot read the database directly. Only the server, with
a secret key, can.

**Resume files.** The uploaded PDF is read in memory to make suggestions, then
discarded. It is never stored, so it can't be downloaded by anyone (R2.18).
Email addresses and phone numbers in a resume are never suggested.

**Verification.** We store the verified email address so the student doesn't need
to verify again, and only a keyed hash of each code, never the code itself.
Codes are never shown on screen, returned by the API or written to logs.

**GitHub.** Sign-in requests no GitHub permissions. We keep only the GitHub
account's numeric id, username and avatar address.

**Employer inquiries** are stored with the student or project they're about and
the contact details the employer enters. No employer account is created.
