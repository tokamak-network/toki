"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useWallets } from "@privy-io/react-auth";
import { toViemAccount } from "@privy-io/react-auth";
import {
  createPublicClient,
  http,
  type Address,
  type Hex,
  encodeFunctionData,
  erc20Abi,
  maxUint256,
} from "viem";
import { sepolia, mainnet } from "viem/chains";
import { signAuthorization } from "viem/experimental";
import { to7702SimpleSmartAccount } from "permissionless/accounts";
import { createSmartAccountClient } from "permissionless";
import { createPimlicoClient } from "permissionless/clients/pimlico";
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

// Custom paymaster data provider for TONPaymaster
// The paymaster doesn't require any special data — it reads price from on-chain storage
function createTonPaymasterProvider(paymasterAddress: Address) {
  const stubData = {
    paymaster: paymasterAddress,
    paymasterData: "0x" as Hex,
    paymasterVerificationGasLimit: BigInt(150000),
    paymasterPostOpGasLimit: BigInt(100000),
  };

  return {
    getPaymasterStubData: async () => stubData,
    getPaymasterData: async () => stubData,
  };
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
  const authorizationRef = useRef<any>(null);
  const embeddedInitRef = useRef(false);
  const externalInitRef = useRef(false);

  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
  const metamaskWallet = wallets.find(
    (w) => w.walletClientType === "metamask"
  );

  // ─── Path A: Privy Embedded Wallet ───
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

        // Determine paymaster mode:
        // 1. Custom TONPaymaster (ERC-20 mode) — gas paid in TON
        // 2. Fallback: Pimlico Verifying Paymaster (sponsor) — free gas
        const tonPaymasterAddr = CONTRACTS.TON_PAYMASTER;
        const useCustomPaymaster = !!tonPaymasterAddr;

        let client: AnySmartAccountClient;

        if (useCustomPaymaster) {
          // Custom TONPaymaster: gas paid in TON
          // Uses Pimlico bundler for UserOp submission, but our own paymaster for gas payment
          const tonPaymaster = createTonPaymasterProvider(tonPaymasterAddr as Address);

          client = createSmartAccountClient({
            account: smartAccount,
            chain,
            bundlerTransport: http(pimlicoUrl!),
            paymaster: tonPaymaster,
            userOperation: {
              estimateFeesPerGas: async () =>
                (await pimlicoClient.getUserOperationGasPrice()).fast,
            },
          }) as AnySmartAccountClient;

          console.log("Using custom TONPaymaster:", tonPaymasterAddr);
        } else {
          // Fallback: Pimlico Verifying Paymaster (sponsor — free gas)
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

          console.log("Using Pimlico Verifying Paymaster (sponsor)");
        }

        if (cancelled) return;

        setSmartAccountClient(client);
        setWalletType("embedded");
        setIsGasless(!useCustomPaymaster);
        setPaymasterMode(useCustomPaymaster ? "erc20" : "sponsor");
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
        const supportsPaymaster = await checkPaymasterSupport(provider, chain.id);

        console.log(
          `MetaMask paymasterService support: ${supportsPaymaster}`
        );

        // Determine paymaster mode for MetaMask path
        const useCustomPaymaster = !!CONTRACTS.TON_PAYMASTER;

        // Build absolute URL for our ERC-7677 paymaster API
        // MetaMask may not accept relative URLs
        const paymasterApiUrl = typeof window !== "undefined"
          ? `${window.location.origin}/api/paymaster`
          : "/api/paymaster";

        // Build capabilities object
        // Always include paymasterService when available — optional: true
        // ensures MetaMask falls back to ETH if it can't use the paymaster.
        // We do NOT gate on wallet_getCapabilities because MetaMask may not
        // advertise paymasterService support yet still honor it via wallet_sendCalls.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const buildCapabilities = (): any => {
          if (useCustomPaymaster) {
            // Use our own ERC-7677 paymaster API (gas paid in TON)
            return {
              paymasterService: {
                url: paymasterApiUrl,
                optional: true, // Fallback to ETH if unsupported
              },
            };
          }

          if (pimlicoUrl) {
            // Fallback: Pimlico sponsorship
            return {
              paymasterService: {
                url: pimlicoUrl,
                ...(sponsorshipPolicyId
                  ? { context: { sponsorshipPolicyId } }
                  : {}),
                optional: true,
              },
            };
          }

          return {};
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

            const capabilities = buildCapabilities();

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
        setIsGasless(!useCustomPaymaster && supportsPaymaster);
        setPaymasterMode(useCustomPaymaster ? "erc20" : supportsPaymaster ? "sponsor" : "none");
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

  // Wrapper that injects authorization and TON approve for custom paymaster
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

      // For ERC-20 paymaster: prepend TON approve call to paymaster
      // The paymaster's postOp calls transferFrom(sender, paymaster, gasCostInTON)
      // So the smart account must approve the paymaster first
      if (paymasterMode === "erc20" && CONTRACTS.TON_PAYMASTER && args.calls) {
        const approveCall = {
          to: CONTRACTS.TON as Address,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: "approve",
            args: [CONTRACTS.TON_PAYMASTER as Address, maxUint256],
          }),
        };
        args = {
          ...args,
          calls: [approveCall, ...args.calls],
        };
      }

      return smartAccountClient.sendTransaction(args);
    },
    [smartAccountClient, walletType, paymasterMode]
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
  };
}
