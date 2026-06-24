// Throwaway E2E smoke test: load the built extension, visit each guide domain
// (URL real, page body stubbed via request interception), assert the Toki guide
// overlay injects, and screenshot it.
import { chromium } from "@playwright/test"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const EXT = path.join(__dirname, "build", "chrome-mv3-prod")

const stub = (label) => ({
  contentType: "text/html",
  body: `<!doctype html><html><head><meta charset="utf-8"><title>${label}</title></head><body style="font-family:sans-serif;padding:40px;background:#eef">
<h1>${label} (test stub)</h1><p>Toki 가이드 오버레이가 우상단에 떠야 함.</p></body></html>`,
})

const CASES = [
  { name: "metamask", url: "https://metamask.io/", glob: "https://metamask.io/**", expect: "메타마스크 설치" },
  { name: "upbit", url: "https://upbit.com/", glob: "https://upbit.com/**", expect: "업비트" },
]

const ctx = await chromium.launchPersistentContext("", {
  headless: false,
  args: [
    `--disable-extensions-except=${EXT}`,
    `--load-extension=${EXT}`,
    "--no-first-run",
    "--no-default-browser-check",
  ],
})

let pass = 0
for (const c of CASES) {
  const page = await ctx.newPage()
  await page.route(c.glob, (route) => route.fulfill(stub(c.name)))
  await page.goto(c.url, { waitUntil: "domcontentloaded" }).catch(() => {})
  // give the content script (document_idle) time to mount the CSUI
  await page.waitForTimeout(3000)

  const hosts = await page.locator("plasmo-csui").count()
  let found = false
  try {
    await page.getByText(c.expect, { exact: false }).first().waitFor({ timeout: 4000 })
    found = true
  } catch {
    found = false
  }
  const shot = path.join(__dirname, `e2e-${c.name}.png`)
  await page.screenshot({ path: shot })
  console.log(`[${c.name}] plasmo-csui hosts=${hosts} guideTextVisible=${found} -> ${shot}`)
  if (found) pass++
  await page.close()
}

// ─── Popup capture (seeded with demo progress + address) ───
let extId = null
for (let i = 0; i < 24 && !extId; i++) {
  const sws = ctx.serviceWorkers()
  if (sws.length) extId = new URL(sws[0].url()).host
  else await new Promise((r) => setTimeout(r, 250))
}
if (extId) {
  const pop = await ctx.newPage()
  await pop.goto(`chrome-extension://${extId}/popup.html`).catch(() => {})
  await pop.evaluate(
    () =>
      new Promise((res) =>
        chrome.storage.local.set(
          {
            "tokiGuide:metamask:step": 3,
            "tokiGuide:exchange:step": 1,
            "tokiGuide:address": "0x1234567890abcdef1234567890abcdef12345678",
          },
          res,
        ),
      ),
  )
  await pop.reload()
  await pop.waitForTimeout(600)
  const shot = path.join(__dirname, "e2e-popup.png")
  await pop.screenshot({ path: shot })
  console.log(`[popup] extId=${extId} -> ${shot}`)
} else {
  console.log("[popup] could not resolve extension id (no service worker)")
}

await ctx.close()
console.log(`\nRESULT: ${pass}/${CASES.length} passed`)
process.exit(pass === CASES.length ? 0 : 1)
