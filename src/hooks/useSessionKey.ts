"use client";

import {
  createDelegation,
  getDeleGatorEnvironment,
  Implementation,
  toMetaMaskSmartAccount,
} from "@metamask/delegation-toolkit";
import { erc7710BundlerActions } from "@metamask/delegation-toolkit/experimental";
import { encodeDelegations } from "@metamask/delegation-toolkit/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type Address,
  createPublicClient,
  encodeAbiParameters,
  encodeFunctionData,
  erc20Abi,
  type Hex,
  http,
  maxUint256,
  parseUnits,
} from "viem";
import { createBundlerClient } from "viem/account-abstraction";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { mainnet, sepolia } from "viem/chains";
import { CONTRACTS } from "@/constants/contracts";
import { tonTokenAbi } from "@/lib/abi";

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

// LocalStorage keys
const SESSION_KEY_STORAGE = "ttoni_session_key";
const DELEGATION_STORAGE = "ttoni_delegation";

interface StoredSessionKey {
  privateKey: Hex;
  address: Address;
  expiry: number; // unix timestamp
}

interface StoredDelegation {
  delegate: Hex;
  delegator: Hex;
  authority: Hex;
  caveats: { enforcer: Hex; terms: Hex; args: Hex }[];
  salt: Hex;
  signature: Hex;
}

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

function loadSessionKey(): StoredSessionKey | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY_STORAGE);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSessionKey;
    if (parsed.expiry < Math.floor(Date.now() / 1000)) {
      localStorage.removeItem(SESSION_KEY_STORAGE);
      localStorage.removeItem(DELEGATION_STORAGE);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function loadDelegation(): StoredDelegation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DELEGATION_STORAGE);
    if (!raw) return null;
    return JSON.parse(raw) as StoredDelegation;
  } catch {
    return null;
  }
}

// Check if EOA has been upgraded to smart account (has DeleGator code)
async function checkSmartAccountDeployed(address: Address): Promise<boolean> {
  const code = await publicClient.getCode({ address });
  return !!code && code !== "0x";
}

