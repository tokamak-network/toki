// Network + viem public client for the MCP server. Self-contained: no Next deps.
// Mirrors src/lib/chain.ts in the main app (Ethereum L1 only — mainnet/sepolia).
import { createPublicClient, http } from "viem";
import { mainnet, sepolia } from "viem/chains";

export const isTestnet = process.env.TOKI_NETWORK === "sepolia";
export const chain = isTestnet ? sepolia : mainnet;

// RPC: explicit TOKI_RPC_URL wins; otherwise a public fallback (rate-limited).
const fallbackRpc = isTestnet
  ? "https://ethereum-sepolia-rpc.publicnode.com"
  : "https://eth.llamarpc.com";
export const rpcUrl = process.env.TOKI_RPC_URL || fallbackRpc;

export const publicClient = createPublicClient({
  chain,
  transport: http(rpcUrl, { timeout: 15_000 }),
});
