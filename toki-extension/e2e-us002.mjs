// US-002 verification (in the service worker):
//  1. the periodic alarm is registered
//  2. the notify path fires once when the mocked balance increases, and not
//     again when it is unchanged.
import { chromium } from "@playwright/test"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const EXT = path.join(__dirname, "build", "chrome-mv3-prod")
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const ctx = await chromium.launchPersistentContext("", {
  headless: false,
  args: [
    `--disable-extensions-except=${EXT}`,
    `--load-extension=${EXT}`,
    "--no-first-run",
    "--no-default-browser-check",
  ],
})

let sw = null
for (let i = 0; i < 24 && !sw; i++) {
  const s = ctx.serviceWorkers()
  if (s.length) sw = s[0]
  else await sleep(250)
}
if (!sw) {
  console.log("no service worker")
  await ctx.close()
  process.exit(1)
}

const alarms = await sw.evaluate(
  () => new Promise((res) => chrome.alarms.getAll((a) => res(a.map((x) => x.name)))),
)
const alarmOk = alarms.includes("toki:ton-poll")

const notify = await sw.evaluate(async () => {
  const created = []
  chrome.notifications.create = (opts) => {
    created.push(opts)
    return Promise.resolve("id")
  }
  const addr = "0x1111111111111111111111111111111111111111"
  await new Promise((r) =>
    chrome.storage.local.set(
      {
        "tokiGuide:address": addr,
        "tokiGuide:lastBalance": "10000000000000000000", // 10 TON in wei
        "tokiGuide:lastBalanceAddr": addr,
      },
      r,
    ),
  )
  // balance 10 -> 25 TON should notify once
  await globalThis.__tokiPoll(async () => 25000000000000000000n)
  const firstCount = created.length
  // unchanged 25 -> 25 should NOT notify again
  await globalThis.__tokiPoll(async () => 25000000000000000000n)
  return {
    firstCount,
    secondCount: created.length,
    title: created[0]?.title ?? "",
    message: created[0]?.message ?? "",
  }
})

const pass =
  alarmOk &&
  notify.firstCount === 1 &&
  notify.secondCount === 1 &&
  /TON 도착/.test(notify.title)

console.log(`alarmRegistered=${alarmOk}  notify=${JSON.stringify(notify)}`)
console.log(`US-002 ${pass ? "PASS" : "FAIL"}`)

await ctx.close()
process.exit(pass ? 0 : 1)
