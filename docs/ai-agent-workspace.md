# AI Agent Workspace — Design

Status: **draft** · Owner: toki · Created: 2026-06-10

How the AI Access key (issued via [TON AI Access](https://github.com/tokamak-network/tokamak-ai-access)) becomes a usable, agentic AI experience inside toki — and how that extends to a future Electron desktop agent.

## 1. Vision

Stake TON → issue an AI key → **use AI freely inside toki**, eventually in a standalone desktop agent. The issued LiteLLM key (billed to the user's stake) is the credential; toki provides the interface.

Two distinct chat surfaces (keep them separate):

| Surface | Purpose | Model / key | Status |
|---|---|---|---|
| **TokiChat** (`src/components/chat/TokiChat.tsx`) | Mascot **consultation** — explains staking, wallet, onboarding | toki's **service** key (`LITELLM_API_KEY`, server-side, `qwen3-235b`) | live |
| **Agent Workspace** (new) | **Agentic** AI the user drives with **their own** issued key | the **user's** `sk-litellm-…` key | this doc |

TokiChat is the guide; the Agent Workspace is the product the stake unlocks. They share visual language but are different routes, prompts, and credentials.

## 2. Stages

| Stage | Scope | Gating |
|---|---|---|
| **0 — Issue** | In-app SIWE-delegated key issuance (modal) | ✅ built; live needs AI Access PR #1 + 3 env conditions |
| **1 — Agent chat MVP** | `/agent` route: chat with the Tokamak AI server using the issued key, via a toki proxy | this doc |
| **2 — Agentic tools** | Tool-use: on-chain reads (balance, staking, APR), then actions — à la Tokagentos plugins | later |
| **3 — Desktop** | Electron shell wrapping the same Agent UI; key in OS keychain | later |

## 3. Key lifecycle

```
issue (Stage 0)  →  store  →  use (Agent Workspace)  →  expire (30d) / rotate / revoke
```

- **Issue**: `issueAiAccessKey()` returns `{ key, expiresAt }` once (`src/lib/aiAccess.ts`).
- **Store**: see §4 — MVP client-side, hardened server-side.
- **Use**: `/api/agent` proxy forwards chat to the AI server with the key as bearer.
- **Expire/rotate**: keys are 30-day. On `401` from the AI server, prompt re-issue (the delegated endpoint's `409` dedup means re-issue requires the prior key to be expired/revoked — manage on the AI Access site for now).

## 4. Where the key lives (the central decision)

toki has **no server-side user auth today** (API routes take input + use `supabaseAdmin`; Privy is client-only). That shapes the options:

### MVP (Stage 1) — client-side key + proxy  ✅ recommended to start
- After issuance, store the key in `localStorage` (`toki.aiAccessKey` = `{ key, expiresAt }`).
- The Agent Workspace sends the key to **`/api/agent`** per request; the proxy attaches it as the bearer to the AI server.
- **Why a proxy** (not call the AI server directly from the browser): avoids cross-origin CORS with the AI server, lets toki normalize model names, and adds server-side guardrails (timeout, max tokens, basic rate limiting).
- **Risk**: an XSS bug could read the key from `localStorage`. Accepted for MVP because the key is the **user's own**, scoped to **LLM inference only**, **30-day**, **revocable**, and **billed to their own stake** — blast radius is limited and self-contained. Mitigate with the usual XSS hygiene (no `dangerouslySetInnerHTML` on model output, CSP).

### Stage 2 hardening — server-side encrypted vault + Privy auth  ✅ implemented 2026-06-19
- **Auth = Privy access token, verified server-side** (`@privy-io/server-auth`, `PRIVY_APP_SECRET`). Every login method (Google / email / MetaMask external wallet) is a Privy session, so one check covers all — chosen over a bespoke SIWE session (simpler, no nonce/cookie infra). `src/lib/privyServer.ts`.
- Key **AES-256-GCM encrypted at rest in Supabase** (`ai_access_keys`, keyed by Privy user id; `AI_KEY_ENC_SECRET`). `src/lib/crypto.ts` + `src/lib/aiKeyStore.ts`.
- `/api/agent` + `/api/agent/usage` **resolve+decrypt the key from the verified user** server-side — the browser never sends or holds it. Legacy `localStorage` keys auto-migrate to the vault then clear. Plaintext returned only on explicit reveal (`GET /api/aikey?reveal=1`) for tool export.
- Endpoints: `/api/aikey` — `POST` store · `GET` status · `GET ?reveal=1` · `DELETE`. Enables cross-device + clean revoke.
- **Activate**: env `PRIVY_APP_SECRET` + `AI_KEY_ENC_SECRET` (`openssl rand -hex 32`), and apply `supabase/migrations/20260619000000_ai_access_keys.sql`. Until set, the AI endpoints return 503 and the UI shows the gate.

### Stage 3 — desktop
- Electron stores the key in the **OS keychain** (Keychain / Credential Manager / libsecret) — strictly better than browser storage. Same `/api/agent` contract (or a local equivalent).

## 5. Components (Stage 1)

```
src/app/agent/page.tsx                 # /agent route (auth-gated, like /dashboard)
src/components/agent/AgentWorkspace.tsx # the agentic chat UI (separate from TokiChat)
src/app/api/agent/route.ts             # proxy: {messages, key} → AI server /v1/chat/completions
src/lib/aiAccess.ts                    # + key storage helpers (save/load/clear) + agentChat()
```

- **`/api/agent`**: validates `key` format (`sk-…`) + `messages`, forwards to `${AI_ACCESS_LLM_URL}/v1/chat/completions` with `Authorization: Bearer <key>`, streams or returns the completion. Server env: `AI_ACCESS_LLM_URL` (default `https://api2.ai.tokamak.network`), `AI_ACCESS_MODEL`.
- **AgentWorkspace**: multi-turn chat, message history in component state (later: persisted). If no stored key → empty state with a "발급받기" CTA pointing at the hub issuance. Dev affordance: allow pasting a key manually so the UI is testable before the issuance path is live.
- **Entry point**: hub `HudRail` AI button — when a key is already stored, route to `/agent` instead of issuing; otherwise issue first.

## 6. Agentic tools (Stage 2 — sketch)

Give the agent tools, mirroring Tokagentos' action/provider model:
- **Read**: `getBalances`, `getStakingPositions`, `getApr`, `getOperators` (reuse `src/lib/staking*`).
- **Act** (guarded, explicit confirm): `stake`, `unstake`, `withdraw` — routed through the user's existing wallet (Privy), never the AI key.
- The AI key authorizes **inference**; the **wallet** authorizes **on-chain**. Never conflate them.

This is the natural convergence with [Tokagentos](https://github.com/tokamak-network/Tokagentos-monorepo) (agents with built-in wallets): toki's Agent Workspace could later host or interop with a Tokagentos agent.

## 7. Go-live dependencies

Stage 1 builds independently but is **only end-to-end once Stage 0 is live**:
1. AI Access **PR #1** merged + deployed.
2. AI Access env `DELEGATED_ALLOWED_ORIGINS` = toki origin.
3. toki env `NEXT_PUBLIC_AI_ACCESS_BASE` set.

Until then: issuance falls back to the AI Access site, and `/agent` works only with a manually-pasted key (dev).

## 8. Open questions

- **Key rotation UX**: re-issue requires the old key expired/revoked (delegated `409`). Do we add a toki-side "rotate" that calls the AI Access rotate endpoint, or defer to the AI Access site?
- **History persistence**: in-memory (MVP) vs Supabase per-user (needs the Stage 2 session).
- **Model choice**: single model vs user-selectable (the AI server exposes several via LiteLLM).
- **Streaming**: SSE from `/api/agent` for token streaming (nice-to-have; MVP can be non-streaming).

## 9. Troubleshooting — "Key rejected" / usage stuck on "loading…"

**Symptom**: `/agent` shows "Your key was rejected (expired or revoked)" and resets to
the issue gate; the AI ACCESS PASS card's usage sticks on "loading…".

**Root cause (verified 2026-06-23)**: the issued LiteLLM key lives on the **shared
`api2.ai.tokamak.network` proxy** — both mainnet and Sepolia AI Access deploys set
`LITELLM_BASE_URL=https://api2.ai.tokamak.network` (per the `tokamak-network/tokamak-ai-access`
repo, `main` and `sepolia`). So this is **not** a network/URL mismatch — toki's
`/api/agent` + `/api/agent/usage` already point at the same `api2`. The key is rejected
because it was **deleted or expired on `api2`** (e.g., the LiteLLM key DB was reset).
Re-issuing in-app then hits the AI Access **KV dedup → `409` "Key already issued"**
(stake-type keys carry no expiry, so the ledger record never auto-clears).

**What toki does now**:
- The usage proxy returns a `reason` (`auth | nokey | revoked | unconfigured`); the card
  shows real state (loading / used+%-left / `usage unavailable`) instead of a permanent
  spinner.
- On a genuine `401 revoked/expired` (chat or usage), toki **deletes the dead key from the
  Supabase vault** (`clearAiKeyServer`) so a reload shows a clean gate, not a dead card.
- The gate always offers **"Manage key on AI Access site"** (`AI_ACCESS_URL`) — the real
  recovery path, since toki has no delegated revoke/rotate endpoint.

**User recovery**: open the AI Access site (network-aware `AI_ACCESS_URL`), sign in with the
same wallet, and **rotate / renew / delete** the key there; then return to toki and re-issue.

**If networks ever diverge** (separate LiteLLM per network): set `AI_ACCESS_LLM_URL` on the
toki deploy to that network's proxy — `/api/agent` and `/api/agent/usage` already read it
(`AI_ACCESS_LLM_URL ?? api2.ai.tokamak.network`).
