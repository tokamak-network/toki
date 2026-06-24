-- Toki Passport leaderboard: one score row per Privy user, ranked by score desc.
-- Written exclusively via the service-role key (supabaseAdmin); RLS on with no
-- public policies so the anon/client key can never read or write it directly.
create table if not exists public.profile_scores (
  privy_user_id text primary key,
  address       text,
  display_name  text,
  score         integer     not null default 0,
  level         integer     not null default 1,
  tier          text,
  updated_at    timestamptz not null default now()
);

create index if not exists profile_scores_score_idx on public.profile_scores (score desc);

alter table public.profile_scores enable row level security;
