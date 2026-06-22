// TON AI Access — Tokamak ecosystem service (tokamak-network/tokamak-ai-access).
// Stake >= MIN_TON_AI_ACCESS TON on Ethereum L1 → receive a LiteLLM virtual API
// key for the Tokamak AI server (api2.ai.tokamak.network), usable in Claude Code /
// Codex / any OpenAI-compatible client.
//
// Single source of truth shared by the hub lobby (HudRail) and the detailed
// wallet view (AiAccessCard) so the threshold and handoff URL never drift apart.
import { createSiweMessage } from "viem/siwe";
import { getAddress } from "viem";
import { isTestnet } from "@/lib/chain";

export const MIN_TON_AI_ACCESS = 100;

// AI Access service domain — network-aware so Sepolia testnet and mainnet each
// talk to their own deploy (toki's network is driven by NEXT_PUBLIC_NETWORK).
// Used as the external handoff link AND the native-issuance origin.
export const AI_ACCESS_URL = isTestnet
  ? "https://tokamak-ai-access-git-sepolia-theo-3096s-projects.vercel.app"
  : "https://tokamak-ai-access.vercel.app";

// Models the AI server exposes (OpenAI-compatible). First entry is the default.
export const AI_MODELS = ["qwen-3.6", "deepseek-v4-flash", "gemma-4"] as const;

// Where the Advanced "API docs" link points (repoint if a dedicated docs page lands).
export const AI_ACCESS_DOCS_URL = AI_ACCESS_URL;

// Native in-app issuance (Arch B): toki calls a delegated, CORS-gated endpoint on
// the AI Access service (master key + key ledger stay there; toki only proves the
// user via SIWE). It hits the SAME network domain as AI_ACCESS_URL above — no
// separate URL to configure. Flip on per-deploy with NEXT_PUBLIC_AI_ACCESS_NATIVE=1
// once that deploy's /api/keys/issue-delegated is live and allowlists this app's
// origin (DELEGATED_ALLOWED_ORIGINS); otherwise the "issue key" CTA falls back to
// the external handoff.
export const AI_ACCESS_BASE = AI_ACCESS_URL;
export const isNativeIssueEnabled =
  process.env.NEXT_PUBLIC_AI_ACCESS_NATIVE === "1";

const SIWE_STATEMENT = "Sign in to Tokamak LLM Access with your Ethereum account.";

export interface IssueResult {
  key: string;
  expiresAt: string;
}

/** Minimal EIP-1193 surface — Privy's getEthereumProvider() satisfies this. */
export interface Eip1193Provider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

export class AiAccessError extends Error {
  status: number;
  /** Disambiguates a 401/429: "budget" | "auth" | "expired" | "revoked" | "nokey". */
  reason?: string;
  constructor(message: string, status: number, reason?: string) {
    super(message);
    this.name = "AiAccessError";
    this.status = status;
    this.reason = reason;
  }
}

async function asError(res: Response): Promise<AiAccessError> {
  let msg = `HTTP ${res.status}`;
  try {
    const body = (await res.json()) as { error?: string };
    if (body?.error) msg = body.error;
  } catch {
    // non-JSON body; keep the status-code message
  }
  return new AiAccessError(msg, res.status);
}

/**
 * Run the full native issuance flow against the delegated endpoint:
 *  1. GET a single-use nonce for the address.
 *  2. Build a SIWE message and have the user sign it (personal_sign).
 *  3. POST {message, signature} → the server verifies, re-checks stake on-chain,
 *     mints a LiteLLM key, and returns it once.
 *
 * Throws AiAccessError with the HTTP status on failure (403 = insufficient stake,
 * 409 = key already issued, 401 = bad signature/nonce).
 */
export async function issueAiAccessKey(
  provider: Eip1193Provider,
  address: string,
  onPhase?: (phase: "signing" | "issuing") => void,
): Promise<IssueResult> {
  if (!AI_ACCESS_BASE) throw new AiAccessError("AI Access not configured", 0);
  const account = getAddress(address);
  const endpoint = `${AI_ACCESS_BASE}/api/keys/issue-delegated`;

  // 1) nonce
  const nonceRes = await fetch(`${endpoint}?address=${account}`, {
    headers: { Accept: "application/json" },
  });
  if (!nonceRes.ok) throw await asError(nonceRes);
  const { nonce } = (await nonceRes.json()) as { nonce: string };

  // 2) SIWE message + signature
  const message = createSiweMessage({
    domain: window.location.host,
    address: account,
    statement: SIWE_STATEMENT,
    uri: window.location.origin,
    version: "1",
    chainId: 1,
    nonce,
  });
  onPhase?.("signing");
  const signature = (await provider.request({
    method: "personal_sign",
    params: [message, account],
  })) as string;

  // 3) issue
  onPhase?.("issuing");
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, signature }),
  });
  if (!res.ok) throw await asError(res);
  return (await res.json()) as IssueResult;
}

// ── Legacy localStorage key — kept ONLY to migrate Stage 1 users into the
// Stage 2 server vault. New code never writes the key to the browser. ──────────
const STORAGE_KEY = "toki.aiAccessKey";

