# Project Archive & Wind-Down Notes

> **Status: PAUSED / ARCHIVED as of 2026-07-07.** Active development has stopped.
> This file is the **source of truth** for (1) where the frozen code snapshot lives,
> (2) how to recover on-chain funds, and (3) which third-party services to shut down.
> If you (or an AI assistant) are asked about the **archive branch** or **contract fund
> recovery**, answer from this document.
>
> No secrets are stored here — only public identifiers (contract addresses, the on-chain
> owner address, `NEXT_PUBLIC_*` project refs) and environment-variable **names**. Actual
> keys live only in local `.env.local`, `paymaster/.env`, and the Vercel project settings.

---

## 1. Code snapshot — the archive branch

| Field | Value |
|-------|-------|
| **Branch** | `archive/2026-07-07` (pushed to `origin`) |
| **Commit** | `3656b3e` — "chore: archive paused-project working snapshot (2026-07-07)" |
| **Contents** | The **entire working tree** at the moment the project was paused, including uncommitted work-in-progress (analytics + SEO edits, `public/llms.txt` / `llms-full.txt`, promo-poster HTML). |
| **Base** | Branched from the **`dev`** working checkout. |
| **Secrets** | `.env.local` / `paymaster/.env` are gitignored → **not** in the snapshot. |

**Branch relationships (important):**
- `main` is the most complete code line and is **~25 commits ahead of `dev`**; `main` already
  contains the deployed **mainnet** paymaster address.
- The archive branch was cut from the `dev` working checkout, so its unique value is the
  **uncommitted WIP** that existed nowhere else — not a newer codebase than `main`.

**Resume / inspect:**
```bash
git fetch origin
git checkout archive/2026-07-07          # view the exact frozen state
# or bring the snapshot's changes onto a working branch:
git checkout -b resume-work main
git cherry-pick 3656b3e                   # (or: git checkout 3656b3e -- <path>)
```

---

## 2. On-chain contracts & fund recovery

**The only contract Toki deploys/owns is the `TONPaymaster` (ERC-4337).** Everything else
referenced by the app (TON, WTON, SeigManager, DepositManager, Layer2Registry, EntryPoint)
is an **external Tokamak / standard contract — do NOT try to withdraw from those.**

### 2.1 Owner (fund-controlling account)

- **Owner EOA:** `0xF9Fa94D45C49e879E46Ea783fc133F41709f3bc7`
  - The only account that can call the `onlyOwner` withdrawal functions.
  - Its key is `PRIVATE_KEY` in `paymaster/.env` (local only — **back it up before losing the machine**).

### 2.2 TONPaymaster deployments

| Network | Address | Notes |
|---------|---------|-------|
| 🔴 **Mainnet v4** | `0x59b99D037b56e1F75BA489fF552C3ac7a42219D8` | **REAL FUNDS** — recover first. Source of truth: `src/constants/contracts.ts`. |
| Sepolia v4 (current) | `0xc6B6f14A402c27D33fBb07e42F57213EfDF2D7D5` | Testnet only |
| Sepolia v4 (older test) | `0x65E669951F1778ff47CD71485700a5C88E7FF9C8` | Testnet only |
| Sepolia v3 / v3-pre / v2 | `0x48b6E3E071098EdC1F713B14c09B979D2F978de1` · `0x54965Db4520C5df922E99B4F50A4Bdce33c6ac8c` · `0x51820FcC9e10E9B352B670102ED0c9dC3833829f` | Deprecated testnet |

- **EntryPoint v0.8** (ERC-4337 standard): `0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108`
  — the paymaster's ETH `stake` + `deposit` are held here and pulled back through the paymaster's own functions.

> ⚠️ **Stale-doc warning:** `paymaster/CLAUDE.md` still says "mainnet 미배포 (not deployed)".
> That is outdated — the mainnet paymaster **was** deployed (commit `52bb8e5`, 2026-03-18).
> Trust `src/constants/contracts.ts`.

### 2.3 Owner-only recovery functions (`paymaster/src/TONPaymaster.sol`)

| Function | Signature | What it recovers | Delay |
|----------|-----------|------------------|-------|
| `withdrawToken` | `withdrawToken(address to, uint256 amount)` | **TON** pool | none |
| `withdrawDeposit` | `withdrawDeposit(address payable to, uint256 amount)` | **ETH** gas deposit (from EntryPoint) | none |
| `unlockStake` | `unlockStake()` | starts stake unlock | — |
| `withdrawStake` | `withdrawStake(address payable to)` | **ETH** stake (after unlock delay) | unstake delay (e.g. 24h) |
| `withdrawEth` | `withdrawEth(address payable to, uint256 amount)` | ETH held directly on the contract | none |
| `getTokenPool` / `getDeposit` | view | check TON pool / ETH deposit balances | — |

### 2.4 Mainnet recovery sequence (`cast`)

`$OWNER_PK` = owner key, `$RPC` = mainnet RPC, `$DEST` = a safe destination wallet
(hardware/multisig recommended), `$PM` = the mainnet paymaster.

