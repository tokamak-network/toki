// ─── Service worker ───────────────────────────────────────────────────
// US-001: inject a MAIN-world provider bridge on request (bypasses page CSP)
//         so the ISOLATED guide can detect MetaMask + read the address.
// US-002: poll the saved address' TON balance on an alarm and notify when TON
//         arrives.

import { createPublicClient, formatUnits, http } from "viem"
import { mainnet } from "viem/chains"

import { shouldNotify } from "~shared/notify"

const ADDR_KEY = "tokiGuide:address"
const BAL_KEY = "tokiGuide:lastBalance"
const BAL_ADDR_KEY = "tokiGuide:lastBalanceAddr"
const ALARM = "toki:ton-poll"

// TON (Tokamak Network) ERC-20 on Ethereum L1, 18 decimals.
const TON = "0x2be5e8c109e2197D077D13A82dAead6a9b3433C5" as const
const RPC = "https://eth.llamarpc.com"
const ERC20_BALANCE_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const

const publicClient = createPublicClient({ chain: mainnet, transport: http(RPC) })

// Returns the raw integer balance in wei (bigint) — no precision loss.
async function readTonBalance(address: string): Promise<bigint> {
  return publicClient.readContract({
    address: TON,
    abi: ERC20_BALANCE_ABI,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
  })
}

// Poll once. `readBalance` is injectable so tests can supply a mock balance.
async function pollBalance(readBalance: (a: string) => Promise<bigint> = readTonBalance) {
  const store = await chrome.storage.local.get([ADDR_KEY, BAL_KEY, BAL_ADDR_KEY])
  const address: string | undefined = store[ADDR_KEY]
  if (!address) return

  let balance: bigint
  try {
    balance = await readBalance(address)
  } catch {
    return // RPC hiccup — try again next alarm
  }

  // Compare on the raw wei integer (stored as a string) — no float rounding.
  // Reset baseline when the address changes (don't notify on a switch).
  const sameAddr = store[BAL_ADDR_KEY] === address
  const prev: bigint | null =
    sameAddr && typeof store[BAL_KEY] === "string" ? BigInt(store[BAL_KEY]) : null

  if (shouldNotify(prev, balance)) {
    const delta = balance - (prev ?? 0n)
    chrome.notifications.create({
      type: "basic",
      iconUrl: chrome.runtime.getURL("assets/characters/toki-excited.png"),
      title: "토키: TON 도착!",
      message: `${Number(formatUnits(delta, 18)).toLocaleString("en-US", { maximumFractionDigits: 2 })} TON이 지갑에 들어왔어. 이제 스테이킹할 수 있어!`,
      priority: 2,
    })
  }

  await chrome.storage.local.set({ [BAL_KEY]: balance.toString(), [BAL_ADDR_KEY]: address })
}

function ensureAlarm() {
  // Create only if missing so frequent SW wakes don't keep resetting the period.
  chrome.alarms.get(ALARM, (a) => {
    if (!a) chrome.alarms.create(ALARM, { periodInMinutes: 2 })
  })
}

chrome.runtime.onInstalled.addListener(ensureAlarm)
chrome.runtime.onStartup.addListener(ensureAlarm)
chrome.alarms.onAlarm.addListener((a) => {
  if (a.name === ALARM) pollBalance()
})

// onInstalled/onStartup aren't guaranteed to have run on a given SW wake, so
// also ensure the alarm at top level.
ensureAlarm()

// Test hook (used by e2e to exercise the notify path with a mock balance).
;(globalThis as unknown as { __tokiPoll?: typeof pollBalance }).__tokiPoll = pollBalance

// ─── US-001: MAIN-world provider bridge injection ──────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "toki:init-bridge" && sender.tab?.id != null) {
    chrome.scripting
      .executeScript({
        target: { tabId: sender.tab.id },
        world: "MAIN",
        func: tokiInpageBridge,
        args: [String(msg.nonce ?? "")],
      })
      .then(() => sendResponse({ ok: true }))
      .catch((e) => sendResponse({ ok: false, error: String(e) }))
    return true // async response
  }
  return undefined
})

// Self-contained MAIN-world bridge. Serialized + injected into the page; must
// not reference outer scope. Talks to the ISOLATED guide via window.postMessage.
function tokiInpageBridge(nonce: string) {
  const w = window as unknown as {
    __tokiBridge?: boolean
    ethereum?: {
      request: (a: { method: string }) => Promise<unknown>
      isMetaMask?: boolean
      providers?: Array<{ request: (a: { method: string }) => Promise<unknown>; isMetaMask?: boolean }>
    }
  }
  if (w.__tokiBridge) return
  w.__tokiBridge = true

  let mm: { request: (a: { method: string }) => Promise<unknown> } | null = null
  window.addEventListener("eip6963:announceProvider", (e: Event) => {
    const detail = (e as CustomEvent).detail
    if (detail?.provider && /metamask/i.test(`${detail.info?.rdns ?? ""} ${detail.info?.name ?? ""}`)) {
      mm = detail.provider
    }
  })
  window.dispatchEvent(new Event("eip6963:requestProvider"))

  const getProvider = () => {
    if (mm) return mm
    const eth = w.ethereum
    if (eth) {
      if (Array.isArray(eth.providers)) {
        const p = eth.providers.find((x) => x.isMetaMask)
        if (p) return p
      }
      return eth
    }
    return null
  }

  window.addEventListener("message", async (ev: MessageEvent) => {
    if (ev.source !== window) return
    const m = ev.data
    // Only answer requests carrying our per-page nonce, and stamp replies with
    // it so the guide can reject forged responses.
    if (!m || m.__tokiGuide !== "req" || m.nonce !== nonce) return
    const reply = (payload: Record<string, unknown>) =>
      window.postMessage({ __tokiGuide: "res", id: m.id, nonce, ...payload }, "*")
    try {
      if (m.type === "detect") {
        window.dispatchEvent(new Event("eip6963:requestProvider"))
        setTimeout(() => reply({ installed: !!getProvider() }), 250)
      } else if (m.type === "connect") {
        const p = getProvider()
        if (!p) return reply({ error: "no-provider" })
        const accs = (await p.request({ method: "eth_requestAccounts" })) as string[]
        reply({ address: (accs && accs[0]) || null })
      }
    } catch (e) {
      reply({ error: e instanceof Error ? e.message : "error" })
    }
  })
}

export {}
