# Mainnet Deployment Checklist & Security Review

> Reviewed: 2026-03-12
> Reference for mainnet (Ethereum L1) deployment of Toki staking with TONPaymaster gasless flow.

---

## Paymaster Fund Management

### ETH Deposit & Withdrawal

TONPaymaster contract has owner-only functions for fund management:

| Function | Target | Description |
|----------|--------|-------------|
| `deposit()` | EntryPoint | Deposit ETH for gas sponsoring |
| `withdrawDeposit(to, amount)` | EntryPoint deposits | Withdraw deposited ETH to admin EOA |
| `withdrawToken(to, amount)` | Collected TON | Withdraw TON tokens received from users |
| `withdrawEth(to, amount)` | Contract ETH | Withdraw any ETH sent directly to contract |
| `unlockStake()` / `withdrawStake(to)` | EntryPoint stake | Unlock and withdraw staked ETH (1-day delay) |

All functions are `onlyOwner` — callable only by the deployer EOA.

### Monitoring

- Check deposit balance: `getDeposit()` view function on paymaster
- Replenish when low: call `deposit()` with new ETH
- Adjust pricing: `setPrice(tokenPerEth)` for manual mode, or `setUseOracle(true/false)` for TWAP
- Adjust markup: `setMarkup(bps)` (default 15000 = 150%)

---

## Security Issues — Fix Before Mainnet

### CRITICAL

#### 1. Session Key Private Key Stored in Plaintext

**Location:** `src/hooks/useSessionKey.ts:237`

Session key private key is stored in localStorage without encryption. XSS or malicious browser extension could steal it.

```typescript
// CURRENT (vulnerable)
localStorage.setItem(SESSION_KEY_STORAGE, JSON.stringify(storedKey));

// REQUIRED: Encrypt with Web Crypto API before storing
```

**Fix:**
- Encrypt private key using Web Crypto API with user-derived key
- Consider sessionStorage instead of localStorage
- Shorten expiration (24h instead of 7 days)

#### 2. Unlimited Token Approval (maxUint256)

**Location:** `src/hooks/useEip7702.ts:122,234,362` and `src/hooks/useSessionKey.ts:392`

Grants unlimited TON approval to paymaster. If paymaster is compromised, attacker drains all user TON.

```typescript
// CURRENT (vulnerable)
args: [CONTRACTS.TON_PAYMASTER as Address, maxUint256]

// REQUIRED: Calculate and approve only estimated gas cost
```

**Fix:**
- Calculate gas estimate per transaction
- Approve only `estimatedGas * tokenPerEth * markup`

### HIGH

#### 3. Mainnet Paymaster Address Not Set

**Location:** `src/constants/contracts.ts:17`

`TON_PAYMASTER: ""` is empty for mainnet. Must deploy and set before launch.

**Fix:**
- Run `paymaster/script/DeployMainnet.s.sol`
- Update `MAINNET_CONTRACTS.TON_PAYMASTER` with deployed address
- Add runtime validation that address is non-empty

#### 4. Paymaster API Has No Auth/Rate Limiting

**Location:** `src/app/api/paymaster/route.ts`

The `/api/paymaster` endpoint accepts any request without rate limiting, origin validation, or signature verification. Attackers can drain deposited ETH.

**Fix:**
- Add rate limiting per IP/user
- Validate UserOperation parameters
- Implement CORS restrictions
- Add signature-based auth for paymaster requests

#### 5. Vulnerable Dependencies

Known CVEs in `glob`, `hono`, `minimatch`.

**Fix:**
```bash
npm audit fix
```

#### 6. Private Key Export Phishing Risk

**Location:** `src/components/onboarding/OnboardingQuest.tsx:562`

Onboarding guides users to export private key via `exportWallet()`. Phishing clones could intercept.

**Fix:**
- Add prominent security warnings before export
- Add user acknowledgment step

### MEDIUM

#### 7. Pimlico API Key Client Exposure

**Location:** `src/hooks/useEip7702.ts:34-36`

`NEXT_PUBLIC_PIMLICO_API_KEY` is in client-side code. Can be abused for billing attacks.

**Fix:**
- Implement server-side proxy for bundler requests
- Set rate limits on Pimlico dashboard

#### 8. No Slippage/Deadline on Staking TX

**Location:** `src/components/staking/StakingScreen.tsx:262-290`

`approveAndCall` sent without deadline or slippage protection.

**Fix:**
- Add transaction deadline if supported by contracts
- Document expected behavior for users

#### 9. Session Key Delegation Scope Too Broad

**Location:** `src/hooks/useSessionKey.ts:240-253`

Delegates both `approve` and `approveAndCall`. Standalone `approve` can set arbitrary spenders.

**Fix:**
- Remove standalone `approve` from delegation scope, or
- Add caveats to restrict spender addresses

### LOW

#### 10. Console Logging Sensitive Info

**Location:** `src/hooks/useEip7702.ts:387,395,403`

TX details logged to console in production.

**Fix:** Remove or gate behind `NODE_ENV !== "production"`.

#### 11. No HTTPS Enforcement

No runtime check for HTTPS. Wallet ops over HTTP would be catastrophic.

**Fix:** Add HTTPS check in production.

#### 12. localStorage Not Cleared on Logout

Session key persists after Privy logout.

**Fix:** Clear session key storage on Privy logout event.

---

## Deployment Steps

### 1. Deploy TONPaymaster to Mainnet

```bash
cd paymaster
forge script script/DeployMainnet.s.sol --rpc-url $ETH_RPC --broadcast --verify
```

This will:
- Deploy TONPaymaster with Uniswap V3 TWAP oracle
- Stake 0.1 ETH on EntryPoint (1-day unstake delay)
- Deposit 1 ETH for gas prepayment
- Configure TWAP oracle (WTON/WETH pool: `0xC29271E3a68A7647Fd1399298Ef18FeCA3879F59`, 30-min window)

### 2. Update Contract Address

```typescript
// src/constants/contracts.ts
const MAINNET_CONTRACTS = {
  TON_PAYMASTER: "0x...", // ← deployed address
};
```

### 3. Configure Oracle (if using TWAP)

```solidity
paymaster.setOracleConfig(wtonWethPool, weth, wton, 1800); // 30-min TWAP
paymaster.setUseOracle(true);
```

Or manual pricing:
```solidity
paymaster.setUseOracle(false);
paymaster.setPrice(2500e18); // 2500 TON per ETH
```

### 4. Pre-Launch Checklist

```
[ ] TONPaymaster deployed & verified on Etherscan
[ ] EntryPoint ETH deposited (monitor with getDeposit())
[ ] contracts.ts mainnet address updated
[ ] TWAP oracle or manual price configured
[ ] maxUint256 approve → calculated amount
[ ] Session key encryption implemented
[ ] /api/paymaster rate limiting added
[ ] npm audit clean
[ ] console.log removed from hooks
[ ] Deployer EOA secured (multisig or timelock recommended)
[ ] Test full staking flow on mainnet fork
[ ] Monitor Pimlico API usage limits
```

---

## Architecture Reference

See also:
- `docs/gasless-architecture.md` — Full technical flow of gasless staking
- `paymaster/src/TONPaymaster.sol` — Paymaster contract source
- `paymaster/script/DeployMainnet.s.sol` — Mainnet deployment script
