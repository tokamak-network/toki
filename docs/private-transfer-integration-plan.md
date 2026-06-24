# Toki 프라이빗 전송 통합 계획 (Tokamak Private App Channels)

> **상태:** 계획(Plan A 확정) · 미착수
> **작성:** 2026-06-09
> **목적:** toki에 "프라이빗 전송" 기능을 Tokamak의 zk 채널 스택 위에 얹기 위한 구현 설계. 다른 세션(토키 허브 논의)에 합류시켜 개발을 시작하기 위한 핸드오프 문서.
> **확정 사항:** 계획 A(기존 채널에 얇게 올라타기) · 유즈케이스 = ① 유저 간 프라이빗 송금 ② 프라이빗 인출/통합 · Sepolia 파일럿 → 메인넷 순.

---

## 0. TL;DR + 반드시 짚어야 할 네이밍 정정

- **`airdrop.tonnel.io`는 TON 블록체인의 그 유명한 Tonnel 믹서가 아니다.** 이름만 같은 별개 프로젝트와 혼동하기 쉬움(name collision). 실제로는 **Tokamak이 직접 운영하는 데모/에어드랍**으로, **Ethereum L1 메인넷**에서 도는 **Tokamak Private App Channels**의 `private-state` DApp 시연이다.
- 그 데모가 쓰는 "state channel package"는 npm `@tokamak-private-dapps/private-state-cli`이고, 내부적으로 `@tokamak-zk-evm/cli`(Rust prover) + `tokamak-l2js`에 의존한다. **진짜로 tokamak-zk-evm 기반이 맞다.**
- 단, "state channel"은 브랜딩일 뿐 **고전적 결제/상태 채널이 아니다.** 분쟁 윈도우 없는 **validity-proof(zk-SNARK) 기반 per-app zk 도메인**으로, 증명이 L1에서 검증되면 상태가 즉시 확정된다.
- **결정적 궁합:** 그 채널의 정산 자산이 **toki가 스테이킹하는 바로 그 TON**(`0x2be5e8c109e2197D077D13A82dAead6a9b3433C5`), 같은 Ethereum L1 메인넷, 같은 MetaMask/EIP-712. 체인·토큰·지갑 호환이 완벽하다.
- **프라이버시는 부분적:** 브릿지 입금/출금은 L1에 **공개**된다. 숨겨지는 것은 *채널 내부 note 이체*(누가 누구에게/얼마)뿐.

---

## 1. 핵심 설계 제약 (아키텍처를 결정하는 사실)

리서치로 1차 출처 검증된 세 가지:

1. **증명(proving)은 브라우저 불가 → 서버 워커 필수.**
   `private-state-cli`는 importable SDK가 **없다**(`exports:null`, `main:null`, bin만 존재). 증명은 Node 20+ Linux에서 **Rust prover 바이너리를 빌드**해 실행하며 1건당 분 단위. 브라우저용은 v0.1.0 *verifier*(WASM)뿐, *prover* 없음. → Next.js 서버리스 라우트가 아니라 **별도 long-running 워커 + 비동기 잡 큐** 필요.

2. **키 파생만 클라이언트에서 깔끔히 복제 가능.** `tokamak-l2js`는 importable.
   - **Viewing key**(note 수신용) = `eth_signTypedData_v4`
     - `domain: { name: "TokamakPrivateState", version: "1", chainId }`
     - `primaryType: "NoteReceiveKey"`
     - `types.NoteReceiveKey = [protocol:string, dapp:string, channelId:uint256, channelName:string, account:address]`
     - `message = { protocol: "PRIVATE_STATE_NOTE_RECEIVE_KEY_V2", dapp: "private-state", channelId, channelName, account }`
   - **Spending key**(채널 바인딩 L2 키) = `personal_sign`(plaintext)
     - `"Tokamak private-state L2 wallet secret binding\nchannel:<channelName>\nwalletSecret:<walletSecret>"`
   - 공통 코어: `deriveL2KeysFromSignature(signature)` → Poseidon으로 시드한 Jubjub 키. **반드시 `tokamak-l2js`의 Poseidon/jubjub을 그대로 써야 키가 일치**(일반 Poseidon 쓰면 불일치).
   - 함의: **사용자 메인 지갑의 raw private key를 서버로 넘길 필요가 없다.** 서명만 받으면 됨(보안상 결정적).

