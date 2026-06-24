-- AI Access key vault (Stage 2): the user's LiteLLM key, encrypted at rest
-- (AES-256-GCM, app-side), keyed by the Privy user id. Replaces browser
-- localStorage so the key never persists in the browser.

create table if not exists public.ai_access_keys (
  privy_user_id text primary key,
  address       text,
  ciphertext    text not null,
  iv            text not null,
  auth_tag      text not null,
  last_four     text,
  expires_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Server-only access: the app reads/writes via the service role (bypasses RLS).
-- Enable RLS with NO public policies so anon / authenticated keys cannot touch it.
alter table public.ai_access_keys enable row level security;
