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
  constructor(message: string, status: number) {
    super(message);
    this.name = "AiAccessError";
    this.status = status;
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

// ── Stage 1 MVP: client-side key storage + agent chat proxy ──────────────
// The issued key is the user's own credential (LLM inference only, 30-day,
// revocable, billed to their stake). Stored in localStorage for the in-app
// Agent Workspace; Stage 2 moves this to server-side encrypted storage + a SIWE
// session. See docs/ai-agent-workspace.md.
const STORAGE_KEY = "toki.aiAccessKey";

export interface StoredKey {
  key: string;
  expiresAt: string;
}

export function saveIssuedKey(k: StoredKey): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(k));
  } catch {
    // storage unavailable (private mode etc.) — non-fatal
  }
}

export function loadIssuedKey(): StoredKey | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const k = JSON.parse(raw) as StoredKey;
    if (!k?.key) return null;
    if (k.expiresAt && new Date(k.expiresAt).getTime() < Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return k;
  } catch {
    return null;
  }
}

export function clearIssuedKey(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // non-fatal
  }
}

export interface AgentMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/** Send a chat turn through toki's /api/agent proxy using the issued key. */
export async function agentChat(key: string, messages: AgentMessage[]): Promise<string> {
  const res = await fetch("/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, messages }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new AiAccessError(body?.error ?? `HTTP ${res.status}`, res.status);
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

/** Read the issued key's budget/usage via toki's CORS-safe proxy. */
export async function getKeyUsage(key: string): Promise<KeyUsage> {
  const res = await fetch("/api/agent/usage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new AiAccessError(body?.error ?? `HTTP ${res.status}`, res.status);
  }
  return (await res.json()) as KeyUsage;
}