3. **note 제출은 plain EOA `eth_sendTransaction` → `ChannelManager.executeChannelTransaction(payload, functionProof)`.**
   - CLI의 `--tx-submitter <ACCOUNT>` 플래그로 **가스 내는 EOA를 note 소유자와 분리 가능** → toki 릴레이어 EOA가 제출·가스부담 가능.
   - ⚠️ **반드시 확인:** `ChannelManager.sol`에서 `msg.sender`가 note 소유자에 바인딩되지 않는지(증명이 L2 신원을 바인딩하고, submitter privacy가 명시 기능이라 안 묶일 가능성이 큼 — 그래도 코드로 확인). 이게 릴레이어/paymaster 가능 여부의 전제.
   - 기본 CLI 경로는 raw EOA tx라 **toki의 ERC-7677 paymaster로 자동 스폰서되지 않는다.** 가스 스폰서를 원하면 동일 calldata를 4337 UserOp/7702 배치로 직접 감싸야 함.

---

## 2. "지금 로컬에서 하던 일"이 어디로 옮겨가나

현재 airdrop.tonnel.io는 **전부 유저 본인 컴퓨터(로컬)**에서 실행된다: `npm i` → CLI 설치, `install`로 Rust prover 로컬 빌드 + CRS 다운로드, `account import`로 L1 개인키를 CLI에 직접 보관, 증명도 로컬 CPU/RAM, 제출도 로컬에서 ETH 가스 내며 전송. 즉 **클라이언트가 곧 prover이자 서명자**다(개발자용 CLI 체험).

계획 A는 이 무거운 부분을 **toki 서버 워커**로 옮긴다:

| 항목 | 지금 (tonnel) | 계획 A (toki) |
|---|---|---|
| npm 설치 / Rust 빌드 / CRS 다운로드 | 유저 PC | **toki 서버**(1회 셋업, 재사용) |
| 증명 생성 | 유저 PC CPU/RAM | **toki 서버**(비동기 잡) |
| tx 제출 + 가스 | 유저 PC, ETH 직접 | **toki 릴레이어 EOA**(가스 부담) |
| L2 키 파생 서명 | 유저 PC | **유저 브라우저**(서명만, raw 키 미전송) |
| 내 메인 TON 이동(approve/deposit/join) | 유저 PC import 키 | **유저 브라우저, 본인 지갑 서명**(서버 미접근) |

---

## 3. 시스템 아키텍처

```
┌─ Toki Frontend (Next.js 14, 기존) ──────────────┐
│ • L2 키 파생: Privy/MetaMask 서명               │
│   (signTypedData_v4 + personal_sign)            │   기존 staking-service.ts 패턴 +
│ • L1 자금 이동(approve/deposit/join):            │   TONPaymaster/EIP-7702 재사용 (가스리스)
│   사용자 지갑으로 클라 서명                       │
│ • ProvingProgress: 토키 마스코트 연출(thinking)  │
└───────────┬──────────────────────────────────────┘
            │  BFF: src/app/api/private-transfer/*
┌───────────▼─── Toki Prover Worker (신규 서비스) ──────────┐
│ Ubuntu 22.04 + Node 20 + Rust toolchain + CRS(Drive 미러)  │
│ private-state-cli <cmd> --json 래핑 (shell out)            │
│ 비동기 잡 큐(증명 1~2분) · 릴레이어 EOA(--tx-submitter)     │
│   prove → submit → sourceTxHash 반환                       │
└───────────┬────────────────────────────────────────────────┘
            │  eth_sendTransaction
┌───────────▼─── Ethereum L1 (기존 메인넷 인프라) ──────────┐
│ BridgeCore / L1TokenVault / ChannelManager                 │
│ PrivateStateController (commitment/nullifier 트리)          │
│ canonical asset = TON                                      │
└────────────────────────────────────────────────────────────┘
```

### Custody / 신뢰 모델 (핵심 원칙)
- **메인 지갑 TON을 움직이는 L1 tx(`approve`, `deposit-bridge`, `channel join`)는 무조건 클라에서 사용자 서명.** 메인 자금은 서버가 절대 손대지 않음. (toki `executeStaking()` 3-경로 인프라 + paymaster 재사용 → 가스리스 가능)
- 서버 워커는 **서명에서 파생한 L2 spending key를 메모리에서 일시 사용·미영속**으로만 다룬다. L2 키는 채널 *내부* 자산만 통제 → 노출돼도 메인 지갑은 안전.
- note 제출 가스는 **toki 릴레이어 EOA**가 부담(원하면 TON으로 정산 — 기존 paymaster 경제모델과 연결).

