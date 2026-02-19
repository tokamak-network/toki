import { createPublicClient, http } from "viem";
import { mainnet, sepolia } from "viem/chains";

const isTestnet = process.env.NEXT_PUBLIC_NETWORK === "sepolia";

export const chain = isTestnet ? sepolia : mainnet;

const defaultRpc = isTestnet
  ? "https://ethereum-sepolia-rpc.publicnode.com"
  : "https://eth.llamarpc.com";

export const publicClient = createPublicClient({
  chain,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL || defaultRpc, {
    timeout: 15_000,
  }),
});
