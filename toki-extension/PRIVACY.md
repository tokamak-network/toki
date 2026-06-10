# 개인정보처리방침 / Privacy Policy — Toki 온보딩 가이드

_최종 업데이트: 2026-06-09_

> 이 페이지를 공개 URL(예: GitHub Pages, 노션, tokamak.network 하위 경로)로 호스팅하고, 그 URL을 크롬 웹스토어 대시보드의 "개인정보처리방침" 칸에 입력하세요.

## 한국어

**Toki 온보딩 가이드**(이하 "확장 프로그램")는 사용자의 개인정보를 **수집·저장·전송·판매하지 않습니다.** 외부 서버를 운영하지 않습니다.

### 처리하는 데이터
- **지갑 주소(이더리움 공개 주소)**: 사용자가 직접 입력하거나 메타마스크 연결로 가져온 주소를 **브라우저 로컬 저장소(`chrome.storage.local`)에만** 보관합니다. 거래소 출금 단계에서 "주소 복사"에 재사용하기 위함입니다. 이 주소는 **외부로 전송되지 않습니다.**
- **온보딩 진행 상태**: 어느 단계까지 진행했는지를 로컬에 저장합니다.

### 네트워크 통신
- 저장된 지갑 주소의 **TON 잔액을 조회**하기 위해 공개 이더리움 RPC 노드(`eth.llamarpc.com`, `*.publicnode.com`)에 **읽기 전용 요청**을 보냅니다. TON이 도착하면 알림을 띄우기 위함입니다. 이 과정에서 개인정보는 전송되지 않으며, 조회되는 것은 공개 블록체인 데이터(잔액)뿐입니다.

### 권한 사용
- `scripting`: 메타마스크 설치 감지 및 주소 읽기를 위한 페이지 내 브리지 주입(가이드 도메인 한정).
- `storage`: 위의 로컬 저장.
- `alarms`, `notifications`: TON 도착 알림.
- 호스트 권한(`metamask.io`, 업비트·빗썸·코인원·코빗, RPC): 해당 페이지에서의 안내 표시 및 잔액 조회에만 사용.

### 데이터 삭제
확장 프로그램 팝업의 "진행 초기화" / "주소 지우기" 또는 확장 프로그램 삭제로 모든 로컬 데이터가 제거됩니다.

### 문의
(연락처 이메일 / GitHub 이슈 URL을 여기에 기재)

---

## English

**Toki Onboarding Guide** ("the Extension") does **not collect, store on any server, transmit, or sell** personal information. We operate no backend server.

### Data handled
- **Wallet address (public Ethereum address)**: an address you enter manually or import via MetaMask is stored **only in your browser's local storage (`chrome.storage.local`)**, so it can be re-used by the "copy address" action during exchange withdrawal. It is **never sent off-device.**
- **Onboarding progress**: which step you've reached, stored locally.

### Network requests
- To **read the TON balance** of your saved address (so we can notify you when TON arrives), the Extension makes **read-only** requests to public Ethereum RPC nodes (`eth.llamarpc.com`, `*.publicnode.com`). No personal data is sent; only public on-chain balance data is read.

### Permissions
- `scripting`: inject an in-page bridge (guide domains only) to detect MetaMask and read the address.
- `storage`: the local storage above.
- `alarms`, `notifications`: TON-arrival alerts.
- Host permissions (`metamask.io`, Korean exchanges, RPC): used solely for in-page guidance and balance reads.

### Data deletion
Use "Reset progress" / "Clear address" in the popup, or uninstall the Extension, to remove all local data.

### Contact
(Add a contact email / GitHub issues URL here.)
