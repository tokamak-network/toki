"use client";

import { useState, useEffect, useRef } from "react";
import { useWallets } from "@privy-io/react-auth";
import { toViemAccount } from "@privy-io/react-auth";
import {
  createPublicClient,
  http,
  type Address,
  type Hex,
  type SignedAuthorization,
  encodeFunctionData,
  erc20Abi,
  maxUint256,
} from "viem";
import { sepolia, mainnet } from "viem/chains";
import { createBundlerClient } from "viem/account-abstraction";
import {
  toMetaMaskSmartAccount,
  Implementation,
} from "@metamask/delegation-toolkit";
import { CONTRACTS } from "@/constants/contracts";

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

type WalletType = "embedded" | "external" | null;
export type PaymasterMode = "erc20" | "sponsor" | "none";
export type StakingMode = "direct" | "delegation";

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

// Ensures EOA is delegated to MetaMask DeleGator (EIP-7702).
// - Privy: returns SignedAuthorization to include in UserOp (fully gasless)
// - MetaMask: sends a Type 4 tx via MetaMask to set delegation, returns null
type EnsureDelegationFn = () => Promise<SignedAuthorization | null>;

// Shared setup: creates MetaMask Smart Account + BundlerClient + wrapper
// Used by both Privy embedded and MetaMask external paths
async function setupDelegationToolkit(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signer: any,
  signerAddress: Address,
  ensureDelegation: EnsureDelegationFn,
): Promise<{ wrapper: SmartAccountWrapper; useCustomPaymaster: boolean }> {
  const smartAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Stateless7702,
    signer,
    address: signerAddress,
  });

  // Patch: Stateless7702 doesn't use factory deployment — it uses EIP-7702 authorization.
  // The delegation-toolkit sets factoryData=undefined when address is provided directly,
  // causing getFactoryArgs to throw. Override to return empty factory args.
  smartAccount.getFactoryArgs = async () => ({
    factory: undefined,
    factoryData: undefined,
  });

  const tonPaymasterAddr = CONTRACTS.TON_PAYMASTER;
  const useCustomPaymaster = !!tonPaymasterAddr;

  const tonPaymaster = useCustomPaymaster
    ? createTonPaymasterProvider(tonPaymasterAddr as Address)
    : undefined;

  const bundlerClient = createBundlerClient({
    client: publicClient,
    transport: http(pimlicoUrl!),
    ...(tonPaymaster ? { paymaster: tonPaymaster } : {}),
  });

  const wrapper: SmartAccountWrapper = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendTransaction: async (args: any) => {
      // For ERC-20 paymaster: prepend TON approve call
      let calls = args.calls || [];
      if (useCustomPaymaster && CONTRACTS.TON_PAYMASTER) {
        const approveCall = {
          to: CONTRACTS.TON as Address,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: "approve",
            args: [CONTRACTS.TON_PAYMASTER as Address, maxUint256],
          }),
        };
        calls = [approveCall, ...calls];
      }

      // Check if EIP-7702 authorization is needed (first UserOp or wrong delegation)
      const deployed = await smartAccount.isDeployed();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userOpParams: any = {
        account: smartAccount,
        calls,
      };

      if (!deployed) {
        console.log("[EIP-7702] Account not delegated, setting up delegation...");
        const authorization = await ensureDelegation();
        if (authorization) {
          // Privy path: include signed authorization in UserOp
          userOpParams.authorization = authorization;
        }
        // MetaMask path: delegation was set via separate tx, no auth needed
      }

      const userOpHash = await bundlerClient.sendUserOperation(userOpParams);

      const receipt = await bundlerClient.waitForUserOperationReceipt({
        hash: userOpHash,
      });
      return receipt.receipt.transactionHash;
    },
  };

  return { wrapper, useCustomPaymaster };
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

        // Privy accounts support signAuthorization natively —
        // returns signed authorization to include in UserOp (fully gasless)
        const ensureDelegation: EnsureDelegationFn = async () => {
          const nonce = await publicClient.getTransactionCount({
            address: localAccount.address,
            blockTag: "pending",
          });
          return localAccount.signAuthorization!({
            contractAddress: CONTRACTS.METAMASK_DELEGATOR as Address,
            chainId: chain.id,
            nonce,
          });
        };

        const { wrapper, useCustomPaymaster } = await setupDelegationToolkit(
          { account: localAccount },
          localAccount.address,
          ensureDelegation,
        );

        if (cancelled) return;

        setSmartAccountClient(wrapper);
        setWalletType("embedded");
        setIsGasless(!useCustomPaymaster);
        setPaymasterMode(useCustomPaymaster ? "erc20" : "none");
        setIsReady(true);

        console.log(
          useCustomPaymaster
            ? `[Embedded] Using TONPaymaster via delegation-toolkit`
            : "[Embedded] No paymaster configured"
        );
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

  // ─── Path B: MetaMask External Wallet ───
  // Uses wallet_sendCalls (EIP-5792) which MetaMask handles natively.
  // Checks wallet_getCapabilities to detect paymasterService support:
  //   - If supported: uses ERC-7677 paymaster for gasless transactions
  //   - If not: gas is paid in ETH by the user
  useEffect(() => {
    if (!metamaskWallet || externalInitRef.current) return;

    let cancelled = false;

    async function setupMetaMask() {
      try {
        externalInitRef.current = true;

        const provider = await metamaskWallet!.getEthereumProvider();
        const address = metamaskWallet!.address as Address;
        const chainHex = `0x${chain.id.toString(16)}`;

        // Check if MetaMask supports paymasterService on this chain
        let hasPaymasterSupport = false;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const capabilities = await (provider as any).request({
            method: "wallet_getCapabilities",
            params: [address],
          });
          console.log("[MetaMask] wallet_getCapabilities:", JSON.stringify(capabilities, null, 2));

          const chainCaps = capabilities?.[chainHex] || capabilities?.[`0x${chain.id.toString(16).toUpperCase()}`];
          if (chainCaps?.paymasterService?.supported) {
            hasPaymasterSupport = true;
          }
        } catch (capErr) {
          console.warn("[MetaMask] wallet_getCapabilities failed:", capErr);
        }

        // Build the paymaster URL for ERC-7677
        const paymasterUrl = hasPaymasterSupport
          ? `${window.location.origin}/api/paymaster`
          : null;

        console.log(
          hasPaymasterSupport
            ? `[MetaMask] paymasterService supported! Using ${paymasterUrl}`
            : "[MetaMask] paymasterService not supported on this chain. Gas paid in ETH."
        );

        const wrapper: SmartAccountWrapper = {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          sendTransaction: async (args: any) => {
            let calls = (args.calls || []).map(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (c: any) => ({
                to: c.to,
                data: c.data || "0x",
                value: c.value ? `0x${BigInt(c.value).toString(16)}` : "0x0",
              })
            );

            // If using paymaster, prepend TON approve for gas payment
            if (paymasterUrl && CONTRACTS.TON_PAYMASTER) {
              const approveCall = {
                to: CONTRACTS.TON as Address,
                data: encodeFunctionData({
                  abi: erc20Abi,
                  functionName: "approve",
                  args: [CONTRACTS.TON_PAYMASTER as Address, maxUint256],
                }),
                value: "0x0",
              };
              calls = [approveCall, ...calls];
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const sendCallsParams: any = {
              version: "2.0.0",
              from: address,
              chainId: chainHex,
              atomicRequired: true,
              calls,
            };

            // Add paymasterService capability if supported
            if (paymasterUrl) {
              sendCallsParams.capabilities = {
                paymasterService: {
                  url: paymasterUrl,
                },
              };
            }

            console.log("[MetaMask] wallet_sendCalls params:", JSON.stringify(sendCallsParams, null, 2));

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const callResult = await (provider as any).request({
              method: "wallet_sendCalls",
              params: [sendCallsParams],
            });

            console.log("[MetaMask] wallet_sendCalls result:", callResult, typeof callResult);

            // v2 may return an object { id: "0x..." } or just a string
            const batchId: string =
              typeof callResult === "string"
                ? callResult
                : callResult?.id || callResult?.batchId || String(callResult);

            console.log("[MetaMask] batchId:", batchId);

            // Poll wallet_getCallsStatus until confirmed
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let status: any;
            for (let i = 0; i < 120; i++) {
              await new Promise((r) => setTimeout(r, 2000));
              try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                status = await (provider as any).request({
                  method: "wallet_getCallsStatus",
                  params: [batchId],
                });
              } catch (pollErr: unknown) {
                // code 5730 = bundle dropped (user rejected or expired)
                const errCode = (pollErr as { code?: number })?.code;
                if (errCode === 5730) {
                  throw new Error("Transaction was rejected or expired");
                }
                throw pollErr;
              }
              console.log("[MetaMask] wallet_getCallsStatus:", status);
              // v1: "CONFIRMED", v2: 200 (numeric)
              if (status.status === "CONFIRMED" || status.status === 200) break;
              // v2: 400+ means failure
              if (typeof status.status === "number" && status.status >= 400) {
                throw new Error(`Transaction failed with status ${status.status}`);
              }
            }

            const isConfirmed =
              status?.status === "CONFIRMED" || status?.status === 200;
            if (!isConfirmed) {
              throw new Error("Transaction was not confirmed");
            }

            return status.receipts[0].transactionHash as `0x${string}`;
          },
        };

        if (cancelled) return;

        setSmartAccountClient(wrapper);
        setWalletType("external");
        setIsGasless(hasPaymasterSupport);
        setPaymasterMode(hasPaymasterSupport ? "erc20" : "none");
        setIsReady(true);
      } catch (e) {
        if (cancelled) return;
        externalInitRef.current = false;
        const msg = e instanceof Error ? e.message : String(e);
        console.error("EIP-7702 MetaMask setup failed:", msg);
        setError(msg);
      }
    }

    setupMetaMask();

    return () => {
      cancelled = true;
      externalInitRef.current = false;
    };
  }, [metamaskWallet]);

  return {
    smartAccountClient,
    isReady,
    error,
    walletType,
    isGasless,
    paymasterMode,
    isMetaMask: !!metamaskWallet,
  };
}
