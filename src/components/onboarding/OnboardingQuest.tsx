"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

// ─── Quest Data ───────────────────────────────────────────────────────

type Mood = "welcome" | "explain" | "thinking" | "excited" | "proud" | "cheer" | "wink";

const MOOD_IMAGES: Record<Mood, string> = {
  welcome: "/ttoni-welcome.png",
  explain: "/ttoni-explain.png",
  thinking: "/ttoni-thinking.png",
  excited: "/ttoni-excited.png",
  proud: "/ttoni-proud.png",
  cheer: "/ttoni-cheer.png",
  wink: "/ttoni-wink.png",
};

const MOOD_LABELS: Record<Mood, string> = {
  welcome: "-- 반가운",
  explain: "-- 설명하는",
  thinking: "-- 진지한",
  excited: "-- 신난",
  proud: "-- 자랑스러운",
  cheer: "-- 응원하는",
  wink: "-- 장난스러운",
};

interface DialogueLine {
  text: string;
  mood?: Mood;
}

interface QuestAction {
  type: "link" | "connect" | "confirm" | "balance-check" | "navigate";
  label: string;
  url?: string;
  route?: string;
  confirmText?: string;
}

interface Quest {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeIcon: string;
  xp: number;
  intro: DialogueLine[];
  action?: QuestAction;
  verify?: "metamask-installed" | "metamask-connected" | "user-confirm";
  success: DialogueLine[];
}

