# Toki 허브 IA + 네비게이션 설계

> **상태:** 설계 (개편 1단계 — IA/네비게이션) · 미구현
> **작성:** 2026-06-10
> **맥락:** toki를 토카막 생태계 **단일 허브 + 마스코트 미니월렛**으로 개편. 본 문서는 [[hub-uiux-references]]의 원칙("IA 먼저, 마스코트는 정서 스킨")을 토키 실제 코드에 매핑한 화면 구조 설계. 다음 단계(마스코트 온보딩 플로우, 프라이빗 전송 UX)는 이 위에 얹는다.

---

## 0. 현재 구조 진단 (왜 바꾸나)

| 문제 | 현재 | 근거 파일 |
|---|---|---|
| 진입점 파편화 | 상단 nav(Quests/Staking/Ecosystem/GitHub) → 각각 독립 풀스크린 | `src/components/layout/Header.tsx:51-155` |
| 모바일 영속 nav 없음 | 하단 탭바 부재, 인라인 링크 의존 | (없음) |
| 허브 통합 약함 | 대시보드가 greeting+wallet+런처를 한 페이지에 길게 쌓음 | `src/components/dashboard/DashboardContent.tsx:302-566` |
| 지갑 정체성 흐림 | "미니월렛"인데 잔액/받기/포지션이 대시보드 카드 한 덩어리에 묻힘 | `DashboardContent.tsx:332-495` |
| 서비스 디렉토리 = 단순 링크 | AppLauncher 4타일(상태 배지만) | `src/components/dashboard/AppLauncher.tsx:14-19` |

**보존할 자산:** 풍부한 마스코트/VN 시스템(`VNStakingPanel.tsx`의 `getMoodForPhase` / `MOOD_IMAGES` / `useTypewriter` / `DialogueBoxVN`), 16무드 스프라이트, `services.json`(66+ 생태계), 다크 시안/블루 테마 + `.card` + `max-w-4xl`.

---

## 1. 네비게이션 모델 — 모바일 우선 하단 탭 4개

레퍼런스: Phantom(홈 탭=섹션 스택), Base(큐레이션 홈), Binance(자산+Earn 단축), "nav 3-5개로 짧게"(Zerion). 서비스가 ~3개라 **큐레이션 홈** 채택, 거대 디렉토리(OKX) 회피.

```
┌──────────────────────────────────────┐
│             (현재 화면)                │
│                                        │
│                                        │
├──────────────────────────────────────┤
│   🏠       👛       🃏       🐰        │  ← 영속 하단 탭 (모바일)
│   홈      지갑    컬렉션    토키       │
└──────────────────────────────────────┘
```

| 탭 | 라우트 | 역할 | 아이콘 |
|---|---|---|---|
| **홈** | `/dashboard` (허브 홈) | 인사 + 지갑 스냅샷 + 서비스 타일 + 넛지 | 집 |
| **지갑** | `/wallet` (신규) | 잔액 상세 + 받기 + 스테이킹 포지션 + 출금 + 거래내역 | 지갑 |
| **컬렉션** | `/collection` | 업적/카드 갤러리 | 카드 |
| **토키** | `/toki` (신규) | 컴패니언 + 챗 + 퀘스트/도움말 | 토키 얼굴 |

- **서비스는 탭이 아님.** 홈 타일에서 *풀스크린 VN 경험*으로 열림(스테이킹/생태계/프라이빗전송/복권). = "월렛 안에서 앱 실행" 패턴(Backpack), 탭아웃 이탈 함정 회피.
- **데스크톱:** 기존 `Header.tsx` 상단 nav 유지(탭과 동일 목적지로 정렬), 하단 탭바는 `lg:` 이상에서 숨김.
- **퀘스트/온보딩**: 별도 탭 대신 신규 유저 홈 카드 + 토키 탭에서 접근(완료 시 홈에서 사라짐 — 점진적 노출).

---

## 2. 홈 (허브) 구성 — 섹션 스택

레퍼런스: Phantom(섹션 스택) + Base(서비스 그리드 + featured) + Binance(자산 스냅샷) + Toss/Zcash(상태 기반 단일 넛지) + Finch(부화형 온보딩 카드).

