# Ttoni

**TON Staking Made Easy** — Stake your TON with one click.

Ttoni simplifies Tokamak Network staking for exchange holders. No MetaMask, no ETH gas fees, no WTON complexity. Just connect and earn ~35% APR seigniorage rewards.

## Problem

Staking TON currently requires **8-15 steps**: installing MetaMask, managing seed phrases, registering wallets on exchanges (Travel Rule), acquiring ETH for gas, understanding WTON wrapping (27 decimals), choosing among 10 operators, and navigating deprecated UIs.

## Solution

Ttoni reduces this to **3 steps**:

1. **Login** — Sign in with Kakao/Google. Wallet created automatically.
2. **Transfer** — Send TON from your exchange to your Ttoni address.
3. **Stake** — One button. Gas paid in TON via EIP-7702 + Paymaster.

## Architecture

```
User (Social Login)
  → Privy SDK (EOA creation)
  → EIP-7702 (EOA → Smart Account delegation)
  → TON Paymaster (gas fees in TON, not ETH)
  → Tokamak Contracts (TON → WTON → DepositManager → SeigManager)
```

### Key Design Decisions

- **L1-only**: Staking contracts live on Ethereum L1. No L2 bridge needed.
- **EIP-7702**: EOA stays exchange-compatible (Travel Rule) while gaining Smart Account capabilities.
- **TON Paymaster**: Users never need ETH. Gas fees are deducted from their TON balance.
- **Auto operator selection**: Best operator chosen automatically based on commission rate and activity.
- **Compound seigniorage**: No restaking needed. Rewards compound automatically via coinage tokens.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Auth | Privy SDK (Kakao, Google OAuth) |
| Web3 | viem (EIP-7702 + UserOperation signing) |
| Bundler | Pimlico (EntryPoint v0.8) |
| Paymaster | Custom TonPaymaster (TON → ETH swap) |
| Contracts | Tokamak Network (TON, WTON, SeigManager, DepositManager) |

## Contracts

### Existing (no deployment needed)

| Contract | Address |
|----------|---------|
| EntryPoint v0.8 | `0x4337084d9e255ff0702461cf8895ce9e3b5ff108` |
| TON | `0x2be5e8c109e2197D077D13A82dAead6a9b3433C5` |
| WTON | `0xc4A11aaf6ea915Ed7Ac194161d2fC9384F15bff2` |
| SeigManager | `0x0b55a0f463b6defb81c6063973763951712d0e5f` |
| DepositManager | `0x0b58ca72b12f01fc05f8f252e226f3e2089bd00e` |

### New (to be deployed)

| Contract | Purpose |
|----------|---------|
| TonPaymaster | Accept TON as gas payment, swap to ETH internally |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
  app/              # Next.js App Router pages
  components/
    landing/        # Landing page components
    layout/         # Header, Footer
    ui/             # Reusable UI components
  constants/        # Contract addresses, ABIs
  hooks/            # React hooks
  lib/              # Utilities
```

## License

MIT
