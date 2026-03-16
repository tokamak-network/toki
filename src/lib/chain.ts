import { createPublicClient, http } from "viem";
import { mainnet, sepolia } from "viem/chains";

export const isTestnet = process.env.NEXT_PUBLIC_NETWORK === "sepolia";

export const chain = isTestnet ? sepolia : mainnet;

// Alchemy RPC — derive URL from single API key + network mode
const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const alchemyRpc = alchemyKey
  ? `https://${isTestnet ? "eth-sepolia" : "eth-mainnet"}.g.alchemy.com/v2/${alchemyKey}`
  : null;

const fallbackRpc = isTestnet
  ? "https://ethereum-sepolia-rpc.publicnode.com"
  : "https://eth.llamarpc.com";

export const rpcUrl = alchemyRpc || fallbackRpc;

export const publicClient = createPublicClient({
  chain,
  transport: http(rpcUrl, { timeout: 15_000 }),
});

// Pimlico Bundler — URL auto-switches by chain.id
const pimlicoApiKey = process.env.NEXT_PUBLIC_PIMLICO_API_KEY;
export const pimlicoUrl = pimlicoApiKey
  ? `https://api.pimlico.io/v2/${chain.id}/rpc?apikey=${pimlicoApiKey}`
  : null;
