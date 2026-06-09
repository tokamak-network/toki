// ─── Private Transfer (Tokamak Private App Channels) — addresses & config ────
//
// Verified from the locally-installed CLI 1.0.1 deployment artifacts at
// ~/tokamak-private-channels/dapps/private-state/chain-id-{1,11155111}/.
// See docs/private-transfer-integration-plan.md §12 (M0 findings).

export type PtNetwork = "mainnet" | "sepolia";

export interface PtChainConfig {
  chainId: number;
  bridgeCore: `0x${string}`;
  bridgeTokenVault: `0x${string}`;
  dAppManager: `0x${string}`;
  controller: `0x${string}`; // PrivateStateController
  l2AccountingVault: `0x${string}`;
  channelDeployer: `0x${string}`;
  grothVerifier: `0x${string}`;
  tokamakVerifier: `0x${string}`;
  /** Canonical settlement asset (the token bridged into channels). */
  ton: `0x${string}`;
}

export const PT_CONFIG: Record<PtNetwork, PtChainConfig> = {
  mainnet: {
    chainId: 1,
    bridgeCore: "0x992E2Ae206620d811832a8F697c526c4f95974b6",
    bridgeTokenVault: "0xf127Aef661c815ad46c5159146078f6F1E9f5F61",
    dAppManager: "0x88Ab290a9dc0a169240EBC282Ec1F7C8524645aA",
    controller: "0x67C6233A99D9f122Fef9DC111e89948107b34c2F",
    l2AccountingVault: "0x9a6c9eb158269bbed8885649f95acefa8aafc3aa",
    channelDeployer: "0xE9B3d20e5925DEB506B5F5cCA94F753B6A34Af7C",
    grothVerifier: "0xC1523baF508B5d45663Cb69fc0cA7F35e82101eB",
    tokamakVerifier: "0xfC0BaCc0628BafAcB7Ce52fde21680caAA3cC9E1",
    // canonical TON (Tokamak Network ERC-20 on Ethereum L1)
    ton: "0x2be5e8c109e2197D077D13A82dAead6a9b3433C5",
  },
  sepolia: {
    chainId: 11155111,
    bridgeCore: "0x1995B1cDe4e0a3F77bDeC297824504CdAc9a838E",
    bridgeTokenVault: "0xac95B08BBB7726ea71Eb9b055BEF8e9383d470eC",
    dAppManager: "0x4E3FD6bfd3cb4CA89AfEFc9d91828b9fFb94bCD6",
    controller: "0x9199ab74168fddbcc30a51fed7bd0bb8a8d107c0",
    l2AccountingVault: "0x1f24a5358455f4edfeadee843d0dcb8b450a84fe",
    channelDeployer: "0x218Db34Eb03a268722C39B6eD744f8b9b8522d21",
    grothVerifier: "0x3B4e4A9CfB87fea821fA314F8f75673aBe5137F2",
    tokamakVerifier: "0xc99a2001f39039C89AB88b14D0cf5d24346029e7",
    // TODO(M0): confirm the channel's canonical asset on Sepolia (bridge mockAsset
    // is 0x0). Toki's Sepolia TON is below; verify it matches before live use.
    ton: "0xa30fe40285B8f5c0457DbC3B7C8A280373c40044",
  },
};

/** Live channel the user has joined on mainnet (CLI workspace). */
export const PT_DEFAULT_CHANNEL = "the-great-first-channel";

// ─── L2 identity derivation (mirror of CLI 1.0.1 cli-shared.mjs) ─────────────
// L2 keys are derived from the user's wallet SIGNATURE (no raw key to server):
//   message = [DOMAIN, `channel:${name}`, `walletSecret:${secret}`].join("\n")
//   signer.signMessage(message) -> deriveL2KeysFromSignature() (tokamak-l2js)
// Note-receive key uses eth_signTypedData_v4 (NoteReceiveKey typed data).
export const PT_L2_WALLET_SECRET_SIGNING_DOMAIN =
  "Tokamak private-state L2 wallet secret binding";
export const PT_NOTE_RECEIVE_PROTOCOL = "PRIVATE_STATE_NOTE_RECEIVE_KEY_V2";

/** tokamak-l2js version that MUST match the CLI's (Poseidon/jubjub key parity). */
export const PT_L2JS_VERSION = "0.1.4";