### ⚠️ M0에서 확정할 분기
CLI가 join/deposit을 *외부 서명된 tx*로도 수용하는지, 아니면 import한 키를 고집하는지 검증 필요. CLI는 워크스페이스 상태를 `~/tokamak-private-channels/`에 로컬 보관하므로, 만약 import 키를 고집하면 두 경로 중 택일:
- **(A) 클라 L1 서명 + 서버 동기화:** 클라에서 viem으로 L1 콜 직접 실행 → 서버에서 `wallet recover-workspace`로 체인→워크스페이스 재구성(로그 스캔으로 가능). **이게 가능한지 M0에서 확인.**
- **(B) 금액-한정 세션 계정(burner) 폴백:** 송금 금액만 일시적으로 세션 계정으로 옮겨 CLI가 처리. custody가 금액·세션으로 한정됨. 파일럿 수용 가능, 프로덕션은 (A) 지향.

---

## 4. toki 레포 파일 단위 변경

### 신규 서비스 (별도 배포 단위)
```
services/private-transfer-worker/
  Dockerfile              # Ubuntu 22.04 + Node20 + Rust/cargo/cmake/clang/libclang/pkg-config
                          #   + private-state-cli install (Rust 빌드 + CRS 다운로드)
  src/server.ts           # Fastify; 내부 API (BFF만 호출 허용, 인증 토큰)
  src/cli.ts              # private-state-cli <cmd> --json 래핑
                          #   stdout=최종 JSON 결과 / stderr=JSON-Lines 진행(loading→proving→submitting→persisting→done)
  src/jobs.ts             # 잡 큐(BullMQ+Redis 또는 Supabase 큐), 증명 비동기
  src/relayer.ts          # CHANNEL_SUBMITTER_PRIVATE_KEY EOA → --tx-submitter
  src/crs-mirror.ts       # Google Drive CRS를 toki 스토리지로 미러(가용성 리스크 완화)
```

### Next.js BFF 라우트 (프론트 ↔ 워커)
```
src/app/api/private-transfer/
  keys/route.ts            # 서명할 EIP-712 typed-data + personal_sign 메시지 발급/검증
  onboard/route.ts         # join + note-receive pubkey 등록 상태 기록
  transfer/route.ts        # transfer-notes 잡 enqueue → 워커
  redeem-withdraw/route.ts # redeem + withdraw-channel + withdraw-bridge
  notes/route.ts           # 잔액/note 스캔(recover-workspace + get-notes)
  status/[jobId]/route.ts  # 잡 폴링
```

### 신규 lib
```
src/lib/private-transfer/
  keys.ts          # tokamak-l2js로 L2 키 파생 (§1의 정확한 메시지)
  bridge-calls.ts  # approve/deposit-bridge/join L1 calldata (staking-calls.ts 패턴)
  abi.ts           # BridgeCore / L1TokenVault / ChannelManager / DAppManager ABI
  constants.ts     # 채널 id·name, 컨트랙트 주소 (mainnet + sepolia 분기)
  service.ts       # 프론트 → BFF 호출 래퍼
```

### 신규 컴포넌트 / 훅 / 페이지
```
src/components/private-transfer/
  PrivateTransferPanel.tsx       # UC1: 수신자 선택 + 금액 + 송금
  WithdrawConsolidatePanel.tsx   # UC2: redeem→withdraw, 다른 주소로 인출
  PrivateBalancePanel.tsx        # note/채널 잔액
  ProvingProgress.tsx            # 비동기 증명 진행 (토키 thinking→excited 스프라이트)
src/hooks/usePrivateTransfer.ts  # 서명→enqueue→폴링 오케스트레이션
src/hooks/usePrivateChannel.ts   # join/deposit 온보딩 상태
src/app/private-transfer/page.tsx
```

### 기존 파일 수정
- `src/constants/contracts.ts` — Bridge/Vault/ChannelManager 주소 추가 (메인넷: ChannelManager `0x3108d92A38bFb4B3396DE7ad4D92318a8fbE61D7` 등 / Sepolia는 자체 배포 주소)
- `src/locales/en.ts` + `ko.ts` — 프라이빗 송금 문자열 **양쪽 동시** 추가 (i18n 규칙)
- `src/components/layout/ConnectButton.tsx` 또는 대시보드 nav — 진입점 추가
- `package.json` — `tokamak-l2js` 의존성 추가 (클라 키 파생용)
- **Supabase 테이블:**
  - `private_transfer_jobs` — 잡 상태
  - `private_notes_index` — 유저별 note ref·last-scanned-block (스캔 UX 가속)
  - `channel_directory` — toki 유저 ↔ L2 주소 + noteReceivePubKey (**수신자를 username으로 고르게 하는 디렉토리**)

