# toki — 발견(Discovery) 표면 등재 + AI 에이전트 대상 홍보 실행 패키지

> 작성 2026-06-09. 목적: TON 홀더가 *"어디서 스테이킹?"* 찾을 때 toki가 뜨게 하는 등재 작업(Part A) + 그 *같은* 데이터가 LLM·AI 에이전트의 답이 되게 하는 작업(Part B).
> **핵심 통찰:** Part A(데이터 등재) = Part B(에이전트 발견)의 토대. LLM/에이전트는 "TON 스테이킹 어디서?"를 CoinGecko·StakingRewards·DefiLlama·Reddit에서 끌어온다. 따라서 두 작업은 같은 표면에서 만난다.
>
> ⚠️ 제출 자체는 계정/권한(프로젝트 오너십)이 필요해 *대신 해줄 수 없음* — 아래는 제출에 필요한 모든 데이터·문구·절차를 준비한 패키지. 사람이 폼만 넣으면 됨.

---

## 공통 데이터 (모든 제출에 재사용)

| 항목 | 값 |
|---|---|
| 토큰 | **Tokamak Network TON** (거래소엔 보통 티커 **TOKAMAK**) |
| ⚠️ 네이밍 | **Toncoin(TON 블록체인)과 다른 토큰.** 모든 등재·문서에서 "Tokamak Network TON (ERC-20, Ethereum)"로 명시 — LLM·에이전트가 Toncoin과 혼동함 |
| 체인 | **Ethereum mainnet (L1), chainId 1** (Tokamak L2 아님) |
| TON 컨트랙트 | `0x2be5e8c109e2197D077D13A82dAead6a9b3433C5` (18 decimals) |
| WTON | `0xc4A11aaf6ea915Ed7Ac194161d2fC9384F15bff2` (27 decimals, 스테이킹 내부 단위) |
| SeigManager | `0x0b55a0f463b6defb81c6063973763951712d0e5f` |
| DepositManager | `0x0b58ca72b12f01fc05f8f252e226f3e2089bd00e` |
| Layer2Registry | `0x7846c2248A7B4dE77E9C2Bae7FBB93bfC286837B` |
| 스테이킹 모델 | Seigniorage. **블록당 3.92 WTON** 신규발행 → 스테이킹된 WTON에 pro-rata 분배. `BLOCKS_PER_YEAR ≈ 2,628,000` |
| APR 산출 | `src/lib/staking.ts` → `calculateApr()` (SeigManager 온체인 데이터, 목 데이터 아님). 오퍼레이터별 commission 반영 |
| 앱 URL | (toki 프로덕션 Vercel URL — 채워넣기) |
| 로고 | `public/toki-logo.png` (256×256) |

---

## PART A — 홀더 발견 표면 (의도 100% 유입)

### A-1. 🥇 StakingRewards — 최우선
**현황:** Tokamak 자산 페이지 존재(`stakingrewards.com/asset/tokamak-network`). 리서치상 "스테이킹 불가(not a PoS network)"로 표기 → **확인 필요(라이브)**. 어느 쪽이든 액션 동일.
**왜:** "TON 어디서 스테이킹" 검색의 정석(고의도 ~3,500/일). **LLM이 스테이킹 질문에 인용하는 정규 소스** → Part B와 직결.

**트랙 2개:**
1. **Asset integration** (TON을 stakeable로 + live 시뇨리지 APR): `integration.stakingrewards.com`
   - 제출 데이터: TON 컨트랙트, APR 방법론(아래), 스테이킹 컨트랙트(DepositManager/SeigManager), toki를 staking route로.
   - **APR 방법론 문구(초안):** *"Seigniorage staking on Ethereum L1. 3.92 WTON minted per Ethereum block (~2,628,000 blocks/yr) distributed pro-rata to staked WTON across DAO operator candidates. Effective APR = annualized seigniorage / total staked, net of per-operator commission. Live on-chain computation via SeigManager; see toki calculateApr()."*
2. **Verified Staking Provider / Infra Ratings** (toki를 provider로, 브랜드 페이지+등급): `providers.stakingrewards.com`
   - 절차: 신청폼 → intro call → NDA/계약 → 실사폼(보안/운영/법무) → 스코어카드 등급.
   - ⚠️ 비용·현 등급 임계치 미공개 → 신청 시 문의.

**오너:** Tokamak/toki BD. **공수:** asset integration 중간 / provider 트랙 무거움.

- [ ] 라이브 페이지 상태 확인 (스테이킹 가능 표기 여부)
- [ ] asset integration 폼 제출 (컨트랙트 + APR 방법론)
- [ ] provider 트랙 신청 (NDA 라인, 병행)

