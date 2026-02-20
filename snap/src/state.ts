import type { KeyringAccount } from "@metamask/keyring-api";
import type { Json } from "@metamask/utils";

export type Wallet = {
  account: KeyringAccount;
  privateKey: string; // hex, no 0x prefix
  isDelegated: boolean; // true after first EIP-7702 delegation
};

export type SnapConfig = {
  bundlerUrl: string;
};

export type SnapState = {
  wallets: Record<string, Wallet>;
  config: SnapConfig;
};

const DEFAULT_STATE: SnapState = {
  wallets: {},
  config: {
    bundlerUrl: "",
  },
};

export async function getState(): Promise<SnapState> {
  const state = (await snap.request({
    method: "snap_manageState",
    params: { operation: "get" },
  })) as Record<string, Json> | null;

  if (!state) {
    return { ...DEFAULT_STATE };
  }

  return state as unknown as SnapState;
}

export async function saveState(state: SnapState): Promise<void> {
  await snap.request({
    method: "snap_manageState",
    params: {
      operation: "update",
      newState: state as unknown as Record<string, Json>,
    },
  });
}
