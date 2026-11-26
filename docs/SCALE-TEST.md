# Scale test (F.27 – F.29)

## Setup

`scale_fixture.json` (220 students, 110 projects, 25 companies) imported through
**Staff → Import from the old site**, the same importer used for the legacy
export. No separate loading code.

## What the directory loads (F.28)

The directory is paged on the server: 24 profiles per page, with filters
applied in the database (`searchStudents()` in `src/lib/students.ts`, with
`count`, `range`, `contains`/`overlaps` and indexes `students_directory_idx`
and `students_skills_idx`).

Measured on a local copy of the production build:

| Public profiles in the database | `/` (first page, HTML) | `/api/students` (first page, JSON) |
|---|---|---|
| 21 (before the scale fixture) | 84.7 KB | 10.4 KB |
| 229 (after the scale fixture) | 95.2 KB | 11.9 KB |

Ten times more students changes the first load by about 10 KB (the extra page
links and counts), not ten times. Every request returns at most 24 profiles.

Checks with the scale data loaded:

| Query | Result |
|---|---|
| `/api/students` | 229 found, 24 returned, page 1 |
| `/api/students?page=10` | page 10, 13 returned |
| `/api/students?skills=Unity` | 22 found |
| `/api/students?skills=Unity&availability=contract` | 16 found (only confirmed Active Talent) |
| `/api/students?status=alumni&page=2` | 48 found, page 2 |
| `/api/students?q=Synthetic+Student+19` | 10 found |

All responses took under 0.1 s locally.

## Heavy media (F.29, F.33)

- Directory cards have initials only: no images, videos, resumes or demos.
- Profile avatars and project preview images use `loading="lazy"`.
- Project pages never load a demo until the visitor presses **Play**. Video is
  a link. You can confirm this in the browser's Network panel: opening a project
  page makes no request to the demo URL.

## How to repeat it on the deployed site

1. `/staff/migrate` → choose `scale_fixture.json` → **Import** (or look at the
   saved run under *Earlier runs*).
2. Open `/` with the Network panel open: one page of 24 profiles.
3. Try the filters above and the **Next** link at the bottom of the directory.