const QUESTS: Quest[] = [
  {
    id: "install-metamask",
    title: "금고 만들기",
    subtitle: "MetaMask 설치",
    badge: "금고 초보자",
    badgeIcon: "V",
    xp: 100,
    intro: [
      { text: "안녕! 나는 또니라고 해.", mood: "welcome" },
      { text: "너의 TON 스테이킹을 도와줄 가이드야.", mood: "welcome" },
      { text: "시작하기 전에, 먼저 '디지털 금고'를 만들어야 해.", mood: "explain" },
      { text: "MetaMask라는 건데, 크롬에 설치하는 확장 프로그램이야.", mood: "explain" },
      { text: "아래 버튼을 누르면 설치 페이지로 이동할 거야. 설치하고 돌아와!", mood: "cheer" },
    ],
    action: {
      type: "link",
      label: "MetaMask 설치하러 가기",
      url: "https://metamask.io/download/",
    },
    verify: "metamask-installed",
    success: [
      { text: "잘했어! 금고가 생겼네!", mood: "excited" },
      { text: "벌써 첫 번째 퀘스트 클리어야. 이 조합 꽤 잘 맞는걸?", mood: "wink" },
    ],
  },
  {
    id: "create-wallet",
    title: "열쇠 보관하기",
    subtitle: "시드 구문 백업",
    badge: "열쇠 지킴이",
    badgeIcon: "K",
    xp: 150,
    intro: [
      { text: "이제 금고의 '비밀 열쇠'를 만들 차례야.", mood: "explain" },
      { text: "MetaMask를 열면 '새 지갑 만들기'가 보일 거야.", mood: "explain" },
      { text: "12개의 영어 단어가 나오는데... 이게 정말정말 중요해.", mood: "thinking" },
      { text: "이 단어들이 네 금고의 유일한 열쇠거든.", mood: "thinking" },
      { text: "종이에 적어서 안전한 곳에 보관해. 사진은 절대 안 돼!", mood: "thinking" },
      { text: "다 적었으면 아래 체크박스를 눌러줘.", mood: "cheer" },
    ],
    action: {
      type: "confirm",
      label: "완료 확인",
      confirmText: "12개 단어를 종이에 적어서 안전하게 보관했어요",
    },
    verify: "user-confirm",
    success: [
      { text: "좋아, 믿을게!", mood: "welcome" },
      { text: "열쇠를 잃어버리면 금고를 다시 열 수 없으니까 꼭 잘 보관해야 해.", mood: "thinking" },
      { text: "두 번째 퀘스트도 클리어! 점점 실력이 느는걸?", mood: "excited" },
    ],
  },
  {
    id: "connect-ttoni",
    title: "또니와 연결",
    subtitle: "지갑 연결하기",
    badge: "또니의 친구",
    badgeIcon: "F",
    xp: 200,
    intro: [
      { text: "이제 네 금고를 나한테 보여줄 차례야!", mood: "excited" },
      { text: "아래 버튼을 누르면 MetaMask 팝업이 뜰 거야.", mood: "explain" },
      { text: "'연결' 버튼만 눌러주면 돼. 간단하지?", mood: "wink" },
    ],
    action: { type: "connect", label: "MetaMask 연결하기" },
    verify: "metamask-connected",
    success: [
      { text: "연결 완료! 이제 네 지갑이 보여.", mood: "excited" },
      { text: "이 주소가 앞으로 네 스테이킹 주소가 될 거야.", mood: "explain" },
      { text: "세 번째 퀘스트 클리어! 우리 사이가 점점 가까워지는 느낌?", mood: "wink" },
    ],
  },
  {
    id: "verify-upbit",
    title: "업비트 인증",
    subtitle: "거래소 지갑 등록",
    badge: "거래소 고수",
    badgeIcon: "U",
    xp: 300,
    intro: [
      { text: "업비트에서 TON을 가져오려면 지갑 주소를 인증해야 해.", mood: "explain" },
      { text: "업비트 앱을 열어봐. 같이 하자!", mood: "cheer" },
      { text: "[MY] -> [개인지갑 주소 관리] -> [주소 등록] 순서야.", mood: "explain" },
      { text: "이더리움(ETH) 네트워크를 선택하고...", mood: "explain" },
      { text: "MetaMask 연결 버튼을 누르면 주소가 자동 입력돼.", mood: "explain" },
      { text: "마지막으로 카카오톡 인증까지 완료하면 끝!", mood: "thinking" },
      { text: "다 했으면 아래에서 확인해줘.", mood: "cheer" },
    ],
    action: {
      type: "confirm",
      label: "완료 확인",
      confirmText: "업비트에서 지갑 인증을 완료했어요",
    },
    verify: "user-confirm",
    success: [
      { text: "대단해! 이게 제일 어려운 단계였는데!", mood: "excited" },
      { text: "이제 업비트에서 이 주소로 바로 TON을 보낼 수 있어.", mood: "welcome" },
      { text: "네 번째 퀘스트 클리어! 이 정도면 프로 아니야?", mood: "proud" },
    ],
  },
  {
    id: "receive-ton",
    title: "첫 TON 받기",
    subtitle: "업비트에서 TON 출금",
    badge: "TON 홀더",
    badgeIcon: "T",
    xp: 250,
    intro: [
      { text: "이제 진짜 TON을 가져와 볼까?", mood: "excited" },
      { text: "업비트 앱에서: 출금 -> TON -> 네 MetaMask 주소 입력", mood: "explain" },
      { text: "처음엔 소액으로 테스트하는 게 좋아!", mood: "thinking" },
      { text: "10 TON 정도면 충분해. 전송되면 아래에서 확인해줘.", mood: "cheer" },
    ],
    action: {
      type: "confirm",
      label: "완료 확인",
      confirmText: "업비트에서 TON 출금을 완료했어요",
    },
    verify: "user-confirm",
    success: [
      { text: "TON이 도착했어! 이제 스테이킹 준비 완료!", mood: "excited" },
      { text: "다섯 번째 퀘스트 클리어! 거의 다 왔어!", mood: "proud" },
    ],
  },
  {
    id: "first-stake",
    title: "첫 스테이킹",
    subtitle: "스테이킹 시작하기",
    badge: "스테이킹 히어로",
    badgeIcon: "S",
    xp: 500,
    intro: [
      { text: "드디어 마지막 퀘스트야!", mood: "excited" },
      { text: "여기까지 온 너, 정말 대단해.", mood: "proud" },
      { text: "이제 대시보드로 이동해서 첫 스테이킹을 해볼까?", mood: "explain" },
      { text: "오퍼레이터를 선택하고, 원하는 만큼 TON을 스테이킹하면 돼!", mood: "cheer" },
    ],
    action: { type: "navigate", label: "대시보드에서 스테이킹 시작", route: "/dashboard" },
    verify: "user-confirm",
    success: [
      { text: "모든 퀘스트를 클리어했어!", mood: "excited" },
      { text: "너... 혹시 천재야? 이렇게 빨리 끝낼 줄 몰랐어.", mood: "proud" },
      { text: "이제부터 블록이 쌓일 때마다 시뇨리지 보상이 들어올 거야.", mood: "explain" },
      { text: "앞으로도 잘 부탁해, 파트너!", mood: "wink" },
    ],
  },
];

