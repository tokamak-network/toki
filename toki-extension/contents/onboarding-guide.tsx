import type { PlasmoCSConfig } from "plasmo"
import { useCallback, useEffect, useRef, useState } from "react"

import {
  detectFlow,
  isValidAddress,
  type DetectedFlow,
  type GuideAction,
} from "~shared/onboarding-flows"
import { getSpriteUrl } from "~shared/sprites"

// ─── Plasmo CSUI config ───────────────────────────────────────────────
export const config: PlasmoCSConfig = {
  matches: [
    "https://metamask.io/*",
    "https://*.upbit.com/*",
    "https://*.bithumb.com/*",
    "https://*.coinone.co.kr/*",
    "https://*.korbit.co.kr/*",
  ],
  all_frames: false,
}

const ADDR_KEY = "tokiGuide:address"
const fmtAddr = (a?: string | null) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "")

// Talk to the MAIN-world provider bridge (injected by the background SW) over
// window.postMessage. Resolves {installed}|{address}|{error}|{timeout}.
let _seq = 0
function pageRequest(
  type: "detect" | "connect",
  nonce: string,
  timeout = 12000,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const id = ++_seq
  return new Promise((resolve) => {
    const handler = (ev: MessageEvent) => {
      if (ev.source !== window) return
      const m = ev.data
      // Validate the per-page secret nonce too: a hostile script in the page's
      // MAIN world could otherwise forge a {__tokiGuide:"res", id} reply (id is
      // a guessable counter) and poison the saved withdrawal address.
      if (!m || m.__tokiGuide !== "res" || m.id !== id || m.nonce !== nonce) return
      window.removeEventListener("message", handler)
      resolve(m)
    }
    window.addEventListener("message", handler)
    window.postMessage({ __tokiGuide: "req", id, nonce, type }, "*")
    setTimeout(() => {
      window.removeEventListener("message", handler)
      resolve({ timeout: true })
    }, timeout)
  })
}

