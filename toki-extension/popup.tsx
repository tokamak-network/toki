import { useEffect, useState } from "react"

import { detectFlow } from "~shared/onboarding-flows"
import { getSpriteUrl } from "~shared/sprites"

import "./style.css"

const MM_TOTAL = detectFlow("metamask.io")?.steps.length ?? 4
const EX_TOTAL = detectFlow("upbit.com")?.steps.length ?? 6

const MM_KEY = "tokiGuide:metamask:step"
const EX_KEY = "tokiGuide:exchange:step"
const ADDR_KEY = "tokiGuide:address"

const fmtAddr = (a?: string | null) => (a ? `${a.slice(0, 8)}…${a.slice(-6)}` : "")

const EXCHANGES: { ko: string; url: string }[] = [
  { ko: "업비트", url: "https://upbit.com/" },
  { ko: "빗썸", url: "https://www.bithumb.com/" },
  { ko: "코인원", url: "https://coinone.co.kr/" },
  { ko: "코빗", url: "https://www.korbit.co.kr/" },
]

function openTab(url: string) {
  if (typeof chrome !== "undefined" && chrome.tabs?.create) chrome.tabs.create({ url })
  else window.open(url, "_blank", "noopener")
}

export default function Popup() {
  const [mmStep, setMmStep] = useState<number | null>(null)
  const [exStep, setExStep] = useState<number | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const load = () =>
      chrome.storage?.local.get([MM_KEY, EX_KEY, ADDR_KEY], (r) => {
        setMmStep(typeof r?.[MM_KEY] === "number" ? r[MM_KEY] : null)
        setExStep(typeof r?.[EX_KEY] === "number" ? r[EX_KEY] : null)
        setAddress(r?.[ADDR_KEY] ?? null)
      })
    load()
    const listener = (_c: unknown, area: string) => {
      if (area === "local") load()
    }
    chrome.storage?.onChanged.addListener(listener)
    return () => chrome.storage?.onChanged.removeListener(listener)
  }, [])

  const copyAddr = () => {
    if (!address) return
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  const clearAddr = () => chrome.storage?.local.remove(ADDR_KEY)
  const resetProgress = () => chrome.storage?.local.remove([MM_KEY, EX_KEY])

  return (
    <div
      style={{
        width: 320,
        background: "#0a0a0f",
        color: "#fff",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Apple SD Gothic Neo', sans-serif",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <img
          src={getSpriteUrl("welcome")}
          alt="Toki"
          style={{ width: 36, height: 36, objectFit: "contain" }}
        />
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>토키 온보딩 가이드</div>
          <div style={{ fontSize: 11, color: "#22d3ee" }}>MetaMask · 거래소 TON 출금</div>
        </div>
      </div>

      {/* Flow 1 */}
      <FlowCard
        title="① 메타마스크 지갑 만들기"
        step={mmStep}
        total={MM_TOTAL}
        right={
          <button style={chip(true)} onClick={() => openTab("https://metamask.io/")}>
            열기
          </button>
        }
      />

      {/* Flow 2 */}
      <FlowCard
        title="② 거래소에서 TON 출금"
        step={exStep}
        total={EX_TOTAL}
        right={null}
        footer={
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 8 }}>
            {EXCHANGES.map((e) => (
              <button key={e.ko} style={chip(false)} onClick={() => openTab(e.url)}>
                {e.ko}
              </button>
            ))}
          </div>
        }
      />

      {/* Saved address */}
      <div style={panel}>
        <div style={label}>내 받는 주소 (MetaMask)</div>
        {address ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
            <code
              style={{
                flex: 1,
                fontSize: 12,
                color: "#fff",
                fontFamily: "ui-monospace, monospace",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
              {fmtAddr(address)}
            </code>
            <button style={chip(true)} onClick={copyAddr}>
              {copied ? "✓ 복사됨" : "복사"}
            </button>
            <button style={chip(false)} onClick={clearAddr}>
              지우기
            </button>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>
            아직 저장 안 됨 — 가이드의 '주소 저장'에서 붙여넣어줘.
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", gap: 6 }}>
        <a
          href="https://toki.tokamak.network"
          target="_blank"
          rel="noreferrer"
          style={{ ...chip(true), flex: 1, textAlign: "center", textDecoration: "none", padding: "9px" }}>
          Toki 앱 열기 →
        </a>
        <button style={{ ...chip(false), padding: "9px 12px" }} onClick={resetProgress}>
          진행 초기화
        </button>
      </div>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textAlign: "center" }}>
        v0.1.0 · Tokamak Network
      </div>
    </div>
  )
}

function FlowCard({
  title,
  step,
  total,
  right,
  footer,
}: {
  title: string
  step: number | null
  total: number
  right: React.ReactNode
  footer?: React.ReactNode
}) {
  const current = step === null ? 0 : Math.min(step + 1, total)
  const done = step !== null && step >= total - 1
  return (
    <div style={panel}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
        {right}
      </div>
      <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background:
                step !== null && i <= step ? "#22d3ee" : "rgba(255,255,255,0.12)",
            }}
          />
        ))}
      </div>
      <div style={{ fontSize: 11, color: done ? "#4ade80" : "rgba(255,255,255,0.45)", marginTop: 5 }}>
        {step === null ? "아직 시작 안 함" : done ? "✓ 완료!" : `진행 중 ${current}/${total}`}
      </div>
      {footer}
    </div>
  )
}

const panel: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 10,
  padding: 12,
}

const label: React.CSSProperties = {
  fontSize: 10.5,
  color: "rgba(255,255,255,0.4)",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
}

function chip(primary: boolean): React.CSSProperties {
  return {
    padding: "5px 11px",
    borderRadius: 8,
    border: "1px solid",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    borderColor: primary ? "#22d3ee" : "rgba(255,255,255,0.18)",
    background: primary ? "rgba(34,211,238,0.15)" : "rgba(255,255,255,0.05)",
    color: primary ? "#22d3ee" : "rgba(255,255,255,0.7)",
  }
}
