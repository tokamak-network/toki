# Toki 허브 개편 — UI/UX 레퍼런스 큐레이션

> **상태:** 리서치 참고자료 (개편 디자인용)
> **작성:** 2026-06-10
> **맥락:** toki를 **토카막 생태계 단일 허브 + 마스코트 미니월렛**으로 개편. 타깃 = 비크립토 유저. 묶는 서비스 = 스테이킹 + 복권/게임 + 프라이빗 전송. 임베디드 지갑(Privy) + 가스리스 + Ethereum L1 메인넷.
> **목적:** 다른 세션(토키 허브 논의)에서 화면 설계 시 참조. 전부 실제 출시 제품 + toki가 차용할 구체 패턴 + URL.

---

## 0. 먼저 — toki가 가장 먼저 뜯어볼 5개 (우선순위)

| # | 레퍼런스 | toki에 주는 핵심 한 가지 | URL |
|---|---|---|---|
| 1 | **Base App** (Coinbase) | 단일 체인 소비자 허브의 1:1 모델 — featured 캐러셀 + 카테고리 그리드 + 핀 고정, 온보딩에서 "관심 카테고리 고르기"로 홈 개인화 | https://www.coinbase.com/wallet |
| 2 | **Backpack** | "서비스는 월렛 *안에서* 실행"(xNFT/Blinks) — 스테이킹·복권·전송을 외부 dApp 탭아웃이 아니라 in-shell 패널로 | https://backpack.app |
| 3 | **Toss (토스)** | 친화 금융 UX 교과서 — 만보기/행운퀴즈식 매일 오는 훅 + A/B 검증 UX 라이팅 규칙 | https://toss.tech/article/8-writing-principles-of-toss |
| 4 | **Duolingo (Duo)** | 감정 스프라이트 ↔ 앱 상태 1:1 매핑 로직 (toki 스프라이트 셋이 이미 Duo 구조) | https://www.925studios.co/blog/duolingo-design-breakdown |
| 5 | **Railway Wallet (RAILGUN)** | 프라이빗 전송 1:1 모델 — Public/Private 토글 + Pending/Spendable 잔액 분리 | https://help.railway.xyz |

---

## 1. 허브 / 월렛-셸 구조 (서비스를 지갑 중심으로 묶는 법)