```
┌──────────────────────────────────────┐
│ 🐰  안녕 민지!            🌐 ⚙️ 🔔   │  ① 헤더바: 토키 미니 + 인사 + 설정/언어/알림
├──────────────────────────────────────┤
│ ┌──────────────────────────────────┐ │
│ │ 내 자산                          │ │  ② 지갑 스냅샷 (compact)
│ │  1,240 TON                       │ │     - 총 TON 크게 (ETH/가스 숨김)
│ │  스테이킹 중 800 · 유휴 440      │ │     - 보조 한 줄
│ │  [ 받기 ]      [ 지갑 열기 → ]   │ │     - 받기 / 지갑 탭으로
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ 🐰 "440 TON이 놀고 있어! 스테이킹할까?"│ ③ 토키 넛지 (조건부 1개)
│ │                      [ 스테이킹 ] │ │     - 상태 기반 단일 CTA + 무드
│ └──────────────────────────────────┘ │
│  서비스                                │  ④ 서비스 타일 2×2 (the hub)
│ ┌────────────┐ ┌────────────┐        │     - 상태 배지(LIVE/곧) + 토키 미니
│ │ 💠 스테이킹 │ │ 🕶️ 프라이빗 │        │     - 핀/즐겨찾기(☆)
│ │   LIVE     │ │   전송 · 곧 │        │
│ └────────────┘ └────────────┘        │
│ ┌────────────┐ ┌────────────┐        │
│ │ 🎮 게임·복권│ │ 🧭 생태계   │        │
│ │   이벤트 중 │ │   LIVE     │        │
│ └────────────┘ └────────────┘        │
│ ┌──────────────────────────────────┐ │
│ │ 토키랑 시작하기            2/5   │ │  ⑤ 퀘스트 진행 카드 (신규 유저만)
│ │ ●●○○○  다음: 거래소에서 TON 받기 │ │     - 완료 시 숨김
│ └──────────────────────────────────┘ │
│  토카막 생태계                전체 → │  ⑥ 생태계 하이라이트 (가로 스크롤)
│ [◧][◧][◧][◧][◧]  →                    │     - services.json 미리보기 → /explore
├──────────────────────────────────────┤
│   🏠       👛       🃏       🐰        │
└──────────────────────────────────────┘
```

**섹션 규칙:**
1. **헤더바** — 토키 미니 스프라이트(무드 반영) + "안녕 {이름}!" + 언어토글/설정/알림. (`ConnectButton.tsx` 멤버카드는 ⚙️ 또는 토키 탭으로)
2. **지갑 스냅샷** — 총 TON 중심, ETH·가스·체인 숨김(Phantom invisible). [받기] + [지갑 열기]로 지갑 탭.
3. **토키 넛지** — 상태당 *단 하나*의 CTA(Zcash "smartest next move"). 토키 대사 + 무드. 없으면 미표시.
4. **서비스 타일 2×2** — AppLauncher 진화: 상태 배지 + 토키 미니 + ☆핀. 탭 시 풀스크린 VN.
5. **퀘스트 진행 카드** — 신규 유저만, 프로그레스 + 다음 할 일 1개. 완료 시 사라짐.
6. **생태계 하이라이트** — `services.json` 미리보기 가로 스크롤 + "전체 →" → `/explore` VN. (Base discover-in-feed)

---

## 3. 지갑 탭 구성 (미니월렛 정체성)

현재 `DashboardContent.tsx:332-495`의 지갑 덩어리를 독립 탭으로 승격·정리.

```
┌──────────────────────────────────────┐
│ 내 지갑              Ethereum Mainnet │  총 자산 + 네트워크 라벨
│ 0xAb…39   📋                          │  주소 + 복사
├──────────────────────────────────────┤
│ TON              1,240   (≈ ...)      │  잔액 상세
│ 스테이킹된 TON      800               │   - TON / 스테이킹된 TON
│ ETH                0.012  ▸ 더보기     │   - ETH는 보조(접힘)
├──────────────────────────────────────┤
│ 스테이킹 포지션                        │  operator별 원금/세뇨리지/출금
│ • Operator A  원금 500  +12.3 세뇨    │  (StakingSummaryCard 재사용)
│ • 출금 준비됨 200       [ 출금 ]      │  (모바일 출금 실행 유지)
├──────────────────────────────────────┤
│ [ 받기 ]  [ Etherscan ]  [ 새로고침 ] │  액션
│ [ 알림 켜기 ]                          │
├──────────────────────────────────────┤
│ 거래 내역 ▸                            │  (있으면)
│ 연결된 계정 / 지갑 ▸                   │  Privy linked accounts
└──────────────────────────────────────┘
```

향후 **프라이빗 전송**이 붙으면 지갑 탭 상단에 [[private-transfer-integration-plan]]의 **Public/Private 토글**(Railgun 패턴)이 들어갈 자리.

---

## 4. 서비스 실행 동작 (in-shell)

| 유형 | 서비스 | 동작 | 하단 탭 |
|---|---|---|---|
| 몰입형 VN | 스테이킹(`/staking`), 생태계(`/explore`), 프라이빗 전송(`/private-transfer`) | 풀스크린 takeover + ← 허브로 | 숨김 |
| 경량 | 지갑, 컬렉션 | 셸 내 | 유지 |
| 이벤트 | 복권(`/lottery`), 이벤트(`/event`) | 시즌 시 홈 타일/배너 노출 | 컨텍스트 |

몰입형은 풀스크린이되 **명확한 "← 허브" 복귀**가 필수(World/Backpack 인셸 느낌). 기존 VN 화면 그대로 재사용.

---

## 5. 마스코트 통합

