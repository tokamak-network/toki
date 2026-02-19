// Tokamak Network Contract Addresses (Ethereum Mainnet)
export const CONTRACTS = {
  TON: "0x2be5e8c109e2197D077D13A82dAead6a9b3433C5" as const,
  WTON: "0xc4A11aaf6ea915Ed7Ac194161d2fC9384F15bff2" as const,
  SEIG_MANAGER_PROXY: "0x0b55a0f463b6defb81c6063973763951712d0e5f" as const,
  DEPOSIT_MANAGER_PROXY: "0x0b58ca72b12f01fc05f8f252e226f3e2089bd00e" as const,
  LAYER2_REGISTRY_PROXY: "0x7846c2248a7b4de77e9c2bae7fbb93bfc286837b" as const,
  // EntryPoint v0.8 (EIP-7702 compatible)
  ENTRY_POINT_V08: "0x4337084d9e255ff0702461cf8895ce9e3b5ff108" as const,
} as const;

// Layer2 Operators
export const OPERATORS = [
  { name: "tokamak1", address: "0xf3B17FDB808c7d0Df9ACd24dA34700ce069007DF" },
  { name: "DXM Corp", address: "0x44e3605d0ed58FD125E9C47D1bf25a4406c13b57" },
  { name: "DSRV", address: "0x2B67D8D4E61b68744885E243EfAF988f1Fc66E2D" },
  { name: "Talken", address: "0x36101b31e74c5E8f9a9cec378407Bbb776287761" },
  { name: "staked", address: "0x2c25A6be0e6f9017b5bf77879c487eed466F2194" },
  { name: "level", address: "0x0F42D1C40b95DF7A1478639918fc358B4aF5298D" },
  { name: "decipher", address: "0xbc602C1D9f3aE99dB4e9fD3662CE3D02e593ec5d" },
  { name: "DeSpread", address: "0xC42cCb12515b52B59c02eEc303c887C8658f5854" },
  { name: "Danal Fintech", address: "0xf3CF23D896Ba09d8EcdcD4655d918f71925E3FE5" },
  { name: "Hammer DAO", address: "0x06D34f65869Ec94B3BA8c0E08BCEb532f65005E2" },
] as const;

// Token decimals
export const TON_DECIMALS = 18;
export const WTON_DECIMALS = 27;

// Seigniorage
export const SEIG_PER_BLOCK = 3.92; // WTON per block
export const BLOCKS_PER_YEAR = 2_628_000; // ~12s block time
