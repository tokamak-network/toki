"use client";

// ─── Page-transition catalog (internal selection tool) ───────────────────────
// Previews every screen transition we ship (registry.ts) so we can pick the one
// used for the landing "시작하기" → /dashboard hop. Reuses the EXACT cover CSS
// from TransitionProvider, so what you see here is what ships. Pick one and it's
// persisted (localStorage) and read by VideoHero on the next "시작하기" click.

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  COVER_CSS,
  useScreenTransition,
} from "@/components/transitions/TransitionProvider";
import {
  TRANSITIONS,
  type TransKey,
  getStartTransition,
  setStartTransition,
  DEFAULT_START_TRANS,
} from "@/components/transitions/registry";
import { coverChildren } from "@/components/transitions/CoverArt";

type Phase = "out" | "in";

type Meta = {
  label: string;
  menu: string;
  desc: string;
  accent: string;
  icon: string;
};

const META: Record<TransKey, Meta> = {
  launch: {
    label: "로켓 워프",
    menu: "스테이킹",
    desc: "시안 빛이 아래에서 위로 솟구치는 발사 연출. 기운차고 시작에 잘 어울려요.",
    accent: "#22d3ee",
    icon: "🚀",
  },
  zoom: {
    label: "오픈 줌",
    menu: "지갑",
    desc: "골드 원형이 확 열리며 빨려드는 줌인. 빠르고 경쾌해요.",
    accent: "#f59e0b",
    icon: "🔍",
  },
  iris: {
    label: "스텔스 아이리스",
    menu: "프라이빗 송금",
    desc: "원형 조리개가 닫혔다 다시 열리는 은밀한 전환.",
    accent: "#94a3b8",
    icon: "🕶️",
  },
  flip: {
    label: "카드 플립",
    menu: "복권",
    desc: "카드가 휙 뒤집히듯 회전하며 전환. 놀이 느낌.",
    accent: "#f59e0b",
    icon: "🎴",
  },
  glitch: {
    label: "디지털 디졸브",
    menu: "AI 액세스",
    desc: "스캔라인 글리치로 분해됐다 재조립. 사이버틱한 무드.",
    accent: "#22d3ee",
    icon: "🤖",
  },
  spread: {
    label: "카드 셔터",
    menu: "컬렉션",
    desc: "실제 토키 티어 카드(브론즈~블랙)가 부채꼴 핸드로 펼쳐져 셔터처럼 내려왔다 빠지는 전환. (임시 — 실제 카드 에셋 사용)",
    accent: "#f59e0b",
    icon: "🃏",
  },
  map: {
    label: "맵 와이프",
    menu: "생태계 탐색",
    desc: "그리드 맵이 좌→우로 쓸고 지나가는 전환.",
    accent: "#60a5fa",
    icon: "🗺️",
  },
  curtain: {
    label: "커튼 (양쪽 문)",
    menu: "신규",
    desc: "양쪽에서 문이 닫혔다 다시 열리는 극적인 전환. 시작 화면에 잘 어울려요.",
    accent: "#7fe9ff",
    icon: "🚪",
  },
  diamond: {
    label: "다이아몬드 아이리스",
    menu: "신규",
    desc: "마름모 조리개가 중앙에서 확 퍼지며 덮었다 열리는 전환.",
    accent: "#818cf8",
    icon: "💠",
  },
  swipe: {
    label: "패널 스와이프",
    menu: "신규",
    desc: "밝은 가장자리를 단 패널이 오른쪽에서 밀고 들어왔다 왼쪽으로 빠짐.",
    accent: "#22d3ee",
    icon: "➡️",
  },
  flash: {
    label: "플래시 버스트",
    menu: "신규",
    desc: "빛이 팡 터지듯 번지는 강렬하고 짧은 전환. 임팩트가 커요.",
    accent: "#7fe9ff",
    icon: "⚡",
  },
  squad: {
    label: "토키 스쿼드 (웨지)",
    menu: "시작하기",
    desc: "5개 토키 캐릭터 웨지가 위아래에서 스태거로 슉슉 들어와 덮었다 열리는 게임풍 진입 전환. poster-squad 모션 버전.",
    accent: "#22d3ee",
    icon: "👥",
  },
  manga: {
    label: "토키 합체 (시안 망가)",
    menu: "시작하기 · 기본값",
    desc: "시안 망가 포스터가 스스로 조립돼요. 의상·구도가 다른 토키 패널 5개 + 큰 '토키' 타이틀 + 사이드 텍스트 + 토큰 심볼 푸터가 사방에서 하나씩 날아와 합체했다가, 다시 흩어지며 화면을 열어줍니다. 대시보드 진입 기본 전환. poster-allmight-toki 모션 버전.",
    accent: "#22d3ee",
    icon: "💥",
  },
  fade: {
    label: "페이드",
    menu: "기본값",
    desc: "부드러운 암전. 가볍고 어디에나 안전한 기본.",
    accent: "#64748b",
    icon: "✨",
  },
};

