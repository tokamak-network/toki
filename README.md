<div align="center">

<img src="public/toki-welcome.png" width="180" alt="Toki welcomes you"/>

# TOKI

**TON Staking, Simplified.**

<p>
<a href="#-features"><img src="https://img.shields.io/badge/Features-22d3ee?style=for-the-badge" alt="Features"/></a>
<a href="#-getting-started"><img src="https://img.shields.io/badge/Quick%20Start-22d3ee?style=for-the-badge" alt="Quick Start"/></a>
<a href="#-achievement-cards"><img src="https://img.shields.io/badge/Cards-22d3ee?style=for-the-badge" alt="Achievement Cards"/></a>
</p>

<p>
<img src="https://img.shields.io/badge/Next.js_14-000?style=flat-square&logo=next.js" alt="Next.js"/>
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=fff" alt="TypeScript"/>
<img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=fff" alt="Tailwind"/>
<img src="https://img.shields.io/badge/Ethereum-3C3C3D?style=flat-square&logo=ethereum&logoColor=fff" alt="Ethereum"/>
<img src="https://img.shields.io/badge/EIP--7702-22d3ee?style=flat-square" alt="EIP-7702"/>
</p>

</div>

---

## <img src="public/toki-explain.png" width="36" align="center"/> What is Toki?

Toki is a **TON staking platform** built on Tokamak Network. It reduces the 8-15 step staking process down to **3 simple steps** — no MetaMask, no ETH gas fees, no WTON complexity.

<table><tr>
<td width="80"><img src="public/toki-thinking.png" width="80"/></td>
<td><b>The Problem</b><br/>
Staking TON currently requires installing MetaMask, managing seed phrases, registering wallets on exchanges (Travel Rule), acquiring ETH for gas, understanding WTON wrapping (27 decimals), choosing among 10+ operators, and navigating deprecated UIs.</td>
</tr></table>

<table><tr>
<td width="80"><img src="public/toki-excited.png" width="80"/></td>
<td><b>Toki's Solution</b><br/>
Sign in with Google. Send TON. Click stake. That's it. Gas is paid in TON via EIP-7702 + Paymaster.</td>
</tr></table>

---

## <img src="public/toki-excited.png" width="36" align="center"/> Features

### Gasless Staking (EIP-7702)

- **TON Paymaster** — Gas fees paid in TON, no ETH needed
- **Session Key Delegation** — Sign once, stake gaslessly for 7 days
- **Auto WTON Wrapping** — TON → WTON conversion handled automatically
- **Auto Operator Selection** — Best operator chosen by commission rate and activity

### Visual Novel Onboarding

A guided tutorial with Toki as your companion through 5 quests:

<table>
<tr>
<td align="center" width="20%">
<img src="public/toki-mini-step1.png" width="60"/><br/>
<b>Quest 1</b><br/>
<sub>Create Account</sub>
</td>
<td align="center" width="20%">
<img src="public/toki-mini-step2.png" width="60"/><br/>
<b>Quest 2</b><br/>
<sub>Bridge to MetaMask</sub>
</td>
<td align="center" width="20%">
<img src="public/toki-mini-step3.png" width="60"/><br/>
<b>Quest 3</b><br/>
<sub>Exchange Verification</sub>
</td>
<td align="center" width="20%">
<img src="public/toki-presenting.png" width="60"/><br/>
<b>Quest 4</b><br/>
<sub>Receive TON</sub>
</td>
<td align="center" width="20%">
<img src="public/toki-celebrate.png" width="60"/><br/>
<b>Quest 5</b><br/>
<sub>First Gasless Stake</sub>
</td>
</tr>
</table>

Each quest features dialogue sequences, mood-based character expressions, and XP rewards.

### Toki Character System

Toki has **17 mood expressions** that respond to context throughout the UI:

<table>
<tr>
<td align="center"><img src="public/toki-welcome.png" width="48"/><br/><sub>welcome</sub></td>
<td align="center"><img src="public/toki-explain.png" width="48"/><br/><sub>explain</sub></td>
<td align="center"><img src="public/toki-thinking.png" width="48"/><br/><sub>thinking</sub></td>
<td align="center"><img src="public/toki-excited.png" width="48"/><br/><sub>excited</sub></td>
<td align="center"><img src="public/toki-proud.png" width="48"/><br/><sub>proud</sub></td>
<td align="center"><img src="public/toki-cheer.png" width="48"/><br/><sub>cheer</sub></td>
<td align="center"><img src="public/toki-wink.png" width="48"/><br/><sub>wink</sub></td>
<td align="center"><img src="public/toki-surprised.png" width="48"/><br/><sub>surprised</sub></td>
<td align="center"><img src="public/toki-shy.png" width="48"/><br/><sub>shy</sub></td>
</tr>
<tr>
<td align="center"><img src="public/toki-determined.png" width="48"/><br/><sub>determined</sub></td>
<td align="center"><img src="public/toki-pointing.png" width="48"/><br/><sub>pointing</sub></td>
<td align="center"><img src="public/toki-reading.png" width="48"/><br/><sub>reading</sub></td>
<td align="center"><img src="public/toki-confused.png" width="48"/><br/><sub>confused</sub></td>
<td align="center"><img src="public/toki-laughing.png" width="48"/><br/><sub>laughing</sub></td>
<td align="center"><img src="public/toki-peace.png" width="48"/><br/><sub>peace</sub></td>
<td align="center"><img src="public/toki-worried.png" width="48"/><br/><sub>worried</sub></td>
<td align="center"><img src="public/toki-crying-happy.png" width="48"/><br/><sub>moved</sub></td>
<td align="center"></td>
</tr>
</table>

### Bilingual (i18n)

Full Korean/English support via custom `LanguageProvider` with locale files in `src/locales/`.

---

## <img src="public/toki-proud.png" width="36" align="center"/> Achievement Cards

Collect **19 unique cards** across **5 categories** as you progress through your staking journey.

<table>
<tr>
<td align="center" width="20%"><img src="public/card-bg-bronze.png" width="90"/><br/><b>Bronze</b><br/><sub>Common</sub></td>
<td align="center" width="20%"><img src="public/card-bg-silver.png" width="90"/><br/><b>Silver</b><br/><sub>Uncommon</sub></td>
<td align="center" width="20%"><img src="public/card-bg-gold.png" width="90"/><br/><b>Gold</b><br/><sub>Rare</sub></td>
<td align="center" width="20%"><img src="public/card-bg-platinum.png" width="90"/><br/><b>Platinum</b><br/><sub>Epic</sub></td>
<td align="center" width="20%"><img src="public/card-bg-black.png" width="90"/><br/><b>Black</b><br/><sub>Legendary</sub></td>
</tr>
</table>

<details>
<summary><b>View all 19 cards</b></summary>

<br/>

<img src="public/toki-card-reveal.png" width="120" align="right"/>

**Onboarding** (5 cards)
| Card | Trigger |
|------|---------|
| First Account | Create your first wallet |
| Bridge Master | Complete MetaMask bridge |
| Exchange Verified | Verify exchange address |
| TON Received | Receive first TON |
| Onboarding Complete | Finish all 5 quests |

**Staking** (6 cards)
| Card | Trigger |
|------|---------|
| First Stake | Stake any amount of TON |
| Staker 10 | Cumulative 10+ TON staked |
| Whale Staker | Cumulative 100+ TON staked |
| Gasless Pioneer | Use gasless staking |
| Delegation User | Use session key delegation |
| First Unstake | Complete first unstake |

**Explore** (3 cards)
| Card | Trigger |
|------|---------|
| Explorer | Visit the ecosystem page |
| Service Surfer | Click 3+ different services |
| Category Master | View all 4 categories |

**Social** (3 cards)
| Card | Trigger |
|------|---------|
| Chat Starter | Start first chat with Toki |
| Dialogue Veteran | Visit 10+ dialogue nodes |
| Free Spirit | Use free text input 3+ times |

**Special** (1 card)
| Card | Trigger |
|------|---------|
| Power User | Unlock 15+ achievements |

</details>

---

## <img src="public/toki-reading.png" width="36" align="center"/> Architecture

