"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useWallets } from "@privy-io/react-auth";
import { toViemAccount } from "@privy-io/react-auth";
import {
  createPublicClient,
  http,
  type Address,
  formatUnits,
} from "viem";
import { sepolia, mainnet } from "viem/chains";
import { signAuthorization } from "viem/experimental";
import { to7702SimpleSmartAccount } from "permissionless/accounts";
import { createSmartAccountClient } from "permissionless";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { prepareUserOperationForErc20Paymaster } from "permissionless/experimental/pimlico";
import { CONTRACTS } from "@/constants/contracts";
import type { SmartAccountClient } from "permissionless";

const isTestnet = process.env.NEXT_PUBLIC_NETWORK === "sepolia";
const chain = isTestnet ? sepolia : mainnet;

const publicClient = createPublicClient({
  chain,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL || undefined, {
    timeout: 15_000,
  }),
});

const pimlicoApiKey = process.env.NEXT_PUBLIC_PIMLICO_API_KEY;
const pimlicoUrl = pimlicoApiKey
  ? `https://api.pimlico.io/v2/${chain.id}/rpc?apikey=${pimlicoApiKey}`
  : null;

const sponsorshipPolicyId =
  process.env.NEXT_PUBLIC_PIMLICO_SPONSORSHIP_POLICY_ID || undefined;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySmartAccountClient = SmartAccountClient<any, any, any, any, any>;

type WalletType = "embedded" | "external" | null;
export type PaymasterMode = "erc20" | "sponsor" | "none";

// Unified interface for both paths
interface SmartAccountWrapper {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendTransaction: (args: any) => Promise<`0x${string}`>;
}

export interface GasCostEstimate {
  costInToken: bigint;
  costInUsd: bigint;
  costInTokenFormatted: string;
}

// Check if MetaMask supports paymasterService via wallet_getCapabilities
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function checkPaymasterSupport(provider: any, chainId: number): Promise<boolean> {
  try {
    const capabilities = await provider.request({
      method: "wallet_getCapabilities",
      params: [await provider.request({ method: "eth_accounts" }).then((a: string[]) => a[0])],
    });
    const chainHex = `0x${chainId.toString(16)}`;
    return capabilities?.[chainHex]?.paymasterService?.supported === true;
  } catch {
    return false;
  }
}

