import {
  handleKeyringRequest,
  MethodNotSupportedError,
} from "@metamask/keyring-snap-sdk";
import type {
  Json,
  OnKeyringRequestHandler,
  OnRpcRequestHandler,
} from "@metamask/snaps-sdk";
import type { Call } from "./keyring";
import { TonPaymasterKeyring } from "./keyring";
import type { SnapConfig } from "./state";
import { getState } from "./state";

let keyring: TonPaymasterKeyring;

async function getKeyring(): Promise<TonPaymasterKeyring> {
  if (!keyring) {
    const state = await getState();
    keyring = new TonPaymasterKeyring(state);
  }
  return keyring;
}

/**
 * Handle custom RPC requests from the companion dApp.
 *
 * Methods:
 * - ton_setConfig: Configure bundler URL
 * - ton_getConfig: Get current config
 * - ton_sendUserOp: Build, sign, and submit UserOp with EIP-7702 + TONPaymaster
 * - ton_getAccounts: List registered accounts
 * - keyring_*: Routed to Keyring handler (account management)
 */
export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  console.log(`[TON Snap] RPC request from ${origin}:`, request.method);

  const kr = await getKeyring();

  // Route keyring_* methods to the keyring handler
  if (request.method.startsWith("keyring_")) {
    return (await handleKeyringRequest(kr, request)) ?? null;
  }

  switch (request.method) {
    case "ton_setConfig": {
      if (!request.params) {
        throw new Error("Missing config params");
      }
      return (await kr.setConfig(
        request.params as unknown as Partial<SnapConfig>,
      )) as unknown as Json;
    }

    case "ton_getConfig": {
      return (await kr.getConfig()) as unknown as Json;
    }

    case "ton_getAccounts": {
      const accounts = await kr.listAccounts();
      return accounts as unknown as Json;
    }

    case "ton_sendUserOp": {
      if (!request.params) {
        throw new Error(
          "Missing params. Expected: { calls: [{to, value?, data?}] }",
        );
      }
      const params = request.params as unknown as { calls: Call[] };
      if (!params.calls || !Array.isArray(params.calls)) {
        throw new Error(
          "Expected params.calls to be an array of {to, value?, data?}",
        );
      }
      const userOpHash = await kr.sendUserOp(params.calls);
      return userOpHash as unknown as Json;
    }

    default:
      throw new MethodNotSupportedError(request.method);
  }
};

/**
 * Handle keyring requests from MetaMask.
 * Routes account management and ERC-4337 methods to our keyring.
 */
export const onKeyringRequest: OnKeyringRequestHandler = async ({
  origin,
  request,
}) => {
  console.log(`[TON Snap] Keyring request from ${origin}:`, request.method);

  return (await handleKeyringRequest(await getKeyring(), request)) ?? null;
};
