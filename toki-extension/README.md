# Toki Onboarding Guide (크롬 익스텐션)

토키가 **사용자가 실제로 헤매는 페이지 위에 올라타서** 두 가지를 단계별로 안내하는 크롬 MV3 익스텐션입니다.

1. **메타마스크 지갑 생성** — `metamask.io`에서
2. **거래소 TON 출금** — 업비트 / 빗썸 / 코인원 / 코빗에서 (트래블룰 개인지갑 등록 + ERC-20 네트워크 경고)

> 이전의 "어디서나 토키 채팅" 오버레이는 **단일 목적(크롬 웹스토어) 빌드에서 제외**되어 `parked/`에 보존돼 있습니다. 현재 빌드는 온보딩 가이드 1개 목적이며, 권한도 그에 맞게 최소화돼 있습니다.

## 목적 & 타깃 (포지셔닝)

**타깃 유저** — 거래소에서 TON을 사두고 **그냥 보유만 하는**, 온체인 활동 경험이 없고 블록체인 지식도 거의 없는 사람.

**문제** — 산 TON이 거래소 계좌에서 놀고 있음. "자가수탁·온체인·스테이킹은 어렵고 무섭다"는 인식이 진입 장벽.

**목표** — 거래소에 잠든 TON을 **스테이킹으로 옮겨 첫 온체인 경험**을 하게 하고, 그 경험을 발판으로 **토키가 게이트웨이가 되어** Tokamak Network 생태계의 다른 서비스로 유저를 유입시킴.

**그래서 이 익스텐션이 하는 일** — 이 타깃은 "거래소 → 자가수탁 지갑 → 스테이킹" 경로를 반드시 밟아야 하는데(거래소 트래블룰상 출금 시 메타마스크 서명 검증이 필요), 지식이 없어 단계마다 막힌다. 익스텐션은 바로 그 페이지들 위에서 단계별로 손을 잡아 **온보딩 장벽을 제거**한다.
- 메타마스크 **자동 설치는 브라우저 보안상 불가**(웹스토어 인라인 설치 API 폐지 + 네이티브 설치 다이얼로그/타 확장 UI/시드 자동화 불가). 따라서 "**마찰 최소화 + 자동 감지 + 안내**"로 체감 장벽을 낮추는 게 핵심 — 자동 설치가 아니라 *설치 버튼 하이라이트 → 설치 후 자동 감지 → 자동 전진*.
- 토키 앱 자체는 **Privy 임베디드 지갑**(구글 로그인, 무설치)을 쓰므로, 메타마스크는 오직 **거래소 트래블룰 출금**을 위해서만 등장한다.

## 기능

- **페이지 인지형 단계 가이드** — 도메인을 보고 `metamask`/`exchange` 흐름을 자동 선택, 우상단에 진행점 + 토키 스프라이트 + 대사 + 액션 패널을 띄움. 진행 단계는 흐름별로 저장돼 재방문 시 이어짐.
- **메타마스크 자동 감지 + 주소 자동 채움** — 백그라운드 SW가 `chrome.scripting.executeScript({world:"MAIN"})`로 프로바이더 브리지를 주입(페이지 CSP 우회). 설치 자동 감지 배지 + "메타마스크 연결" 원클릭으로 받는 주소를 자동 저장. 안 되는 환경에선 **수동 붙여넣기 폴백** 유지.
  - 보안: **페이지별 crypto nonce**로 브리지 응답을 인증 → 페이지 내 악성 스크립트가 응답을 위조해 출금주소를 바꿔치기하지 못함.
- **TON 도착 알림** — `chrome.alarms`로 저장된 주소의 TON 잔액을 주기 폴링(viem, 이더리움 L1), 증가 시 `chrome.notifications`로 알림. 잔액은 **raw wei(bigint)** 로 비교(부동소수 오차 없음), 주소 변경 시 baseline 리셋.
- **단계별 정밀 하이라이트** — 스텝별 셀렉터 후보 중 첫 매칭 요소에 시안 링 + `scrollIntoView`, 스크롤/리사이즈 추적, 무매칭 시 graceful no-op, 스텝 변경/최소화/언마운트 시 정리.
- **온보딩 허브 팝업** — 툴바 아이콘 → 두 흐름 진행상황 + 저장된 주소 관리(복사/삭제) + 거래소 바로가기 + 진행 초기화.
- **거래소 출금 안내** — **코인=TON, 네트워크=이더리움(ERC-20)** 강조 (토카막 TON은 L1 ERC-20 — 톤코인/다른 네트워크 혼동 방지).