```
User (Social Login)
  → Privy SDK (EOA creation)
  → EIP-7702 (EOA → Smart Account delegation)
  → TON Paymaster (gas fees in TON, not ETH)
  → Tokamak Contracts (TON → WTON → DepositManager → SeigManager)
```

<details>
<summary><b>Key Design Decisions</b></summary>

<br/>

- **L1-only** — Staking contracts live on Ethereum L1. No L2 bridge needed.
- **EIP-7702** — EOA stays exchange-compatible (Travel Rule) while gaining Smart Account capabilities.
- **TON Paymaster** — Users never need ETH. Gas fees are deducted from their TON balance.
- **Auto operator selection** — Best operator chosen automatically based on commission rate and activity.
- **Compound seigniorage** — No restaking needed. Rewards compound automatically via coinage tokens.

</details>

<details>
<summary><b>Tech Stack</b></summary>

<br/>

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Auth | Privy SDK (Google OAuth) |
| Web3 | viem (EIP-7702 + UserOperation signing) |
| Bundler | Pimlico (EntryPoint v0.8) |
| Paymaster | Custom TonPaymaster (TON → ETH swap) |
| Contracts | Tokamak Network (TON, WTON, SeigManager, DepositManager) |

</details>

<details>
<summary><b>Contracts</b></summary>

<br/>

| Contract | Address |
|----------|---------|
| EntryPoint v0.8 | `0x4337084d9e255ff0702461cf8895ce9e3b5ff108` |
| TON | `0x2be5e8c109e2197D077D13A82dAead6a9b3433C5` |
| WTON | `0xc4A11aaf6ea915Ed7Ac194161d2fC9384F15bff2` |
| SeigManager | `0x0b55a0f463b6defb81c6063973763951712d0e5f` |
| DepositManager | `0x0b58ca72b12f01fc05f8f252e226f3e2089bd00e` |
| TonPaymaster | Custom (accepts TON as gas payment) |

</details>

---

## <img src="public/toki-wink.png" width="36" align="center"/> Getting Started

### <img src="public/toki-mini-step1.png" width="28" align="center"/> Step 1: Clone & Install

```bash
git clone https://github.com/tokamak-network/toki.git
cd toki
npm install
```

### <img src="public/toki-mini-step2.png" width="28" align="center"/> Step 2: Configure

Create a `.env.local` file:

```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_ENABLE_TESTNETS=true
```

<table><tr>
<td width="60"><img src="public/toki-pointing.png" width="60"/></td>
<td><sub>Get your Privy App ID from <a href="https://dashboard.privy.io">dashboard.privy.io</a> and WalletConnect Project ID from <a href="https://cloud.walletconnect.com">cloud.walletconnect.com</a></sub></td>
</tr></table>

### <img src="public/toki-mini-step3.png" width="28" align="center"/> Step 3: Launch

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## <img src="public/toki-determined.png" width="36" align="center"/> Project Structure

```
src/
  app/              # Next.js App Router pages
  components/
    landing/        # Landing page (hero, profit simulator, FAQ)
    layout/         # Header, Footer
    onboarding/     # Visual novel quest system + intro cinematic
    dashboard/      # Staking panel + wallet management
    staking/        # Staking screen (gasless flow)
    achievements/   # Achievement toast + card reveal effects
    explore/        # Ecosystem explorer
    chat/           # Toki dialogue chat (visual novel)
    providers/      # Privy, Language, Achievement, Web3 providers
    ui/             # Reusable UI components
  constants/        # Contract addresses, ABIs
  hooks/            # useEip7702, useStakingData
  locales/          # en.ts, ko.ts (i18n strings)
  lib/              # achievements, staking utils, dialogue tree
```

---

## <img src="public/toki-cheer.png" width="36" align="center"/> Contributing

Contributions are welcome! Please open an issue first to discuss changes.

<table><tr>
<td width="60"><img src="public/toki-worried.png" width="60"/></td>
<td><sub>Never commit <code>.env</code> files or private keys to version control.</sub></td>
</tr></table>

---

## License

MIT

<div align="center">
<br/>
<img src="public/toki-peace.png" width="120"/>
<br/>
<sub>Built with Tokamak Network</sub>
</div>