export function useEip7702() {
  const { wallets } = useWallets();
  const [smartAccountClient, setSmartAccountClient] =
    useState<SmartAccountWrapper | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<WalletType>(null);
  const [isGasless, setIsGasless] = useState(false);
  const [paymasterMode, setPaymasterMode] = useState<PaymasterMode>("none");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pimlicoClientRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const authorizationRef = useRef<any>(null);
  const embeddedInitRef = useRef(false);
  const externalInitRef = useRef(false);

  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
  const metamaskWallet = wallets.find(
    (w) => w.walletClientType === "metamask"
  );

  // ─── Path A: Privy Embedded Wallet (unchanged) ───
  useEffect(() => {
    if (!embeddedWallet || !pimlicoUrl || embeddedInitRef.current || metamaskWallet)
      return;

    let cancelled = false;

    async function setupEmbedded() {
      try {
        embeddedInitRef.current = true;

        const localAccount = await toViemAccount({
          wallet: embeddedWallet!,
        });

        const smartAccount = await to7702SimpleSmartAccount({
          client: publicClient,
          owner: localAccount,
          entryPoint: {
            address: CONTRACTS.ENTRY_POINT_V08 as `0x${string}`,
            version: "0.8",
          },
          accountLogicAddress:
            CONTRACTS.SIMPLE_ACCOUNT_7702 as `0x${string}`,
        });

        if (cancelled) return;

        const code = await publicClient.getCode({
          address: localAccount.address,
        });
        const needsAuthorization = !code || code === "0x";

        if (needsAuthorization) {
          authorizationRef.current = await signAuthorization(publicClient, {
            account: localAccount,
            contractAddress: CONTRACTS.SIMPLE_ACCOUNT_7702 as `0x${string}`,
          });
        }

        const pimlicoClient = createPimlicoClient({
          transport: http(pimlicoUrl!),
          entryPoint: {
            address: CONTRACTS.ENTRY_POINT_V08 as `0x${string}`,
            version: "0.8",
          },
        });

        pimlicoClientRef.current = pimlicoClient;

        // Try ERC-20 Paymaster (TON for gas) first, fallback to Verifying Paymaster (sponsor)
        let useErc20Paymaster = false;
        try {
          const quotes = await pimlicoClient.getTokenQuotes({
            chain,
            tokens: [CONTRACTS.TON as Address],
          });
          useErc20Paymaster = quotes.length > 0;
          console.log(
            `TON ERC-20 Paymaster: ${useErc20Paymaster ? "supported" : "not supported"}`,
            quotes
          );
        } catch (e) {
          console.log("ERC-20 Paymaster check failed, using sponsor:", e);
        }

        let client: AnySmartAccountClient;

        if (useErc20Paymaster) {
          // ERC-20 Paymaster: gas paid in TON
          // paymasterContext.token triggers prepareUserOperationForErc20Paymaster
          // to auto-inject approve + calculate exact cost
          client = createSmartAccountClient({
            account: smartAccount,
            chain,
            bundlerTransport: http(pimlicoUrl!),
            paymaster: pimlicoClient,
            paymasterContext: {
              token: CONTRACTS.TON as Address,
            },
            userOperation: {
              estimateFeesPerGas: async () =>
                (await pimlicoClient.getUserOperationGasPrice()).fast,
              prepareUserOperation:
                prepareUserOperationForErc20Paymaster(pimlicoClient),
            },
          }) as AnySmartAccountClient;
        } else {
          // Fallback: Verifying Paymaster (sponsor — free gas)
          client = createSmartAccountClient({
            account: smartAccount,
            chain,
            bundlerTransport: http(pimlicoUrl!),
            paymaster: pimlicoClient,
            userOperation: {
              estimateFeesPerGas: async () =>
                (await pimlicoClient.getUserOperationGasPrice()).fast,
            },
          }) as AnySmartAccountClient;
        }

        if (cancelled) return;

        setSmartAccountClient(client);
        setWalletType("embedded");
        setIsGasless(!useErc20Paymaster);
        setPaymasterMode(useErc20Paymaster ? "erc20" : "sponsor");
        setIsReady(true);
      } catch (e) {
        if (cancelled) return;
        embeddedInitRef.current = false;
        const msg = e instanceof Error ? e.message : String(e);
        console.error("EIP-7702 embedded setup failed:", msg);
        setError(msg);
      }
    }

    setupEmbedded();

    return () => {
      cancelled = true;
      embeddedInitRef.current = false;
    };
  }, [embeddedWallet, metamaskWallet]);

  // ─── Path B: MetaMask via wallet_sendCalls (EIP-5792) ───
  // MetaMask handles EIP-7702 delegation internally.
  // paymasterService is marked optional — if MetaMask supports it, gas is sponsored.
  // If not, user pays gas with ETH.
  useEffect(() => {
    if (!metamaskWallet || externalInitRef.current) return;

    externalInitRef.current = true;

    async function setupMetaMask() {
      try {
        const provider = await metamaskWallet!.getEthereumProvider();

        // Check if MetaMask supports paymasterService on this chain
        const supportsPaymaster = pimlicoUrl
          ? await checkPaymasterSupport(provider, chain.id)
          : false;

        console.log(
          `MetaMask paymasterService support: ${supportsPaymaster}`
        );

        // Build capabilities object
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const buildCapabilities = (withPaymaster: boolean): any => {
          if (!withPaymaster || !pimlicoUrl) return {};
          return {
            paymasterService: {
              url: pimlicoUrl,
              ...(sponsorshipPolicyId
                ? { context: { sponsorshipPolicyId } }
                : {}),
              optional: true, // EIP-5792 v2: wallet ignores if unsupported
            },
          };
        };

        // Wrap MetaMask's wallet_sendCalls to match the unified sendTransaction interface
        const wrapper: SmartAccountWrapper = {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          sendTransaction: async (args: any) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const calls = args.calls.map((call: any) => ({
              to: call.to as string,
              data: (call.data || "0x") as string,
              ...(call.value
                ? { value: `0x${call.value.toString(16)}` }
                : {}),
            }));

            const capabilities = buildCapabilities(!!pimlicoUrl);

            // EIP-5792: wallet_sendCalls
            // MetaMask handles EIP-7702 delegation internally
            const callsId = await provider.request({
              method: "wallet_sendCalls",
              params: [
                {
                  version: "2.0.0",
                  chainId: `0x${chain.id.toString(16)}`,
                  from: metamaskWallet!.address,
                  atomicRequired: false,
                  calls,
                  ...(Object.keys(capabilities).length > 0
                    ? { capabilities }
                    : {}),
                },
              ],
            });

            // Poll wallet_getCallsStatus until confirmed
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let status: any;
            const maxAttempts = 60; // 2 min timeout
            for (let i = 0; i < maxAttempts; i++) {
              await new Promise((resolve) => setTimeout(resolve, 2000));
              status = await provider.request({
                method: "wallet_getCallsStatus",
                params: [callsId],
              });
              if (status.status !== "PENDING") break;
            }

            if (!status || status.status === "PENDING") {
              throw new Error("Transaction timed out");
            }
            if (status.status !== "CONFIRMED") {
              throw new Error(
                `Transaction failed: ${status.status}`
              );
            }

            return status.receipts[0].transactionHash as `0x${string}`;
          },
        };

        setSmartAccountClient(wrapper);
        setWalletType("external");
        setIsGasless(supportsPaymaster);
        setIsReady(true);
      } catch (e) {
        externalInitRef.current = false;
        const msg = e instanceof Error ? e.message : String(e);
        console.error("MetaMask setup failed:", msg);
        setError(msg);
      }
    }

    setupMetaMask();

    return () => {
      externalInitRef.current = false;
    };
  }, [metamaskWallet]);

  // Wrapper that injects authorization for the first embedded transaction
  const sendTransaction = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (args: any) => {
      if (!smartAccountClient) throw new Error("Smart account not ready");

      // Inject pre-signed authorization if available (embedded path, first tx only)
      if (walletType === "embedded" && authorizationRef.current) {
        args = {
          ...args,
          authorization: authorizationRef.current,
          factory: "0x7702" as `0x${string}`,
          factoryData: "0x" as `0x${string}`,
        };
        authorizationRef.current = null;
      }

      return smartAccountClient.sendTransaction(args);
    },
    [smartAccountClient, walletType]
  );

  // Estimate gas cost in TON for ERC-20 Paymaster mode
  const estimateGasCostInTON = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (userOperation: any): Promise<GasCostEstimate | null> => {
      if (paymasterMode !== "erc20" || !pimlicoClientRef.current) return null;
      try {
        const result = await pimlicoClientRef.current.estimateErc20PaymasterCost({
          entryPoint: {
            address: CONTRACTS.ENTRY_POINT_V08 as Address,
            version: "0.8",
          },
          userOperation,
          token: CONTRACTS.TON as Address,
        });
        return {
          costInToken: result.costInToken,
          costInUsd: result.costInUsd,
          costInTokenFormatted: formatUnits(result.costInToken, 18),
        };
      } catch (e) {
        console.error("Failed to estimate ERC-20 gas cost:", e);
        return null;
      }
    },
    [paymasterMode]
  );

  return {
    smartAccountClient: smartAccountClient
      ? { ...smartAccountClient, sendTransaction }
      : null,
    isReady,
    error,
    walletType,
    isGasless,
    paymasterMode,
    estimateGasCostInTON,
  };
}