---

## 5. CLI 라이프사이클 참조 (래핑 대상)

`private-state-cli` 2-토큰 명령(`<group> <verb>`), 모두 `--json` 지원. 글로벌 플래그: `--network <mainnet|sepolia|anvil>`, `--account <ALIAS>`, `--acknowledge-action-impact`(상태변경 tx마다 필수), `--tx-submitter <ACCOUNT>`(note 명령, 가스 분리). RPC는 `set rpc`로 1회 설정.

| 단계 | 명령 | 핵심 인자 | 출력 |
|---|---|---|---|
| 설치 | `install` | `[--read-only] [--docker]` | 로컬 런타임 |
| RPC 설정 | `set rpc` | `--network --rpc-url` | rpc-config.env |
| L1 서명자 import | `account import` | `--account --network --private-key-file` | 로컬 계정 |
| 채널 생성(리더) | `channel create` | `--channel-name --join-toll --network --account` | tx hash |
| **브릿지 입금 L1→vault** | `account deposit-bridge` | `--amount --network --account --acknowledge-action-impact` | approveTxUrl, fundTxUrl |
| **채널 join** | `channel join` | `--channel-name --network --account --wallet-secret-path --acknowledge-action-impact` | tx hash, l2Address, epochId |
| 브릿지→채널 잔액 | `wallet deposit-channel` | `--wallet --network --amount --acknowledge-action-impact` | tx hash |
| **note mint** | `wallet mint-notes` | `--wallet --network --amounts <JSON> --acknowledge-action-impact [--tx-submitter]` | tx hash, outputNotes |
| **note transfer**(프라이빗 송금) | `wallet transfer-notes` | `--wallet --network --note-ids <JSON> --recipients <JSON> --amounts <JSON> --acknowledge-action-impact [--tx-submitter]` | **sourceTxHash**, output notes |
| **note redeem** | `wallet redeem-notes` | `--wallet --network --note-ids <JSON> --acknowledge-action-impact [--tx-submitter]` | tx hash |
| 채널→브릿지 잔액 | `wallet withdraw-channel` | `--wallet --network --amount --acknowledge-action-impact` | tx hash |
| **브릿지 출금 →L1** | `account withdraw-bridge` | `--amount --network --account --acknowledge-action-impact` | tx hash |
| 채널 exit | `channel exit` | `--wallet --network` (잔액 0 필요) | tx hash |
| note 조회 | `wallet get-notes` | `--wallet --network` | note 상태(수신 note는 viewing key로 복호화) |
| 워크스페이스 복구 | `wallet recover-workspace` | (`--from-genesis` 옵션) | 로그 스캔으로 상태 재구성 |

- transfer 모양 제약: 등록된 **1→1 / 1→2 / 2→1** input→output note 형태만 허용.
- 수신: **pull 모델.** 송신자가 수신자의 등록 pubkey로 note를 암호화해 `executeChannelTransaction` 로그에 기록. 수신자는 `recover-workspace`(로그 스캔)+`get-notes`로 viewing key로 복호화. **송금 시점에 수신자 온라인 불필요**(L1 로그에서 나중에 복구 가능, 단 명령당 7,200블록 스캔 예산 — 오래된 건 `--from-genesis`). **멤버 note 송수신에 채널 리더 liveness 불필요.**

---

## 6. UI/UX (비주얼 노벨 + 마스코트)

**겉은 평범한 송금/인출 앱, 뒤의 채널/note/증명은 전부 숨김.** 어려운 zk 용어는 토키 대사로 번역.

### 진입
대시보드에 "프라이빗 송금" 카드. 토키 `explain`: "여기선 누구한테 보냈는지 안 보이게 TON을 옮길 수 있어~" + 작은 경고 배지("입출금 자체는 공개돼요. 채널 안에서만 비공개").

### 첫 진입 = 온보딩(1회)
1. "프라이빗 채널 입장하기" → 지갑 서명 1회(키 파생, 가스 무료) → 토키 `cheer`
2. 입금 금액 입력 → 서명 → 가스리스로 채널에 TON 예치 → "프라이빗 잔액: 10 TON" 표시