// ─── Component ────────────────────────────────────────────────────────
export default function OnboardingGuide() {
  const [flow] = useState<DetectedFlow | null>(() =>
    typeof window !== "undefined" ? detectFlow(window.location.hostname) : null,
  )
  // Per-page secret shared with the injected bridge to authenticate its replies.
  const [channel] = useState(() => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID()
    // Fallback (older engines): still CSPRNG, never Math.random.
    const a = new Uint8Array(16)
    crypto.getRandomValues(a)
    return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("")
  })
  const [stepIndex, setStepIndex] = useState(0)
  const [address, setAddress] = useState<string | null>(null)
  const [draft, setDraft] = useState("")
  const [minimized, setMinimized] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [installed, setInstalled] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [hlRect, setHlRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null)
  const loadedRef = useRef(false)

  const stepKey = flow ? `tokiGuide:${flow.id}:step` : null

  // Ask the background SW to inject the MAIN-world provider bridge (with our
  // per-page nonce so its replies can be authenticated).
  useEffect(() => {
    try {
      chrome.runtime?.sendMessage({ type: "toki:init-bridge", nonce: channel })
    } catch {
      /* bridge optional — manual paste still works */
    }
  }, [channel])

  // Load saved progress + address once.
  useEffect(() => {
    if (!flow || loadedRef.current) return
    loadedRef.current = true
    try {
      chrome.storage?.local.get([stepKey!, ADDR_KEY], (r) => {
        const saved = r?.[stepKey!]
        if (typeof saved === "number" && saved < flow.steps.length) setStepIndex(saved)
        if (r?.[ADDR_KEY]) {
          setAddress(r[ADDR_KEY])
          setDraft(r[ADDR_KEY])
        }
      })
    } catch {
      /* ignore */
    }
  }, [flow, stepKey])

  // Persist step.
  useEffect(() => {
    if (!flow || !loadedRef.current) return
    try {
      chrome.storage?.local.set({ [stepKey!]: stepIndex })
    } catch {
      /* ignore */
    }
  }, [stepIndex, flow, stepKey])

  const step = flow?.steps[stepIndex]

  // Live MetaMask detection while on a detect step.
  useEffect(() => {
    if (!step?.detect) {
      setInstalled(null)
      return
    }
    let cancelled = false
    const poll = async () => {
      const r = await pageRequest("detect", channel, 3000)
      // Ignore timeouts (bridge not injected yet) so a late-timing-out early
      // poll can't overwrite a later successful detection. Keeps "확인 중" until
      // a real reply arrives.
      if (!cancelled && !r.timeout) setInstalled(!!r.installed)
    }
    poll()
    const t = setInterval(poll, 2500)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [step?.id, step?.detect, channel])

  // Ring-highlight the first on-page element matching the step's selectors.
  useEffect(() => {
    const selectors = step?.highlight
    if (!selectors || minimized) {
      setHlRect(null)
      return
    }
    let cancelled = false
    const find = (): Element | null => {
      for (const sel of selectors) {
        try {
          const el = document.querySelector(sel)
          if (el) return el
        } catch {
          /* invalid selector — skip */
        }
      }
      return null
    }
    const measure = () => {
      if (cancelled) return
      const el = find()
      if (!el) {
        setHlRect(null)
        return
      }
      const r = el.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) {
        setHlRect(null)
        return
      }
      setHlRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }
    const first = find()
    if (first) first.scrollIntoView({ behavior: "smooth", block: "center" })
    measure()
    const iv = setInterval(measure, 500)
    window.addEventListener("scroll", measure, true)
    window.addEventListener("resize", measure)
    return () => {
      cancelled = true
      clearInterval(iv)
      window.removeEventListener("scroll", measure, true)
      window.removeEventListener("resize", measure)
    }
  }, [step?.id, step?.highlight, minimized])

  const flash = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2400)
  }, [])

  const persistAddress = useCallback((a: string) => {
    setAddress(a)
    setDraft(a)
    try {
      chrome.storage?.local.set({ [ADDR_KEY]: a })
    } catch {
      /* ignore */
    }
  }, [])

  const saveAddress = useCallback(() => {
    const a = draft.trim()
    if (!isValidAddress(a)) {
      flash("0x로 시작하는 42자리 주소가 맞는지 확인해줘!")
      return
    }
    persistAddress(a)
    flash("주소를 저장했어!")
  }, [draft, flash, persistAddress])

  const goNext = useCallback(() => {
    if (!flow) return
    setStepIndex((i) => Math.min(i + 1, flow.steps.length - 1))
  }, [flow])

  const handleAction = useCallback(
    async (action: GuideAction) => {
      switch (action.kind) {
        case "open-url":
          if (action.url) window.open(action.url, "_blank", "noopener")
          break
        case "next":
          goNext()
          break
        case "copy-address":
          if (!address) {
            flash("먼저 메타마스크 주소를 저장해줘!")
            break
          }
          try {
            await navigator.clipboard.writeText(address)
            flash("주소를 복사했어!")
          } catch {
            flash("복사 실패 — 주소를 직접 선택해 복사해줘.")
          }
          break
        case "connect": {
          setBusy(true)
          try {
            const r = await pageRequest("connect", channel)
            if (r.address && isValidAddress(r.address)) {
              persistAddress(r.address)
              flash("주소를 자동으로 저장했어!")
              goNext()
            } else if (r.error === "no-provider") {
              flash("메타마스크가 안 보여 — 설치했는지 확인하거나 아래에 직접 붙여넣어줘.")
            } else if (r.timeout) {
              flash("응답이 없어 — 메타마스크 팝업을 확인하거나 직접 붙여넣어줘.")
            } else {
              flash("연결이 취소됐어. 직접 붙여넣어도 돼!")
            }
          } finally {
            setBusy(false)
          }
          break
        }
      }
    },
    [address, goNext, flash, persistAddress, channel],
  )

  if (!flow || !step) return null

  const spriteUrl = getSpriteUrl(step.mood)
  const body = step.bodyKo.replace("{address}", address ? fmtAddr(address) : "(아직 저장 안 됨)")
  const isLast = stepIndex === flow.steps.length - 1

  // ─── Minimized bubble ───
  if (minimized) {
    return (
      <div
        onClick={() => setMinimized(false)}
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 2147483647,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #0ea5e9, #22d3ee)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}>
        <img
          src={getSpriteUrl("pointing")}
          alt="Toki"
          style={{ width: 44, height: 44, objectFit: "contain" }}
        />
      </div>
    )
  }

  const FONT =
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Apple SD Gothic Neo', sans-serif"

  return (
    <>
      {hlRect && (
        <TokiPointer
          rect={hlRect}
          label={step.pointLabelKo ?? "여기예요!"}
          spriteUrl={getSpriteUrl("pointing")}
        />
      )}
      <div
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 2147483647,
          width: 340,
        maxWidth: "calc(100vw - 40px)",
        background: "#0a0a0f",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 16,
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        fontFamily: FONT,
        overflow: "hidden",
      }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
        }}>
        <img
          src={getSpriteUrl("welcome")}
          alt="Toki"
          style={{ width: 30, height: 30, objectFit: "contain" }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "#fff", fontWeight: 600, fontSize: 13, lineHeight: 1.2 }}>
            토키 가이드
          </div>
          <div
            style={{
              color: "#22d3ee",
              fontSize: 11,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
            {flow.titleKo}
          </div>
        </div>
        <button onClick={() => setMinimized(true)} title="접기" style={iconBtn}>
          —
        </button>
      </div>

      {/* Progress dots */}
      <div style={{ display: "flex", gap: 5, padding: "10px 14px 0" }}>
        {flow.steps.map((s, i) => (
          <div
            key={s.id}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background:
                i < stepIndex
                  ? "#22d3ee"
                  : i === stepIndex
                    ? "rgba(34,211,238,0.6)"
                    : "rgba(255,255,255,0.12)",
            }}
          />
        ))}
      </div>

      {/* Body */}
      <div style={{ padding: 14 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <img
            src={spriteUrl}
            alt=""
            style={{ width: 56, height: 56, objectFit: "contain", flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#fff", fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
              {step.titleKo}
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: 12.5,
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}>
              {body}
            </div>
          </div>
        </div>

        {/* Live install badge */}
        {step.detect === "installed" && (
          <div
            style={{
              marginTop: 10,
              padding: "6px 10px",
              borderRadius: 8,
              fontSize: 11.5,
              fontWeight: 500,
              border: "1px solid",
              borderColor: installed ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.12)",
              background: installed ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.04)",
              color: installed ? "#4ade80" : "rgba(255,255,255,0.55)",
            }}>
            {installed === null
              ? "메타마스크 확인 중…"
              : installed
                ? "✓ 메타마스크가 감지됐어!"
                : "아직 메타마스크가 안 보여 — 설치 후 잠깐 기다리거나 '다음'으로."}
          </div>
        )}

        {/* Address input */}
        {step.addressInput && (
          <div style={{ marginTop: 12 }}>
            {address && (
              <div style={{ fontSize: 11, color: "#4ade80", marginBottom: 6 }}>
                ✓ 저장됨: {fmtAddr(address)}
              </div>
            )}
            <div style={{ display: "flex", gap: 6 }}>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="0x... 메타마스크 주소 붙여넣기"
                spellCheck={false}
                style={{
                  flex: 1,
                  minWidth: 0,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 8,
                  padding: "7px 10px",
                  color: "#fff",
                  fontSize: 12,
                  fontFamily: "ui-monospace, monospace",
                  outline: "none",
                }}
              />
              <button
                onClick={saveAddress}
                style={{
                  padding: "7px 12px",
                  borderRadius: 8,
                  border: "1px solid #22d3ee",
                  background: "rgba(34,211,238,0.15)",
                  color: "#22d3ee",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  flexShrink: 0,
                }}>
                저장
              </button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
          {step.actions?.map((a, i) => {
            const primary = a.kind === "next" || a.kind === "connect"
            const isConnect = a.kind === "connect"
            return (
              <button
                key={i}
                disabled={busy && isConnect}
                onClick={() => handleAction(a)}
                style={{
                  padding: "7px 12px",
                  borderRadius: 9,
                  border: "1px solid",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: busy && isConnect ? "wait" : "pointer",
                  borderColor: primary ? "#22d3ee" : "rgba(255,255,255,0.2)",
                  background: primary ? "rgba(34,211,238,0.15)" : "rgba(255,255,255,0.05)",
                  color: primary ? "#22d3ee" : "rgba(255,255,255,0.7)",
                  opacity: busy && isConnect ? 0.6 : 1,
                }}>
                {isConnect && busy ? "연결 중…" : a.labelKo}
              </button>
            )
          })}
        </div>
      </div>

      {/* Footer nav */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}>
        <button
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          disabled={stepIndex === 0}
          style={{ ...textBtn, opacity: stepIndex === 0 ? 0.3 : 1 }}>
          ◀ 이전
        </button>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
          {stepIndex + 1} / {flow.steps.length}
        </span>
        <button
          onClick={goNext}
          disabled={isLast}
          style={{ ...textBtn, opacity: isLast ? 0.3 : 1 }}>
          다음 ▶
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(34,211,238,0.95)",
            color: "#0a0a0f",
            fontSize: 11.5,
            fontWeight: 600,
            padding: "6px 12px",
            borderRadius: 999,
            whiteSpace: "nowrap",
            maxWidth: "92%",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}>
          {toast}
        </div>
      )}
      </div>
    </>
  )
}

