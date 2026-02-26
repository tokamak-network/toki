# Gasless Staking via TONPaymaster: Technical Architecture

## Overview

ttoni enables TON token staking on the Tokamak Network **without holding any ETH**. Three technologies converge to make this possible:

| Layer | Technology | Role |
|-------|-----------|------|
| Account | EIP-7702 | Upgrades user's EOA into a smart account in-place (same address) |
| Routing | ERC-4337 | Routes transaction through Bundler -> EntryPoint -> handleOps |
| Gas Payment | TONPaymaster | Pays gas in ETH on behalf of user, collects equivalent TON in post-execution |

---

## Transaction Lifecycle

### Phase 1: UserOperation Construction (Client)

When the user clicks "Stake", the `useEip7702` hook assembles the UserOperation.

The hook **prepends** a `TON.approve(paymaster, maxUint256)` call before the user's actual staking call. This is required because TON does not support EIP-2612 `permit()`, so the paymaster needs explicit on-chain approval to pull TON in the post-execution phase.

**Final callData contains two calls (atomic batch):**

| # | Call | Purpose |
|---|------|---------|
| 1 | `TON.approve(TONPaymaster, MAX)` | Grant paymaster permission to pull TON |
| 2 | `TON.approveAndCall(WTON, amount, stakingData)` | Wrap TON -> WTON and deposit to operator |

**Paymaster data** is minimal -- just the paymaster address and empty bytes. No off-chain signature is needed because the TONPaymaster reads its exchange rate from on-chain storage.

```
paymasterAndData = [TONPaymaster address] + [0x]
```

### Phase 2: EIP-7702 Authorization (First Time Only)

If the EOA has never been upgraded, the client signs an EIP-7702 authorization:

```
signature = sign(keccak256(0x05 || rlp([chainId, Simple7702Account, nonce])))
```

This authorization is included in the UserOperation and processed atomically with the first transaction. After this:

- The EOA's **address does not change**
- The EOA gains smart account methods (`execute`, `executeBatch`, `validateUserOp`)
- All existing balances and state remain at the same address
- The account is now ERC-4337 compatible

### Phase 3: Bundler Submission

The UserOperation is sent to the Pimlico bundler, which validates, estimates gas, and bundles it into an on-chain transaction targeting the EntryPoint contract.

### Phase 4: EntryPoint.handleOps() -- Three-Phase Execution

```
+------------------------------------------------------------------+
|                     EntryPoint.handleOps()                        |
|                                                                   |
|  +------------------------------------------------------------+  |
|  |  PHASE A: Validation                                       |  |
|  |                                                            |  |
|  |  1. EntryPoint -> SmartAccount.validateUserOp()            |  |
|  |     - Verifies ECDSA signature of the EOA owner            |  |
|  |                                                            |  |
|  |  2. EntryPoint -> TONPaymaster.validatePaymasterUserOp()   |  |
|  |     - Checks: user's TON balance >= maxTokenCost            |  |
|  |     - Returns: context = encode(sender, maxTokenCost)       |  |
|  |     - Does NOT check allowance (approve hasn't run yet)     |  |
|  +------------------------------------------------------------+  |
|                              |                                    |
|                              v                                    |
|  +------------------------------------------------------------+  |
|  |  PHASE B: Execution                                        |  |
|  |                                                            |  |
|  |  EntryPoint -> SmartAccount.executeBatch()                 |  |
|  |    Call 1: TON.approve(paymaster, MAX)      <- allowance    |  |
|  |    Call 2: TON.approveAndCall(WTON, amt)    <- staking      |  |
|  |              +-- TON -> WTON wrapping                       |  |
|  |              +-- DepositManager.deposit(operator, amount)   |  |
|  +------------------------------------------------------------+  |
|                              |                                    |
|                              v                                    |
|  +------------------------------------------------------------+  |
|  |  PHASE C: Post-Execution                                   |  |
|  |                                                            |  |
|  |  EntryPoint -> TONPaymaster.postOp(actualGasCost)          |  |
|  |    1. Convert actualGasCost (ETH) -> TON                    |  |
|  |    2. token.safeTransferFrom(user -> paymaster, tokenCost)  |  |
|  |                                                            |  |
|  |  Works because Phase B granted the allowance                |  |
|  +------------------------------------------------------------+  |
|                                                                   |
+------------------------------------------------------------------+
```

