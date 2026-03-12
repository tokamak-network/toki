// Minimal ABI fragments for reading staking data

export const seigManagerAbi = [
  {
    inputs: [],
    name: "stakeOfTotal",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupplyOfTon",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "seigPerBlock",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "lastSeigBlock",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "layer2", type: "address" },
      { name: "account", type: "address" },
    ],
    name: "stakeOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "layer2", type: "address" }],
    name: "commissionRates",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "layer2", type: "address" }],
    name: "isCommissionRateNegative",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const layer2RegistryAbi = [
  {
    inputs: [],
    name: "numLayer2s",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "index", type: "uint256" }],
    name: "layer2ByIndex",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const candidateAbi = [
  {
    inputs: [],
    name: "totalStaked",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "memo",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// TON token (approveAndCall for 1-tx staking)
export const tonTokenAbi = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "data", type: "bytes" },
    ],
    name: "approveAndCall",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// WTON token
export const wtonTokenAbi = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "data", type: "bytes" },
    ],
    name: "approveAndCall",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// DepositManager (deposit, withdraw)
export const depositManagerAbi = [
  {
    inputs: [
      { name: "layer2", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "deposit",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "layer2", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "requestWithdrawal",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "layer2", type: "address" }],
    name: "requestWithdrawalAll",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "layer2", type: "address" },
      { name: "receiveTON", type: "bool" },
    ],
    name: "processRequest",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "layer2", type: "address" },
      { name: "n", type: "uint256" },
      { name: "receiveTON", type: "bool" },
    ],
    name: "processRequests",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "layer2", type: "address" },
      { name: "account", type: "address" },
    ],
    name: "numPendingRequests",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "layer2", type: "address" },
      { name: "account", type: "address" },
    ],
    name: "numRequests",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "layer2", type: "address" },
      { name: "account", type: "address" },
    ],
    name: "pendingUnstaked",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "layer2", type: "address" },
      { name: "account", type: "address" },
    ],
    name: "withdrawalRequestIndex",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "layer2", type: "address" },
      { name: "account", type: "address" },
      { name: "index", type: "uint256" },
    ],
    name: "withdrawalRequest",
    outputs: [
      { name: "withdrawableBlockNumber", type: "uint128" },
      { name: "amount", type: "uint128" },
      { name: "processed", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "globalWithdrawalDelay",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// TONPaymaster (gas cost estimation via on-chain oracle)
export const tonPaymasterAbi = [
  {
    inputs: [{ name: "ethAmount", type: "uint256" }],
    name: "ethToToken",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTokenPerEth",
    outputs: [{ name: "tokenPerEthRate", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
