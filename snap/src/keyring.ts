import {
  Address,
  isValidPrivate,
  toChecksumAddress,
  ecsign,
} from "@ethereumjs/util";
import { keccak256 } from "ethereum-cryptography/keccak";
import type {
  Keyring,
  KeyringAccount,
  KeyringRequest,
  SubmitRequestResponse,
} from "@metamask/keyring-api";
import { EthAccountType, EthMethod, KeyringEvent } from "@metamask/keyring-api";
import { emitSnapKeyringEvent } from "@metamask/keyring-snap-sdk";
import type { Json } from "@metamask/utils";
import { v4 as uuid } from "uuid";

import {
  CONTRACTS,
  DUMMY_SIGNATURE,
  MAX_UINT256,
  PAYMASTER_POST_OP_GAS_LIMIT,
  PAYMASTER_VERIFICATION_GAS_LIMIT,
  SELECTORS,
  SEPOLIA_CHAIN_ID,
  EIP_7702_MAGIC,
} from "./constants";
import type { SnapConfig, SnapState, Wallet } from "./state";
import { saveState } from "./state";
import type { Eip7702Auth } from "./bundler";
import {
  estimateUserOperationGas,
  getUserOperationGasPrice,
  sendUserOperation,
} from "./bundler";

// ─── Utility Helpers ───

