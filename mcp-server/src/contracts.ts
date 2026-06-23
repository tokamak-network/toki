// Tokamak Network contract addresses + minimal read ABIs.
// Source of truth: ../../src/constants/contracts.ts and ../../src/lib/abi.ts in
// the main toki app. Kept self-contained here so the MCP server has zero coupling
// to Next. If the app's addresses/ABIs change, mirror them here.
import { isTestnet } from "./chain.js";

const MAINNET = {
  TON: "0x2be5e8c109e2197D077D13A82dAead6a9b3433C5",
  WTON: "0xc4A11aaf6ea915Ed7Ac194161d2fC9384F15bff2",
  SEIG_MANAGER_PROXY: "0x0b55a0f463b6defb81c6063973763951712d0e5f",
  DEPOSIT_MANAGER_PROXY: "0x0b58ca72b12f01fc05f8f252e226f3e2089bd00e",
  LAYER2_REGISTRY_PROXY: "0x7846c2248A7B4dE77E9C2Bae7FBB93bfC286837B",
} as const;

const SEPOLIA = {
  TON: "0xa30fe40285b8f5c0457dbc3b7c8a280373c40044",
  WTON: "0x79e0d92670106c85e9067b56b8f674340dca0bbd",
  SEIG_MANAGER_PROXY: "0x2320542ae933FbAdf8f5B97cA348c7CeDA90fAd7",
  DEPOSIT_MANAGER_PROXY: "0x90ffcc7F168DceDBEF1Cb6c6eB00cA73F922956F",
  LAYER2_REGISTRY_PROXY: "0xA0a9576b437E52114aDA8b0BC4149F2F5c604581",
} as const;

export const CONTRACTS = isTestnet ? SEPOLIA : MAINNET;

export const TON_DECIMALS = 18;
export const RAY_DECIMALS = 27; // WTON / staking amounts
export const MAX_OPERATORS = 20;

export const seigManagerAbi = [
  { inputs: [], name: "stakeOfTotal", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalSupplyOfTon", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "seigPerBlock", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "layer2", type: "address" }], name: "commissionRates", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "layer2", type: "address" }], name: "isCommissionRateNegative", outputs: [{ name: "", type: "bool" }], stateMutability: "view", type: "function" },
] as const;

export const layer2RegistryAbi = [
  { inputs: [], name: "numLayer2s", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "index", type: "uint256" }], name: "layer2ByIndex", outputs: [{ name: "", type: "address" }], stateMutability: "view", type: "function" },
] as const;

export const candidateAbi = [
  { inputs: [], name: "totalStaked", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "memo", outputs: [{ name: "", type: "string" }], stateMutability: "view", type: "function" },
] as const;

export const erc20Abi = [
  { inputs: [{ name: "account", type: "address" }], name: "balanceOf", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
] as const;

// DepositManager — per-account staking totals (used by the app's hub balance chip).
export const depositManagerAbi = [
  { inputs: [{ name: "account", type: "address" }], name: "accStakedAccount", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "account", type: "address" }], name: "pendingUnstakedAccount", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
] as const;