export function useSessionKey(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getEthereumProvider: (() => Promise<any>) | null,
  userAddress: Address | null,
) {
  const [sessionKeyAddress, setSessionKeyAddress] = useState<Address | null>(
    null,
  );
  const [delegationReady, setDelegationReady] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiry, setExpiry] = useState<number | null>(null);
  const [isSmartAccount, setIsSmartAccount] = useState<boolean | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const initRef = useRef(false);

  // Load existing session key + delegation from localStorage on mount
  // Also check if EOA is already upgraded to smart account
  useEffect(() => {
    if (initRef.current || !userAddress) return;
    initRef.current = true;

    const storedKey = loadSessionKey();
    const storedDelegation = loadDelegation();

    if (
      storedKey &&
      storedDelegation &&
      storedDelegation.delegator.toLowerCase() === userAddress.toLowerCase()
    ) {
      setSessionKeyAddress(storedKey.address);
      setExpiry(storedKey.expiry);
      setDelegationReady(true);
    }

    // Check smart account status
    checkSmartAccountDeployed(userAddress).then(setIsSmartAccount);

    return () => {
      initRef.current = false;
    };
  }, [userAddress]);

  // Upgrade EOA to smart account via wallet_sendCalls (requires ETH, one-time)
  const upgradeToSmartAccount = useCallback(async () => {
    if (!getEthereumProvider || !userAddress) return;

    setIsUpgrading(true);
    setError(null);

    try {
      const provider = await getEthereumProvider();
      const chainHex = `0x${chain.id.toString(16)}`;

      // Send an empty batch call — MetaMask will prompt smart account upgrade
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (provider as any).request({
        method: "wallet_sendCalls",
        params: [
          {
            version: "2.0.0",
            from: userAddress,
            chainId: chainHex,
            atomicRequired: true,
            calls: [],
          },
        ],
      });

      const batchId =
        typeof result === "string" ? result : result?.id || String(result);

      // Poll for completion
      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const status = await (provider as any).request({
            method: "wallet_getCallsStatus",
            params: [batchId],
          });
          if (status.status === "CONFIRMED" || status.status === 200) break;
          if (typeof status.status === "number" && status.status >= 400) {
            throw new Error(`Upgrade failed with status ${status.status}`);
          }
        } catch (e: unknown) {
          if ((e as { code?: number })?.code === 5730) {
            throw new Error("Smart account upgrade was rejected");
          }
          throw e;
        }
      }

      setIsSmartAccount(true);
      console.log("[SessionKey] Smart account upgrade complete");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[SessionKey] Upgrade failed:", msg);
      setError(msg.slice(0, 200));
    }

    setIsUpgrading(false);
  }, [getEthereumProvider, userAddress]);

  // Request delegation signature from MetaMask
  const requestDelegation = useCallback(async () => {
    if (!getEthereumProvider || !userAddress || !pimlicoUrl) return;

    setIsRequesting(true);
    setError(null);

    try {
      const provider = await getEthereumProvider();
      const environment = getDeleGatorEnvironment(chain.id);

      // Generate or reuse session key
      let storedKey = loadSessionKey();
      let sessionPrivateKey: Hex;
      let sessionAddr: Address;
      const expiryTime = Math.floor(Date.now() / 1000) + 7 * 24 * 3600; // 1 week

      if (storedKey) {
        sessionPrivateKey = storedKey.privateKey;
        sessionAddr = storedKey.address;
      } else {
        sessionPrivateKey = generatePrivateKey();
        const sessionAccount = privateKeyToAccount(sessionPrivateKey);
        sessionAddr = sessionAccount.address;
        storedKey = {
          privateKey: sessionPrivateKey,
          address: sessionAddr,
          expiry: expiryTime,
        };
        localStorage.setItem(SESSION_KEY_STORAGE, JSON.stringify(storedKey));
      }

      // Create delegation with functionCall scope for TON contract
      const delegation = createDelegation({
        environment,
        from: userAddress as Hex,
        to: sessionAddr as Hex,
        scope: {
          type: "functionCall",
          targets: [CONTRACTS.TON as Address],
          selectors: [
            "approve(address,uint256)",
            "approveAndCall(address,uint256,bytes)",
          ],
        },
      });

      // Sign delegation via raw eth_signTypedData_v4 on MetaMask provider
      // MetaMask blocks delegation signing through the toolkit's abstraction layer,
      // so we construct the EIP-712 typed data manually and call the provider directly.
      const typedData = {
        types: {
          EIP712Domain: [
            { name: "name", type: "string" },
            { name: "version", type: "string" },
            { name: "chainId", type: "uint256" },
            { name: "verifyingContract", type: "address" },
          ],
          Caveat: [
            { name: "enforcer", type: "address" },
            { name: "terms", type: "bytes" },
          ],
          Delegation: [
            { name: "delegate", type: "address" },
            { name: "delegator", type: "address" },
            { name: "authority", type: "bytes32" },
            { name: "caveats", type: "Caveat[]" },
            { name: "salt", type: "uint256" },
          ],
        },
        primaryType: "Delegation" as const,
        domain: {
          name: "DelegationManager",
          version: "1",
          chainId: chain.id,
          verifyingContract: environment.DelegationManager,
        },
        message: {
          delegate: delegation.delegate,
          delegator: delegation.delegator,
          authority: delegation.authority,
          caveats: delegation.caveats.map(
            (c: { enforcer: Hex; terms: Hex }) => ({
              enforcer: c.enforcer,
              terms: c.terms,
            }),
          ),
          salt:
            delegation.salt === "0x" ? "0" : BigInt(delegation.salt).toString(),
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const signature = await (provider as any).request({
        method: "eth_signTypedData_v4",
        params: [userAddress, JSON.stringify(typedData)],
      });

      const signedDelegation = { ...delegation, signature };

      // Store signed delegation
      localStorage.setItem(
        DELEGATION_STORAGE,
        JSON.stringify(signedDelegation),
      );

      setSessionKeyAddress(sessionAddr);
      setExpiry(expiryTime);
      setDelegationReady(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[SessionKey] Delegation request failed:", msg);
      if (msg.includes("User rejected") || msg.includes("user rejected")) {
        setError("Delegation signature rejected by user");
      } else {
        setError(msg.slice(0, 200));
      }
    }

    setIsRequesting(false);
  }, [getEthereumProvider, userAddress]);

  // Send staking transaction via session key + delegation (gasless)
  const stakeWithDelegation = useCallback(
    async (
      operatorAddress: Address,
      tonAmount: string,
    ): Promise<`0x${string}`> => {
      if (!userAddress || !pimlicoUrl) {
        throw new Error("Not ready: missing userAddress or pimlico config");
      }

      const storedKey = loadSessionKey();
      const storedDelegation = loadDelegation();
      if (!storedKey || !storedDelegation) {
        throw new Error(
          "No session key or delegation found. Please sign delegation first.",
        );
      }

      const environment = getDeleGatorEnvironment(chain.id);
      const sessionAccount = privateKeyToAccount(storedKey.privateKey);

      // Create smart account for session key operating on behalf of user
      const sessionSmartAccount = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Stateless7702,
        signer: { account: sessionAccount },
        address: userAddress,
      });

      // Patch: prevent getFactoryArgs from throwing
      sessionSmartAccount.getFactoryArgs = async () => ({
        factory: undefined,
        factoryData: undefined,
      });

      const tonPaymasterAddr = CONTRACTS.TON_PAYMASTER;
      const tonPaymaster = tonPaymasterAddr
        ? createTonPaymasterProvider(tonPaymasterAddr as Address)
        : undefined;

      const bundler = createBundlerClient({
        client: publicClient,
        transport: http(pimlicoUrl),
        ...(tonPaymaster ? { paymaster: tonPaymaster } : {}),
      }).extend(erc7710BundlerActions());

      // Encode the delegation chain as permissionsContext
      const permissionsContext = encodeDelegations([storedDelegation]);

      // Build staking calls
      const amount = parseUnits(tonAmount, 18);
      const wtonAddr = CONTRACTS.WTON as Address;
      const depositManagerAddr = CONTRACTS.DEPOSIT_MANAGER_PROXY as Address;
      const tonAddr = CONTRACTS.TON as Address;

      const stakingData = encodeAbiParameters(
        [{ type: "address" }, { type: "address" }],
        [depositManagerAddr, operatorAddress],
      );

      // Calls: approve paymaster (if applicable) + approveAndCall for staking
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const calls: any[] = [];

      if (tonPaymasterAddr) {
        calls.push({
          to: tonAddr,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: "approve",
            args: [tonPaymasterAddr as Address, maxUint256],
          }),
          permissionsContext,
          delegationManager: environment.DelegationManager,
        });
      }

      calls.push({
        to: tonAddr,
        data: encodeFunctionData({
          abi: tonTokenAbi,
          functionName: "approveAndCall",
          args: [wtonAddr, amount, stakingData],
        }),
        permissionsContext,
        delegationManager: environment.DelegationManager,
      });

      const userOpHash = await bundler.sendUserOperationWithDelegation({
        account: sessionSmartAccount,
        calls,
        publicClient,
      });

      // Wait for receipt
      const bundlerForReceipt = createBundlerClient({
        client: publicClient,
        transport: http(pimlicoUrl),
        ...(tonPaymaster ? { paymaster: tonPaymaster } : {}),
      });

      const receipt = await bundlerForReceipt.waitForUserOperationReceipt({
        hash: userOpHash,
      });

      return receipt.receipt.transactionHash;
    },
    [userAddress],
  );

  // Revoke session key (clear localStorage)
  const revokeSessionKey = useCallback(() => {
    localStorage.removeItem(SESSION_KEY_STORAGE);
    localStorage.removeItem(DELEGATION_STORAGE);
    setSessionKeyAddress(null);
    setDelegationReady(false);
    setExpiry(null);
  }, []);

  return {
    sessionKeyAddress,
    delegationReady,
    isRequesting,
    error,
    expiry,
    isSmartAccount,
    isUpgrading,
    requestDelegation,
    stakeWithDelegation,
    revokeSessionKey,
    upgradeToSmartAccount,
  };
}
