// Server-only AES-256-GCM helpers for encrypting the AI Access key at rest.
// Key comes from AI_KEY_ENC_SECRET (32 bytes, as 64-hex or base64). Never import
// this into client code.
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

function loadKey(): Buffer | null {
  const raw = process.env.AI_KEY_ENC_SECRET ?? "";
  if (!raw) return null;
  try {
    if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
    const b = Buffer.from(raw, "base64");
    if (b.length === 32) return b;
  } catch {
    // fall through
  }
  return null;
}

const KEY = loadKey();
export const isEncryptionConfigured = KEY !== null;

export interface Sealed {
  ciphertext: string; // base64
  iv: string; // base64
  authTag: string; // base64
}

export function seal(plaintext: string): Sealed {
  if (!KEY) throw new Error("AI_KEY_ENC_SECRET not configured (need 32 bytes hex/base64)");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", KEY, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return {
    ciphertext: ct.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
  };
}

export function open(s: Sealed): string {
  if (!KEY) throw new Error("AI_KEY_ENC_SECRET not configured");
  const decipher = createDecipheriv("aes-256-gcm", KEY, Buffer.from(s.iv, "base64"));
  decipher.setAuthTag(Buffer.from(s.authTag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(s.ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