// ─── Pointing cluster ─────────────────────────────────────────────────
// A pulsing ring + a cyan caret that bounces toward the element + a Toki
// sprite pill saying "여기예요!". Toki literally points at the target so the
// emphasis reads instantly (vs. a quiet border). Auto-places above/below/
// left/right based on the room around the element; tracks via `rect`.
const POINTER_FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Apple SD Gothic Neo', sans-serif"

const POINTER_KEYFRAMES = `
@keyframes tokiPulseRing{0%,100%{box-shadow:0 0 0 3px rgba(34,211,238,.28),0 0 16px rgba(34,211,238,.5)}50%{box-shadow:0 0 0 7px rgba(34,211,238,.10),0 0 30px rgba(34,211,238,.9)}}
@keyframes tokiBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes tokiCaretDown{0%,100%{transform:translateY(0)}50%{transform:translateY(7px)}}
@keyframes tokiCaretUp{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes tokiCaretRight{0%,100%{transform:translateX(0)}50%{transform:translateX(7px)}}
@keyframes tokiCaretLeft{0%,100%{transform:translateX(0)}50%{transform:translateX(-7px)}}
@keyframes tokiFade{from{opacity:0}to{opacity:1}}
`

function TokiPointer({
  rect,
  label,
  spriteUrl,
}: {
  rect: { top: number; left: number; width: number; height: number }
  label: string
  spriteUrl: string
}) {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280
  const vh = typeof window !== "undefined" ? window.innerHeight : 800
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const GAP = 12
  const TRI = 13
  const clampX = (x: number) => Math.max(120, Math.min(vw - 120, x))
  const clampY = (y: number) => Math.max(90, Math.min(vh - 90, y))

  let side: "above" | "below" | "left" | "right"
  if (rect.top >= 150) side = "above"
  else if (vh - (rect.top + rect.height) >= 150) side = "below"
  else if (rect.left >= 200) side = "left"
  else side = "right"

  const triBase = { width: 0, height: 0 } as React.CSSProperties
  let caretWrap: React.CSSProperties
  let caretInner: React.CSSProperties
  let pillWrap: React.CSSProperties
  const flip = side === "right"

  if (side === "above") {
    caretWrap = { left: cx, top: rect.top - GAP, transform: "translate(-50%,-100%)" }
    caretInner = {
      ...triBase,
      borderLeft: `${TRI}px solid transparent`,
      borderRight: `${TRI}px solid transparent`,
      borderTop: `${TRI + 4}px solid #22d3ee`,
      animation: "tokiCaretDown 0.9s ease-in-out infinite",
    }
    pillWrap = { left: clampX(cx), top: rect.top - GAP - TRI - 8, transform: "translate(-50%,-100%)" }
  } else if (side === "below") {
    caretWrap = { left: cx, top: rect.top + rect.height + GAP, transform: "translate(-50%,0)" }
    caretInner = {
      ...triBase,
      borderLeft: `${TRI}px solid transparent`,
      borderRight: `${TRI}px solid transparent`,
      borderBottom: `${TRI + 4}px solid #22d3ee`,
      animation: "tokiCaretUp 0.9s ease-in-out infinite",
    }
    pillWrap = { left: clampX(cx), top: rect.top + rect.height + GAP + TRI + 8, transform: "translate(-50%,0)" }
  } else if (side === "left") {
    caretWrap = { left: rect.left - GAP, top: cy, transform: "translate(-100%,-50%)" }
    caretInner = {
      ...triBase,
      borderTop: `${TRI}px solid transparent`,
      borderBottom: `${TRI}px solid transparent`,
      borderLeft: `${TRI + 4}px solid #22d3ee`,
      animation: "tokiCaretRight 0.9s ease-in-out infinite",
    }
    pillWrap = { left: rect.left - GAP - TRI - 8, top: clampY(cy), transform: "translate(-100%,-50%)" }
  } else {
    caretWrap = { left: rect.left + rect.width + GAP, top: cy, transform: "translate(0,-50%)" }
    caretInner = {
      ...triBase,
      borderTop: `${TRI}px solid transparent`,
      borderBottom: `${TRI}px solid transparent`,
      borderRight: `${TRI + 4}px solid #22d3ee`,
      animation: "tokiCaretLeft 0.9s ease-in-out infinite",
    }
    pillWrap = { left: rect.left + rect.width + GAP + TRI + 8, top: clampY(cy), transform: "translate(0,-50%)" }
  }

  return (
    <>
      <style>{POINTER_KEYFRAMES}</style>
      {/* pulsing ring */}
      <div
        data-toki-highlight=""
        style={{
          position: "fixed",
          top: rect.top - 6,
          left: rect.left - 6,
          width: rect.width + 12,
          height: rect.height + 12,
          border: "2.5px solid #22d3ee",
          borderRadius: 10,
          pointerEvents: "none",
          zIndex: 2147483646,
          animation: "tokiPulseRing 1.5s ease-in-out infinite",
          transition: "top .15s ease, left .15s ease, width .15s ease, height .15s ease",
        }}
      />
      {/* caret bouncing toward the element */}
      <div style={{ position: "fixed", zIndex: 2147483646, pointerEvents: "none", ...caretWrap }}>
        <div style={{ filter: "drop-shadow(0 0 6px rgba(34,211,238,.85))", ...caretInner }} />
      </div>
      {/* Toki sprite pill */}
      <div
        style={{
          position: "fixed",
          zIndex: 2147483646,
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 16px 5px 6px",
          background: "#0a0a0f",
          border: "1.5px solid rgba(34,211,238,0.6)",
          borderRadius: 999,
          boxShadow: "0 8px 28px rgba(0,0,0,.55), 0 0 18px rgba(34,211,238,.45)",
          fontFamily: POINTER_FONT,
          whiteSpace: "nowrap",
          animation: "tokiFade .25s ease-out",
          ...pillWrap,
        }}>
        <span style={{ display: "inline-flex", transform: flip ? "scaleX(-1)" : undefined }}>
          <img
            src={spriteUrl}
            alt=""
            style={{
              width: 56,
              height: 56,
              objectFit: "contain",
              animation: "tokiBob 1.2s ease-in-out infinite",
            }}
          />
        </span>
        <span style={{ color: "#fff", fontSize: 13.5, fontWeight: 700, letterSpacing: "-0.01em" }}>
          {label}
        </span>
      </div>
    </>
  )
}

const iconBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "rgba(255,255,255,0.4)",
  cursor: "pointer",
  fontSize: 18,
  lineHeight: 1,
  padding: 4,
}

const textBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "rgba(255,255,255,0.6)",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 500,
  padding: "2px 4px",
}