const ORDER: TransKey[] = [
  "squad",
  "manga",
  "launch",
  "zoom",
  "iris",
  "flip",
  "glitch",
  "spread",
  "map",
  "curtain",
  "diamond",
  "swipe",
  "flash",
  "fade",
];

function TransitionTile({
  k,
  selected,
  onApply,
  onFullscreen,
  onNavTest,
}: {
  k: TransKey;
  selected: boolean;
  onApply: () => void;
  onFullscreen: () => void;
  onNavTest: () => void;
}) {
  const meta = META[k];
  const [phase, setPhase] = useState<Phase | null>(null);
  const timers = useRef<number[]>([]);
  const looping = useRef(false);

  const clear = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  };

  const cycle = useCallback(() => {
    const { inMs, outMs } = TRANSITIONS[k];
    setPhase("out");
    timers.current.push(window.setTimeout(() => setPhase("in"), inMs + 220));
    timers.current.push(
      window.setTimeout(() => {
        setPhase(null);
        if (looping.current) timers.current.push(window.setTimeout(cycle, 480));
      }, inMs + 220 + outMs + 160),
    );
  }, [k]);

  const enter = () => {
    looping.current = true;
    clear();
    cycle();
  };
  const leave = () => {
    looping.current = false;
    clear();
    setPhase(null);
  };

  useEffect(
    () => () => {
      looping.current = false;
      clear();
    },
    [],
  );

  return (
    <article
      className={`tcat-card${selected ? " is-sel" : ""}`}
      style={{ "--ac": meta.accent } as React.CSSProperties}
    >
      <div
        className="tcat-pv"
        onMouseEnter={enter}
        onMouseLeave={leave}
        onClick={() => {
          if (!looping.current) {
            clear();
            cycle();
          }
        }}
      >
        <div className="tcat-idle">
          <span className="tcat-ic">{meta.icon}</span>
          <span className="tcat-hint">▶ 호버 / 탭하면 재생</span>
        </div>
        {phase && (
          <div className={`screen-cover sc-${k} sc-${phase}`} aria-hidden="true">
            {coverChildren(k)}
          </div>
        )}
        {selected && <span className="tcat-badge">시작하기 적용중</span>}
      </div>

      <div className="tcat-body">
        <div className="tcat-head">
          <h3>{meta.label}</h3>
          <code className="tcat-key">{k}</code>
        </div>
        <div className="tcat-tags">
          <span className="tcat-menu">{meta.menu}</span>
          <span className="tcat-ms">
            {TRANSITIONS[k].inMs}+{TRANSITIONS[k].outMs}ms
          </span>
        </div>
        <p className="tcat-desc">{meta.desc}</p>
        <div className="tcat-actions">
          <button
            type="button"
            className={`tcat-btn primary${selected ? " on" : ""}`}
            onClick={onApply}
          >
            {selected ? "✓ 적용됨" : "시작하기에 적용"}
          </button>
          <button type="button" className="tcat-btn" onClick={onFullscreen}>
            전체화면
          </button>
          <button type="button" className="tcat-btn ghost" onClick={onNavTest}>
            이동 테스트 →
          </button>
        </div>
      </div>
    </article>
  );
}

