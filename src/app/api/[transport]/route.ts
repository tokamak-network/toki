// Hosted Remote MCP endpoint (Streamable HTTP) — Toki Agent Gateway, M0 read-only.
// Mounted on the dynamic [transport] segment so mcp-handler serves:
//   POST/GET /api/mcp   (Streamable HTTP)   ·   /api/sse (legacy SSE)
// Static sibling routes (/api/agent, /api/aikey, ...) take precedence, so this
// only ever handles the "mcp"/"sse" transports. No auth on read-only tools.
// Connect from any MCP client:  claude mcp add --transport http toki https://toki.tokamak.network/api/mcp
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { isAddress, formatUnits } from "viem";
import { fetchStakingData } from "@/lib/staking";
import { publicClient } from "@/lib/chain";
import { CONTRACTS, TON_DECIMALS } from "@/constants/contracts";
import { tonTokenAbi } from "@/lib/abi";

const RAY = 27;
const MIN_TON_AI_ACCESS = 100;

// DepositManager per-account totals (not in the shared abi.ts read fragments).
const depositAccountAbi = [
  { inputs: [{ name: "account", type: "address" }], name: "accStakedAccount", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "account", type: "address" }], name: "pendingUnstakedAccount", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
] as const;

const handler = createMcpHandler(
  (server) => {
    server.tool(
      "toki_get_apr",
      "Live Tokamak Network staking APR/APY on Ethereum L1 (SeigManager), plus total staked, total supply, and seigniorage per block.",
      {},
      async () => {
        const d = await fetchStakingData();
        return {
          content: [{ type: "text", text: JSON.stringify({
            apr_pct: Number(d.apr.toFixed(2)),
            apy_pct: Number(d.apy.toFixed(2)),
            totalStaked_TON: Math.round(d.totalStakedRaw),
            totalSupply_TON: Math.round(d.totalSupplyRaw),
            seigPerBlock_WTON: Number(d.seigPerBlockRaw.toFixed(2)),
            operatorCount: d.operatorCount,
          }, null, 2) }],
        };
      },
    );

    server.tool(
      "toki_list_operators",
      "Tokamak staking operators (name, address, staked TON), sorted by stake. Use to pick where to stake.",
      { limit: z.number().int().positive().max(50).optional() },
      async ({ limit }) => {
        const d = await fetchStakingData();
        const operators = d.operators
          .slice(0, limit ?? 20)
          .map((o) => ({ name: o.name, address: o.address, staked_TON: Math.round(Number(o.totalStaked)) }));
        return { content: [{ type: "text", text: JSON.stringify({ operatorCount: d.operatorCount, operators }, null, 2) }] };
      },
    );

    server.tool(
      "toki_staking_status",
      "A wallet's Tokamak position on Ethereum L1: idle TON, staked TON, pending-unstake (14-day cooldown), and whether it meets the 100 TON AI Access threshold.",
      { address: z.string().describe("0x Ethereum address") },
      async ({ address }) => {
        if (!isAddress(address)) {
          return { content: [{ type: "text", text: `Error: invalid address ${address}` }], isError: true };
        }
        const acct = address as `0x${string}`;
        const [bal, staked, pending] = await Promise.all([
          publicClient.readContract({ address: CONTRACTS.TON as `0x${string}`, abi: tonTokenAbi, functionName: "balanceOf", args: [acct] }),
          publicClient.readContract({ address: CONTRACTS.DEPOSIT_MANAGER_PROXY as `0x${string}`, abi: depositAccountAbi, functionName: "accStakedAccount", args: [acct] }),
          publicClient.readContract({ address: CONTRACTS.DEPOSIT_MANAGER_PROXY as `0x${string}`, abi: depositAccountAbi, functionName: "pendingUnstakedAccount", args: [acct] }),
        ]);
        const idle = Number(formatUnits(bal, TON_DECIMALS));
        const st = Number(formatUnits(staked, RAY));
        const pend = Number(formatUnits(pending, RAY));
        const net = st > pend ? st - pend : 0;
        return {
          content: [{ type: "text", text: JSON.stringify({
            address,
            idle_TON: Number(idle.toFixed(4)),
            staked_TON: Number(net.toFixed(4)),
            pendingUnstake_TON: Number(pend.toFixed(4)),
            aiAccessEligible: net >= MIN_TON_AI_ACCESS,
            tonToUnlockAiAccess: Math.max(0, MIN_TON_AI_ACCESS - net),
          }, null, 2) }],
        };
      },
    );
  },
  {},
  { basePath: "/api" },
);

// Best-effort per-IP rate limit (in-memory; resets per serverless cold start) so an
// unauthenticated caller can't fan the read-only tools into an on-chain RPC cost spike.
const RL_WINDOW_MS = 60_000;
const RL_MAX = 30;
const rlHits = new Map<string, { count: number; reset: number }>();
function allow(request: Request): boolean {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const now = Date.now();
  const e = rlHits.get(ip);
  if (!e || now > e.reset) {
    rlHits.set(ip, { count: 1, reset: now + RL_WINDOW_MS });
    return true;
  }
  if (e.count >= RL_MAX) return false;
  e.count++;
  return true;
}

async function guarded(request: Request): Promise<Response> {
  if (!allow(request)) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "content-type": "application/json", "retry-after": "60" },
    });
  }
  return handler(request);
}

export { guarded as GET, guarded as POST, guarded as DELETE };