## 구성 파일

| 파일 | 역할 |
|------|------|
| `contents/onboarding-guide.tsx` | 가이드 오버레이(CSUI). 도메인 감지 → 단계 패널, 브리지 메시징(감지/연결), 주소 입력, 하이라이트 |
| `shared/onboarding-flows.ts` | 두 흐름의 단계 정의 + 거래소 감지 + 주소 검증 |
| `background.ts` | 서비스워커: MAIN-world 프로바이더 브리지 주입(nonce 인증) + TON 도착 알림(알람/RPC) |
| `shared/notify.ts` | 순수 `shouldNotify()` (number/bigint 제네릭, 유닛 테스트 대상) |
| `popup.tsx` | 온보딩 허브 팝업 |
| `parked/toki-overlay.tsx` | 이전 채팅 오버레이 — 단일 목적 스토어 빌드에서 제외(보존용) |

## 권한 (manifest)

| 권한 | 용도 |
|------|------|
| `scripting` | MAIN-world 프로바이더 브리지 주입 (메타마스크 감지/주소 읽기) |
| `storage` | 진행 단계·저장 주소·마지막 잔액 |
| `alarms` + `notifications` | TON 도착 알림 |
| `host_permissions` | 가이드 5개 도메인(metamask.io + 4개 거래소) + 잔액 조회 RPC(llamarpc/publicnode) |

## 빌드 & 로드

```bash
cd toki-extension
npm install        # 최초 1회 (node_modules 있으면 생략)
npm run build      # plasmo build → build/chrome-mv3-prod
```
크롬: `chrome://extensions` → 개발자 모드 → **압축해제된 확장 로드** → `build/chrome-mv3-prod`.

## 테스트

```bash
npm run build
node --experimental-strip-types notify.test.mts   # shouldNotify 유닛 (5/5)
node e2e-smoke.mjs    # 두 도메인에 오버레이 주입 + 팝업 렌더
node e2e-us001.mjs    # 자동 감지 + 주소 자동 채움 (mock provider)
node e2e-us002.mjs    # 알람 등록 + TON 도착 알림 경로 (SW)
node e2e-us003.mjs    # 하이라이트 링 위치 + 무매칭 no-op
```
> e2e는 헤드드 Chromium에 익스텐션을 실제 로드하고, 가이드 URL을 `page.route`로 stub해 콘텐츠 스크립트 주입을 트리거합니다. (`@playwright/test`는 상위 `toki` repo의 node_modules에서 해석)

수동 확인: `metamask.io` / `upbit.com` 접속 → 가이드 패널, 툴바 아이콘 → 허브 팝업. 초기화는 팝업의 "진행 초기화" 또는 `chrome.storage.local`의 `tokiGuide:*` 키 삭제.

## 알려진 한계 (정직하게)

- **메타마스크 자체 UI(확장 팝업/온보딩 화면)에는 오버레이 불가** — 크롬이 타 확장(`chrome-extension://`) 페이지 주입을 막음. 그 구간은 체크리스트 텍스트로 안내.
- **거래소 DOM 비침습** — 폼/입력 미조작, 안내 + 주소 복사만. (거래소 DOM은 자주 바뀌고 민감)
- **브리지 주입 실패 시 감지 배지가 "확인 중"에 멈춤** — CSP가 강한 프레임 등. 수동 붙여넣기는 정상 동작 (LOW, 후속 개선 대상).

## 로드맵 (V2+)

- 사이드패널 퀵 대시보드(APR/스테이킹/세뇨리지) — RPC만으로 읽기전용.
- 영어 i18n (현재 한국어 전용).
- 거래소 도메인별 정밀 하이라이트 셀렉터 정교화(유지보수 비용 고려).
- 브리지 주입 실패 시 배지 폴백 처리.

## 배포

현재 빌드는 **단일 목적(온보딩 가이드)** 으로 정리됨 — 채팅 오버레이 제외, 권한 최소화(`storage`/`scripting`/`alarms`/`notifications` + 가이드 도메인·RPC). `npm run package` → `build/chrome-mv3-prod.zip` (~9MB).

- 절차·심사 주의점·체크리스트: **[PUBLISHING.md](./PUBLISHING.md)**
- 리스팅 문구·권한 사유·데이터 공개 답변: **[STORE-LISTING.md](./STORE-LISTING.md)**
- 개인정보처리방침(공개 URL로 호스팅): **[PRIVACY.md](./PRIVACY.md)**