### UC1 — 유저 간 프라이빗 송금
- 받는 사람을 **토키 친구 디렉토리에서 username으로 선택**(raw 주소 노출 0) + 금액 입력 → "보내기"
- 서명 1회 → **증명 대기 화면**: 토키 `thinking` "증명 만드는 중... 1~2분 걸려~" + 프로그레스
- 완료 → 토키 `excited`/`celebrate` "보냈어! 아무도 누구한테 갔는지 몰라" + "증명 보기"(sourceTxHash)
- 수신자는 토키 안 켜놔도 됨 → 나중에 들어오면 "@준이 너한테 2 TON 프라이빗으로 보냈어!" 알림

### UC2 — 프라이빗 인출/통합
- 금액 + 받을 주소(다른 지갑) → "인출하기" → 증명 대기 → redeem→withdraw 자동 진행 → "다른 주소로 빠졌어! 입금 주소랑 연결 안 보여~"
- "잔돈 정리하기" 버튼으로 흩어진 note 통합
- ⚠️ 화면에 항상 작은 경고: "지금은 사용자가 적어서 추적될 수 있어요"(익명성 집합 한계)

### 관통하는 UX 원칙
- 체감은 송금 앱 수준(받는 사람 + 금액 + 보내기). channel/note/proof/nullifier 전부 숨김.
- 분 단위 증명 대기를 마스코트 연출로 메움("멈춘 게 아니라 토키가 일하는 중").
- 가스는 toki가 대신 냄(ETH 신경 X).
- 솔직한 한계 고지는 작게 항상 노출.

---

## 7. 마일스톤

| 단계 | 내용 | 게이트 |
|---|---|---|
| **M0 스파이크** | Sepolia 자체 배포(Foundry: deploy-bridge→deploy-private-state→add-dapp). 워커 컨테이너에서 CLI 전체 라이프사이클 수동 1회. **증명 RAM/시간 측정**, `ChannelManager.sol` `msg.sender` 바인딩 확인, `recover-workspace` 체인-only 동기화 가능 여부 확인. (test-wallet 스킬 활용) | 릴레이어 제출 성립 + 증명 비용 수용 가능 + §3 분기 결정 |
| **M1 온보딩** | 클라 L2 키 파생(tokamak-l2js) + join/pubkey 등록 + bridge deposit(클라 서명, paymaster 가스리스) + Supabase 디렉토리 | Sepolia 두 계정 join 성공 |
| **M2 송금(UC1)** | transfer-notes 잡 파이프라인 + ProvingProgress + 수신 스캔/잔액 + 수신자 picker | Sepolia E2E 프라이빗 송금 |
| **M3 인출/통합(UC2)** | redeem + withdraw + 다른 주소 인출 + 익명성-집합 경고 UI | Sepolia E2E 인출 |
| **M4 메인넷 파일럿(게이트)** | 보안 리뷰 + custody 하드닝 + `the-great-first-channel` join(또는 자체 채널) + 제한 롤아웃 | security-review 통과 |

---

## 8. 착수 전 반드시 검증 (M0)

1. `ChannelManager.executeChannelTransaction`의 `msg.sender` 비바인딩 → 릴레이어/paymaster 전제.
2. CLI가 외부 서명 L1 tx를 수용하는지 vs import 키 고집 → client-side L1 서명 가능 여부(안 되면 §3 폴백).
3. 증명 1건당 RAM/CPU/시간(문서 미기재 — 측정 필수, 운영비 지배 요인).
4. Sepolia 공개 채널 유무(git에 없음 → 자체 배포 전제). `deleteDApp`은 Sepolia/local 전용(메인넷 등록은 영구) 확인됨.
5. paymaster로 `executeChannelTransaction` 스폰서 가능한지(UserOp 래퍼 필요).

## 9. 리스크 (UI/문서에 명시)

- **미감사(unaudited) 알파 + 단일 owner 업그레이더블 컨트랙트** — 메인넷 자금 노출 신중.
- **Google Drive 의존(CRS·배포 아티팩트, git에 없음)** — 가용성 리스크 → toki 스토리지 미러 필수.
- **프라이버시 부분성 + 작은 익명성 집합**(현재 라이브 채널 1개·소수 유저) — 과대광고 금지, 한계 고지.
- **prover 운영비**(분 단위 증명, GPU 옵션) — 비동기 잡 + 사용량 제한.
- **`airdrop.tonnel.io` 도메인은 피싱 패턴과 닮음** — 모든 주소/명령은 공식 `github.com/tokamak-network`로만 검증.

---

## 10. 레퍼런스 (1차 출처)

