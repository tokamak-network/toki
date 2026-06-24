import cssText from "data-text:~style.css"
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import { useCallback, useEffect, useRef, useState } from "react"

import { executeAction, type ActionContext, type ActionResult, type ChatActionButton } from "~shared/actions"
import { parseIntent } from "~shared/intent-parser"
import { getSpriteUrl, type Mood } from "~shared/sprites"

// ─── Plasmo CSUI config ───────────────────────────────────────────────

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: false,
}

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText.replaceAll(":root", ":host(plasmo-csui)")
  return style
}

// ─── Types ────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: "user" | "toki"
  text: string
  mood?: Mood
  actions?: ChatActionButton[]
}

// ─── Main Component ───────────────────────────────────────────────────

export default function TokiOverlay() {
  const [isOpen, setIsOpen] = useState(false)
  const [mood, setMood] = useState<Mood>("welcome")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "toki",
      text: "안녕! 나는 토키야. TON 스테이킹을 도와줄게! 뭐든 물어봐~",
      mood: "welcome",
    },
  ])
  const [input, setInput] = useState("")
  const [isHovered, setIsHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 24, y: 24 })

  const dragOffset = useRef({ x: 0, y: 0 })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ─── Scroll to bottom on new messages ───
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // ─── Focus input when chat opens ───
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // ─── Drag handlers ───────────────────────────────────────────────
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (isOpen) return
      setIsDragging(true)
      dragOffset.current = {
        x: e.clientX - (window.innerWidth - position.x - 64),
        y: e.clientY - (window.innerHeight - position.y - 64),
      }
      e.preventDefault()
    },
    [isOpen, position],
  )

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const newX = Math.max(
        0,
        Math.min(window.innerWidth - 64, window.innerWidth - (e.clientX - dragOffset.current.x) - 64),
      )
      const newY = Math.max(
        0,
        Math.min(window.innerHeight - 64, window.innerHeight - (e.clientY - dragOffset.current.y) - 64),
      )
      setPosition({ x: newX, y: newY })
    }

    const handleMouseUp = () => setIsDragging(false)

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging])

  // ─── Action context ──────────────────────────────────────────────
  const actionCtx: ActionContext = {
    login: () => {},
    logout: () => {},
    isAuthenticated: false,
    navigateTo: (path: string) =>
      window.open(`https://toki.tokamak.network${path}`, "_blank"),
    locale: "ko",
    exportWallet: undefined,
    userAddress: undefined,
    tonBalance: undefined,
  }

  // ─── Message helpers ─────────────────────────────────────────────
  const addMessage = useCallback((msg: Omit<Message, "id">) => {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: `${Date.now()}-${Math.random()}` },
    ])
  }, [])

  // ─── Send handler ────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text) return

    setInput("")
    addMessage({ role: "user", text })

    // Show thinking state briefly
    setMood("thinking")

    setTimeout(() => {
      const intent = parseIntent(text)

      if (intent) {
        const result: ActionResult = executeAction(intent, actionCtx)
        const responseText = result.textKo
        setMood(result.mood)
        addMessage({
          role: "toki",
          text: responseText,
          mood: result.mood,
          actions: result.actions,
        })
        if (result.navigateAfter) {
          setTimeout(() => {
            window.open(
              `https://toki.tokamak.network${result.navigateAfter}`,
              "_blank",
            )
          }, 800)
        }
        if (result.sideEffect) {
          result.sideEffect()
        }
      } else {
        setMood("confused")
        addMessage({
          role: "toki",
          text: "음... 잘 모르겠어. 잔액 확인, 스테이킹, 로그인 같은 거 물어봐줘!",
          mood: "confused",
        })
      }
    }, 400)
  }, [input, addMessage, actionCtx])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ─── Action button handler ───────────────────────────────────────
  const handleActionButton = useCallback(
    (action: ChatActionButton) => {
      if (action.id === "privy-login") {
        window.open("https://toki.tokamak.network", "_blank")
        addMessage({
          role: "toki",
          text: "Toki 앱에서 로그인해줘! 새 탭을 열었어~",
          mood: "excited",
        })
        setMood("excited")
      } else if (action.id === "copy-address" && action.params?.address) {
        navigator.clipboard.writeText(action.params.address).then(() => {
          addMessage({
            role: "toki",
            text: "주소를 클립보드에 복사했어!",
            mood: "cheer",
          })
          setMood("cheer")
        })
      } else if (
        action.id === "start-staking-flow" ||
        action.id === "go-staking-amount"
      ) {
        const path = action.params?.amount
          ? `/staking?amount=${action.params.amount}`
          : "/staking"
        window.open(`https://toki.tokamak.network${path}`, "_blank")
      } else if (action.id === "go-staking-toki-pick") {
        window.open(
          "https://toki.tokamak.network/staking?tokiPick=true",
          "_blank",
        )
      }
    },
    [addMessage],
  )

  // ─── Render ──────────────────────────────────────────────────────
  const spriteUrl = getSpriteUrl(mood)

  // The dedicated onboarding guide (contents/onboarding-guide.tsx) owns these
  // domains — don't show the generic chat bubble on top of it.
  if (
    typeof window !== "undefined" &&
    ["metamask.io", "upbit.com", "bithumb.com", "coinone.co.kr", "korbit.co.kr"].some(
      (h) => window.location.hostname.includes(h),
    )
  ) {
    return null
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: `${position.y}px`,
        right: `${position.x}px`,
        zIndex: 2147483647,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>
      {/* Chat Window */}
      <div
        style={{
          position: "absolute",
          bottom: "80px",
          right: "0",
          width: "360px",
          height: "500px",
          background: "#0a0a0f",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          transformOrigin: "bottom right",
          transition: "transform 0.2s ease, opacity 0.2s ease",
          transform: isOpen ? "scale(1)" : "scale(0.8)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
        }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.03)",
          }}>
          <img
            src={spriteUrl}
            alt="Toki"
            style={{ width: "32px", height: "32px", objectFit: "contain" }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                color: "#fff",
                fontWeight: 600,
                fontSize: "14px",
                lineHeight: 1.2,
              }}>
              Toki
            </div>
            <div style={{ color: "#22d3ee", fontSize: "11px" }}>
              TON Staking Assistant
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.4)",
              cursor: "pointer",
              fontSize: "18px",
              lineHeight: 1,
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
            ×
          </button>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,255,255,0.1) transparent",
          }}>
          {messages.map((msg) => (
            <div key={msg.id}>
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    msg.role === "user" ? "flex-end" : "flex-start",
                  alignItems: "flex-end",
                  gap: "8px",
                }}>
                {msg.role === "toki" && (
                  <img
                    src={getSpriteUrl(msg.mood ?? "welcome")}
                    alt=""
                    style={{
                      width: "24px",
                      height: "24px",
                      objectFit: "contain",
                      flexShrink: 0,
                    }}
                  />
                )}
                <div
                  style={{
                    maxWidth: "75%",
                    padding: "8px 12px",
                    borderRadius:
                      msg.role === "user"
                        ? "12px 12px 2px 12px"
                        : "12px 12px 12px 2px",
                    background:
                      msg.role === "user"
                        ? "#3b82f6"
                        : "rgba(255,255,255,0.07)",
                    color: "#fff",
                    fontSize: "13px",
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}>
                  {msg.text}
                </div>
              </div>
              {/* Action buttons */}
              {msg.role === "toki" && msg.actions && msg.actions.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px",
                    marginTop: "6px",
                    paddingLeft: "32px",
                  }}>
                  {msg.actions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleActionButton(action)}
                      style={{
                        padding: "5px 10px",
                        borderRadius: "8px",
                        border: "1px solid",
                        fontSize: "11px",
                        cursor: "pointer",
                        fontWeight: 500,
                        transition: "opacity 0.15s",
                        borderColor:
                          action.variant === "danger"
                            ? "#ef4444"
                            : action.variant === "secondary"
                              ? "rgba(255,255,255,0.2)"
                              : "#22d3ee",
                        background:
                          action.variant === "danger"
                            ? "rgba(239,68,68,0.15)"
                            : action.variant === "secondary"
                              ? "rgba(255,255,255,0.05)"
                              : "rgba(34,211,238,0.15)",
                        color:
                          action.variant === "danger"
                            ? "#ef4444"
                            : action.variant === "secondary"
                              ? "rgba(255,255,255,0.6)"
                              : "#22d3ee",
                      }}>
                      {action.labelKo}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div
          style={{
            padding: "10px 12px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            gap: "8px",
            alignItems: "center",
          }}>
          {/* Mic button placeholder */}
          <button
            title="음성 입력 (준비 중)"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              width: "34px",
              height: "34px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "not-allowed",
              opacity: 0.5,
              flexShrink: 0,
              color: "rgba(255,255,255,0.5)",
              fontSize: "14px",
            }}>
            🎤
          </button>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { e.stopPropagation(); handleKeyDown(e); }}
            onKeyUp={(e) => e.stopPropagation()}
            onKeyPress={(e) => e.stopPropagation()}
            placeholder="메시지를 입력해..."
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              padding: "7px 12px",
              color: "#fff",
              fontSize: "13px",
              outline: "none",
              minWidth: 0,
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            style={{
              background: input.trim() ? "#22d3ee" : "rgba(255,255,255,0.06)",
              border: "none",
              borderRadius: "8px",
              width: "34px",
              height: "34px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: input.trim() ? "pointer" : "not-allowed",
              opacity: input.trim() ? 1 : 0.4,
              flexShrink: 0,
              color: input.trim() ? "#0a0a0f" : "rgba(255,255,255,0.4)",
              fontSize: "16px",
              transition: "background 0.15s, opacity 0.15s",
            }}>
            ↑
          </button>
        </div>
      </div>

      {/* Floating character button */}
      <div
        onMouseDown={handleDragStart}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => !isDragging && setIsOpen((prev) => !prev)}
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #0ea5e9, #22d3ee)",
          boxShadow: isHovered
            ? "0 0 0 4px rgba(34,211,238,0.3), 0 8px 24px rgba(0,0,0,0.5)"
            : "0 4px 16px rgba(0,0,0,0.4)",
          cursor: isDragging ? "grabbing" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          transition: "box-shadow 0.2s ease, transform 0.2s ease",
          transform: isHovered && !isDragging ? "scale(1.08)" : "scale(1)",
          userSelect: "none",
          animation: isHovered ? "none" : "tokiBounce 2.4s ease-in-out infinite",
        }}>
        <img
          src={spriteUrl}
          alt="Toki"
          style={{
            width: "52px",
            height: "52px",
            objectFit: "contain",
            pointerEvents: "none",
            transition: "transform 0.2s ease",
          }}
        />
      </div>

      {/* Bounce animation keyframes */}
      <style>{`
        @keyframes tokiBounce {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}