// ─── Typing Effect Hook ───────────────────────────────────────────────

function useTypewriter(text: string, speed = 40) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  const skip = useCallback(() => {
    setDisplayed(text);
    setDone(true);
  }, [text]);

  return { displayed, done, skip };
}

// ─── Sub Components ───────────────────────────────────────────────────

function ProgressBar({
  current,
  total,
  xp,
}: {
  current: number;
  total: number;
  xp: number;
}) {
  const pct = (current / total) * 100;
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-400">
          Quest {Math.min(current + 1, total)} / {total}
        </span>
        <span className="text-sm font-mono-num text-accent-amber">
          {xp} XP
        </span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-accent-blue to-accent-cyan rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function QuestCard({
  quest,
  index,
  status,
  isCurrent,
  onClick,
}: {
  quest: Quest;
  index: number;
  status: "locked" | "current" | "completed";
  isCurrent: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={status === "locked"}
      className={`w-full text-left p-4 rounded-xl transition-all ${
        status === "completed"
          ? "bg-accent-blue/10 border border-accent-blue/30"
          : isCurrent
            ? "bg-white/10 border border-accent-cyan/40 scale-[1.02]"
            : "bg-white/5 border border-transparent opacity-50"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
            status === "completed"
              ? "bg-accent-blue text-white"
              : isCurrent
                ? "bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/40"
                : "bg-white/10 text-gray-500"
          }`}
        >
          {status === "completed" ? quest.badgeIcon : index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className={`text-sm font-semibold ${status === "completed" ? "text-accent-sky" : isCurrent ? "text-gray-200" : "text-gray-500"}`}
          >
            {quest.title}
          </div>
          <div className="text-xs text-gray-500 truncate">{quest.subtitle}</div>
        </div>
        {status === "completed" && (
          <div className="text-xs text-accent-amber font-mono-num shrink-0">
            +{quest.xp} XP
          </div>
        )}
      </div>
    </button>
  );
}

function BadgeReveal({ quest }: { quest: Quest }) {
  return (
    <div className="flex flex-col items-center py-6 animate-fade-in">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-cyan flex items-center justify-center text-3xl font-bold text-white mb-3 animate-float">
        {quest.badgeIcon}
      </div>
      <div className="text-accent-cyan font-semibold">{quest.badge}</div>
      <div className="text-accent-amber text-sm font-mono-num mt-1">
        +{quest.xp} XP
      </div>
    </div>
  );
}

// ─── Dialogue Box ─────────────────────────────────────────────────────

function DialogueBox({
  line,
  onNext,
  isLast,
}: {
  line: DialogueLine;
  onNext: () => void;
  isLast: boolean;
}) {
  const { displayed, done, skip } = useTypewriter(line.text, 35);

  return (
    <div
      className="cursor-pointer select-none"
      onClick={() => (done ? onNext() : skip())}
    >
      <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-accent-cyan font-semibold text-sm">Ttoni</span>
          {line.mood && (
            <span className="text-xs text-gray-500">
              {MOOD_LABELS[line.mood]}
            </span>
          )}
        </div>
        <p className="text-gray-200 text-base leading-relaxed min-h-[2.5rem]">
          {displayed}
          {!done && (
            <span className="inline-block w-0.5 h-4 bg-accent-cyan ml-0.5 animate-pulse align-middle" />
          )}
        </p>
        {done && (
          <div className="text-right mt-2">
            <span className="text-xs text-gray-500">
              {isLast ? "Click to continue" : "Click to next"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Character Display ────────────────────────────────────────────────

function TtoniCharacter({ mood, phase }: { mood?: Mood; phase?: Phase }) {
  // Badge phase uses proud, action/verifying phase uses cheer
  const effectiveMood: Mood =
    phase === "badge"
      ? "proud"
      : phase === "action" || phase === "verifying"
        ? "cheer"
        : mood || "welcome";

  const imageSrc = MOOD_IMAGES[effectiveMood];
  const [prevSrc, setPrevSrc] = useState(imageSrc);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (imageSrc !== prevSrc) {
      setTransitioning(true);
      const timer = setTimeout(() => {
        setPrevSrc(imageSrc);
        setTransitioning(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [imageSrc, prevSrc]);

  return (
    <div className="relative w-48 sm:w-56 lg:w-64">
      <div className="absolute inset-0 bg-accent-blue/15 rounded-3xl blur-2xl -z-10" />
      <Image
        src={transitioning ? prevSrc : imageSrc}
        alt="Ttoni"
        width={300}
        height={300}
        className={`rounded-2xl drop-shadow-xl transition-opacity duration-200 ${
          transitioning ? "opacity-0" : "opacity-100"
        }`}
        priority
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────

type Phase = "intro" | "action" | "verifying" | "success" | "badge";

export default function OnboardingQuest() {
  const router = useRouter();
  const [questIndex, setQuestIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [connectedAddr, setConnectedAddr] = useState<string | null>(null);
  const [totalXp, setTotalXp] = useState(0);
  const [completedQuests, setCompletedQuests] = useState<Set<string>>(
    new Set()
  );
  const questAreaRef = useRef<HTMLDivElement>(null);

  // Load progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("ttoni-onboarding");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setQuestIndex(data.questIndex || 0);
        setTotalXp(data.totalXp || 0);
        setCompletedQuests(new Set(data.completed || []));
      } catch {
        // ignore
      }
    }
  }, []);

  // Save progress
  const saveProgress = useCallback(
    (qi: number, xp: number, completed: Set<string>) => {
      localStorage.setItem(
        "ttoni-onboarding",
        JSON.stringify({
          questIndex: qi,
          totalXp: xp,
          completed: Array.from(completed),
        })
      );
    },
    []
  );

  const quest = QUESTS[questIndex];
  const dialogues =
    phase === "intro" || phase === "action" || phase === "verifying"
      ? quest.intro
      : quest.success;
  const currentLine = dialogues[dialogueIndex];
  const isAllComplete = questIndex >= QUESTS.length;

  // Auto-scroll to quest area
  useEffect(() => {
    questAreaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [phase, questIndex]);

  const handleNextDialogue = () => {
    if (dialogueIndex < dialogues.length - 1) {
      setDialogueIndex(dialogueIndex + 1);
    } else if (phase === "intro") {
      setPhase("action");
    } else if (phase === "success") {
      setPhase("badge");
    }
  };

  const handleAction = async () => {
    if (!quest.action) return;

    if (quest.action.type === "link") {
      window.open(quest.action.url, "_blank");
      setPhase("verifying");
    } else if (quest.action.type === "connect") {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ethereum = (window as any).ethereum;
        if (!ethereum) {
          alert("MetaMask가 감지되지 않습니다. 먼저 설치해주세요!");
          return;
        }
        const accounts = await ethereum.request({
          method: "eth_requestAccounts",
        });
        if (accounts && accounts.length > 0) {
          setConnectedAddr(accounts[0]);
          handleVerifySuccess();
        }
      } catch {
        alert("MetaMask 연결이 취소되었습니다.");
      }
    } else if (quest.action.type === "confirm") {
      if (!confirmed) return;
      handleVerifySuccess();
    } else if (quest.action.type === "navigate") {
      handleVerifySuccess();
    }
  };

  const handleVerify = async () => {
    if (quest.verify === "metamask-installed") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ethereum = (window as any).ethereum;
      if (ethereum) {
        handleVerifySuccess();
      } else {
        alert(
          "MetaMask가 아직 감지되지 않아요. 설치 후 이 페이지를 새로고침해주세요!"
        );
      }
    }
  };

  const handleVerifySuccess = () => {
    setPhase("success");
    setDialogueIndex(0);
    setConfirmed(false);
  };

  const handleBadgeDone = () => {
    const newCompleted = new Set(completedQuests);
    newCompleted.add(quest.id);
    const newXp = totalXp + quest.xp;
    const newIndex = questIndex + 1;

    setCompletedQuests(newCompleted);
    setTotalXp(newXp);
    setQuestIndex(newIndex);
    setPhase("intro");
    setDialogueIndex(0);
    saveProgress(newIndex, newXp, newCompleted);

    // Navigate if last quest action was navigate
    if (quest.action?.type === "navigate" && quest.action.route) {
      router.push(quest.action.route);
    }
  };

  const handleQuestCardClick = (index: number) => {
    if (index <= questIndex) {
      // Can review completed quests but not change progress
    }
  };

  // ─── Render: All Complete ──────────────────────────────────────────

  if (isAllComplete) {
    return (
      <div className="min-h-screen bg-grid flex items-center justify-center px-4">
        <div className="max-w-lg mx-auto text-center animate-fade-in">
          <TtoniCharacter mood="proud" phase="badge" />
          <div className="mt-8">
            <h1 className="text-3xl font-bold text-gradient mb-4">
              All Quests Clear!
            </h1>
            <p className="text-gray-400 mb-2">
              모든 퀘스트를 클리어했어요.
            </p>
            <p className="text-accent-amber font-mono-num text-xl mb-8">
              Total {totalXp} XP
            </p>
            <div className="flex flex-wrap gap-3 justify-center mb-8">
              {QUESTS.map((q) => (
                <div
                  key={q.id}
                  className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-blue to-accent-cyan flex items-center justify-center text-lg font-bold text-white"
                  title={q.badge}
                >
                  {q.badgeIcon}
                </div>
              ))}
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-accent-blue to-accent-navy text-white font-semibold text-lg glow-blue hover:scale-105 transition-transform"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Quest in Progress ─────────────────────────────────────

  return (
    <div className="min-h-screen bg-grid">
      {/* Header */}
      <header className="border-b border-white/5 backdrop-blur-md bg-background/80 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-blue to-accent-navy flex items-center justify-center text-white font-bold text-xs">
              T
            </div>
            <span className="text-base font-bold text-gradient">Ttoni</span>
          </a>
          <span className="text-sm font-mono-num text-accent-amber">
            {totalXp} XP
          </span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <ProgressBar
          current={questIndex}
          total={QUESTS.length}
          xp={totalXp}
        />

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Quest List */}
          <div className="lg:w-64 shrink-0">
            <h3 className="text-sm text-gray-500 mb-3 font-semibold">
              Quests
            </h3>
            <div className="space-y-2">
              {QUESTS.map((q, i) => (
                <QuestCard
                  key={q.id}
                  quest={q}
                  index={i}
                  status={
                    completedQuests.has(q.id)
                      ? "completed"
                      : i === questIndex
                        ? "current"
                        : "locked"
                  }
                  isCurrent={i === questIndex}
                  onClick={() => handleQuestCardClick(i)}
                />
              ))}
            </div>
          </div>

          {/* Right: Quest Content */}
          <div className="flex-1" ref={questAreaRef}>
            {/* Quest Title */}
            <div className="mb-6">
              <div className="text-xs text-accent-cyan mb-1">
                Quest {questIndex + 1}
              </div>
              <h2 className="text-2xl font-bold text-gray-100">
                {quest.title}
              </h2>
              <p className="text-sm text-gray-500">{quest.subtitle}</p>
            </div>

            {/* Character + Dialogue Area */}
            <div className="flex flex-col items-center gap-6">
              {/* Ttoni Character */}
              <TtoniCharacter mood={currentLine?.mood} phase={phase} />

              {/* Connected Address */}
              {connectedAddr && phase === "success" && quest.id === "connect-ttoni" && (
                <div className="w-full p-3 rounded-lg bg-white/5 border border-accent-cyan/20 text-center">
                  <div className="text-xs text-gray-500 mb-1">Your Address</div>
                  <div className="font-mono text-sm text-accent-cyan break-all">
                    {connectedAddr}
                  </div>
                </div>
              )}

              {/* Badge Reveal */}
              {phase === "badge" && (
                <div className="w-full">
                  <BadgeReveal quest={quest} />
                  <button
                    onClick={handleBadgeDone}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-blue to-accent-navy text-white font-semibold hover:scale-[1.02] transition-transform"
                  >
                    {questIndex < QUESTS.length - 1
                      ? "Next Quest"
                      : "Complete!"}
                  </button>
                </div>
              )}

              {/* Dialogue */}
              {(phase === "intro" || phase === "success") && currentLine && (
                <div className="w-full">
                  <DialogueBox
                    line={currentLine}
                    onNext={handleNextDialogue}
                    isLast={dialogueIndex === dialogues.length - 1}
                  />
                </div>
              )}

              {/* Action Phase */}
              {phase === "action" && quest.action && (
                <div className="w-full space-y-4">
                  {/* Action-specific UI */}
                  {quest.action.type === "link" && (
                    <button
                      onClick={handleAction}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-accent-blue to-accent-navy text-white font-semibold text-lg hover:scale-[1.02] transition-transform"
                    >
                      {quest.action.label}
                    </button>
                  )}

                  {quest.action.type === "connect" && (
                    <button
                      onClick={handleAction}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-accent-blue to-accent-navy text-white font-semibold text-lg hover:scale-[1.02] transition-transform"
                    >
                      {quest.action.label}
                    </button>
                  )}

                  {quest.action.type === "confirm" && (
                    <div className="space-y-3">
                      <label className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                        <input
                          type="checkbox"
                          checked={confirmed}
                          onChange={(e) => setConfirmed(e.target.checked)}
                          className="mt-0.5 w-5 h-5 rounded accent-accent-cyan"
                        />
                        <span className="text-gray-300 text-sm">
                          {quest.action.confirmText}
                        </span>
                      </label>
                      <button
                        onClick={handleAction}
                        disabled={!confirmed}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-accent-blue to-accent-navy text-white font-semibold text-lg disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] transition-transform"
                      >
                        {quest.action.label}
                      </button>
                    </div>
                  )}

                  {quest.action.type === "navigate" && (
                    <button
                      onClick={handleAction}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-accent-blue to-accent-navy text-white font-semibold text-lg hover:scale-[1.02] transition-transform"
                    >
                      {quest.action.label}
                    </button>
                  )}
                </div>
              )}

              {/* Verifying Phase (MetaMask install check) */}
              {phase === "verifying" && (
                <div className="w-full space-y-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-gray-400 text-sm mb-4">
                      MetaMask 설치를 완료했으면 아래 버튼을 눌러주세요.
                    </p>
                    <button
                      onClick={handleVerify}
                      className="px-8 py-3 rounded-xl bg-gradient-to-r from-accent-blue to-accent-navy text-white font-semibold hover:scale-[1.02] transition-transform"
                    >
                      설치 확인하기
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
