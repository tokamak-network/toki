// US-003 verification: the install step ring-highlights the on-page download
// link, and a page with no matching selector produces no ring and no errors.
import { chromium } from "@playwright/test"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const EXT = path.join(__dirname, "build", "chrome-mv3-prod")

const ctx = await chromium.launchPersistentContext("", {
  headless: false,
  args: [
    `--disable-extensions-except=${EXT}`,
    `--load-extension=${EXT}`,
    "--no-first-run",
    "--no-default-browser-check",
  ],
})

// 1) metamask stub with a download link → expect a ring over it
const page = await ctx.newPage()
const html = `<!doctype html><html><body style="margin:0">
<div style="height:380px"></div>
<a href="/download/" id="dl" style="display:inline-block;margin:40px;padding:18px 28px;background:#0376c9;color:#fff;border-radius:8px;text-decoration:none">Download MetaMask</a>
<div style="height:900px"></div></body></html>`
await page.route("https://metamask.io/**", (r) => r.fulfill({ contentType: "text/html", body: html }))
await page.goto("https://metamask.io/", { waitUntil: "domcontentloaded" }).catch(() => {})
await page.waitForTimeout(2600)

const ring = page.locator("[data-toki-highlight]")
const ringCount = await ring.count()
let overlapOk = false
if (ringCount > 0) {
  const rb = await ring.first().boundingBox()
  const lb = await page.locator("#dl").boundingBox()
  if (rb && lb) {
    overlapOk =
      rb.x <= lb.x + 4 &&
      rb.y <= lb.y + 4 &&
      rb.x + rb.width >= lb.x + lb.width - 4 &&
      rb.y + rb.height >= lb.y + lb.height - 4
  }
}
await page.screenshot({ path: path.join(__dirname, "e2e-us003.png") })

// 2) no-match page → no ring, no page errors
const page2 = await ctx.newPage()
let pageErr = false
page2.on("pageerror", () => {
  pageErr = true
})
await page2.route("https://upbit.com/**", (r) =>
  r.fulfill({ contentType: "text/html", body: "<!doctype html><html><body><h1>upbit stub</h1></body></html>" }),
)
await page2.goto("https://upbit.com/", { waitUntil: "domcontentloaded" }).catch(() => {})
await page2.waitForTimeout(1600)
const ring2 = await page2.locator("[data-toki-highlight]").count()

const pass = ringCount === 1 && overlapOk && ring2 === 0 && !pageErr
console.log(`ringCount=${ringCount} overlapOk=${overlapOk} noMatchRing=${ring2} pageErrors=${pageErr}`)
console.log(`US-003 ${pass ? "PASS" : "FAIL"}`)

await ctx.close()
process.exit(pass ? 0 : 1)
