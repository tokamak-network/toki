# toki → Telegram Mini App 마이그레이션 개발 계획

> 작성: 2026-06-09. 목적: 브라우저용 toki(Next.js 14 + Privy 임베디드 지갑)를 텔레그램 Mini App(TMA)으로 포팅.
> 전략 맥락: Tokamak은 RaaS·고객0 → toki가 유일한 소비자 완성품 = 등대 앱 + 분배 차량. TMA = 최대 유저베이스에 붙는 분배 표면.
> 딥리서치 wir63wmtf **완료**: 무손실 복권 스테이킹/프라이빗 선물/TMA 리텐션/Privy TMA 지원 → §6 결과 반영. 정책 블로커로 전략 피벗 → **§7 = 텔레그램 채널 유저 성장 방안**.

---

## 0. 결론 (feasibility) — ⚠️ 2026-06-09 딥리서치로 대폭 수정

> **정정(중요):** 이 문서 초안은 "거의 그대로 포팅 가능 / 체인 안 바꿔도 됨"이라 했으나 **틀렸다.** 딥리서치(wir63wmtf)가 반박. 아래 ⛔ 블로커 참조.

**렌더링은 그대로 가지만, *정책상* toki를 컴플라이언트 TMA로 as-is 출시할 수 없다.** Telegram Mini App 블록체인 가이드라인(2025-01 발효)이 **비-TON 체인 EVM 서명·연결·홍보를 금지**. toki는 Privy+**이더리움 메인넷(L1)** 서명 dApp(Tokamak 스테이킹 컨트랙트는 이더리움 L1, **별도 Tokamak L2 아님** — `src/lib/chain.ts`=mainnet) → 텔레그램이 *이더리움 지갑 서명*을 명시 금지하므로 정책 위반이 오히려 더 명확.

### ⛔ CRITICAL BLOCKER — Telegram TON-only 정책 (3-0 검증)
출처: core.telegram.org/bots/blockchain-guidelines. **Not Permitted:** 이더리움/BNB 자산·NFT 발행; **앱 내 이더리움 지갑 연결·서명**; TON Connect 외 지갑 프로토콜(브리징 제외); **비-TON 체인 홍보·링크**; 이더리움/비트코인 지갑 연결 보상. (binding since Jan 2025.)
- toki(EVM 스테이킹 서명)는 "멀티체인 지갑" 예외 해당 안 됨 → **컴플라이언트 TMA 불가, as-is.**
- **선택지 3개:**
  - **(a) TON Connect 재설계/브리지** — 대공사. toki의 *이더리움 L1 TON 스테이킹* 본질과 충돌(L1 스테이킹을 TON측으로 브리지?). 사실상 다른 제품.
  - **(b) 하이브리드** — 웹앱은 EVM 유지 + TMA는 *TON Connect 제한 셸*(리퍼럴/뷰어). EVM 핵심기능은 TMA 밖.
  - **(c) TMA 채널 포기** — 웹/지갑 모듈/SDK 등 다른 분배 표면 사용. *EVM 제약 없음.*
- ⚠️ enforcement 강도는 변수(EVM 미니앱이 존재는 함)나 delisting/차단 리스크 실재 → *등대 앱*을 정책 위반 위에 세우는 건 부적절.

