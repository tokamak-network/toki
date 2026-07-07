<div align="center">

<img src="public/toki-promo-mag.png" width="460" alt="Toki — stake TON, get unlimited AI"/>

# TOKI

**Stake TON → get unlimited AI.**

<sub>A mascot mini-wallet & hub for the Tokamak Network ecosystem — Ethereum L1, non-custodial, gasless.</sub>

<p>
<a href="#-unlimited-ai-by-staking"><img src="https://img.shields.io/badge/Unlimited%20AI%20by%20staking-a855f7?style=for-the-badge" alt="Unlimited AI"/></a>
<a href="#connect-your-agent-mcp"><img src="https://img.shields.io/badge/MCP%20server-22d3ee?style=for-the-badge" alt="MCP"/></a>
<a href="#-features"><img src="https://img.shields.io/badge/Features-22d3ee?style=for-the-badge" alt="Features"/></a>
<a href="#-getting-started"><img src="https://img.shields.io/badge/Quick%20Start-22d3ee?style=for-the-badge" alt="Quick Start"/></a>
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

> [!WARNING]
> **This project is PAUSED / ARCHIVED (2026-07-07).** Active development has stopped.
> A full working-tree snapshot lives on the **`archive/2026-07-07`** branch. For archive
> details, the third-party **cost-shutdown** checklist, and on-chain **fund-recovery**
> (TONPaymaster) procedures, see **[`docs/ARCHIVE.md`](docs/ARCHIVE.md)**.

---

<div align="center">

**Launch trailer**

<video src="https://github.com/user-attachments/assets/01961447-7667-4947-8772-059747daa2cc" width="640" controls playsinline></video>

<sub><a href="https://www.youtube.com/watch?v=Kw-KYhbWMmA">▶ Watch on YouTube</a> if the inline player doesn't load.</sub>

</div>

---

## <img src="public/characters/toki-explain.png" width="36" align="center"/> What is Toki?

Toki turns **staking into access**. Stake TON on Tokamak Network (non-custodial, Ethereum L1, gasless) and unlock the ecosystem — led by the headline perk: **an unlimited AI key.**

- 🤖 **Stake 100 TON → unlimited AI.** Get an OpenAI-compatible LLM key (Qwen / DeepSeek / Gemma) with a generous daily budget (~1M tokens/day) you can drop into **Claude Code, Cursor, or any agent** — plus the Toki **MCP server**. You keep your TON (it earns yield); inference runs on a self-hosted Tokamak AI server, not your wallet.
- 💸 **Easiest staking UX.** Sign in with Google *or* connect MetaMask, send TON, click once. Gas is paid in TON via **EIP-7702 + Paymaster** — no ETH, no WTON wrapping, no operator research.
- 🪙 **Real, non-custodial yield.** Tokamak distributes **3.92 WTON/block** of seigniorage to stakers; APR is computed live from on-chain SeigManager data. Your TON stays yours, withdrawable after the protocol's unstaking period.
- 🎮 **Mascot hub.** Wallet, private transfer (zk), AI access, achievement cards, ecosystem explore — one cozy anime-mascot surface (the `/dashboard` lobby).

---

## <img src="public/characters/toki-proud.png" width="36" align="center"/> Unlimited AI by staking

<img src="public/characters/menu-ai.png" width="150" align="right" alt="Toki AI familiar"/>

The wedge: **stake 100 TON, get an unlimited\* AI key.** No subscription, no per-token bill — your staked TON (which you keep, and which earns seigniorage) *is* the credential.

- **OpenAI-compatible** — point any client at `base_url` + your `sk-…` key. Models: Qwen, DeepSeek, Gemma.
- **Works in your tools** — Claude Code, Cursor, Codex, or the **Toki MCP server** (live Tokamak staking tools inside your agent).
- **Why it's free** — inference runs on a **self-hosted** Tokamak AI server (zero marginal cost), funded as a growth wedge + seigniorage. Unstake any time → access ends.

<sub>\*Unlimited within a generous daily budget (~1M tokens/day).</sub>

### Connect your agent (MCP)

```bash
# Hosted — no install. Live Tokamak staking tools in Claude Code:
claude mcp add --transport http toki https://toki.tokamak.network/api/mcp
```

Tools: `toki_get_apr`, `toki_list_operators`, `toki_staking_status`. Prefer a local stdio server? See [`mcp-server/`](mcp-server/README.md) (`@toki/mcp`).

---

## <img src="public/characters/toki-cheer.png" width="36" align="center"/> One mascot, the whole ecosystem

The `/dashboard` lobby is a gacha-style hub — every Tokamak service is a tile, fronted by Toki and your live on-chain balances:

<div align="center">
<img src="public/screenshot-dashboard.png" width="780" alt="Toki dashboard — gacha-lobby hub with staking, AI access, wallet, private transfer and more"/>
</div>

---

## <img src="public/characters/toki-excited.png" width="36" align="center"/> Features

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
<img src="public/cards/onboarding-wallet.png" width="92"/><br/>
<b>Quest 1</b><br/>
<sub>Create Account</sub>
</td>
<td align="center" width="20%">
<img src="public/cards/onboarding-bridge.png" width="92"/><br/>
<b>Quest 2</b><br/>
<sub>Bridge to MetaMask</sub>
</td>
<td align="center" width="20%">
<img src="public/cards/onboarding-exchange.png" width="92"/><br/>
<b>Quest 3</b><br/>
<sub>Exchange Verification</sub>
</td>
<td align="center" width="20%">
<img src="public/cards/onboarding-ton.png" width="92"/><br/>
<b>Quest 4</b><br/>
<sub>Receive TON</sub>
</td>
<td align="center" width="20%">
<img src="public/cards/stake-gasless.png" width="92"/><br/>
<b>Quest 5</b><br/>
<sub>First Gasless Stake</sub>
</td>
</tr>
</table>

Each quest features dialogue sequences, mood-based character expressions, and XP rewards.

### Bilingual (i18n)

Full Korean/English support via custom `LanguageProvider` with locale files in `src/locales/`.

---

## <img src="public/characters/toki-proud.png" width="36" align="center"/> Achievement Cards

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

<img src="public/characters/toki-card-reveal.png" width="120" align="right"/>

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

## <img src="public/characters/toki-reading.png" width="36" align="center"/> Architecture

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

## <img src="public/characters/toki-wink.png" width="36" align="center"/> Getting Started

### <img src="public/toki-mini-step1.png" width="28" align="center"/> Step 1: Clone & Install

```bash
git clone https://github.com/tokamak-network/toki.git
cd toki
npm install
```

### <img src="public/toki-mini-step2.png" width="28" align="center"/> Step 2: Configure

Copy the example env and fill in your keys:

```bash
cp .env.local.example .env.local
```

Core: `NEXT_PUBLIC_PRIVY_APP_ID` (Privy), `NEXT_PUBLIC_RPC_URL` (Alchemy/Infura), `NEXT_PUBLIC_PIMLICO_API_KEY` (bundler), `NEXT_PUBLIC_NETWORK` (`mainnet` | `sepolia`).
For AI Access + analytics (server-side): `PRIVY_APP_SECRET`, `AI_KEY_ENC_SECRET`, and the Supabase keys.

<table><tr>
<td width="60"><img src="public/characters/toki-pointing.png" width="60"/></td>
<td><sub>Every var is documented inline in <code>.env.local.example</code>. Privy keys: <a href="https://dashboard.privy.io">dashboard.privy.io</a>.</sub></td>
</tr></table>

### <img src="public/toki-mini-step3.png" width="28" align="center"/> Step 3: Launch

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## <img src="public/characters/toki-determined.png" width="36" align="center"/> Project Structure

```
src/
  app/
    api/            # Routes: /api/agent (AI proxy) · /api/aikey (key vault) · /api/mcp (MCP) · ...
    ...             # App Router pages: dashboard · staking · agent · profile · lottery
  components/
    agent/          # AI Access workspace — issued key → chat + "Connect" modal (MCP/LiteLLM)
    hub/            # /dashboard gacha-lobby hub (HubLobby + MENU collage)
    landing/        # Landing (hero, profit simulator, FAQ)
    staking/        # Gasless staking screen
    onboarding/     # Visual-novel quest system
    achievements/   # Achievement toasts + card reveals
    providers/      # Privy · Language · Achievement · Web3
  constants/        # Contract addresses, ABIs
  hooks/            # useEip7702, useStakedTon
  lib/              # aiAccess · staking · leaderboard · achievements · crypto (key vault)
  locales/          # en.ts, ko.ts (i18n)
mcp-server/         # @toki/mcp — standalone MCP server exposing Tokamak staking as agent tools
supabase/migrations # ai_access_keys (key vault) · profile_scores (leaderboard) · analytics_events
```

---

## <img src="public/characters/toki-cheer.png" width="36" align="center"/> Contributing

Contributions are welcome! Please open an issue first to discuss changes.

<table><tr>
<td width="60"><img src="public/characters/toki-worried.png" width="60"/></td>
<td><sub>Never commit <code>.env</code> files or private keys to version control.</sub></td>
</tr></table>

---

## License

MIT

<div align="center">
<br/>
<img src="public/characters/toki-peace.png" width="120"/>
<br/>
<sub>Built with Tokamak Network</sub>
</div>
