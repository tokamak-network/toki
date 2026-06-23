# @toki/mcp — Toki Agent Gateway (MCP server)

Expose **Tokamak Network staking** to any AI agent as MCP tools. Point your CLI/agent
(Claude Code, Cursor, Claude Desktop) at this server and ask it about staking — APR,
operators, a wallet's position — in plain language.

This is **M0: read-only** (no signing, no keys). Write tools (`stake`, `unstake`) and
AI Access key issuance arrive in later milestones via **delegated session keys**.
See the design doc: *Projects/Toki — "Toki Agent Gateway — 구현 설계"*.

## Tools

| Tool | Args | Returns |
|------|------|---------|
| `toki_get_apr` | — | Live APR/APY, total staked/supply, seigniorage per block |
| `toki_list_operators` | `limit?` | Operators (staked + commission %), plus `tokiPick` (lowest fee → most staked) |
| `toki_staking_status` | `address` | Wallet's idle / staked / pending-unstake TON + AI Access (100 TON) eligibility |

All data is read live from Ethereum **L1 mainnet** SeigManager / DepositManager / Layer2Registry.

## Setup

```bash
cd mcp-server
npm install
npm run build      # compiles to dist/  (or use `npm run dev` via tsx)
```

### Environment
- `TOKI_NETWORK` — `mainnet` (default) or `sepolia`
- `TOKI_RPC_URL` — your Alchemy/Infura URL (recommended; falls back to a public RPC)

## Attach to your agent

**Claude Code** (built version):
```bash
claude mcp add toki -- node /ABS/PATH/toki/mcp-server/dist/server.js
# with a dedicated RPC:
claude mcp add toki --env TOKI_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/KEY -- node /ABS/PATH/toki/mcp-server/dist/server.js
```

**Cursor / Claude Desktop** (`mcp.json` / `claude_desktop_config.json`):
```jsonc
{
  "mcpServers": {
    "toki": {
      "command": "node",
      "args": ["/ABS/PATH/toki/mcp-server/dist/server.js"],
      "env": { "TOKI_RPC_URL": "https://eth-mainnet.g.alchemy.com/v2/KEY" }
    }
  }
}
```

Then ask: *"What's the Toki staking APR?"*, *"Which operator should I stake with?"*,
*"What's my position for 0x…?"*

## Smoke test
`smoke-client.mjs` drives the server end-to-end (real MCP handshake → list tools →
call each tool):
```bash
npm run build
TOKI_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/KEY node smoke-client.mjs
# (use eth-sepolia + TOKI_NETWORK=sepolia to test against testnet)
```

## Roadmap (see design doc)
- **M0** ✅ read-only staking tools (this)
- **M1** delegated session keys (caveats: action/limit/expiry/operator allowlist)
- **M2** write tools: `toki_stake` / `toki_unstake` (gasless via TON Paymaster)
- **M3** `toki_issue_ai_access_key` → AI key = ecosystem passport
- **M4** ecosystem fan-out (private transfer, lottery, …)
