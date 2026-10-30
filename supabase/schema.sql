-- ImmXrsive Talent Platform: database schema (Release 2 repair)
--
-- How to use: open your Supabase project -> SQL Editor -> New query,
-- paste this whole file, and click Run. It is safe to run more than once.
-- Then run supabase/seed.sql the same way to load the Release 1 fixtures.
--
-- Security model: Row Level Security is ON for every table and there are
-- NO policies for the anon/authenticated roles. That means the browser can
-- never read or write these tables directly with the public anon key.
-- All reads and writes go through the Next.js server (src/app/api/...),
-- which uses the service-role key and enforces privacy and ownership.

-- Older versions of this app created differently-shaped tables with some of
-- the same names. Any existing table that doesn't have this design's marker
-- column is renamed to <name>_legacy_<timestamp> instead of being deleted,
-- so no old data is lost and the new tables can be created cleanly.
do $$
declare
  t record;
  i record;
  suffix text := to_char(now(), 'YYYYMMDDHH24MISS');
begin
  for t in
    select * from (values
      ('project_contributors', 'role'),
      ('students',             'section_order'),
      ('projects',             'domain'),
      ('skills',               'name'),
      ('app_users',            'github_id'),
      ('verification_challenges', 'code_hash'),
      ('inquiries',            'source_type')
    ) as v(tbl, marker)
  loop
    if exists (select 1 from information_schema.tables
               where table_schema = 'public' and table_name = t.tbl)
       and (
         not exists (select 1 from information_schema.columns
                     where table_schema = 'public' and table_name = t.tbl and column_name = t.marker)
         -- the new skills table has exactly one column
         or (t.tbl = 'skills' and (select count(*) from information_schema.columns
                                   where table_schema = 'public' and table_name = 'skills') <> 1)
         -- the new project_contributors table has a (project_id, student_id) primary key
         or (t.tbl = 'project_contributors' and not exists (
               select 1 from pg_constraint
                where conrelid = to_regclass('public.project_contributors') and contype = 'p'))
       ) then
      execute format('alter table public.%I rename to %I', t.tbl, t.tbl || '_legacy_' || suffix);
      -- Index names (including primary keys) must be unique, so rename the old ones too.
      for i in
        select indexname from pg_indexes
         where schemaname = 'public' and tablename = t.tbl || '_legacy_' || suffix
      loop
        execute format('alter index public.%I rename to %I', i.indexname, left(i.indexname, 40) || '_legacy_' || suffix);
      end loop;
    end if;
  end loop;
end $$;

create table if not exists public.skills (
  name text primary key
);

