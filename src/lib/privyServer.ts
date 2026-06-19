// Server-only Privy auth-token verification. toki has no bespoke session — every
// login method (Google, email, MetaMask/external wallet) goes through Privy, so a
// verified Privy access token identifies the user (DID) for all of them.
import { PrivyClient } from "@privy-io/server-auth";
import type { NextRequest } from "next/server";

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";
const appSecret = process.env.PRIVY_APP_SECRET ?? "";

export const isPrivyServerConfigured = !!appId && !!appSecret;

const privy = isPrivyServerConfigured ? new PrivyClient(appId, appSecret) : null;

/** Verify the `Authorization: Bearer <privy access token>` header. Returns the
 *  Privy user id (DID) or null if missing/invalid/not configured. */
export async function verifyPrivyUser(req: NextRequest): Promise<string | null> {
  if (!privy) return null;
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;
  try {
    const claims = await privy.verifyAuthToken(token);
    return claims.userId ?? null;
  } catch {
    return null;
  }
}