### A-2. 🥈 CoinGecko / CoinMarketCap — 토큰 페이지
**왜:** 홀더가 가격 보러 *이미 들르는* 곳 + LLM 인용 1순위 소스(특히 ChatGPT).

- **CoinGecko 공식 프로필 클레임:** `partner.coingecko.com` → Update Coin/Token Info. 링크·소셜 정비, "Stake/Earn" CTA를 canonical 링크에 추가 가능한지 문의(미문서화 → 제출하며 확인).
- **CoinGecko 셀프서브 광고 ($100~):** `ads.coingecko.com/self-serve-solutions/tokens` → **Tokamak 코인 페이지/카테고리에 타겟.** 가장 정밀한 노출.
  - **광고 카피(초안):** *"Stake your TON, earn seigniorage — no MetaMask, no gas. Start in 1 click on toki."* (한국 타겟 버전: *"TON 스테이킹, toki에서 1클릭. 지갑·가스 걱정 없이."*)
- **CMC:** 프로필 클레임(support/listings 포털) + **CMC Yield 페이지**(`coinmarketcap.com/yield/`) 등재 — 셀프서브 폼 없음, 파트너십 경유.

**오너:** toki 마케팅. **공수:** 낮음. **비용:** $100~.

- [ ] CoinGecko 프로필 클레임 + 링크 정비 + Stake CTA 문의
- [ ] CoinGecko 광고 라이브 (Tokamak 페이지 타겟, ~$100)
- [ ] CMC 프로필 클레임 + Yield 페이지 파트너십 문의