### 정책과 별개로 깨지는 것 (기술)
**인증:** Google OAuth가 웹뷰에서 깨짐 — Privy는 TMA서 **email/SMS/임베디드 지갑만** 지원(2-1~3-0 검증, tdlib #681 COOP). → Telegram-native 로그인으로 교체. 이건 (b)/(c) 어느 경로든 유효.

**현 스택 (확인됨):**
- Next.js 14.2.35 App Router, Vercel 배포 (HTTPS 호스팅 = TMA 요건 충족)
- `@privy-io/react-auth` 3.14 — `loginMethods: ["google","email"]`, 임베디드 ETH 지갑 `createOnLogin: users-without-wallets`
- `viem` 2.46, `@metamask/delegation-toolkit` 0.13(스마트계정/위임), `paymaster/`(가스리스), `@supabase/supabase-js`(백엔드)
- `middleware.ts` = /admin 차단만 (유저 인증 리다이렉트 없음 → 포팅 리스크 낮음)

---

## 1. 깨지는 것 / 그대로 가는 것

### ✅ 그대로
- 비주얼노벨 UI·토키 마스코트·감정 스프라이트·오디오, 라우트(onboarding/staking/lottery/dashboard/collection/explore/event), i18n(ko/en), Supabase API, viem 체인 호출, **임베디드 지갑 + paymaster 가스리스**(TMA에 오히려 이상적).

### ⚠️ 손봐야
| 영역 | 문제 | 대응 |
|---|---|---|
| **인증(최우선)** | Google OAuth 팝업/리다이렉트가 텔레그램 웹뷰에서 깨짐 | Privy `loginMethods`에 `telegram` 추가 → Telegram 로그인으로 임베디드 지갑 프로비저닝 |
| MetaMask 주입 감지 | `PrivyClientProvider`의 `window.ethereum` 폴링·`ethereum#initialized`는 텔레그램에서 죽은 코드 | TMA 빌드에선 비활성/가드 |
| 네비/뒤로가기 | 브라우저 history 의존 | Telegram `BackButton` + 라우터 연동 |
| 외부 링크 | `window.open`(익스플로러·트랜잭션 링크) 제약 | `WebApp.openLink`/`openTelegramLink` |
| 세션 저장 | 서드파티 쿠키 제한 | Supabase 서버세션 또는 Telegram `CloudStorage` |
| 뷰포트/제스처 | safe-area, swipe-to-close ↔ VN 탭/스와이프 충돌 | `expand()`, `disableVerticalSwipes()`, safe-area CSS |

---

## 2. 단계별 개발 계획

### Phase 0 — 셋업 (0.5주)
- BotFather로 봇 + Mini App 등록, 프로덕션 URL = 기존 Vercel 배포(또는 `t.toki.tokamak.network`).
- `@telegram-apps/sdk`(또는 `@twa-dev/sdk`) 추가. `layout.tsx`에서 `WebApp.ready()`/`expand()` 초기화, 테마 변수 연동.
- TMA 전용 진입 분기(예: `?tma=1` 또는 런타임 `Telegram.WebApp` 감지)로 *브라우저 빌드와 단일 코드베이스 유지*.

### Phase 1 — 인증/지갑 교체 (핵심 경로, 1~1.5주)
- `PrivyProvider.tsx` `config.loginMethods`에 `"telegram"` 추가(또는 TMA 환경에서 `["telegram"]` 우선). Privy의 Telegram 로그인은 `initData`를 검증해 유저 식별 → `createOnLogin: users-without-wallets`로 임베디드 지갑 자동 생성(현 설정 그대로 재사용).
- `PrivyClientProvider.tsx`: TMA 환경에서 `window.ethereum` 감지 로직 가드(불필요·오작동 방지).
- 서버: Telegram `initData` HMAC 검증 엔드포인트(Supabase Edge/Next API) — Privy가 처리하면 위임, 아니면 직접.
- ⚠️ **검증 필요(딥리서치):** Privy react-auth 3.14의 TMA/Telegram 로그인 정식 지원 범위 + 웹뷰 OAuth 폴백. 미지원 시 대안 = TON Connect 병행 또는 initData→커스텀 지갑.

### Phase 2 — 웹뷰 어댑테이션 (1주)
- `BackButton` ↔ Next 라우터, 외부 링크 `openLink` 래퍼, 세션 영속화, viewport/safe-area, VN 제스처 충돌 해결, 햅틱/메인버튼으로 핵심 CTA(스테이크/뽑기) 강화.

### Phase 3 — 분배 메커니즘 (0.5주)
- `start_param` 기반 친구초대 딥링크(레퍼럴), 결과 공유(`shareURL`), 봇 푸시 알림(래플 당첨·스테이킹 리워드 → 리텐션).

### Phase 4 — 신규 제품 피처 (product, 리서치 게이트)
- **무손실 복권 스테이킹(prize-linked):** 기존 `staking/` + `lottery/`를 결합 — seigniorage 이자를 래플 상금 풀로, 원금 보존. *PoolTogether 모델, §6 리서치로 규제·리텐션 검증 후 확정.*
- **프라이빗 선물/송금:** 스테이트 채널 프라이버시 전송 제품을 "토키와 몰래 선물"로 래핑(임베디드 지갑 → 지갑 없는 친구에게도). *§6 규제(믹서) 검증 후.*

---

## 3. 파일별 영향 (실제 코드 기준)

| 파일 | 변경 |
|---|---|
| `src/components/providers/PrivyProvider.tsx` | `loginMethods`에 telegram, TMA 분기 |
| `src/components/providers/PrivyClientProvider.tsx` | MetaMask 주입 감지 TMA 가드 |
| `src/app/layout.tsx` | `@telegram-apps/sdk` init, viewport/theme |
| `src/components/layout/ConnectButton.tsx` | TMA에서 "텔레그램으로 시작" UX |
| `src/components/onboarding/*` | 웹뷰 온보딩(시드구문 없는 흐름 강조), BackButton |
| 외부 링크 호출부(트랜잭션/익스플로러) | `openLink` 래퍼로 치환 |
| `middleware.ts` | 변경 불필요(영향 없음) |
| `next.config.mjs` | 헤더/CSP가 텔레그램 iframe 임베드 허용하는지 점검 |

---

## 4. 리스크 / 오픈 퀘스천 (딥리서치 후 갱신)
- ⛔ **Telegram TON-only 정책 = as-is 출시 불가** (§0). 가장 큰 리스크.
- ⚠️ **체인 정정:** toki는 **이더리움 메인넷(L1)** dApp이다(Tokamak L2/Thanos 아님 — `src/lib/chain.ts`=mainnet). 초안의 "비이더리움/Tokamak 커스텀 체인" 서술은 **오류**. 텔레그램 정책은 *이더리움* 지갑 서명을 명시 금지하므로 toki는 정확히 그 케이스라 TMA 불가. (역으로 지갑/미니앱 *분배* 관점에선 메인넷이라 호환성 최대 — 커스텀 체인 추가 불필요.)
- Privy: TMA서 email/SMS/임베디드만(Google OAuth 깨짐) — 확정.
- 가스리스(paymaster)·delegation-toolkit이 TON Connect 경로에선 무의미(EVM 전용) — 경로 (b)/(c)에서만 유효.
- 무손실 복권 **한국 사행성 분류 = 미확인(리서치 갭)**. 미국은 주별 패치워크, 연방 합법화 아님(refuted). → 한국 런칭 시 별도 법률 검토 필수.
- 프라이버시 전송 *믹서 규제*(Tornado Cash 맥락) — 소비자 대상 리스크 미해결.

## 5. 공수 추정
- Phase 0~3(포팅 자체) = **약 3~4주** (인증 교체가 절반). Phase 4(신규 제품)는 별도, 리서치 후 산정.
- "from scratch" 아님 — 단일 코드베이스에 TMA 어댑터 레이어 + 로그인 교체.

## 6. 딥리서치 결과 (wir63wmtf, 105 agents, 18 confirmed / 7 killed)

**한 줄: "검증된 메커니즘들의 고위험 조합 + 치명적 정책 블로커." 추천했던 조합의 거의 모든 다리가 손상됨.**

| 가설 | 판정 |
|---|---|
| 텔레그램 = toki 분배 채널 | ⛔ **EVM as-is 불가**(TON-only 정책). 채널 자체가 막힘 |
| 무손실 복권이 스테이킹 리텐션/TVL↑ | ⚠️ **온체인 선례 PoolTogether 붕괴** (TVL ~$3.08M, 연매출 ~$22.8K). 전통(Premium Bonds)은 견고하나 *크립토 이전 미입증*, "인구규모 리텐션" 강주장은 refuted |
| 무손실 복권 합법성 | ⚠️ 미국 주별 패치워크·연방합법 아님(refuted). **한국 사행성 분류 미확인** → 법률검토 필수 |
| 게임화가 스테이킹 리텐션↑ | ⚠️ **노벨티 감쇠 실재**(~4주 후 하락), "재설계로 해결" refuted. 마스코트/스토리 지속효과 *미입증* |
| 프라이빗 선물이 바이럴 | ⚠️ Cash App 수치는 풀스택(선물 특정 아님), "P2P가 주 획득동력" **refuted**. 선물 단독 바이럴 미입증 |
| Privy+EVM TMA 포팅 | ⛔ 정책 위반 + Google OAuth 깨짐(email/SMS/임베디드만) |
| TMA SDK 라이프사이클(BackButton/viewport `.mount()`) | ✅ 기계적, 블로커 아님 |

**갭(미해결):** 한국 사행성 분류, TON 미니앱(Notcoin/Hamster/Tonnel) 실제 리텐션 수치, TON Connect vs 임베디드 UX, 믹서 소비자 규제.

**시사점:** 텔레그램+복권+선물 조합은 *각 요소가 입증약함 + 채널이 막힘*. → toki는 **(c) TMA 포기 + 웹/지갑 분배**가 현실적. "무손실 복권"을 핵심 리텐션 엔진으로 베팅하지 말 것(선례 붕괴). 게임화는 *UX로 OK, 리텐션 보장은 아님*.

**출처:** core.telegram.org/bots/blockchain-guidelines · privy.io/blog/building-telegram-apps · defillama.com/protocol/pooltogether-v5 · news.bloomberglaw.com(Kent v. PoolTogether) · theblock.co/post/339563(TMA 리텐션) · springer 10.1186/s41239-021-00314-6(게임화 감쇠)

---

## 7. 텔레그램으로 toki 유저 성장 (Mini App 없이 — 정책 안전 채널)

§0 정책 블로커로 EVM 스테이킹을 Mini App에 못 넣지만, **텔레그램을 top-of-funnel 획득 + 리텐션 루프**로는 쓸 수 있다. 가이드라인 제약은 주로 *Mini App + 공식 채널*에 적용 — **봇·스티커·커뮤니티는 자유도 높음**. 전환(스테이킹)은 웹/모바일 앱에서.

**퍼널:** 텔레그램 터치(스티커/밈/봇/광고) → toki 웹앱 가입 → first stake → 봇 재참여로 리텐션. 각 단계 코호트 트래킹.

> ⚠️ 네이밍: Tokamak "TON"(ETH ERC-20) ≠ Toncoin(TON 체인). 텔레그램 청중엔 "Tokamak TON" 명확화 — "TON 스테이킹"은 Toncoin 오해 유발.

### 전술 (레버리지 × 정책안전 순)

| # | 전술 | 왜 | 정책 | 비용 |
|---|---|---|---|---|
| 1 | **Toki 스티커/이모지 팩** | `public/toki-*.png` 20+ 감정 스프라이트 → 채팅마다 노출·공유 바이럴. 최대 미활용 IP 자산 | ✅ 무관 | ~0 |
| 2 | **Toki 봇 (리텐션 엔진)** | 시뇨리지/리워드 알림·복권 결과·**재참여 푸시** = Q4 노벨티 감쇠(~4주) 직접 대응 | ✅ 지갑서명X→제약 비대상 | 저 |
| 3 | **레퍼럴 딥링크** | 봇/공유 `start_param`→웹앱 어트리뷰션. 기존 복권 딥링크 인프라 재사용 | ✅ | 저 |
| 4 | **커뮤니티/공지 채널** | 한국 스테이킹 커뮤니티·공지·지원 | ✅ (Mini App 없으면 제약 약함) | 저 |
| 5 | **밈/콘텐츠 (meme-researcher 스킬)** | 마스코트 IP 숏폼, 텔레그램+X 교차 | ✅ | 중 |
| 6 | **유료: Telegram Ads / 크립토 KOL** | 한국·크립토 페이드 획득. **Q2 미검증 → 소액 테스트 후 확대** | ✅ | 가변 |
| — | (옵션) **비-서명 Mini App** | 업적/리더보드/레퍼럴 *읽기전용* 셸(서명X). 회색지대(외부 비-TON 유도 제약) → 보류 | ⚠️ 회색 | 중 |

### 즉시 vs 검증 후
- **즉시(저리스크·고IP레버리지):** ① 스티커팩 · ② 봇 알림·재참여 · ③ 레퍼럴 딥링크.
- **검증 후:** ⑥ 유료(코호트 리텐션 측정 먼저) · 비-서명 Mini App(정책 확인 먼저).

### 막힌 것(회피)
Mini App ETH 서명 · EVM 지갑연결 보상 · 공식채널 비-TON 홍보 · 비-TON 자산 홍보 외부 유도.

### 여전히 미검증 → 타깃 리서치 권장
Q2 한국 텔레그램 채널 실제 리텐션/전환, 스티커→앱·봇→앱 전환율 벤치마크, 어떤 전술이 실제로 retained user를 만드는지(install-vanity 회피).

---

## 참고
- Tokamak 현황 ground-truth: Obsidian `LLM-Wiki/projects/tokamak-network-status.md`
- 전략 맥락: Obsidian `Ideas/프라이버시 전송 제품 - 플랫폼 라이딩 분배 방안.md`, `Ideas/Tokamak 생태계 확장 - 플러그인 분배 채널 리서치.md`
