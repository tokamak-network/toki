// Real-world check: load the extension, visit the ACTUAL metamask.io/download
// page, dismiss the cookie banner, then verify our highlight ring lands on the
// real "Chrome" install button (same-frame geometric overlap).
import { chromium } from "@playwright/test"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const EXT = path.join(__dirname, "build", "chrome-mv3-prod")
const URL = process.argv[2] || "https://metamask.io/download/"

const ctx = await chromium.launchPersistentContext("", {
  headless: false,
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, "--no-first-run", "--no-default-browser-check"],
})

const page = await ctx.newPage()
console.log("navigating:", URL)
await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 }).catch((e) => console.log("goto warn:", e.message))
await page.waitForTimeout(4000)

// Dismiss cookie consent so it doesn't cover the install buttons.
for (const label of ["모두 동의", "필요치 않은 항목 거부", "Accept all", "Reject all", "Accept"]) {
  const btn = page.getByText(label, { exact: false }).first()
  if (await btn.isVisible().catch(() => false)) {
    await btn.click().catch(() => {})
    console.log("dismissed consent via:", label)
    break
  }
}
// Dismiss may re-render/reload → poll until our highlight ring reappears.
let ringReady = false
for (let i = 0; i < 16; i++) {
  if ((await page.locator("[data-toki-highlight]").count()) > 0) { ringReady = true; break }
  await page.waitForTimeout(500)
}
console.log("ring present after consent dismiss:", ringReady)

// Ring lives in the Plasmo shadow DOM → measure via Playwright locator (pierces
// shadow). Target is in the page light DOM → measure via getBoundingClientRect.
// Both are viewport-relative, so directly comparable.
const ringBox = (await page.locator("[data-toki-highlight]").count())
  ? await page.locator("[data-toki-highlight]").first().boundingBox()
  : null
const target = await page.evaluate(() => {
  const t =
    document.querySelector("a[href*='/webstore/detail/metamask']") ||
    document.querySelector("a[href*='nkbihfbeogaeaoehlefnkodbefgpgknn']")
  if (!t) return null
  const r = t.getBoundingClientRect()
  return { x: r.x, y: r.y, w: r.width, h: r.height, text: (t.textContent || "").trim().slice(0, 30), href: t.getAttribute("href") }
})

let coverage = 0
if (ringBox && target) {
  const ix = Math.max(0, Math.min(ringBox.x + ringBox.width, target.x + target.w) - Math.max(ringBox.x, target.x))
  const iy = Math.max(0, Math.min(ringBox.y + ringBox.height, target.y + target.h) - Math.max(ringBox.y, target.y))
  const area = target.w * target.h
  coverage = area ? +((ix * iy) / area).toFixed(2) : 0
}

await page.screenshot({ path: path.join(__dirname, "e2e-real-metamask.png"), fullPage: false })

console.log("\n=== ring (shadow) vs real Chrome install button (light DOM) ===")
console.log("ringBox:", JSON.stringify(ringBox))
console.log("target :", JSON.stringify(target))
const hit = coverage >= 0.9
console.log(`\nRESULT: ${hit ? "HIT — ring covers the Chrome install button" : "MISS"}  (target coverage=${coverage})`)

await ctx.close()
process.exit(hit ? 0 : 1)
