# Legacy migration: how to run it, and what it found

Covers F.01 – F.06 and F.27. The importer is part of the product: staff use it
from the website, and it writes through the same tables and queries as every
other record.

## How to run it

1. Sign in at `/student`, verify your Algoma email, open `/staff` and turn on
   staff tools with the staff access code.
2. Open **Staff home → Import from the old site** (`/staff/migrate`).
3. Choose the export file (`legacy_export.json`, or a file in the same shape as
   `scale_fixture.json`).
4. Press **Check file (no changes)**. This is a dry run: it shows exactly what
   would be created, updated, left unchanged or reported, and saves nothing.
5. Press **Import**. The report is saved. **Download report** gives the full
   report as JSON (also listed under *Earlier runs*).
6. Running the same file again is safe (F.02): records are matched by their
   legacy id, so the second run reports everything as *unchanged*.

There is no command-line step and no SQL to paste. The only one-time setup is
the database section "Final release" in `supabase/schema.sql`.

## Rules the importer follows

| Rule | Why |
|---|---|
| Every record keeps its legacy id in `legacy_id`, stored once and never changed. Public ids are the legacy ids (`/students/LS01`, `/projects/LP01`, `/partners/LC01`). If an id is already used by a different record, the new one gets an `M` prefix. | Stable identity (F.06). A rename, a new email, a new domain or a new GitHub username never breaks the link. |
| A re-run matches on `legacy_id`. Unchanged records are *skipped*; changed ones are *updated*; missing ones are *created*. | Idempotent (F.02). |
| A record that was claimed, merged or edited on the new site since it was imported is never overwritten by the old export. It is listed under *Kept as changed on the new site*. | Staff and owners' work wins over old data. |
| Missing references (LP02 → LS99) are skipped and listed, never invented. Malformed or repeated records are listed and not imported. | Validation report (F.03). |
| Possible duplicates (same email, same website domain with or without `www.`, or marked in the export) are imported as separate records and flagged for staff. Nothing is merged automatically. | Staff merge (F.17). |
| A project with several contributors becomes one shared project with one accepted contributor row per person and the legacy role. The first listed contributor maintains it until staff assign someone else. | Shared projects (F.04, F.19). |
| Collaborations keep `current`/`past` and `public`/`limited`/`private`. The legacy export has no years, so the year is stored as unknown and shown as "Year not recorded" rather than guessed. | History (F.05). |
| The legacy email is stored in `legacy_email`. Only staff can see it. It is used to approve a claim automatically when it equals the claimant's verified email. | Privacy (F.20), claims (F.08). |
| Legacy availability dates are kept. Dates older than 365 days show as "not confirmed" until the student confirms. | Stale availability (F.14). |
| `publication: retired` becomes a retired profile (hidden, but its project roles stay as "a former contributor"). | Lifecycle (F.15, F.16). |

## Result for the supplied `legacy_export.json`

First import into an empty database (same result on the deployed site):

| Records | New | Updated | Unchanged | Problems |
|---|---|---|---|---|
| Student profiles | 6 | 0 | 0 | 0 |
| Projects | 3 | 0 | 0 | 1 (LP02 lists LS99) |
| Project contributors | 4 | 0 | 0 | 0 |
| Companies | 3 | 0 | 0 | 0 |
| Collaborations | 4 | 0 | 0 | 0 |

Second import of the same file: **0 new**, everything *unchanged*, the same
LS99 problem reported again. No duplicate rows.

Compared with `fixtures/final/legacy_expected_results.json`:

| Expected | Found |
|---|---|
| Counts 6 students, 3 projects, 3 companies, 4 collaborations | Same |
| Duplicate LS04 → LS01 (same email) | Same |
| Broken reference LP02 → LS99 | Same |
| Unclaimed LS02, LS05, LS06 | Same (LS04 is not listed because it is a duplicate, not a person to contact) |
| Shared project kept | LP01 = one project with LS01 (XR Developer) and LS02 (Interaction Developer) |
| Private collaboration kept private | LCO3 is private; it is not on `/partners/LC03` or `/api/partners/LC03` |

Also reported: possible duplicate company **LC02 → LC01** (same domain once
`www.` is removed). The export marks it as a duplicate too.

## Scale fixture (F.27, F.28)

`scale_fixture.json` was imported through the **same** page and code: 220
students, 110 projects, 330 contributor rows, 25 companies. A second run: 0 new.
See `docs/SCALE-TEST.md` for the directory measurements.
