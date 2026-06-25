// Headed demo: load the extension into a fresh Chromium, open metamask.io,
// dismiss the cookie consent, then KEEP the window open so you can watch Toki
// point at the install button. Close the browser window (or Ctrl+C) to end.
import { chromium } from "@playwright/test"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const EXT = path.join(__dirname, "build", "chrome-mv3-prod")
const URL = process.argv[2] || "https://metamask.io/download/"

const ctx = await chromium.launchPersistentContext("", {
  headless: false,
  viewport: null,
  args: [
    `--disable-extensions-except=${EXT}`,
    `--load-extension=${EXT}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--start-maximized",
  ],
})

const page = ctx.pages()[0] || (await ctx.newPage())
console.log("navigating:", URL)
await page
  .goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 })
  .catch((e) => console.log("goto warn:", e.message))
await page.waitForTimeout(3500)

// metamask.io shows up to two consent layers; clear both so they don't cover
// the install button Toki points at.
for (let pass = 0; pass < 3; pass++) {
  let clicked = false
  for (const label of ["모두 동의", "Accept all", "필요치 않은 항목 거부", "Reject all", "Accept", "저장"]) {
    const btn = page.getByText(label, { exact: false }).first()
    if (await btn.isVisible().catch(() => false)) {
      await btn.click().catch(() => {})
      await page.waitForTimeout(700)
      clicked = true
      break
    }
  }
  if (!clicked) break
}

console.log("\n✅ Demo browser is open — Toki is pointing at the Chrome install button.")
console.log("   Close the browser window (or press Ctrl+C here) when you're done.\n")

// Stay alive until the user closes the browser window.
await new Promise((resolve) => ctx.on("close", resolve))
process.exit(0)