- 레포: `github.com/tokamak-network/Tokamak-zk-EVM-contracts` ("Tokamak Private App Channels", whitepaper.md, packages/apps/private-state)
- 프루빙 스택: `github.com/tokamak-network/Tokamak-zk-EVM` (Rust prover/CLI)
- npm: `@tokamak-private-dapps/private-state-cli@2.4.3`, `@tokamak-private-dapps/groth16@0.2.0`, `@tokamak-private-dapps/common-library@0.1.2`, `tokamak-l2js@0.1.4`, `@tokamak-zk-evm/cli@2.1.0`
- 메인넷 컨트랙트(검증): BridgeCore `0x992E2Ae206620d811832a8F697c526c4f95974b6` · DAppManager `0x88Ab290a9dc0a169240EBC282Ec1F7C8524645aA` · L1TokenVault `0xf127Aef661c815ad46c5159146078f6F1E9f5F61` · TokamakVerifier `0x0C467a5082323Cc6F4b7077A9dFb0bbdaf6eC626` · Groth16Verifier `0x21cfF039c1FC4FC621923Db18D8E4ca746C287D5` · ChannelManager `the-great-first-channel` `0x3108d92A38bFb4B3396DE7ad4D92318a8fbE61D7` · canonical TON `0x2be5e8c109e2197D077D13A82dAead6a9b3433C5`
- 별개(무관, 혼동 주의): TON 블록체인의 Tonnel Network 믹서 `tonnel.network` — Tokamak과 무관.

---

## 12. M0 findings — 로컬 그라운드-트루스 (2026-06-09, 실측)

> 이 섹션은 **로컬에 실제 설치된 것**을 직접 확인한 결과다. 위 §1~§11은 2.4.3 기준 *연구본*이라 일부 어긋난다 — **구현은 본 섹션(1.0.1)을 기준으로** 한다.

- **CLI 버전 = `@tokamak-private-dapps/private-state-cli@1.0.1`** (전역 설치, bin `private-state-bridge-cli.mjs`). 문서의 2.4.3 아님. `main:null`/`exports:null` → **importable 아님, shell-out만**. deps: `@tokamak-zk-evm/cli`, `@tokamak-private-dapps/groth16`, `common-library`, `tokamak-l2js`, `ethers`, `@noble/curves`.
- **런타임 = 동작함 (`doctor: OK`).** zk-EVM CLI 2.1.0 런타임(`~/.tokamak-zk-evm/macos/runtime`) + groth16 0.2.0 + **CRS 설치 완료**(`~/tokamak-private-channels/groth16/crs/circuit_final.zkey` 등) + tokamak-l2js 0.1.4. → **macOS 네이티브에서 로컬 증명 생성이 실제로 가능.**
- **워크스페이스:** 사용자가 **메인넷 `the-great-first-channel`에 이미 join** (`~/tokamak-private-channels/workspace/mainnet/the-great-first-channel/{channel,wallets}`, `secrets/mainnet/{accounts,wallets}`). **Sepolia(11155111) 배포 아티팩트 존재**하나 채널 join은 아직 없음.

### 실제 1.0.1 명령 surface (단일 토큰 verb — 문서 §5 표를 대체)
`install` · `uninstall` · `doctor [--gpu]` · `guide` · `transaction-fees` · `account import --account --network --private-key-file` · `create-channel` · `recover-workspace` · `get-channel` · `deposit-bridge --amount --network --account` · `withdraw-bridge` · `get-my-bridge-fund` · `recover-wallet` · `join-channel --channel-name --network --account --wallet-secret-path` · `get-my-wallet-meta` · `get-my-l1-address` · `list-local-wallets` · `deposit-channel --wallet --network --amount` · `withdraw-channel` · `get-my-channel-fund` · `exit-channel` · `mint-notes --wallet --network --amounts [--tx-submitter]` · **`transfer-notes --wallet --network --note-ids --recipients --amounts [--tx-submitter]`** · `redeem-notes` · `get-my-notes`. 글로벌: `--json` (모든 명령), `--version`. 시크릿: account secret(`account import`) + wallet-secret(`join-channel --wallet-secret-path`), RPC는 `~/tokamak-private-channels/secrets/<network>/.env`의 `RPC_URL`.

