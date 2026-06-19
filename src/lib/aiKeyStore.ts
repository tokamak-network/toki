// Server-only store for the user's AI Access key — encrypted at rest in Supabase,
// keyed by Privy user id. The plaintext key lives only transiently (issuance,
// explicit reveal, or while proxying a chat); at rest it is AES-256-GCM sealed.
import { supabaseAdmin } from "@/lib/supabase-admin";
import { seal, open } from "@/lib/crypto";

const TABLE = "ai_access_keys";

interface Row {
  privy_user_id: string;
  address: string | null;
  ciphertext: string;
  iv: string;
  auth_tag: string;
  last_four: string | null;
  expires_at: string | null;
}

export interface KeyStatus {
  hasKey: boolean;
  lastFour: string | null;
  expiresAt: string | null;
}

/** Encrypt + upsert the user's key. */
export async function storeKey(
  userId: string,
  key: string,
  expiresAt: string,
  address?: string,
): Promise<KeyStatus> {
  const s = seal(key);
  const lastFour = key.slice(-4);
  const { error } = await supabaseAdmin.from(TABLE).upsert(
    {
      privy_user_id: userId,
      address: address ? address.toLowerCase() : null,
      ciphertext: s.ciphertext,
      iv: s.iv,
      auth_tag: s.authTag,
      last_four: lastFour,
      expires_at: expiresAt || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "privy_user_id" },
  );
  if (error) throw new Error(error.message);
  return { hasKey: true, lastFour, expiresAt: expiresAt || null };
}

async function fetchRow(userId: string): Promise<Row | null> {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("privy_user_id,address,ciphertext,iv,auth_tag,last_four,expires_at")
    .eq("privy_user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Row) ?? null;
}

/** Status only — never returns the plaintext key. */
export async function getStatus(userId: string): Promise<KeyStatus> {
  const row = await fetchRow(userId);
  if (!row) return { hasKey: false, lastFour: null, expiresAt: null };
  return { hasKey: true, lastFour: row.last_four, expiresAt: row.expires_at };
}

/** Decrypt + return the plaintext key (for proxying or an explicit reveal). */
export async function getDecryptedKey(userId: string): Promise<string | null> {
  const row = await fetchRow(userId);
  if (!row) return null;
  return open({ ciphertext: row.ciphertext, iv: row.iv, authTag: row.auth_tag });
}

export async function deleteKey(userId: string): Promise<void> {
  const { error } = await supabaseAdmin.from(TABLE).delete().eq("privy_user_id", userId);
  if (error) throw new Error(error.message);
}