export interface StoredKey {
  key: string;
  expiresAt: string;
}

/** Read a key previously stored in localStorage (Stage 1), for one-time migration. */
export function loadIssuedKey(): StoredKey | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const k = JSON.parse(raw) as StoredKey;
    return k?.key ? k : null;
  } catch {
    return null;
  }
}

/** Remove the legacy localStorage key (after migrating it to the server). */
export function clearIssuedKey(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // non-fatal
  }
}

// ── Stage 2 server vault (Privy-authed) ───────────────────────────────────────
// Every call carries the Privy access token; the server verifies the user and
// resolves/decrypts the key. Plaintext is only returned on an explicit reveal.
export interface KeyStatus {
  hasKey: boolean;
  lastFour: string | null;
  expiresAt: string | null;
}

function authHeaders(token: string): Record<string, string> {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

/** Encrypt + store the user's key server-side. */
export async function storeAiKey(
  token: string,
  key: string,
  expiresAt: string,
  address?: string,
): Promise<void> {
  const res = await fetch("/api/aikey", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ key, expiresAt, address }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new AiAccessError(body?.error ?? `HTTP ${res.status}`, res.status);
  }
}

/** Whether the user has a stored key (+ masked metadata). Never returns plaintext. */
export async function getAiKeyStatus(token: string): Promise<KeyStatus> {
  const res = await fetch("/api/aikey", { headers: authHeaders(token) });
  if (!res.ok) return { hasKey: false, lastFour: null, expiresAt: null };
  return (await res.json()) as KeyStatus;
}

/** Explicitly decrypt + return the plaintext key (for copy / tool export). */
export async function revealAiKey(token: string): Promise<string | null> {
  const res = await fetch("/api/aikey?reveal=1", { headers: authHeaders(token) });
  if (!res.ok) return null;
  const body = (await res.json()) as { key: string | null };
  return body.key;
}

/** Delete the stored key. */
export async function clearAiKeyServer(token: string): Promise<void> {
  await fetch("/api/aikey", { method: "DELETE", headers: authHeaders(token) }).catch(() => {});
}

export interface AgentMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/** Chat turn via /api/agent — the server resolves the key from the session.
 *  opts lets a selected agent inject its system prompt + model. */
export async function agentChat(
  token: string,
  messages: AgentMessage[],
  opts?: { system?: string; model?: string },
): Promise<string> {
  const res = await fetch("/api/agent", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ messages, system: opts?.system, model: opts?.model }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string; reason?: string };
    throw new AiAccessError(body?.error ?? `HTTP ${res.status}`, res.status, body?.reason);
  }
  const data = (await res.json()) as { reply: string };
  return data.reply;
}

// ── Key usage / daily budget (LiteLLM /key/info via /api/agent/usage) ─────────
// The issued key has a daily spend budget (max_budget, budget_duration "1d",
// resets at budget_reset_at) — that is the real enforced cap. Surfaced so the hub
// + AI Access screen can show today's usage.
export interface KeyUsage {
  spend: number;
  maxBudget: number | null;
  resetAt: string | null;
  budgetDuration: string | null;
  rpmLimit: number | null;
  tpmLimit: number | null;
  expiresAt: string | null;
  blocked: boolean;
}

/** Read the user's key budget/usage via toki's proxy (server resolves the key). */
export async function getKeyUsage(token: string): Promise<KeyUsage> {
  const res = await fetch("/api/agent/usage", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new AiAccessError(body?.error ?? `HTTP ${res.status}`, res.status);
  }
  return (await res.json()) as KeyUsage;
}

// The enforced daily cap is a LiteLLM USD budget ($1/day), which the operator
// sizes as ~1M output tokens/day. Users stake (they don't pay $), so we surface
// usage in TOKENS: the budget fraction × this cap. /key/info has no daily token
// counter, so this is derived from the budget fraction. Adjust if the cap changes.
export const AI_DAILY_TOKEN_LIMIT = 1_000_000;

/** Compact token formatting: 1_000_000 → "1M", 3402 → "3.4K". */
export function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
  return n.toLocaleString("en-US");
}

// ── Advanced "connect your tool" — copy-paste setup skill ────────────────────
// A self-contained instruction block the user pastes into their own AI assistant
// (Claude Code / Cursor / ChatGPT / …), which then configures their local tool to
// use this OpenAI-compatible endpoint. Lets us skip building per-tool installers.
export function buildSetupSkill(key: string): string {
  return `# Tokamak AI Access — connect this to my AI coding tool

I have an OpenAI-compatible API key from Tokamak AI Access. Detect which tool I'm
using (Claude Code / Codex / Cline / Continue / aider / Cursor / OpenAI SDK) and
configure it to use this endpoint:

- Base URL: ${AI_ACCESS_URL}/v1
- API key:  ${key}
- Model:    ${AI_MODELS[0]}   (also available: ${AI_MODELS.slice(1).join(", ")})

Rules:
- Store the key in an env var or the tool's config file. Do NOT hardcode it into
  any file that gets committed to git.
- After configuring, make one tiny test request and tell me whether it worked.
- This key has a daily token budget and is metered, so keep the test minimal.`;
}