### 실측 컨트랙트 주소 (로컬 아티팩트)
- **메인넷(chain-id-1):** BridgeCore `0x992E2Ae206620d811832a8F697c526c4f95974b6` · bridgeTokenVault `0xf127Aef661c815ad46c5159146078f6F1E9f5F61` · dAppManager `0x88Ab290a9dc0a169240EBC282Ec1F7C8524645aA` · controller(PrivateStateController) `0x67c6233a99d9f122fef9dc111e89948107b34c2f` · l2AccountingVault `0x9a6c9eb158269bbed8885649f95acefa8aafc3aa` · channelDeployer `0xE9B3d20e5925DEB506B5F5cCA94F753B6A34Af7C` · grothVerifier `0xC1523baF508B5d45663Cb69fc0cA7F35e82101eB` · canonical TON `0x2be5e8c109e2197D077D13A82dAead6a9b3433C5`. (BridgeCore/Vault/dAppManager는 §10과 일치 ✓)
- **세폴리아(chain-id-11155111):** 아티팩트 일체 존재(`bridge.11155111.json`, `deployment.11155111.latest.json`, `dapp-registration`, `circuit_final.zkey`).

### M0 게이트 상태
- 증명 런타임 동작 ✅ (doctor OK) · 메인넷 채널 가입됨 ✅ · 주소 확인 ✅
- 미확정(착수 전 결정 필요): ① 통합 검증을 **메인넷(실자금)** 으로 할 순 없음 → **Sepolia 채널 생성/가입 + 테스트 지갑 펀딩** 필요. ② 로컬 CLI를 감싸는 **로컬 Node 워커**(서버 호스팅은 추후) 아키텍처 확정. ③ `transfer-notes` 등 `--json` 출력 스키마 캡처(파싱 정확도).

### M0 검증 결과 — "서버 쓰면 브라우저-온리 자가수탁 가능?" → **YES** (소스 확정, 2026-06-09)
CLI 1.0.1 소스(`lib/private-state-cli-shared.mjs`, `private-state-tokamak-helpers.mjs`, `private-state-bridge-cli.mjs`) 직접 확인:
- **L2 키 = 서명 기반 (브라우저 가능).** `deriveParticipantIdentityFromSigner({channelName, walletSecret, signer})` = `signer.signMessage([DOMAIN, "channel:"+name, "walletSecret:"+secret].join("\n"))` → `deriveL2KeysFromSignature(sig)`(tokamak-l2js), `l2Address = getAddress(fromEdwardsToAddress(pub))`. note-receive 키 = `eth_signTypedData_v4`(NoteReceiveKey, protocol `PRIVATE_STATE_NOTE_RECEIVE_KEY_V2`). channelId = `toBigInt(keccak256(toUtf8Bytes(channelName)))`. → **유저 지갑 서명만으로 L2 키 재현 가능, raw 키 서버 미전송.**
- **L1 서명 = import 키 전용 (외부서명 경로 없음).** `account import` → `new Wallet(privateKey)` 로컬 저장 후 그 키로 deposit-bridge/join 서명. → **CLI로는 브라우저 외부서명 불가.**
- **그러나 `recover-workspace`가 온체인 로그로 워크스페이스 재구성**(`fromBlock`, getLogs, `--from-genesis`). → **해결책(Plan A 확정): 브라우저가 viem으로 L1(approve/deposit/join)을 직접 실행(유저 서명, toki paymaster 가스리스) → 서버가 `recover-workspace`로 체인에서 동기화.** L1 키를 서버에 절대 안 넘김 = 자가수탁 유지.
- **증명/제출 = 서버.** mint/transfer/redeem은 Rust 프루버(서버), 제출은 `--tx-submitter`(릴레이어 EOA)로 분리 가능. L2 spending key는 유저 서명에서 파생해 **서버 메모리 일시 사용·미영속**(채널 내부 자산만 통제).

**결론 아키텍처:** 브라우저(로그인·L2키 파생·L1 자금이동 서명·UI) ↔ 서버 워커(프루빙·recover-workspace·릴레이 제출). **단, 이는 별도 상시 워커 호스트**(Ubuntu+Node+Rust+CRS) — Vercel 서버리스 불가(증명 수분·서브프로세스·FS). 실측 주소는 `src/lib/private-transfer/constants.ts`.

## 11. 토키 허브 논의에 합류할 때 한 줄 요약

> "프라이빗 전송"은 **Tokamak Private App Channels(zk note pool, 같은 TON·같은 L1)** 위에 얹는다. 무거운 prover/제출은 **toki 서버 워커**가 호스팅하고(유저는 브라우저 서명만), 메인 자금 L1 tx는 사용자 지갑 클라 서명으로 유지한다. Sepolia 자체배포 파일럿(M0~M3) → 메인넷 게이트(M4). 프라이버시는 채널 내부 한정이며 익명성 집합 한계를 정직히 고지한다.

