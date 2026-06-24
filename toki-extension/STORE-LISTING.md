# 크롬 웹스토어 리스팅 — 붙여넣기용 문구

대시보드의 각 칸에 그대로 복사해 넣으세요. (한국어 기본 / 영어 병기)

---

## 항목 이름 (Item name, ≤75자)
```
Toki 온보딩 가이드 — 메타마스크·거래소 출금
```
영문 스토어용:
```
Toki Onboarding Guide — MetaMask & Exchange Withdrawal
```

## 짧은 설명 (Summary, ≤132자)
```
메타마스크 지갑 생성과 거래소(업비트·빗썸 등) TON 출금을 페이지 위에서 단계별로 안내하는 온보딩 도우미.
```
```
Step-by-step in-page guidance for creating a MetaMask wallet and withdrawing TON from Korean exchanges.
```

## 카테고리 / 언어
- Category: **Productivity** (또는 Developer Tools)
- Language: **한국어** (기본), 필요 시 English 추가

## 단일 목적 설명 (Single purpose)
```
이 확장 프로그램의 단일 목적은 "암호화폐 입문자가 메타마스크 지갑을 만들고 거래소에서 TON을 본인 지갑으로 출금하는 과정"을 해당 페이지 위에서 단계별로 안내하는 것입니다.
```
```
Single purpose: guide newcomers, step by step and in-page, through creating a MetaMask wallet and withdrawing TON from an exchange to their own wallet.
```

## 상세 설명 (Detailed description)

### 한국어
```
거래소에 TON을 사두고 그냥 두고 계신가요? 스테이킹으로 첫 온체인 경험을 시작해보세요.
처음 암호화폐를 시작하면 "메타마스크 설치 → 지갑 생성 → 거래소에서 내 지갑으로 출금"이 가장 헷갈립니다.
토키 온보딩 가이드는 바로 그 페이지 위에 올라타 단계별로 손을 잡아드립니다.

[메타마스크 지갑 만들기] (metamask.io)
- 설치 → 지갑 생성 → 시드구문 안전 보관까지 체크리스트로 안내
- 설치 여부 자동 감지, "연결" 한 번으로 받는 주소 자동 저장

[거래소에서 TON 출금] (업비트·빗썸·코인원·코빗)
- 트래블룰 개인지갑 등록 안내
- 저장해 둔 내 지갑 주소를 한 번에 복사
- 코인=TON, 네트워크=이더리움(ERC-20) 강조로 잘못된 네트워크 출금 방지

[TON 도착 알림]
- 출금 후 지갑에 TON이 도착하면 알림으로 알려줍니다

개인정보 보호: 지갑 주소는 브라우저에만 저장되고 외부로 전송되지 않습니다. 잔액 조회는 공개 RPC로만 수행합니다.
※ 토키는 Tokamak Network의 마스코트입니다. MetaMask 및 각 거래소와는 제휴 관계가 아니며, 이름은 안내 목적의 설명적 사용입니다.
```

### English
```
Bought TON on an exchange and just letting it sit? Put it to work with staking — your first on-chain experience.
Getting started with crypto, the trickiest part is "install MetaMask → create a wallet → withdraw from an exchange to your own wallet."
Toki Onboarding Guide rides on top of those exact pages and walks you through it.

Create a MetaMask wallet (metamask.io)
- Checklist from install → create wallet → safely back up your seed phrase
- Auto-detects MetaMask; one click "connect" saves your receiving address

Withdraw TON from an exchange (Upbit, Bithumb, Coinone, Korbit)
- Guidance for Travel-Rule personal-wallet registration
- One-click copy of your saved wallet address
- Emphasizes coin = TON, network = Ethereum (ERC-20) to prevent wrong-network withdrawals

TON-arrival notification
- Alerts you when TON lands in your wallet

Privacy: your address is stored only in your browser and never sent off-device; balance is read via public RPC only.
Note: Toki is the Tokamak Network mascot. Not affiliated with MetaMask or the exchanges; their names are used descriptively for guidance.
```

## 권한 사용 사유 (Permission justifications — 대시보드 필수)

| 권한 | 사유 |
|------|------|
| `scripting` | 메타마스크 설치 감지 및 받는 주소 읽기를 위해, 가이드 도메인 페이지에 한해 MAIN-world 프로바이더 브리지를 주입. 원격 코드 미사용(번들 포함). |
| `storage` | 사용자의 받는 주소·온보딩 진행 단계·마지막 조회 잔액을 로컬에 저장. |
| `alarms` | TON 잔액을 주기적으로 폴링하기 위한 주기 알람. |
| `notifications` | TON이 도착(잔액 증가)했을 때 알림 표시. |
| host: `metamask.io`, `*.upbit.com`, `*.bithumb.com`, `*.coinone.co.kr`, `*.korbit.co.kr` | 해당 페이지에서 단계별 안내 오버레이 표시 및 메타마스크 브리지 주입. |
| host: `eth.llamarpc.com`, `*.publicnode.com` | 저장된 주소의 TON 잔액을 읽기 위한 공개 RPC 호출. |

## 데이터 사용 공개 (Privacy practices 폼 답변 가이드)
- **수집하는 사용자 데이터**: "Authentication information" 등 **해당 없음**에 가깝게 — 지갑 주소는 사용자가 입력/연결하는 값으로 로컬에만 저장. 폼에서 데이터를 수집한다고 표기해야 하면 "User activity 없음", "Personally identifiable information 없음", "Website content 없음"으로 정직하게.
- **제3자 전송/판매**: 없음.
- **개인정보처리방침 URL**: `PRIVACY.md`를 공개 URL로 호스팅 후 입력.
- 인증서: "데이터를 승인되지 않은 제3자에게 판매하지 않음", "신용 평가/대출 무관", "공시된 목적 외 사용 안 함" 모두 체크.

## 스크린샷 (1~5장, 1280×800 권장)
- ① metamask.io 위 가이드 패널 (설치 단계 + 하이라이트 링)
- ② 거래소 페이지 위 출금 가이드 패널 (코인/네트워크 경고 단계)
- ③ 툴바 팝업 — 두 흐름 진행상황 + 저장 주소
- (참고) 개발 중 캡처한 `e2e-*.png`를 출발점으로 실제 리스팅용 캡처 권장.
```
```