function hexStr(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToUint8(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const padded = clean.length % 2 ? "0" + clean : clean;
  const bytes = new Uint8Array(padded.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(padded.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function padHex(hex: string, bytes: number): string {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  return clean.padStart(bytes * 2, "0");
}

function encodeAddress(addr: string): string {
  return padHex(addr, 32);
}

function encodeUint256(value: string): string {
  const clean = value.startsWith("0x") ? value.slice(2) : value;
  return padHex(clean, 32);
}

function bigIntToMinBytes(n: bigint): Uint8Array {
  if (n === 0n) return new Uint8Array(0);
  const hex = n.toString(16);
  const padded = hex.length % 2 ? "0" + hex : hex;
  const bytes = new Uint8Array(padded.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(padded.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// ─── Minimal RLP Encoder (for EIP-7702 auth) ───

function rlpEncodeItem(data: Uint8Array): Uint8Array {
  if (data.length === 1 && data[0]! < 0x80) {
    return data;
  }
  if (data.length === 0) {
    return new Uint8Array([0x80]);
  }
  if (data.length <= 55) {
    const result = new Uint8Array(1 + data.length);
    result[0] = 0x80 + data.length;
    result.set(data, 1);
    return result;
  }
  const lenBytes = bigIntToMinBytes(BigInt(data.length));
  const result = new Uint8Array(1 + lenBytes.length + data.length);
  result[0] = 0xb7 + lenBytes.length;
  result.set(lenBytes, 1);
  result.set(data, 1 + lenBytes.length);
  return result;
}

function rlpEncodeList(items: Uint8Array[]): Uint8Array {
  const encoded = items.map(rlpEncodeItem);
  const totalLength = encoded.reduce((sum, item) => sum + item.length, 0);
  if (totalLength <= 55) {
    const result = new Uint8Array(1 + totalLength);
    result[0] = 0xc0 + totalLength;
    let offset = 1;
    for (const item of encoded) {
      result.set(item, offset);
      offset += item.length;
    }
    return result;
  }
  const lenBytes = bigIntToMinBytes(BigInt(totalLength));
  const result = new Uint8Array(1 + lenBytes.length + totalLength);
  result[0] = 0xf7 + lenBytes.length;
  result.set(lenBytes, 1);
  let offset = 1 + lenBytes.length;
  for (const item of encoded) {
    result.set(item, offset);
    offset += item.length;
  }
  return result;
}

// ─── ABI Encoding Helpers ───

/**
 * Encode ERC-20 approve(address spender, uint256 amount)
 */
function encodeApprove(spender: string, amount: string): string {
  return "0x" + SELECTORS.APPROVE + encodeAddress(spender) + encodeUint256(amount);
}

/**
 * Encode Simple7702Account.execute(address dest, uint256 value, bytes calldata func)
 */
function encodeExecute(to: string, value: string, data: string): string {
  const dest = encodeAddress(to);
  const val = encodeUint256(value);
  const offset = encodeUint256("0x60"); // 3 * 32 = 96
  const cleanData = data.startsWith("0x") ? data.slice(2) : data;
  const dataLen = encodeUint256("0x" + (cleanData.length / 2).toString(16));
  const paddedData =
    cleanData + "0".repeat((64 - (cleanData.length % 64)) % 64);
  return "0x" + SELECTORS.EXECUTE + dest + val + offset + dataLen + paddedData;
}

/**
 * Encode Simple7702Account.executeBatch((address,uint256,bytes)[] calls)
 * Selector: 0x34fcd5be
 */
function encodeExecuteBatch(
  calls: Array<{ target: string; value: string; data: string }>
): string {
  const count = calls.length;

  // ABI: executeBatch(Call[] calls)
  // Offset to the Call[] array
  let encoded = SELECTORS.EXECUTE_BATCH;
  encoded += encodeUint256("0x20"); // offset to array = 32

  // Array length
  encoded += encodeUint256("0x" + count.toString(16));

  // Each Call is a dynamic tuple, so we need offsets first
  // Calculate offsets for each Call struct
  const callEncodings: string[] = [];
  for (const call of calls) {
    // Each Call tuple: address(32) + value(32) + offset_to_bytes(32) + len(32) + padded_data
    const cleanData = call.data.startsWith("0x")
      ? call.data.slice(2)
      : call.data;
    const dataWords = Math.ceil(cleanData.length / 64) || 0;
    const tupleEncoded =
      encodeAddress(call.target) +
      encodeUint256(call.value) +
      encodeUint256("0x60") + // offset to bytes = 96 (3 * 32)
      encodeUint256("0x" + (cleanData.length / 2).toString(16)) +
      (cleanData || "") +
      "0".repeat((64 - (cleanData.length % 64)) % 64);
    callEncodings.push(tupleEncoded);
  }

  // Offsets for each Call (relative to array data start)
  let currentOffset = count * 32; // past the offset array
  for (const enc of callEncodings) {
    encoded += encodeUint256("0x" + currentOffset.toString(16));
    currentOffset += enc.length / 2; // each hex char = 0.5 byte
  }

  // Actual Call data
  for (const enc of callEncodings) {
    encoded += enc;
  }

  return "0x" + encoded;
}

// ─── EIP-7702 Authorization Signing ───

/**
 * Sign an EIP-7702 authorization.
 * authorization = sign(keccak256(0x05 || rlp([chainId, address, nonce])), privateKey)
 */
function signEip7702Authorization(
  chainId: bigint,
  delegationAddress: string,
  nonce: bigint,
  privateKeyHex: string
): Eip7702Auth {
  // RLP encode [chainId, address, nonce]
  const chainIdBytes = bigIntToMinBytes(chainId);
  const addressBytes = hexToUint8(delegationAddress);
  const nonceBytes = bigIntToMinBytes(nonce);

  const rlpData = rlpEncodeList([chainIdBytes, addressBytes, nonceBytes]);

  // Prepend magic byte 0x05
  const message = new Uint8Array(1 + rlpData.length);
  message[0] = EIP_7702_MAGIC;
  message.set(rlpData, 1);

  // Hash
  const hash = keccak256(message);

  // Sign
  const pkBytes = hexToUint8(privateKeyHex);
  const sig = ecsign(hash, pkBytes);

  // Convert v to yParity (v = 27 or 28 → yParity = 0 or 1)
  const yParity = Number(sig.v) - 27;

  return {
    chainId: "0x" + chainId.toString(16),
    address: delegationAddress,
    nonce: "0x" + nonce.toString(16),
    yParity: "0x" + yParity.toString(16),
    r: "0x" + hexStr(sig.r),
    s: "0x" + hexStr(sig.s),
  };
}

// ─── UserOp Hash Computation (EntryPoint v0.8) ───

/**
 * Compute UserOperation hash for EntryPoint v0.8.
 *
 * packHash = keccak256(abi.encode(sender, nonce, keccak256(initCode),
 *   keccak256(callData), accountGasLimits, preVerificationGas,
 *   gasFees, keccak256(paymasterAndData)))
 * userOpHash = keccak256(abi.encode(packHash, entryPoint, chainId))
 */
function computeUserOpHash(
  userOp: Record<string, string>,
  entryPoint: string,
  chainId: bigint
): string {
  // Pack gas limits: verificationGasLimit (16 bytes) || callGasLimit (16 bytes)
  const verificationGasLimit = padHex(
    userOp.verificationGasLimit ?? "0x0",
    16
  );
  const callGasLimit = padHex(userOp.callGasLimit ?? "0x0", 16);
  const accountGasLimits = verificationGasLimit + callGasLimit;

  // Pack gas fees: maxPriorityFeePerGas (16 bytes) || maxFeePerGas (16 bytes)
  const maxPriorityFeePerGas = padHex(
    userOp.maxPriorityFeePerGas ?? "0x0",
    16
  );
  const maxFeePerGas = padHex(userOp.maxFeePerGas ?? "0x0", 16);
  const gasFees = maxPriorityFeePerGas + maxFeePerGas;

  // Pack paymasterAndData: paymaster(20) + pmVerificationGas(16) + pmPostOpGas(16) + pmData
  let paymasterAndData = "0x";
  if (userOp.paymaster && userOp.paymaster !== "0x") {
    const pm = userOp.paymaster.startsWith("0x")
      ? userOp.paymaster.slice(2)
      : userOp.paymaster;
    const pmVerGas = padHex(
      userOp.paymasterVerificationGasLimit ?? "0x0",
      16
    );
    const pmPostGas = padHex(userOp.paymasterPostOpGasLimit ?? "0x0", 16);
    const pmData = (userOp.paymasterData ?? "0x").startsWith("0x")
      ? (userOp.paymasterData ?? "0x").slice(2)
      : (userOp.paymasterData ?? "");
    paymasterAndData = "0x" + pm.toLowerCase() + pmVerGas + pmPostGas + pmData;
  }

  // Compute initCode
  let initCode = "0x";
  if (userOp.factory && userOp.factory !== "0x") {
    const factory = userOp.factory.startsWith("0x")
      ? userOp.factory.slice(2)
      : userOp.factory;
    const factoryData = (userOp.factoryData ?? "0x").startsWith("0x")
      ? (userOp.factoryData ?? "0x").slice(2)
      : (userOp.factoryData ?? "");
    initCode = "0x" + factory + factoryData;
  }

  // Hash dynamic fields
  const initCodeHash = keccak256(hexToUint8(initCode));
  const callDataHash = keccak256(hexToUint8(userOp.callData ?? "0x"));
  const paymasterAndDataHash = keccak256(hexToUint8(paymasterAndData));

  // abi.encode(sender, nonce, hash(initCode), hash(callData),
  //   accountGasLimits, preVerificationGas, gasFees, hash(paymasterAndData))
  const packData =
    encodeAddress(userOp.sender!) +
    encodeUint256(userOp.nonce ?? "0x0") +
    hexStr(initCodeHash).padStart(64, "0") +
    hexStr(callDataHash).padStart(64, "0") +
    accountGasLimits.padStart(64, "0") +
    encodeUint256(userOp.preVerificationGas ?? "0x0") +
    gasFees.padStart(64, "0") +
    hexStr(paymasterAndDataHash).padStart(64, "0");

  const packHash = keccak256(hexToUint8("0x" + packData));

  // abi.encode(packHash, entryPoint, chainId)
  const outerData =
    hexStr(packHash).padStart(64, "0") +
    encodeAddress(entryPoint) +
    encodeUint256("0x" + chainId.toString(16));

  const finalHash = keccak256(hexToUint8("0x" + outerData));
  return "0x" + hexStr(finalHash);
}

// ─── Call Type ───

export type Call = {
  to: string;
  value?: string;
  data?: string;
};

// ─── TonPaymasterKeyring ───

export class TonPaymasterKeyring implements Keyring {
  #state: SnapState;

  constructor(state: SnapState) {
    this.#state = state;
  }

  async setConfig(config: Partial<SnapConfig>): Promise<SnapConfig> {
    this.#state.config = { ...this.#state.config, ...config };
    await this.#saveState();
    return this.#state.config;
  }

  async getConfig(): Promise<SnapConfig> {
    return this.#state.config;
  }

  // ─── Keyring: Account Management ───

  async listAccounts(): Promise<KeyringAccount[]> {
    return Object.values(this.#state.wallets).map((w) => w.account);
  }

  async getAccount(id: string): Promise<KeyringAccount> {
    const wallet = this.#state.wallets[id];
    if (!wallet) throw new Error(`Account '${id}' not found`);
    return wallet.account;
  }

  /**
   * Register the user's EOA as an ERC-4337 account.
   * With EIP-7702, the EOA itself becomes the smart account.
   * No factory call, no new address.
   */
  async createAccount(
    options: Record<string, Json> = {}
  ): Promise<KeyringAccount> {
    const privateKey = options.privateKey as string | undefined;
    if (!privateKey) {
      throw new Error(
        "Private key is required. Export from MetaMask: Account Details > Show Private Key"
      );
    }

    if (privateKey.includes(" ")) {
      throw new Error(
        "Mnemonic phrases are not supported. Please export your hex private key (0x...)"
      );
    }

    const { privateKey: cleanKey, address: eoaAddress } =
      this.#getKeyPair(privateKey);

    // Check if already registered
    for (const w of Object.values(this.#state.wallets)) {
      if (w.account.address.toLowerCase() === eoaAddress.toLowerCase()) {
        return w.account;
      }
    }

    const scope = `eip155:${SEPOLIA_CHAIN_ID}`;

    const account: KeyringAccount = {
      id: uuid(),
      options: {},
      address: toChecksumAddress(eoaAddress),
      scopes: [scope],
      methods: [
        EthMethod.PrepareUserOperation,
        EthMethod.PatchUserOperation,
        EthMethod.SignUserOperation,
      ],
      type: EthAccountType.Erc4337,
    };

    this.#state.wallets[account.id] = {
      account,
      privateKey: cleanKey,
      isDelegated: false,
    };

    await this.#emitEvent(KeyringEvent.AccountCreated, { account });
    await this.#saveState();
    return account;
  }

  async filterAccountChains(
    _id: string,
    chains: string[]
  ): Promise<string[]> {
    return chains.filter((c) => c.startsWith("eip155:"));
  }

  async updateAccount(account: KeyringAccount): Promise<void> {
    const wallet = this.#state.wallets[account.id];
    if (!wallet) throw new Error(`Account '${account.id}' not found`);
    const updated = { ...wallet.account, ...account, address: wallet.account.address };
    await this.#emitEvent(KeyringEvent.AccountUpdated, { account: updated });
    wallet.account = updated;
    await this.#saveState();
  }

  async deleteAccount(id: string): Promise<void> {
    await this.#emitEvent(KeyringEvent.AccountDeleted, { id });
    delete this.#state.wallets[id];
    await this.#saveState();
  }

  async submitRequest(request: KeyringRequest): Promise<SubmitRequestResponse> {
    // For now, return unsupported — actual transactions go through ton_sendUserOp
    throw new Error(
      "Use ton_sendUserOp via wallet_invokeSnap for transactions. " +
      "MetaMask's built-in UserOp flow does not support EIP-7702."
    );
  }

  // ─── Direct UserOp Submission (EIP-7702) ───

  /**
   * Build, sign, and submit a UserOperation with EIP-7702 delegation.
   * This bypasses MetaMask's UserOp flow and submits directly to the bundler.
   *
   * @param calls - Array of {to, value, data} calls to execute
   * @returns UserOperation hash
   */
  async sendUserOp(calls: Call[]): Promise<string> {
    const bundlerUrl = this.#state.config.bundlerUrl;
    if (!bundlerUrl) {
      throw new Error("Bundler URL not configured. Call ton_setConfig first.");
    }

    // Find the first registered wallet
    const wallets = Object.values(this.#state.wallets);
    if (wallets.length === 0) {
      throw new Error("No account registered. Call keyring_createAccount first.");
    }
    const wallet = wallets[0]!;
    const sender = wallet.account.address;

    // 1. Check if EOA is already delegated
    const code = (await ethereum.request({
      method: "eth_getCode",
      params: [sender, "latest"],
    })) as string;
    const isDelegated = code !== "0x" && code !== "0x0" && code.length > 4;

    // 2. Get nonce from EntryPoint
    let nonce = "0x0";
    if (isDelegated) {
      const nonceCallData =
        "0x" +
        SELECTORS.GET_NONCE +
        encodeAddress(sender) +
        encodeUint256("0x0"); // key = 0

      const nonceResult = (await ethereum.request({
        method: "eth_call",
        params: [
          { to: CONTRACTS.ENTRY_POINT_V08, data: nonceCallData },
          "latest",
        ],
      })) as string;
      nonce = "0x" + BigInt(nonceResult).toString(16);
    }

    // 3. Build callData: prepend TON approve for paymaster + user calls
    const approveData = encodeApprove(CONTRACTS.TON_PAYMASTER, MAX_UINT256);
    const allCalls: Array<{ target: string; value: string; data: string }> = [
      { target: CONTRACTS.TON, value: "0x0", data: approveData },
      ...calls.map((c) => ({
        target: c.to,
        value: c.value ?? "0x0",
        data: c.data ?? "0x",
      })),
    ];

    let callData: string;
    if (allCalls.length === 1) {
      callData = encodeExecute(
        allCalls[0]!.target,
        allCalls[0]!.value,
        allCalls[0]!.data
      );
    } else {
      callData = encodeExecuteBatch(allCalls);
    }

    // 4. Sign EIP-7702 authorization if not yet delegated
    let eip7702Auth: Eip7702Auth | undefined;
    if (!isDelegated) {
      // Get EOA's current nonce for the authorization
      const eoaNonce = (await ethereum.request({
        method: "eth_getTransactionCount",
        params: [sender, "latest"],
      })) as string;

      eip7702Auth = signEip7702Authorization(
        BigInt(SEPOLIA_CHAIN_ID),
        CONTRACTS.SIMPLE_7702_ACCOUNT,
        BigInt(eoaNonce),
        wallet.privateKey
      );
    }

    // 5. Get gas prices
    const gasPrices = await getUserOperationGasPrice(bundlerUrl);
    const { maxFeePerGas, maxPriorityFeePerGas } = gasPrices.fast;

    // 6. Build initial UserOp for gas estimation
    const userOp: Record<string, string> = {
      sender,
      nonce,
      callData,
      maxFeePerGas,
      maxPriorityFeePerGas,
      signature: DUMMY_SIGNATURE,
      // Paymaster fields (EntryPoint v0.8 format)
      paymaster: CONTRACTS.TON_PAYMASTER,
      paymasterData: "0x",
      paymasterVerificationGasLimit: PAYMASTER_VERIFICATION_GAS_LIMIT,
      paymasterPostOpGasLimit: PAYMASTER_POST_OP_GAS_LIMIT,
    };

    // 7. Estimate gas
    const gasEstimate = await estimateUserOperationGas(
      bundlerUrl,
      userOp,
      CONTRACTS.ENTRY_POINT_V08,
      eip7702Auth
    );

    // Update gas values
    userOp.callGasLimit = gasEstimate.callGasLimit;
    userOp.verificationGasLimit = gasEstimate.verificationGasLimit;
    userOp.preVerificationGas = gasEstimate.preVerificationGas;
    if (gasEstimate.paymasterVerificationGasLimit) {
      userOp.paymasterVerificationGasLimit =
        gasEstimate.paymasterVerificationGasLimit;
    }
    if (gasEstimate.paymasterPostOpGasLimit) {
      userOp.paymasterPostOpGasLimit = gasEstimate.paymasterPostOpGasLimit;
    }

    // 8. Compute UserOp hash and sign
    const userOpHash = computeUserOpHash(
      userOp,
      CONTRACTS.ENTRY_POINT_V08,
      BigInt(SEPOLIA_CHAIN_ID)
    );

    const pkBytes = hexToUint8(wallet.privateKey);
    const hashBytes = hexToUint8(userOpHash);
    const sig = ecsign(hashBytes, pkBytes);
    const v = Number(sig.v) < 27 ? Number(sig.v) + 27 : Number(sig.v);
    userOp.signature =
      "0x" + hexStr(sig.r) + hexStr(sig.s) + v.toString(16).padStart(2, "0");

    // 9. Submit to bundler
    const opHash = await sendUserOperation(
      bundlerUrl,
      userOp,
      CONTRACTS.ENTRY_POINT_V08,
      eip7702Auth
    );

    // 10. Mark as delegated
    if (!isDelegated) {
      wallet.isDelegated = true;
      await this.#saveState();
    }

    return opHash;
  }

  // ─── Helpers ───

  #getKeyPair(privateKey: string): {
    privateKey: string;
    address: string;
  } {
    const clean = privateKey.startsWith("0x") ? privateKey.slice(2) : privateKey;
    const bytes = hexToUint8(clean);
    if (!isValidPrivate(bytes)) {
      throw new Error("Invalid private key");
    }
    const address = toChecksumAddress(
      Address.fromPrivateKey(bytes).toString()
    );
    return { privateKey: clean, address };
  }

  async #saveState(): Promise<void> {
    await saveState(this.#state);
  }

  async #emitEvent(
    event: KeyringEvent,
    data: Record<string, Json>
  ): Promise<void> {
    await emitSnapKeyringEvent(snap, event, data);
  }
}