---

## 13. 작업 상태 & 이어서 하기 (handoff — 여기서부터 재개)

> **상태(2026-06-09):** M0 검증 **완료**(소스로 확정), 기반 코드 착수. 풀빌드는 미완(자금 필요한 E2E 게이트 존재).

### 지금까지 한 것 (DONE)
- **M0 검증 완료** — "서버 쓰면 브라우저-온리 자가수탁 프라이빗 송금 가능?" → **YES** (§12 참조, CLI 1.0.1 소스로 확정). 아키텍처 확정: 브라우저(로그인·L2키 파생·L1 서명·UI) ↔ 상시 워커(프루빙·`recover-workspace`·릴레이 제출).
- **`src/lib/private-transfer/constants.ts`** 생성 — 메인넷+세폴리아 실측 컨트랙트 주소, 채널명(`the-great-first-channel`), L2 파생 도메인 상수. `tsc --noEmit` 통과.
- 본 문서 §12에 1.0.1 실제 명령 surface + 서명/키 모델 + recover-workspace 우회 + 실측 주소 기록.

### 로컬 환경 (재개 시 그대로 사용 가능)
- CLI: `@tokamak-private-dapps/private-state-cli@**1.0.1**` 전역 설치(`private-state-cli` bin). `doctor: OK` — zk-EVM 2.1.0 런타임(`~/.tokamak-zk-evm/macos/runtime`) + groth16 0.2.0 + **CRS 설치 완료** → **로컬 증명 동작**.
- 워크스페이스 `~/tokamak-private-channels/`: 메인넷 `the-great-first-channel` **가입됨**(secrets/mainnet + workspace/mainnet 존재), 세폴리아 배포 아티팩트 존재(채널 미가입).
- 키 파생 원본: `$(npm root -g)/@tokamak-private-dapps/private-state-cli/lib/private-state-cli-shared.mjs` (`deriveParticipantIdentityFromSigner`), `.../private-state-tokamak-helpers.mjs` (note-receive, jubjub/poseidon).

### 다음 증분 (순서 + 정확한 시작점)
1. `npm i tokamak-l2js@0.1.4` (CLI와 **버전 일치 필수** — 아니면 키 불일치). → `src/lib/private-transfer/keys.ts` — §12의 파생식을 그대로 미러(`signMessage` 바인딩 + `deriveL2KeysFromSignature`, note-receive `eth_signTypedData_v4`). 클라이언트 사이드. 검증: 고정 서명으로 키 재현 단위 테스트.
2. `src/lib/private-transfer/cli.ts` — 1.0.1 커맨드 빌더(§12 surface, 전부 `--json`). + **로컬 Node 워커** `services/private-transfer-worker/`(shell-out). **읽기 명령부터**(doctor/get-channel/get-my-notes) 검증.
3. BFF `src/app/api/private-transfer/{keys,onboard,transfer,redeem-withdraw,notes,status}/route.ts` + `src/lib/private-transfer/service.ts`.
4. UI: `src/components/private-transfer/{PrivateTransferPanel,ProvingProgress,PrivateBalancePanel}.tsx` + `src/hooks/usePrivateTransfer.ts` → `src/app/private-transfer/page.tsx` 자리표시를 실제 패널로 교체(허브 런처가 이미 연결).
5. **진짜 E2E 검증(자금 필요):** Sepolia 채널 생성/가입(`create-channel`/`join-channel`) + 테스트 지갑 펀딩(test-wallet/testnet-faucet 스킬) → 실제 테스트넷 프라이빗 송금 1건 + recover/get-my-notes로 수신 확인.

### 결정 대기 / 안전수칙
- **메인넷 실자금은 자동으로 절대 건드리지 않음.** 라이브 검증은 Sepolia로만.
- 진행 전 사용자 확인 필요: ① Sepolia 셋업·테스트지갑 펀딩 허락, ② 워커 호스팅(서버는 추후, 지금은 로컬 워커).
- 함정: CLI는 importable 아님→shell-out. Vercel 서버리스 불가(증명 수분·FS). `transfer-notes` 입력 모양은 1→1/1→2/2→1만.

### 한 줄 재개
> §12(확정 아키텍처·주소·명령)와 `src/lib/private-transfer/constants.ts`에서 시작. 다음 = `npm i tokamak-l2js@0.1.4` + `keys.ts`.
