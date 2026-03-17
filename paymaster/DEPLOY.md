# TONPaymaster 배포 가이드

## 사전 준비

- Foundry 설치 (`forge`, `cast`)
- 배포자 지갑에 충분한 ETH (배포 가스비 + stake + deposit)
- 배포자 private key
- Etherscan API key (`ETHERSCAN_API_KEY` 환경변수 설정)

```bash
export ETHERSCAN_API_KEY=<YOUR_ETHERSCAN_API_KEY>
```

## Sepolia 테스트넷 배포

### 필요 ETH

| 항목 | 금액 |
|------|------|
| 컨트랙트 배포 가스비 | ~0.005 ETH |
| EntryPoint Stake | 0.01 ETH |
| EntryPoint Deposit | 0.1 ETH |
| **합계** | **~0.115 ETH** |

### 배포 실행

```bash
cd paymaster

forge script script/Deploy.s.sol:DeployTONPaymaster \
  --rpc-url https://eth-sepolia.g.alchemy.com/v2/<ALCHEMY_KEY> \
  --private-key <PRIVATE_KEY> \
  --broadcast \
  --slow \
  --verify
```

- `--slow`: 트랜잭션을 하나씩 순차 전송 (rate limit 방지)
- `--broadcast`: 실제 전송 (없으면 시뮬레이션만)
- `--verify`: Etherscan에 소스코드 자동 검증 (`foundry.toml`의 `[etherscan]` 키 사용)

### 배포 후 확인

```bash
# 컨트랙트 상태 확인
cast call <PAYMASTER_ADDR> "validityWindow()(uint48)" --rpc-url <RPC_URL>
cast call <PAYMASTER_ADDR> "getDeposit()(uint256)" --rpc-url <RPC_URL>

# EntryPoint stake 확인
cast call 0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108 \
  "getDepositInfo(address)(uint256,bool,uint112,uint32,uint64)" \
  <PAYMASTER_ADDR> --rpc-url <RPC_URL>
```

## 메인넷 배포

### 필요 ETH

| 항목 | 금액 | 비고 |
|------|------|------|
| 컨트랙트 배포 가스비 | ~0.005 ETH | 가스비 낮은 시점 권장 |
| EntryPoint Stake | 0.1 ETH | 번들러 신뢰용 보증금 |
| EntryPoint Deposit | 0.5~1 ETH | 가스비 지불 운전자금 |
| **합계** | **~0.6~1.1 ETH** |

### 배포 실행

```bash
cd paymaster

# 1단계: 시뮬레이션 (--broadcast 없이)
forge script script/DeployMainnet.s.sol:DeployTONPaymasterMainnet \
  --rpc-url https://eth-mainnet.g.alchemy.com/v2/<ALCHEMY_KEY> \
  --private-key <PRIVATE_KEY>

# 2단계: 시뮬레이션 결과 확인 후 실제 배포
forge script script/DeployMainnet.s.sol:DeployTONPaymasterMainnet \
  --rpc-url https://eth-mainnet.g.alchemy.com/v2/<ALCHEMY_KEY> \
  --private-key <PRIVATE_KEY> \
  --broadcast \
  --slow \
  --verify
```

- `--verify`: Etherscan에 소스코드 자동 검증 (`foundry.toml`의 `[etherscan]` 키 사용)

### 메인넷 배포 스크립트가 하는 일

1. TONPaymaster 컨트랙트 배포
2. Uniswap V3 TWAP 오라클 설정 (WTON/WETH 풀, 30분 윈도우)
3. 오라클 모드 활성화
4. EntryPoint에 0.1 ETH stake (1일 unstake delay)
5. EntryPoint에 1 ETH deposit

### 배포 후 프론트엔드 업데이트

`src/constants/contracts.ts`에서 새 주소 업데이트:

```typescript
const MAINNET_CONTRACTS = {
  // ...
  TON_PAYMASTER: "<새_배포_주소>",
};
```

## 배포 후 운영

### Owner 함수

```bash
# 가격 수동 설정 (오라클 비활성화 시)
cast send <PAYMASTER_ADDR> "setPrice(uint256)" <TON_PER_ETH_18DEC> \
  --rpc-url <RPC_URL> --private-key <PK>

# Markup 조정 (기본 15000 = 150%)
cast send <PAYMASTER_ADDR> "setMarkup(uint256)" 12000 \
  --rpc-url <RPC_URL> --private-key <PK>

# Validity window 조정 (기본 300초 = 5분)
cast send <PAYMASTER_ADDR> "setValidityWindow(uint48)" 600 \
  --rpc-url <RPC_URL> --private-key <PK>

# ETH deposit 추가
cast send <PAYMASTER_ADDR> "deposit()" --value 0.5ether \
  --rpc-url <RPC_URL> --private-key <PK>

# 모인 TON 인출
cast send <PAYMASTER_ADDR> "withdrawToken(address,uint256)" <TO_ADDR> <AMOUNT> \
  --rpc-url <RPC_URL> --private-key <PK>
```

### 잔고 모니터링

```bash
# EntryPoint deposit 잔고 (가스비 지불 풀)
cast call <PAYMASTER_ADDR> "getDeposit()(uint256)" --rpc-url <RPC_URL>

# Paymaster에 쌓인 TON 잔고 (유저에게 받은 수수료)
cast call <TON_TOKEN> "balanceOf(address)(uint256)" <PAYMASTER_ADDR> --rpc-url <RPC_URL>
```

### 운전자금 순환

1. `getDeposit()` 확인 -> 임계값 이하이면
2. `withdrawToken()` -> TON 인출
3. DEX에서 TON -> ETH 스왑
4. `deposit()` -> EntryPoint에 ETH 재충전

## 주소 참조

### Sepolia

| 항목 | 주소 |
|------|------|
| EntryPoint v0.8 | `0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108` |
| TON Token | `0xa30fe40285B8f5c0457DbC3B7C8A280373c40044` |
| TONPaymaster (현재) | `0x51820FcC9e10E9B352B670102ED0c9dC3833829f` |

### Mainnet

| 항목 | 주소 |
|------|------|
| EntryPoint v0.8 | `0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108` |
| TON Token | `0x2be5e8c109e2197D077D13A82dAead6a9b3433C5` |
| WTON | `0xc4A11aaf6ea915Ed7Ac194161d2fC9384F15bff2` |
| WTON/WETH Pool | `0xC29271E3a68A7647Fd1399298Ef18FeCA3879F59` |
| TONPaymaster | 미배포 |

## 트러블슈팅

### `in-flight transaction limit reached`
Alchemy 무료 플랜의 동시 tx 제한. `--slow` 플래그 추가하거나 잠시 후 재시도.

### `gapped-nonce tx`
이전 pending tx가 있을 때 발생. `cast nonce <ADDR> --rpc-url <RPC>` 로 확인 후 pending tx가 처리될 때까지 대기.

### `Failed to send transaction` (resume)
배포 중단 시 `--resume` 플래그로 이어서 실행:
```bash
forge script script/Deploy.s.sol:DeployTONPaymaster \
  --rpc-url <RPC_URL> --private-key <PK> --broadcast --resume
```