### Base App (Coinbase) — https://www.coinbase.com/wallet
2025-07 Coinbase Wallet 리브랜드. 지갑 + 소셜 피드 + 미니앱 + 결제를 Base 위에 통합.
- **미니앱이 별도 스토어가 아니라 홈 피드에 인라인.** 즐겨찾기 핀, promoted, trending이 홈에 직조됨.
- 상단 trending 탭 + featured 캐러셀 + 카테고리 행(Games/Social/Art…). → **toki 디렉토리 직접 템플릿.**
- 멘탈모델 Chain(인프라)/Build(개발)/**App(소비자 게이트웨이)** — toki는 토카막의 "App" 레이어.
- 온보딩: 계정 생성 → (선택)신원 → **관심 카테고리 고르기** → 끝. 마지막 단계가 홈 즉시 개인화.

### Backpack — https://backpack.app
Solana 기반 멀티체인 지갑 + 인월렛 미니앱(xNFT) 선구자.
- **서비스가 월렛 샌드박스 안에서 실행**(per-app 권한). 외부 사이트 임베디드 브라우저로 튕기지 않음.
- **"Blinks" 액션 카드** — earn/buy/collect/vote를 한 클릭, 떠나지 않고 실행. 자기네가 지적한 함정: "Explorer 탭 링크아웃 → 마찰·이탈".
- 기능을 Exchange/Wallet/Rewards 기둥으로 그룹.
- → **toki도 탭아웃 금지, 각 서비스 = in-shell 패널 원칙.**

### Step Finance — https://www.step.finance
"front page of Solana" — 한 생태계 ~95% 프로토콜을 한 화면에.
- 순자산 파이차트 + 내장 swap/staking + "Wallet Cleanup" 유틸 + 인라인 뉴스/교육(SolanaFloor).
- → **"토카막의 첫 페이지" 포지셔닝 카피.** 마스코트가 인라인으로 "설명"하는 것과 궁합.

### Phantom — https://phantom.com
15M+ MAU 멀티체인 지갑, "invisible multichain".
- **홈 탭을 섹션 스택**(Recent Activity/Cash/Predictions…)으로. → toki 홈 = 스테이킹/복권/전송 섹션 스택.
- 멀티체인·네트워크 아이콘 기본 숨김(Solana-only 모드). → **체인·가스 기계장치 0 노출.**

### World App (Worldcoin) — https://world.org/world-app
MAU 기준 최다 사용 셀프커스터디 지갑(2025-09), 150+ 미니앱, 가스프리.
- 미니앱을 **폰 홈스크린에 핀** + OS 검색에 노출. 습관적 서비스(스테이킹)에 강력.
- **"일상에 쓸모 있는 슬라이스만 노출"** — 점진적 노출 거버닝 원칙.
- **공용 Mini Apps UI Kit + MiniKit SDK** — 1st/3rd파티 UX 일관성. (toki 서비스 다 1st파티여도 공용 컴포넌트 킷 정의 가치)
- 햅틱·네이티브 로드 등 "네이티브 느낌"을 명시 목표로 출하.

### 대조군 — nav 철학 스펙트럼
- **OKX Wallet** (https://web3.okx.com) — Discover를 하단 nav 상시 슬롯(1,000+ dApp 거대 디렉토리), 카테고리/랭킹/☆즐겨찾기.
- **Binance Web3** (https://www.binance.com/en/web3wallet) — 자산 중심 홈 + Earn/Airdrops 단축, MPC seedless 온보딩.
- → **toki는 서비스 ~3개 → 큐레이션 홈(Binance/Base형) 채택, OKX의 ☆즐겨찾기/핀만 차용.**

---

## 2. 마스코트 / 캐릭터 레이어 (toki 시그니처)

### Duolingo (Duo) — https://www.925studios.co/blog/duolingo-design-breakdown
"마스코트가 곧 제품"의 정석.
- **감정 스프라이트 1개 = 앱 상태 1개**(정답=happy / 완료=proud / 마일스톤=celebrate+컨페티 / 유휴=sleeping / 신기능·스트릭=excited / 스트릭위기=sad). toki 셋(welcome/explain/thinking/excited/proud/cheer/wink/celebrate/sleeping)과 거의 1:1.
- **단순 도형 조합** — 작은 화면서도 읽힘·재포즈 저렴 (모바일 compact 모드 필수).
- **의인화된 stakes** — 슬픈 캐릭터라 푸시가 "잔소리"가 아닌 "귀여움". toki는 스테이킹/복권 마감·미수령 리워드에 적용.

### Finch — https://finchcare.com
자기관리하면 자라는 펫. 다운로드 90일 234만, App Store Editors' Choice.
- **온보딩 = 기능투어가 아니라 알 부화 + 이름짓기 + 성격 고르기**(커밋 전 감정 앵커).
- **care-loop**: "내 자기관리 → 펫이 자람". → **스테이킹을 "금융"이 아니라 "toki 키우기"로 리프레임.**
- 쓰다듬을 때 햅틱·성취 시 무게감 햅틱. 온보딩 내내 같은 primary 버튼(라벨만 변경).

### Aavegotchi — https://www.aavegotchi.com
가장 가까운 *크립토 네이티브* 선례.
- **귀여운 컴패니언 = 이자 붙는 자산이 같은 객체**(Aave aToken 백킹). toki 스테이킹 포지션을 레벨업하는 캐릭터로 감싸는 것 정당화.
- 참여(미니게임/거버넌스)로 희귀도 진척. 착용 wearable로 정체성 레이어.

### Axie "Axie Pals" — https://playtoearn.com/news/axie-infinity-launched-ai-powered-axie-pals-to-help-users-take-care-of-their-axie-nfts
- **"Care Index"** = 매일 상호작용 보상하는 단일 지표. 핵심행동(스테이킹)이 드문 제품의 retention 루프.
- 컴패니언이 잡일 대행 → toki가 최적 operator pick·수령가능 리워드·복권 상태를 선제 노출.

### Genshin Wish + 가챠 reveal 심리 — https://www.pcgamer.com/behind-the-addictive-psychology-and-seductive-art-of-loot-boxes/
- **3막 reveal**(intro→falling stars→result), 색으로 희귀도 긴장 전달(파랑→금).
- **도파민은 결과 직전 빌드업에 피크** → reveal 전 애니메이션에 투자.
- → **복권/카드 reveal 연출 레시피**(bronze→black 티어 색). **금지선: near-miss(거의 당첨) 조작.**

---

## 3. 한국 친화 금융 UX (비크립토 유저 설득의 정석 — 사용자 한국인이라 최우선)

### Toss (토스) — https://toss.tech/article/8-writing-principles-of-toss · https://think-note.com/pedometer/
- **만보기/행운퀴즈 = 드문 핵심행동(스테이킹) 주위에 까는 "매일 오는 훅".** 보상 노드 트레일 + 또래 비교. (만보기 누적 400만, 금융기피 고연령 유입)
- **UX 라이팅 규칙 그대로 채용**: 행위자 시점("어디로 보낼까요?"), 해요체, 능동태, 긍정 프레이밍, **"취소" 대신 "닫기"**(작업 취소 오해 방지), 안 쓰는 단어 제거(잡초뽑기). 전부 A/B 검증.
- 신기능 *첫 사용 허들*에 정확히 돈 써서 활성화 절벽 넘김.

### KakaoBank — https://blog.kakaobank.com/195 · https://cm.asiae.co.kr/en/article/2025112409102248810
- **AI Transfer**: "은행+계좌+금액"을 자연어 한 문장으로, 아는 사람은 별명("엄마") → 확인이 안전장치. → **프라이빗 송금을 "문자 보내듯" + 확인을 마지막 게이트로.**
- 청중별 캐릭터 차등(메인 vs 일상/틴). 캐릭터 카드가 *자랑하는 소셜 오브젝트* → toki 티어 카드백.

### KakaoPay — https://ifdesign.com/en/winner-ranking/project/kakaopay-app-20/350633
- **위젯형 개인화 홈** — "IT/금융 낯선 사람용". → 스테이킹+복권+전송을 위젯 보드로 안 어지럽게.
- **1원 인증** 마이크로 인터랙션 — 입금자명 4글자 읽어 확인. 크립토 수신자 확인의 친화 변형.

### 당근(Karrot) — https://about.daangn.com
- **따뜻함을 시스템으로**: 둥근 휴머니스트 전용 서체(Karrot Sans) + 권한 요청 시 안심 카피("이 위치는 근처 물건 찾기에만 써요. 공유 안 해요").
- **거래 온도** = 남이 매기는 비-게임화 신뢰 지표. → **지갑/시드/권한 순간의 안심 카피 + 둥근 서체로 정서 작업.**

### (반면교사) Naver Pay PayPet
- 캐릭터+포인트 뽑기 붙였지만 Toss/KakaoPay 대비 "안 친절" 평. → **IA 먼저, 마스코트는 정서 스킨**(네비게이션 해결책 아님).

---

## 4. 프라이빗 전송 + 느린 증명 + 가스리스 (어려운 부분)

### Railway Wallet (RAILGUN) — https://help.railway.xyz
- **우상단 Public/Private 토글** — 전체 잔액뷰를 공개/쉴디드(`0zk`)로 전환. "두 잔액, 한 지갑"의 가장 깔끔한 멘탈모델.
- **쉴디드 잔액 = 단일 숫자 아님**: Pending(1h 대기)/Spendable/Incomplete(증명 대기)/Restricted. → "돈은 여기 있지만 다 쓸 수 있는 건 아니다"를 정직하게.
- 수수료를 보유 토큰으로(Broadcaster 릴레이어) → 프라이빗 ETH 불필요. **잔액 동기화 "몇 분 걸려요" 명시.**

### Zcash Zashi/Zodl — https://zodl.com
- shielded-by-default(투명자금은 먼저 쉴드해야 사용 가능).
- 투명자금 감지 시 **"Shield" 한탭 위젯**으로 다음수 제안.
- **Total vs Spendable 2잔액.**
- **프라이버시 깨지는 순간(deshield/출금) 정확히 경고**: "거래 정보를 공개하려 합니다." → **출금 플로우 필수 카피.**

### Privacy Pools (0xbow) — https://privacypools.com
- Vitalik 공저, 2025 메인넷 라이브. 컴플라이언스 친화(프라이빗 *하면서* "깨끗한 자금" 증명).
- **쉴디드 전용 복구문구 + "메인 지갑 시드 절대 입력 금지" 반복 경고.**
- 입금 후 **"이제 익명 집합에 합류했어요"** 확인 — 보이지 않는 암호 이벤트를 구체 상태로.
- 증명 자동 in-browser, "Confirm" 한 번에 zk 복잡도 은닉.

### 보조 프라이버시 레퍼런스
- **Firn** (https://docs.firn.io) — *암호화 잔액* 멘탈모델("나만 복호화"). 비크립토 유저엔 UTXO note보다 직관적일 수 있음(네이밍 참고).
- **Fluidkey/Umbra** (https://www.fluidkey.com) — 숨은 다수 주소 위 통합 단일잔액 뷰. **doxxed 출금주소 경고**(ENS/NFT/POAP 보유 주소로 출금 시 경고) = 프라이버시 자폭 1위 방지.
- **Tornado Cash** (역사적 참고만) — 익명집합 크기 표시(Sybil로 부풀 수 있음 → 표시하면 정직하게 단서), **출금 전 권장 대기**(시간연관 추적 방지) 교훈. 컴플라이언스 적대 프레이밍은 회피.

### 느린 zk 증명 UX (30s~2min) — https://aztec.network/blog/client-side-proof-generation · https://smart-interface-design-patterns.com/articles/designing-better-loading-progress-ux/
1. **증명은 백그라운드 잡** — 3초 넘으면 백그라운드. 즉시 "생성 중" 확인 + 나머지 UI 사용 가능 + 완료 알림.
2. **침묵 = 고장으로 읽힘** — 항상 active 인디케이터 + "왜" 메시지.
3. **단계 체크리스트 > 맨 스피너** — 회로생성→witness→증명→검증. 이탈 측정상 감소.
4. 추정 가능하면 결정형 진행바(앞 빠르게/끝 느리게 = 더 빠르게 체감).
5. **탭 전환·잠금 후 복귀 시 잡 상태 복원**(처음부터 다시 = 신뢰 파괴).
6. 능동적 대기 — 대기 중 다음 액션 큐잉 / 설명 읽기. "추적 불가능하게 만드는 중"처럼 *가치* 전달 시 인내 상승.
7. **플레이풀 대기(마스코트 적합)**: 증명 중 `toki-thinking`, 완료 시 `toki-excited`/`celebrate`, 회전 한줄 설명. → **대기시간을 브랜드·교육 시간으로.**
8. 부분실패·재시도 명시(idempotent/backoff).

### 가스리스 / AA UX
- **Daimo** (https://paydocs.daimo.com/how-it-works) — 가스 완전 은닉, **신규유저 가스리스 시작**, intent 주소, **낯선 주소 송금 경고.**
- **Coinbase Smart Wallet** (https://help.coinbase.com/en/wallet/getting-started/smart-wallet) — **패스키(Face ID) 온보딩 시드 0**, paymaster(ERC-7677) 가스 스폰서, **배치 트랜잭션**(approve+swap+transfer 한 확인) → toki는 **deposit+shield를 한 서명으로 배치.**
- **Peanut** (https://peanut.to) — **링크로 송금**(주소 불필요, 수신 단계 은닉) + 가스리스 수령 + **24h 자동 회수** 안전망.
- **Argent** — guardian 소셜복구 + 48h 보안지연 → 쉴디드 키(분실=영구손실) 보호 모델.

---

## 5. toki에 바로 적용할 종합 원칙

1. **큐레이션 홈 > 거대 디렉토리** (서비스 3개 — Base/Binance형 섹션 홈 + 핀)
2. **체인·가스·시드 0 노출** (Phantom invisible + World 유용한 슬라이스 + Privy seedless)
3. **서비스 = in-shell 패널** (Backpack, 탭아웃 이탈 함정 회피)
4. **마스코트는 연결조직** (온보딩 내레이션 + 인라인 설명 + 복권/증명 대기 연출), 단 **IA 먼저 · 스킵/오토 제공**(파워유저 배려)
5. **프라이버시는 "익명"이 아니라 "프라이빗"** — 깨지는 순간(입출금) 정직 경고 + doxxed 주소 경고 + 권장 대기

### 마스코트/대사 UX 함정 (파워유저 배려)
- 크립토 네이티브·반복 스테이커는 온보딩 스킵 선호 → 대사로 게이팅 금지.
- **두 경로 분기**: 신규=가이드 / 숙련=퀵스타트(가입 데이터로 라우팅).
- 가벼운 마찰의 탈출(X) 항상 제공하되 너무 공짜 스킵도 지양.
- VN 관례 day1부터: **skip(읽은 텍스트 기본) + auto + CTC 마커**, auto 속도에서도 읽히는 페이싱(같은 스테이킹 화면 50번 내레이션 = 마찰).

---

## 6. ⚠️ toki-특이 주의 (L1 메인넷)

위 가스리스 레퍼런스 다수(Daimo / Coinbase SW / Aztec / Fluidkey-on-Base)는 **싸구려 L2 기반**. toki는 **Ethereum L1 메인넷(chainId 1)** 이라 스마트계정+paymaster+zk 가스가 훨씬 비쌈 → 가스리스 약속은 **paymaster 경제에 더 의존**. **L1 직결 프라이버시 레퍼런스 = Railgun / Privacy Pools / Firn / Umbra**(나머지 L2는 UX 영감용, 아키텍처 템플릿 아님).

---

## 7. 토키 허브 세션에 붙일 한 줄 요약

> 구조는 **Base App/Backpack**(단일 생태계 큐레이션 홈 + in-shell 패널), 정서는 **Duolingo/Finch/Toss**(감정 스프라이트 매핑 + care-loop + 친화 라이팅), 프라이빗 전송은 **Railgun/Zcash/Privacy Pools**(Public/Private 토글 + 출금 시 정직 경고 + 컴플라이언스 프레이밍), 느린 증명은 **백그라운드 잡 + 단계 체크리스트 + thinking 마스코트**로 푼다. 체인·가스·시드는 끝까지 숨기되, 프라이버시 한계는 정직하게 노출.