- **홈 헤더바**: 미니 welcome 스프라이트, 무드=상태 반영(유휴=sleeping, 리워드 준비=excited, 신규=welcome). Duolingo 감정-상태 매핑.
- **서비스 VN**: 기존 패턴(`VNStakingPanel` mood/dialogue) 유지.
- **토키 탭**: 풀 컴패니언 + 챗(`TokiChat`) + 퀘스트/도움말 통합. (care-loop: 매일 복귀 반응, "다음 최적 행동" 선제 노출 — Axie Care Index, 후속)
- **파워유저 배려**: VN skip(읽은 텍스트)/auto/CTC 마커 day1 제공, 퀘스트 카드 자동 숨김.

---

## 6. 점진적 노출 — 유저 상태별 홈

| 상태 | 지갑 스냅샷 | 넛지 | 서비스 타일 | 퀘스트 카드 |
|---|---|---|---|---|
| 신규(자금X) | "받아서 시작하기" | "토키랑 지갑부터 만들자" | 대부분 잠금/곧 | **최상단 강조** |
| 자금 보유(스테이킹X) | 유휴 TON 강조 | "스테이킹하자"(스테이킹 타일 글로우) | 스테이킹 LIVE 강조 | 진행 중 |
| 액티브 스테이커 | 세뇨리지 표시 | 리워드/출금 준비 | 전체 활성 | 숨김 |
| 파워유저 | compact | 최소 | ☆핀 정렬 | 숨김 + VN 빠르게 |

---

## 7. 파일 단위 변경 (실제 경로)

### 신규
```
src/components/layout/BottomNav.tsx        # 영속 하단 탭 4개 (모바일), lg:hidden
src/app/wallet/page.tsx                     # 지갑 탭 라우트
src/components/wallet/WalletContent.tsx     # 잔액/포지션/받기/출금 (DashboardContent에서 추출)
src/components/hub/HubHome.tsx              # 허브 홈 (섹션 스택)
src/components/hub/WalletSnapshotCard.tsx   # compact 지갑 스냅샷
src/components/hub/ServiceTileGrid.tsx      # AppLauncher 진화 (핀/상태/마스코트)
src/components/hub/ContextNudge.tsx         # 상태 기반 단일 CTA
src/components/hub/QuestProgressCard.tsx    # 신규 유저 온보딩 진행
src/components/hub/EcosystemHighlightRow.tsx# services.json 미리보기 행
src/app/toki/page.tsx                       # 토키 컴패니언 탭 (챗+퀘스트+도움말)
```

### 리팩터
```
src/components/dashboard/DashboardContent.tsx  → HubHome(홈) + WalletContent(지갑) 분리
src/components/dashboard/AppLauncher.tsx       → ServiceTileGrid (핀/상태배지/토키 미니)
src/app/dashboard/page.tsx                     → <HubHome/> 렌더
src/app/layout.tsx                             → <BottomNav/> 마운트 (모바일)
src/components/layout/Header.tsx               → 데스크톱 nav를 탭 4개에 정렬, 단순화
```

### 유지 (서비스 경험으로 그대로)
```
/staking (VNStakingPanel) · /explore (ExploreContent) · /onboarding (OnboardingQuest)
/collection (CardCollection) · /lottery · /event · /private-transfer
+ VN mood/dialogue 시스템 (신규 서비스 VN에 재사용)
```

### i18n (`hub.*`, en.ts + ko.ts 동시)
```
navHome / navWallet / navCollection / navToki
walletSnapshotTitle / totalAssets / staked / idle / receive / openWallet
serviceStaking / servicePrivate / serviceGames / serviceEcosystem
statusLive / statusSoon / statusEvent
nudgeStakeIdle / nudgeReceiveFirst / nudgeWithdrawReady / nudgeRewardReady
questProgress / questNext / ecosystemTitle / ecosystemSeeAll
```

---

## 8. 단계적 구현 (논브레이킹 순서)

| 단계 | 내용 | 비고 |
|---|---|---|
| **P1** | `BottomNav.tsx` + 4 라우트 셸(홈/지갑/컬렉션/토키) 마운트 | 논브레이킹, 기존 화면 위에 탭만 추가 |
| **P2** | `DashboardContent` → `HubHome` + `WalletContent` 분리, `/wallet` 신설 | 지갑 정체성 확립 |
| **P3** | `ServiceTileGrid`(핀/상태/마스코트) + `ContextNudge` + `QuestProgressCard` | 허브 홈 완성 |
| **P4** | `EcosystemHighlightRow` + 토키 컴패니언 탭(`/toki`) | 생태계 + 마스코트 허브 |
| **P5** | 점진적 노출 상태머신 + VN skip/auto 폴리시 | 파워유저 배려 |

> P1은 기존 화면을 건드리지 않고 하단 탭만 얹는 안전한 시작점.

---

## 9. 한 줄 요약 (허브 세션용)

> 모바일 **하단 탭 4개(홈/지갑/컬렉션/토키)** + **큐레이션 허브 홈**(지갑 스냅샷 → 토키 넛지 1개 → 서비스 2×2 → 퀘스트/생태계). 서비스는 탭이 아니라 홈 타일에서 풀스크린 VN으로 인셸 실행. 지갑 탭이 미니월렛 정체성(향후 Public/Private 토글 자리). 체인·가스·시드 숨기고 마스코트가 연결조직. P1=하단탭만 얹는 논브레이킹 시작.