create table if not exists public.students (
  id              text primary key,                 -- public id used in URLs, e.g. S01
  user_id         uuid unique,                      -- references app_users(user_id), added below
                                                    -- internal owner (null for fixture students)
  name            text not null,
  headline        text not null default '',
  bio             text not null default '',
  program         text not null default '',
  status          text not null default 'current' check (status in ('current','alumni')),
  profile_status  text not null default 'draft'
                    check (profile_status in ('draft','published','unpublished')),
  availability    text[] not null default '{}',
  skills          text[] not null default '{}',     -- standardized skills only (used for filtering)
  suggested_skills text[] not null default '{}',    -- student suggestions not in the standard set (never public filters)
  links           jsonb not null default '{}'::jsonb,   -- {github, linkedin, portfolio}
  location        text not null default '',
  education       text not null default '',
  experience      text[] not null default '{}',
  visibility      jsonb not null default '{"availability":"public","links":"public","location":"private","education":"public","experience":"public"}'::jsonb,
  theme           text not null default 'classic' check (theme in ('classic','midnight','minimal')),
  section_order   text[] not null default '{projects,experience,education}',
  avatar          text not null default 'initials' check (avatar in ('initials','github')),
  avatar_url      text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.projects (
  id           text primary key,
  title        text not null,
  description  text not null default '',
  domain       text not null default '',
  technologies text[] not null default '{}',
  links        jsonb not null default '{}'::jsonb
);

create table if not exists public.project_contributors (
  project_id text not null references public.projects(id) on delete cascade,
  student_id text not null references public.students(id) on delete cascade,
  role       text not null default '',
  primary key (project_id, student_id)
);

-- One row per signed-in GitHub account. Ownership is tied to our own
-- internal user_id. GitHub is matched by its permanent numeric id, so a
-- GitHub username change never creates a second account or profile.
create table if not exists public.app_users (
  user_id                  uuid primary key default gen_random_uuid(),
  github_id                bigint not null unique,   -- GitHub's permanent numeric account id
  github_login             text not null default '', -- display only; may change
  github_avatar_url        text not null default '',
  affiliation_email        text,
  affiliation_verified_at  timestamptz,
  created_at               timestamptz not null default now()
);

-- Email verification challenges. Only a hash of the code is stored.
create table if not exists public.verification_challenges (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.app_users(user_id) on delete cascade,
  email       text not null,
  code_hash   text not null,
  attempts    int  not null default 0,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists verification_challenges_user_idx
  on public.verification_challenges (user_id, created_at desc);
create index if not exists verification_challenges_email_idx
  on public.verification_challenges (email, created_at desc);

-- Employer inquiries (simulated company intake, see fixtures/r1/company_intake_simulation.md)
create table if not exists public.inquiries (
  id            uuid primary key default gen_random_uuid(),
  source_type   text not null check (source_type in ('student','project')),
  source_id     text not null,
  source_name   text not null,
  source_url    text not null,
  company_name  text not null,
  contact_name  text not null,
  contact_email text not null,
  description   text not null,
  created_at    timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint
                 where conname = 'students_user_id_fkey' and conrelid = 'public.students'::regclass) then
    alter table public.students
      add constraint students_user_id_fkey foreign key (user_id)
      references public.app_users(user_id) on delete set null;
  end if;
end $$;

alter table public.skills                  enable row level security;
alter table public.students                enable row level security;
alter table public.projects                enable row level security;
alter table public.project_contributors    enable row level security;
alter table public.app_users               enable row level security;
alter table public.verification_challenges enable row level security;
alter table public.inquiries               enable row level security;

-- Atomically mark a challenge as used. Returns true only for the first caller,
-- so a code can never be used twice even with two requests at the same time.
create or replace function public.consume_challenge(p_id uuid)
returns boolean
language sql
as $$
  update public.verification_challenges
     set used_at = now()
   where id = p_id and used_at is null and expires_at > now()
  returning true;
$$;

-- ===================================================================
-- Release 3: shared projects, contributors, invitations and demos
-- Safe to run more than once. Existing Release 1 fixture projects keep
-- working: they become published projects with accepted contributors.
-- ===================================================================

create table if not exists public.project_roles (
  name text primary key
);
alter table public.project_roles enable row level security;
insert into public.project_roles (name) values
  ('Software Developer'),('XR Developer'),('Frontend Developer'),('Backend Developer'),
  ('Game Developer'),('3D Artist'),('Technical Artist'),('UI/UX Designer'),
  ('Project Manager'),('Researcher'),('QA/Tester'),('Data/AI Developer')
on conflict do nothing;

alter table public.projects add column if not exists maintainer_student_id text references public.students(id) on delete set null;
alter table public.projects add column if not exists publish_status text not null default 'published'
  check (publish_status in ('draft','published'));
alter table public.projects add column if not exists project_status text not null default 'completed'
  check (project_status in ('in-progress','completed'));
alter table public.projects add column if not exists project_date text not null default '';
alter table public.projects add column if not exists repositories text[] not null default '{}';
alter table public.projects add column if not exists repo_keys text[] not null default '{}';
alter table public.projects add column if not exists demo_url text not null default '';
alter table public.projects add column if not exists video_url text not null default '';
alter table public.projects add column if not exists fallback_image_url text not null default '';
alter table public.projects add column if not exists fallback_text text not null default '';
alter table public.projects add column if not exists version int not null default 1;
alter table public.projects add column if not exists created_at timestamptz not null default now();
alter table public.projects add column if not exists updated_at timestamptz not null default now();
create index if not exists projects_repo_keys_idx on public.projects using gin (repo_keys);

-- Contributor relationship. status: invited -> accepted | declined;
-- requested (asked to join) -> accepted | declined; accepted -> removed (soft
-- delete, restorable by the maintainer). Rows are never deleted once accepted.
alter table public.project_contributors add column if not exists status text not null default 'accepted'
  check (status in ('invited','requested','accepted','declined','removed'));
alter table public.project_contributors add column if not exists statement text not null default '';
alter table public.project_contributors add column if not exists featured boolean not null default true;
alter table public.project_contributors add column if not exists invited_by text;
alter table public.project_contributors add column if not exists created_at timestamptz not null default now();
alter table public.project_contributors add column if not exists updated_at timestamptz not null default now();
alter table public.project_contributors add column if not exists removed_at timestamptz;
alter table public.project_contributors add column if not exists removed_by text;

-- Move the Release 1 fixture links into the new structured fields (once).
update public.projects set repositories = array[links->>'repository']
 where repositories = '{}' and coalesce(links->>'repository','') <> '';
update public.projects set demo_url = links->>'demo'
 where demo_url = '' and coalesce(links->>'demo','') <> '';
update public.projects set video_url = links->>'video'
 where video_url = '' and coalesce(links->>'video','') <> '';
-- Fixture for the duplicate-warning test (fixtures/r3/project_duplicate_cases.json):
-- the existing "XR Anatomy Lab" project owns this repository.
update public.projects set repositories = array['https://github.com/example-org/xr-anatomy']
 where id = 'P04' and repositories = '{}';
-- Normalized repository keys used for duplicate detection
-- (same rule as repoKey() in src/lib/projects.ts).
update public.projects p set repo_keys = coalesce((
  select array_agg(distinct lower(regexp_replace(regexp_replace(regexp_replace(trim(r),
           '^https?://(www\.)?', ''), '/+$', ''), '\.git$', '')))
    from unnest(p.repositories) r where trim(r) <> ''), '{}');
