import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

export const chain = mainnet;
export const rpcUrl = "https://eth.llamarpc.com";
export const publicClient = createPublicClient({
  chain,
  transport: http(rpcUrl, { timeout: 15_000 }),
});