### A-3. 🥉 DefiLlama — TVL 어댑터 PR 제출됨 ✅ (리뷰 대기), 무료·퍼미션리스
**왜:** DeFi 수익 헌터 + "온체인 실APY" 신뢰 + **LLM·yield-에이전트가 읽는 소스.** Part B 최고 레버리지(아래 Tier 1).
**절차(2단계 PR):**
1. **TVL 어댑터:** ✅ **제출 완료** — PR **[#19598](https://github.com/DefiLlama/DefiLlama-Adapters/pull/19598)** (`projects/tokamak-network/index.js`, `WTON.balanceOf(DepositManager)` ≈ 31.1M TON ≈ $15M, `staking` 항목). 리뷰/머지 대기 → 머지 후 ~24h UI 반영.
2. **Yields 어댑터:** `DefiLlama/yield-server` fork → `src/adaptors/<slug>/` → pool 객체(`tvlUsd`,`apyBase`) 반환 → PR. 단일토큰 시뇨리지 풀이 LST 카테고리와 안 맞을 수 있음 → DefiLlama Discord에서 매핑 확인.

**오너:** toki 엔지니어(코드 PR). **공수:** 중간. **비용:** 무료.

- [x] TVL 어댑터 PR 제출 — [#19598](https://github.com/DefiLlama/DefiLlama-Adapters/pull/19598) (리뷰 대기)
- [ ] Yields 어댑터 PR + Discord에서 풀 매핑 확인

---

## PART B — AI 에이전트 대상 홍보 (리서치 결과)

> **솔직한 총평:** "에이전트에게 홍보"의 실질 가치는 *화려한 크립토 AI-에이전트 토큰 생태계가 아니라*, **Part A와 같은 데이터 위생 + AEO/GEO + 비수탁 MCP 서버**다. 2026 현재 에이전트 주도 DeFi *수요*는 대부분 초기/과열(x402 30일 거래 ~$1.1M, 에이전트-토큰 섹터 고점 대비 67~90%+ 폭락). → 싸고 토대가 되는 것만, 지금. 토큰 생태계 추격 금지.

### B-1. Tier 1 — 지금, 싸고, 토대 (홀더+LLM+에이전트 동시 도달)
1. **DefiLlama 어댑터 PR** (= A-3) — ✅ 제출됨 [#19598](https://github.com/DefiLlama/DefiLlama-Adapters/pull/19598), 리뷰 대기. *단일 최고 레버리지.* LLM·yield-에이전트가 읽는 venue로 등록.
2. **크롤러 접근 확인 (선결):** GPTBot / ClaudeBot / PerplexityBot / Google-Extended 차단 해제 확인. ⚠️ **Cloudflare가 2026 기본값으로 AI 봇 차단** → toki 도메인 즉시 점검. (이거 막혀 있으면 아래 전부 무의미.)
3. **온사이트 GEO:** 루트에 `llms.txt`(핵심 페이지 마크다운 인덱스) + schema.org(FAQ/HowTo "How to stake TON") + **answer-first "How to stake Tokamak TON" 단일 페이지**(짧고 자기완결적, 상단 배치). 모든 곳에서 **Tokamak TON ≠ Toncoin 명시.**
4. **Reddit/포럼 시딩:** r/CryptoCurrency·r/defi·r/ethereum + Tokamak 커뮤니티에 "TON 스테이킹 어떻게/어디서" 진짜 답변. **Perplexity 인용의 ~47%가 Reddit** — 과대비중 채널.

### B-2. Tier 2 — 할 만함 (중공수, 실수익)
5. **StakingRewards 등재** (= A-1). canonical "where to stake" 소스라 LLM 답을 직접 개선.
6. **toki MCP 서버 (유일하게 만들 가치 있는 에이전트-네이티브 빌드):** 비수탁. read 툴(`get_ton_apr`,`list_operators`,`get_toki_pick`,`get_user_position`) + write 툴 `prepare_stake`(서명 안 된 tx 빌더, dry-run 기본, 유저가 자기 지갑서 서명). **Lido MCP / Base MCP 패턴 복제.** `src/lib/staking.ts`·`contracts.ts` 재사용. 공개: 공식 MCP Registry(`registry.modelcontextprotocol.io`) → PulseMCP·Glama·mcp.so·Smithery 크로스등재 → `awesome-blockchain-mcps` PR. 그러면 **ChatGPT/Claude 유저가 자연어로 "내 TON 스테이크"** 가능 + Apps SDK로 ChatGPT App 재활용(80% 동일).
   - 가치: "stake my TON / best Tokamak operator" 에이전트 질의를 **저비용으로 선점**(니치라 경쟁 적음). 볼륨이 아니라 *포지셔닝·옵셔널리티*.
   - 정책: 비수탁 + 유저 서명 + 시뮬레이션 확인 게이트 필수(OpenAI/Base가 허용하는 안전 패턴).

### B-3. Tier 3 — 보되 만들지 마라 (투기/부적합)
- **ElizaOS 플러그인**(`plugin-tokamak`): 싸게 dev 가시성용 실험만. 단 ELIZAOS 토큰 사기 소송·파머 평판 → 실유저 수익 낮음.
- **Wayfinder Path / Virtuals ACP / Fetch Agentverse / Giza / Almanak:** **지금은 스킵.** 토큰 투기 venue거나, yield-옵티마이저인데 **TON 시뇨리지 스테이킹이 lending-APR 모델과 안 맞음.** 누가 Ethereum-L1 스테이킹을 1급 venue로 넣을 때만 재검토.
- ERC-8004(Trustless Agents, 2026-01 메인넷 라이브)·x402는 plumbing으로 인지만, 빌드는 시기상조.

### B-4. AEO 도달 데이터 (참고)
- 크립토 미디어 **AI 리퍼럴이 2025 Q4에 트래픽 25.6%** + AI 유입 전환율 오가닉 대비 **2~4.4배**. ChatGPT가 AI 리퍼럴 ~78~87% + 제품페이지 인용 Perplexity 대비 50배 → **toki 스테이킹 페이지로 보내는 채널은 ChatGPT**, 비교/리서치 콘텐츠는 Perplexity.
- ⚠️ AI 리퍼럴 ~70%가 GA4서 "direct"로 오귀속 → 별도 트래킹 셋업.
- 출처 다수가 마케팅 벤더 → 방향성으로만.

---

## 통합 우선순위 (한 장)
1. **DefiLlama 어댑터 PR** — ✅ 제출됨 [#19598](https://github.com/DefiLlama/DefiLlama-Adapters/pull/19598) (리뷰 대기). 무료, ~24h 반영, 홀더+LLM+에이전트 동시.
2. **크롤러 접근 점검** (Cloudflare 기본 차단 확인) ← 지금
3. **StakingRewards 고치기/등재** (canonical 소스)
4. **CoinGecko 프로필+$100 광고** (Tokamak 페이지 정밀 타겟)
5. **온사이트 GEO**(llms.txt/schema/answer-first 페이지) + **Reddit 시딩**
6. **toki MCP 서버**(비수탁, ChatGPT/Claude 자연어 스테이크) — 에이전트-네이티브 유일 빌드
- 스킵: 크립토 AI-에이전트 토큰 생태계 전부(과열 잔재)

**KPI:** 팔로워 아님 → **stake 트랜잭션 + 30일 유지 스테이크 + AI 리퍼럴(별도 트래킹)**.