---

## TONPaymaster Contract Details

### validatePaymasterUserOp()

```
Input:  userOp, maxCost
Logic:  totalMaxCost  = maxCost + (postOpGasOverhead * maxFeePerGas)
        maxTokenCost  = _ethToToken(totalMaxCost)
        REQUIRE       user's TON balance >= maxTokenCost
Output: context = encode(sender, maxTokenCost)
        validationData = 0  (valid immediately, no expiry)
```

### postOp()

```
Input:  mode, context, actualGasCost, actualUserOpFeePerGas
Logic:  totalGasCost    = actualGasCost + (postOpGasOverhead * feePerGas)
        actualTokenCost = _ethToToken(totalGasCost)
        TON.safeTransferFrom(sender -> paymaster, actualTokenCost)
```

### ETH-to-TON Conversion

```
_ethToToken(ethAmount) = ethAmount * rate * markupBps / (1e18 * 10000)
```

| Parameter | Value | Description |
|-----------|-------|-------------|
| `rate` | Manual: `2500e18` or TWAP oracle | TON per 1 ETH |
| `markupBps` | `15000` (150%) | Covers volatility risk for paymaster operator |
| `postOpGasOverhead` | `60,000` gas | Gas consumed by postOp's safeTransferFrom |

**Example**: Gas cost = 0.001 ETH -> `0.001 * 2500 * 1.5` = **3.75 TON**

### TWAP Oracle Mode

When `useOracle = true`, the rate is sourced from a Uniswap V3 WTON/WETH pool:

```
pool.observe([1800, 0])
  -> tickCumulatives over 30-minute window
  -> arithmetic mean tick
  -> sqrtPriceX96 via TickMath
  -> WTON per 1 ETH via FullMath.mulDiv
  -> / 1e9 (WTON 27 decimals -> TON 18 decimals)
```

The 30-minute TWAP window provides manipulation resistance.

---

## Wallet Paths

| Path | Wallet | 7702 Auth | Bundler | Gas Source |
|------|--------|-----------|---------|------------|
| A | Privy Embedded | `localAccount.signAuthorization()` | Pimlico + TONPaymaster | TON only |
| B | MetaMask (EIP-5792) | MetaMask DeleGator internal | `wallet_sendCalls` + ERC-7677 | TON only |
| C | MetaMask Snap | Raw RLP + keccak256 signing | Direct Pimlico submission | TON only |

---

## Fund Flow Summary

```
                BEFORE                              AFTER
+-----------------------------+    +---------------------------------+
| User    : 100 TON, 0 ETH   |    | User    : 100 - stake - ~2 TON |
| Paymaster: 1.0 ETH, 0 TON  | -> | Paymaster: ~0.999 ETH, ~2 TON  |
| Operator : 0 staked         |    | Operator : +stake (as WTON)     |
+-----------------------------+    +---------------------------------+

ETH never touches the user's wallet.
Paymaster fronts ETH to EntryPoint, recovers equivalent value in TON.
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Approve embedded in callData, not in validation | TON lacks `permit()`. Approval must execute on-chain before postOp can pull tokens. |
| Balance check only (no allowance check) in validation | The approve call hasn't executed yet at validation time. |
| 150% markup | Compensates paymaster operator for ETH price volatility, operational costs, and oracle imprecision. |
| 60,000 gas postOp overhead | Accounts for the `safeTransferFrom` gas cost in postOp itself. |
| No time-range validation (`validationData = 0`) | Simplifies flow. TWAP oracle prices at execution time mitigates stale pricing risk. |
| Minimal paymasterData (`0x`) | Exchange rate is read on-chain. No off-chain co-signer needed. |