export default function TransitionsCatalog() {
  const { navigate } = useScreenTransition();
  const [selected, setSelected] = useState<TransKey | null>(null);
  const [fs, setFs] = useState<{ k: TransKey; phase: Phase } | null>(null);
  const fsTimers = useRef<number[]>([]);

  useEffect(() => {
    setSelected(getStartTransition());
    const t = fsTimers.current;
    return () => t.forEach((x) => clearTimeout(x));
  }, []);

  const apply = useCallback((k: TransKey) => {
    setStartTransition(k);
    setSelected(k);
  }, []);

  const playFullscreen = useCallback((k: TransKey) => {
    fsTimers.current.forEach((t) => clearTimeout(t));
    fsTimers.current = [];
    const { inMs, outMs } = TRANSITIONS[k];
    setFs({ k, phase: "out" });
    fsTimers.current.push(
      window.setTimeout(() => setFs((f) => (f ? { ...f, phase: "in" } : f)), inMs + 600),
    );
    fsTimers.current.push(
      window.setTimeout(() => setFs(null), inMs + 600 + outMs + 250),
    );
  }, []);

  const selMeta = selected ? META[selected] : null;

  return (
    <main className="tcat">
      <style>{COVER_CSS}</style>
      <style>{PAGE_CSS}</style>

      <header className="tcat-hd">
        <div className="tcat-hd-row">
          <Link href="/" className="tcat-back">
            ← 홈
          </Link>
          <span className="tcat-tagchip">내부 도구 · /transitions</span>
        </div>
        <h1>페이지 전환 효과 카탈로그</h1>
        <p className="tcat-sub">
          “시작하기 → 대시보드” 전환에 쓸 효과를 골라보세요. 카드를 호버하면
          미리보기가 재생되고, <b>전체화면</b>으로 실제 느낌을 확인할 수 있어요.
          마음에 들면 <b>시작하기에 적용</b>을 누르면 저장돼요.
        </p>

        <div className="tcat-current">
          현재 적용:&nbsp;
          {selMeta ? (
            <b style={{ color: selMeta.accent }}>
              {selMeta.icon} {selMeta.label}{" "}
              <code>{selected}</code>
            </b>
          ) : (
            <span>불러오는 중…</span>
          )}
          {selected && selected !== DEFAULT_START_TRANS && (
            <button
              type="button"
              className="tcat-reset"
              onClick={() => apply(DEFAULT_START_TRANS)}
            >
              기본값({DEFAULT_START_TRANS})으로 초기화
            </button>
          )}
        </div>
      </header>

      <section className="tcat-grid">
        {ORDER.map((k) => (
          <TransitionTile
            key={k}
            k={k}
            selected={selected === k}
            onApply={() => apply(k)}
            onFullscreen={() => playFullscreen(k)}
            onNavTest={() => navigate("/dashboard", undefined, k)}
          />
        ))}
      </section>

      <p className="tcat-foot">
        ※ <code>이동 테스트</code>는 실제로 대시보드로 이동합니다(로그인 상태에서
        가장 정확). 모션 줄이기 설정이 켜진 기기에서는 전환이 생략됩니다.
      </p>

      {fs && (
        <>
          <div className="tcat-fsmsg">대시보드로 이동 중…</div>
          <div className={`screen-cover sc-${fs.k} sc-${fs.phase}`} aria-hidden="true">
            {coverChildren(fs.k)}
          </div>
        </>
      )}
    </main>
  );
}

