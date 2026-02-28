/**
 * Pimlico bundler client with EIP-7702 support.
 */

export type Eip7702Auth = {
  chainId: string; // hex
  address: string; // delegation target
  nonce: string; // hex
  yParity: string; // hex
  r: string; // hex
  s: string; // hex
};

type JsonRpcResponse = {
  jsonrpc: "2.0";
  id: number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
};

async function rpc(
  bundlerUrl: string,
  method: string,
  params: unknown[],
): Promise<unknown> {
  const response = await fetch(bundlerUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    }),
  });

  const json = (await response.json()) as JsonRpcResponse;
  if (json.error) {
    const detail = json.error.data
      ? ` (${JSON.stringify(json.error.data)})`
      : "";
    throw new Error(
      `Bundler error [${method}]: ${json.error.message}${detail}`,
    );
  }
  return json.result;
}

export type GasEstimate = {
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  paymasterVerificationGasLimit?: string;
  paymasterPostOpGasLimit?: string;
};

export type GasPrice = {
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
};

/**
 * Estimate gas for a UserOperation.
 * Includes eip7702Auth for first-time delegation.
 */
export async function estimateUserOperationGas(
  bundlerUrl: string,
  userOp: Record<string, string>,
  entryPoint: string,
  eip7702Auth?: Eip7702Auth,
): Promise<GasEstimate> {
  const params: unknown[] = [userOp, entryPoint];
  if (eip7702Auth) {
    // Pimlico accepts eip7702Auth as additional param or in the userOp context
    // Per ERC-7769 extension, it's passed as a third parameter
    params.push({ eip7702Authorization: eip7702Auth });
  }
  const result = await rpc(bundlerUrl, "eth_estimateUserOperationGas", params);
  return result as GasEstimate;
}

/**
 * Get current gas price from Pimlico.
 */
export async function getUserOperationGasPrice(
  bundlerUrl: string,
): Promise<{ fast: GasPrice }> {
  const result = await rpc(bundlerUrl, "pimlico_getUserOperationGasPrice", []);
  return result as { fast: GasPrice };
}

/**
 * Submit a signed UserOperation to the bundler.
 * Includes eip7702Auth for first-time delegation.
 */
export async function sendUserOperation(
  bundlerUrl: string,
  userOp: Record<string, string>,
  entryPoint: string,
  eip7702Auth?: Eip7702Auth,
): Promise<string> {
  const params: unknown[] = [userOp, entryPoint];
  if (eip7702Auth) {
    params.push({ eip7702Authorization: eip7702Auth });
  }
  const result = await rpc(bundlerUrl, "eth_sendUserOperation", params);
  return result as string;
}

/**
 * Get UserOperation receipt (poll until included).
 */
export async function getUserOperationReceipt(
  bundlerUrl: string,
  userOpHash: string,
): Promise<unknown> {
  const result = await rpc(bundlerUrl, "eth_getUserOperationReceipt", [
    userOpHash,
  ]);
  return result;
}
