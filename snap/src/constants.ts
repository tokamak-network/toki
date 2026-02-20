// Sepolia testnet contracts
export const SEPOLIA_CHAIN_ID = 11155111;

export const CONTRACTS = {
  TON: "0xa30fe40285b8f5c0457dbc3b7c8a280373c40044",
  TON_PAYMASTER: "0x7534EB923e88eAeACd070B4d1F33dA58306b800c",
  ENTRY_POINT_V08: "0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108",
  // Simple7702Account singleton (eth-infinitism, Spearbit audited)
  // EOA delegates code to this address via EIP-7702
  SIMPLE_7702_ACCOUNT: "0xe6Cae83BdE06E4c305530e199D7217f42808555B",
} as const;

// Gas limits for TONPaymaster
export const PAYMASTER_VERIFICATION_GAS_LIMIT = "0x24900"; // 150,000
export const PAYMASTER_POST_OP_GAS_LIMIT = "0x186a0"; // 100,000

// Dummy signature for gas estimation (65 bytes)
export const DUMMY_SIGNATURE =
  "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c";

// Function selectors
export const SELECTORS = {
  // Simple7702Account.execute(address dest, uint256 value, bytes calldata func)
  EXECUTE: "b61d27f6",
  // Simple7702Account.executeBatch((address,uint256,bytes)[])
  EXECUTE_BATCH: "34fcd5be",
  // ERC-20 approve(address spender, uint256 amount)
  APPROVE: "095ea7b3",
  // EntryPoint.getNonce(address sender, uint192 key)
  GET_NONCE: "35567e1a",
} as const;

// Max uint256 for approve
export const MAX_UINT256 =
  "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

// EIP-7702 magic byte
export const EIP_7702_MAGIC = 0x05;
