#!/usr/bin/env node
// Toki Agent Gateway — MCP server (M0: read-only Tokamak staking tools).
// Lets any MCP client (Claude Code, Cursor, Claude Desktop) read live staking
// data and a wallet's position. Write tools (stake/unstake) arrive in M2 via
// delegated session keys — see Projects/Toki "Toki Agent Gateway — 구현 설계".
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { isAddress } from "viem";
import { fetchStakingData, fetchPosition } from "./staking.js";

const MIN_TON_AI_ACCESS = 100; // staking threshold to unlock the AI Access key

const server = new Server(
  { name: "toki-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "toki_get_apr",
      description:
        "Live Tokamak Network staking APR/APY from on-chain SeigManager (Ethereum L1), plus total staked, total supply, and seigniorage per block.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "toki_list_operators",
      description:
        "List Tokamak staking operators with staked amount and commission % (negative = rebate to stakers). Includes 'tokiPick' = recommended operator (lowest fee, then most staked).",
      inputSchema: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Max operators to fetch (default 20)." },
        },
      },
    },
    {
      name: "toki_staking_status",
      description:
        "A wallet's Tokamak position on Ethereum L1: idle TON, staked TON, pending-unstake (14-day cooldown), and whether it meets the 100 TON AI Access threshold.",
      inputSchema: {
        type: "object",
        properties: { address: { type: "string", description: "0x Ethereum address" } },
        required: ["address"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args = {} } = req.params;
  const ok = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] });
  const fail = (msg: string) => ({ content: [{ type: "text" as const, text: `Error: ${msg}` }], isError: true });

  try {
    if (name === "toki_get_apr") {
      const d = await fetchStakingData();
      return ok({
        network: d.network,
        apr_pct: Number(d.apr.toFixed(2)),
        apy_pct: Number(d.apy.toFixed(2)),
        totalStaked_TON: Math.round(d.totalStaked),
        totalSupply_TON: Math.round(d.totalSupply),
        seigPerBlock_WTON: Number(d.seigPerBlock.toFixed(2)),
        operatorCount: d.operatorCount,
      });
    }

    if (name === "toki_list_operators") {
      const limit = typeof args.limit === "number" ? args.limit : 20;
      const d = await fetchStakingData(limit);
      const shape = (o: { name: string; address: string; totalStaked: number; commissionPct: number }) => ({
        name: o.name,
        address: o.address,
        staked_TON: Math.round(o.totalStaked),
        commission_pct: Number(o.commissionPct.toFixed(2)),
      });
      return ok({
        network: d.network,
        operatorCount: d.operatorCount,
        tokiPick: d.tokiPick ? shape(d.tokiPick) : null,
        operators: d.operators.map(shape),
      });
    }

    if (name === "toki_staking_status") {
      const address = String(args.address ?? "");
      if (!isAddress(address)) return fail(`Invalid address: ${address}`);
      const p = await fetchPosition(address);
      return ok({
        address: p.address,
        idle_TON: Number(p.idleTon.toFixed(4)),
        staked_TON: Number(p.staked.toFixed(4)),
        pendingUnstake_TON: Number(p.pendingUnstake.toFixed(4)),
        total_TON: Number(p.total.toFixed(4)),
        aiAccessEligible: p.staked >= MIN_TON_AI_ACCESS,
        tonToUnlockAiAccess: Math.max(0, MIN_TON_AI_ACCESS - p.staked),
      });
    }

    return fail(`Unknown tool: ${name}`);
  } catch (e) {
    return fail(e instanceof Error ? e.message : String(e));
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stderr only — stdout is the MCP channel.
  console.error(`toki-mcp running (network=${process.env.TOKI_NETWORK || "mainnet"})`);
}

main().catch((e) => {
  console.error("toki-mcp fatal:", e);
  process.exit(1);
});
