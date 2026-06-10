// TON AI Access — Tokamak ecosystem service (tokamak-network/tokamak-ai-access).
// Stake >= MIN_TON_AI_ACCESS TON on Ethereum L1 → receive a LiteLLM virtual API
// key for the Tokamak AI server (api2.ai.tokamak.network), usable in Claude Code /
// Codex / any OpenAI-compatible client.
//
// Single source of truth shared by the hub lobby (HudRail) and the detailed
// wallet view (AiAccessCard) so the threshold and handoff URL never drift apart.
import { createSiweMessage } from "viem/siwe";
import { getAddress } from "viem";

export const MIN_TON_AI_ACCESS = 10;
export const AI_ACCESS_URL = "https://tokamak-ai-access.vercel.app";

// Native in-app issuance (Arch B): toki calls a delegated, CORS-gated endpoint on
// the AI Access service. The master key + key ledger stay on AI Access; toki only
// proves the user via a SIWE signature. Disabled until this env var points at a
// deployment that exposes /api/keys/issue-delegated and allowlists toki's origin.
export const AI_ACCESS_BASE = process.env.NEXT_PUBLIC_AI_ACCESS_BASE ?? "";
export const isNativeIssueEnabled = AI_ACCESS_BASE.length > 0;

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
