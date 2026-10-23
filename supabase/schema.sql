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

-- Older versions of this app created differently-shaped "students" and
-- "projects" tables. Keep them (renamed) instead of deleting any data.
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'students')
     and not exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'students'
               and column_name = 'profile_status') then
    alter table public.students rename to students_legacy;
  end if;
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'projects')
     and not exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'projects'
               and column_name = 'technologies') then
    alter table public.projects rename to projects_legacy;
  end if;
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
  if not exists (select 1 from pg_constraint where conname = 'students_user_id_fkey') then
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
