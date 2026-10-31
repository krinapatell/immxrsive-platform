# Release 3 — Shared projects, contributor evidence and playable demos

Deployment: https://immxrsive-platform.vercel.app · Tag: `R3-submission`

## What's new

- **My projects** (`/student/projects`): one **Add project** workflow. Fill the
  form by hand, or start from a public GitHub repository: we read its name,
  description, languages, URL and homepage and put them in the form as
  suggestions you can change before saving (R3.01–R3.03).
- A project can have **zero, one or several repository links**. Removing or
  changing a repository never deletes the project or changes its URL (R3.04, R3.26).
- **Shared projects**: one project record, shown on every contributor's
  profile (R3.05). The creator is the first **maintainer** (R3.06) and can hand
  maintenance to another accepted contributor; the project keeps its URL (R3.07).
- **Invitations**: the maintainer invites a teammate by GitHub username with a
  standard role from `standard_roles.json`. The teammate sees the invitation
  under My projects and can accept (and adjust the role) or decline. Invited
  people are never shown publicly until they accept (R3.08–R3.10).
- **Your own contribution**: each accepted contributor writes their own
  contribution statement and chooses whether the project is featured on their
  profile. Nobody else can change these (R3.11, R3.12).
- **Duplicate warning**: adding a repository already connected to a project
  shows a warning with **View project** and **Ask to join** (the maintainer
  approves or declines). Repository URLs are compared ignoring `https://`,
  `www.`, capitals, a trailing `/` and `.git`. A similar title is never merged
  automatically (R3.16).
- **No silent lost updates**: every save of shared project details carries the
  version it was loaded from. If someone saved in between, the save is refused,
  nothing is overwritten, and the editor shows the newer version (R3.17).
- **Demos**: projects store a playable demo link, a video link and source links
  separately, plus a fallback image and description. The public project page
  shows **Play demo**, **Watch video** and **View source** buttons that open in
  a new tab, and the fallback preview below them. Students enter links only;
  no embed code or HTML is accepted (R3.18–R3.22).

## Decisions required by the release

- **Who may edit shared project fields:** only the project's current
  **maintainer**. Other accepted contributors edit only their own role,
  contribution statement and "show on my profile" choice.
- **Removal protection model: reversible soft delete.** When the maintainer
  removes a contributor, their relationship and statement are kept with status
  *removed*; they disappear from the public page, the removed student still sees
  the project in My projects, and the maintainer can **Restore** them at any time.
  Nothing is ever hard-deleted once accepted.

## Evidence for QA

- Shared published project with two accepted contributors: see
  `release_submission.md`.
- Working demo hosted on our deployment:
  https://immxrsive-platform.vercel.app/demos/working-demo.html, with fallback
  image https://immxrsive-platform.vercel.app/demos/fallback.svg.
- Public repository for the GitHub import test:
  https://github.com/krinapatell/immxrsive-platform
- Broken-demo example: fixture project P07 links to `https://example.invalid/demo`.
- Duplicate-warning fixture: project P04 (XR Anatomy Lab) is connected to
  `https://github.com/example-org/xr-anatomy`, matching
  `project_duplicate_cases.json`.

## Known issues / limits

- Teammates can only be invited after they have signed in and verified their
  Algoma email (we invite by exact GitHub username, so no student list is exposed).
- GitHub import works for public repositories only and depends on GitHub's API
  rate limit; if GitHub is busy, the form can be filled by hand.
- Demo links open in a new tab rather than being embedded, so whether a demo
  runs depends on the demo's own site and the visitor's device.
