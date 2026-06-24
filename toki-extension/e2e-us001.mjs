// US-001 verification: with a mock window.ethereum injected in the page MAIN
// world, the guide should (a) auto-detect MetaMask and (b) auto-fill the address
// via the background-injected MAIN-world bridge when "연결" is clicked.
import { chromium } from "@playwright/test"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const EXT = path.join(__dirname, "build", "chrome-mv3-prod")
const ADDR = "0xABcdEF0123456789abcDEF0123456789ABCDef01"
const FMT = `${ADDR.slice(0, 6)}…${ADDR.slice(-4)}`

const ctx = await chromium.launchPersistentContext("", {
  headless: false,
  args: [
    `--disable-extensions-except=${EXT}`,
    `--load-extension=${EXT}`,
    "--no-first-run",
    "--no-default-browser-check",
  ],
})

const page = await ctx.newPage()
await page.addInitScript((addr) => {
  const provider = {
    isMetaMask: true,
    request: async ({ method }) =>
      method === "eth_requestAccounts" || method === "eth_accounts" ? [addr] : null,
  }
  // @ts-ignore
  window.ethereum = provider
  const announce = () =>
    window.dispatchEvent(
      new CustomEvent("eip6963:announceProvider", {
        detail: { info: { rdns: "io.metamask", name: "MetaMask", uuid: "1", icon: "" }, provider },
      }),
    )
  window.addEventListener("eip6963:requestProvider", announce)
  announce()
}, ADDR)

await page.route("https://metamask.io/**", (r) =>
  r.fulfill({ contentType: "text/html", body: "<!doctype html><html><body><h1>MetaMask stub</h1></body></html>" }),
)
await page.goto("https://metamask.io/", { waitUntil: "domcontentloaded" }).catch(() => {})
await page.waitForTimeout(3800) // mount + bridge inject + a couple detect polls

const detected = await page
  .getByText("메타마스크가 감지", { exact: false })
  .first()
  .isVisible()
  .catch(() => false)

// install -> create -> address
await page.getByText("설치했어!", { exact: false }).first().click().catch(() => {})
await page.waitForTimeout(300)
await page.getByText("지갑 만들었어!", { exact: false }).first().click().catch(() => {})
await page.waitForTimeout(300)
await page.getByText("메타마스크 연결해서 자동 저장", { exact: false }).first().click().catch(() => {})
await page.waitForTimeout(1500)

const addrFilled = await page.getByText(FMT, { exact: false }).first().isVisible().catch(() => false)

await page.screenshot({ path: path.join(__dirname, "e2e-us001.png") })
console.log(`autoDetect=${detected}  addrAutoFilled=${addrFilled}  (fmt=${FMT})`)

await ctx.close()
process.exit(detected && addrFilled ? 0 : 1)