const PAGE_CSS = `
.tcat{min-height:100vh;background:radial-gradient(120% 80% at 50% -10%,#0c1422,#06080e 60%);color:#e7eef7;padding:88px 20px 80px;font-family:"Fredoka","Apple SD Gothic Neo",system-ui,sans-serif}
.tcat-hd{max-width:1120px;margin:0 auto 28px}
.tcat-hd-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.tcat-back{color:#9fb4cc;text-decoration:none;font-size:14px;padding:6px 12px;border:1px solid rgba(159,180,204,.25);border-radius:999px;transition:.15s}
.tcat-back:hover{background:rgba(159,180,204,.12);color:#fff}
.tcat-tagchip{font-size:12px;color:#6b86a3;letter-spacing:.04em}
.tcat-hd h1{font-family:"Baloo 2",sans-serif;font-weight:800;font-size:clamp(26px,4vw,42px);margin:0 0 8px;background:linear-gradient(90deg,#7fe9ff,#ffd089);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.tcat-sub{margin:0;max-width:760px;color:#aebfd2;font-size:15px;line-height:1.65}
.tcat-sub b{color:#e7eef7}
.tcat-current{margin-top:18px;display:flex;align-items:center;flex-wrap:wrap;gap:12px;font-size:14px;color:#c9d6e6;background:rgba(255,255,255,.04);border:1px solid rgba(127,233,255,.18);border-radius:14px;padding:12px 16px}
.tcat-current code{font-size:12px;background:rgba(0,0,0,.35);padding:1px 7px;border-radius:6px;color:#cfe8ff}
.tcat-reset{margin-left:auto;background:none;border:1px solid rgba(255,255,255,.18);color:#9fb4cc;font-size:12px;border-radius:999px;padding:5px 12px;cursor:pointer;transition:.15s}
.tcat-reset:hover{background:rgba(255,255,255,.08);color:#fff}

.tcat-grid{max-width:1120px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px}

.tcat-card{background:linear-gradient(180deg,rgba(20,26,38,.9),rgba(12,16,24,.9));border:1px solid rgba(255,255,255,.08);border-radius:18px;overflow:hidden;transition:transform .18s,border-color .18s,box-shadow .18s}
.tcat-card:hover{transform:translateY(-3px);border-color:color-mix(in srgb,var(--ac) 55%,transparent);box-shadow:0 14px 40px rgba(0,0,0,.45)}
.tcat-card.is-sel{border-color:var(--ac);box-shadow:0 0 0 1px var(--ac),0 14px 40px color-mix(in srgb,var(--ac) 22%,transparent)}

.tcat-pv{position:relative;aspect-ratio:16/10;overflow:hidden;cursor:pointer;background:radial-gradient(80% 80% at 50% 40%,color-mix(in srgb,var(--ac) 16%,#0a0e16),#080b12);display:flex;align-items:center;justify-content:center}
.tcat-pv .screen-cover{position:absolute;z-index:2}
.tcat-idle{display:flex;flex-direction:column;align-items:center;gap:10px;z-index:1;user-select:none}
.tcat-ic{font-size:46px;filter:drop-shadow(0 6px 16px rgba(0,0,0,.5))}
.tcat-hint{font-size:12px;color:#8ea4bd;letter-spacing:.03em}
.tcat-badge{position:absolute;top:10px;left:10px;z-index:3;font-size:11px;font-weight:700;color:#06121a;background:var(--ac);padding:3px 9px;border-radius:999px;box-shadow:0 2px 8px rgba(0,0,0,.4)}

.tcat-body{padding:14px 15px 15px}
.tcat-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px}
.tcat-head h3{margin:0;font-family:"Baloo 2",sans-serif;font-weight:700;font-size:18px;color:#f2f7fc}
.tcat-key{font-size:11px;color:var(--ac);background:color-mix(in srgb,var(--ac) 14%,transparent);padding:2px 8px;border-radius:6px}
.tcat-tags{display:flex;gap:8px;margin:8px 0 9px;flex-wrap:wrap}
.tcat-menu{font-size:11px;color:#bcd0e6;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);padding:2px 9px;border-radius:999px}
.tcat-ms{font-size:11px;color:#7b93ad;align-self:center}
.tcat-desc{margin:0 0 14px;font-size:13px;line-height:1.55;color:#a8bace;min-height:40px}
.tcat-actions{display:flex;gap:7px;flex-wrap:wrap}
.tcat-btn{flex:1;min-width:84px;font-family:inherit;font-size:12.5px;font-weight:600;color:#dbe7f4;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:9px 8px;cursor:pointer;transition:.15s;white-space:nowrap}
.tcat-btn:hover{background:rgba(255,255,255,.13)}
.tcat-btn.primary{flex:1.4;color:#06121a;background:var(--ac);border-color:var(--ac)}
.tcat-btn.primary:hover{filter:brightness(1.08)}
.tcat-btn.primary.on{color:#06121a;background:var(--ac)}
.tcat-btn.ghost{flex:.9;background:none;color:#9fb4cc}
.tcat-btn.ghost:hover{color:#fff;background:rgba(255,255,255,.06)}

.tcat-foot{max-width:1120px;margin:26px auto 0;font-size:12.5px;color:#7b93ad;line-height:1.6}
.tcat-foot code{background:rgba(255,255,255,.08);padding:1px 6px;border-radius:5px;color:#cfe8ff}

.tcat-fsmsg{position:fixed;inset:0;z-index:9998;display:flex;align-items:center;justify-content:center;font-family:"Baloo 2",sans-serif;font-size:20px;color:#cfe0f2;letter-spacing:.04em;pointer-events:none}

@media (max-width:600px){
  .tcat{padding:76px 14px 64px}
  .tcat-grid{grid-template-columns:1fr}
}
`;