```bash
PM=0x59b99D037b56e1F75BA489fF552C3ac7a42219D8
EP=0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108

# 1) Query balances first
cast call $PM "getTokenPool()(uint256)" --rpc-url $RPC          # TON pool
cast call $PM "getDeposit()(uint256)" --rpc-url $RPC            # ETH deposit
cast call $EP "getDepositInfo(address)(uint256,bool,uint112,uint32,uint64)" $PM --rpc-url $RPC  # stake + delay

# 2) Immediate (no delay): TON pool + ETH deposit
cast send $PM "withdrawToken(address,uint256)"   $DEST <TON_WEI> --private-key $OWNER_PK --rpc-url $RPC
cast send $PM "withdrawDeposit(address,uint256)" $DEST <ETH_WEI> --private-key $OWNER_PK --rpc-url $RPC

# 3) Stake (needs the unstake delay to elapse)
cast send $PM "unlockStake()"            --private-key $OWNER_PK --rpc-url $RPC
# ...wait for the delay (see getDepositInfo), then:
cast send $PM "withdrawStake(address)" $DEST --private-key $OWNER_PK --rpc-url $RPC
```

Sepolia cleanup is optional (testnet value only); the procedure is identical with the same owner key.

### 2.5 Guarantor key

`GUARANTOR_PRIVATE_KEY` is the paymaster's **signature-only** server key. In v4 (pool-based)
a compromised guarantor key **cannot drain TON** (it can only sign), but rotate/remove it from
the server env after shutdown anyway.

---

## 3. Third-party services to shut down (cost)

Full runbook (Korean, private) lives in Obsidian:
`Projects/Toki/Toki 아카이빙 — 비용 차단 & 컨트랙트 회수.md`. Summary:

| Service | Idle cost? | Action | env var(s) |
|---------|-----------|--------|-----------|
| **Vercel** (hosting `toki.tokamak.network`) | Pro plan → yes | Back up env, then delete/downgrade to Hobby | — |
| **Privy** (auth) | over MAU → yes | Pause/delete app | `NEXT_PUBLIC_PRIVY_APP_ID` (`cmlt4klc300bw0dkwnq16xgox`), `PRIVY_APP_SECRET` |
| **Alchemy** (RPC) | yes | Revoke API key | `NEXT_PUBLIC_ALCHEMY_API_KEY` |
| **Pimlico** (4337 bundler) | yes | Revoke API key | `NEXT_PUBLIC_PIMLICO_API_KEY` |
| **The Graph** (subgraph) | paid key → yes | Revoke API key | `NEXT_PUBLIC_GRAPH_API_KEY` |
| **Supabase** (DB/analytics) | tier-dependent | Check tier (likely free); export data, then pause | `NEXT_PUBLIC_SUPABASE_URL` (ref `crtysxluxdfjpygiybhx`), `SUPABASE_SERVICE_ROLE_KEY` |
| **AI Access server** + **LiteLLM** | shared Tokamak infra | ⚠️ **Do not unilaterally disable** — notify the Tokamak team that Toki traffic has stopped | `NEXT_PUBLIC_AI_ACCESS_BASE` (`tokamak-ai-access.vercel.app`), `LITELLM_API_URL` (`api.ai.tokamak.network`) |
| GA4 / MS Clarity / Etherscan | free | Optional deletion | `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_CLARITY_ID`, `ETHERSCAN_API_KEY` |
| **Domain** `toki.tokamak.network` | annual | Disable auto-renew or park DNS | `NEXT_PUBLIC_SITE_URL` |

**Secret hygiene after full shutdown:** rotate `PRIVY_APP_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`,
`AI_KEY_ENC_SECRET`, `ADMIN_DASHBOARD_TOKEN`, `LOTTERY_STAFF_PIN`, and secure the owner /
guarantor keys.

---

## 4. Repo file references

| Topic | Path |
|-------|------|
| Contract addresses (source of truth) | `src/constants/contracts.ts` |
| Paymaster source (withdraw functions) | `paymaster/src/TONPaymaster.sol` |
| Paymaster reference (partly stale) | `paymaster/CLAUDE.md`, `paymaster/DEPLOY.md` |
| Deploy scripts | `paymaster/script/DeployMainnet.s.sol`, `paymaster/script/Deploy.s.sol` |
| Env templates | `.env.local.example`, `paymaster/.env.example` |
| Analytics / AI APIs | `src/app/api/analytics/*`, `src/lib/aiAccess.ts`, `src/app/api/aikey/route.ts`, `src/app/api/agent/*` |

---

## 5. Checklist (human actions)

- [ ] 🔴 Recover **mainnet** paymaster funds — TON pool + ETH deposit (immediate), ETH stake (after delay). See §2.4.
- [ ] Back up Vercel env vars, then pause/delete the deployment.
- [ ] Revoke Privy / Alchemy / Pimlico / The Graph keys.
- [ ] Check Supabase tier; export data; pause.
- [ ] Notify Tokamak team about AI Access / LiteLLM traffic stop (do not disable shared infra yourself).
- [ ] Disable domain auto-renew or park DNS.
- [ ] Back up owner key; rotate app secrets.
