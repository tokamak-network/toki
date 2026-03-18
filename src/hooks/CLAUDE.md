<claude-mem-context>
# Recent Activity

### Feb 23, 2026

| ID | Time | T | Title | Read |
|----|------|---|-------|------|
| #855 | 5:01 PM | 🔵 | TON Token Lacks EIP-2612 Permit and EIP-3009 Support | ~498 |
</claude-mem-context>

# Hooks Development Notes

## Critical: TON Token Limitations

**TON token (0x2be5e8c109e2197D077D13A82dAead6a9b3433C5) does NOT implement:**
- `permit()` (EIP-2612) - No gasless approval via signature
- `transferWithAuthorization()` (EIP-3009) - No meta-transaction transfers

This means gasless patterns that rely on ERC-20 permit (e.g., Uniswap Permit2, gasless swaps via UniswapX/1inch Fusion/CoW Protocol) **cannot be used with TON**.

### Implications for gasless UX:
- Cannot use `permit()` to avoid separate approve transactions
- Cannot use permit-based relayer patterns
- Gasless staking requires EIP-7702 + Paymaster (TONPaymaster) approach
- MetaMask users need ETH for first-time smart account upgrade (EIP-7702)
- Only Privy embedded wallet path achieves fully gasless (ETH 0) staking

## TONPaymaster v3 Integration

**useEip7702.ts / useSessionKey.ts** 공통:
- `createTonPaymasterProvider(paymasterAddress)` — `/api/paymaster` 서버 API 호출
- Mode 0x01 (Guarantor): 서버가 EIP-712 서명 생성 → 유저 ETH 불필요
- Mode 0x00 (Pre-charge) 폴백: 서버 에러 시 자동 전환 (유저 TON 선결제)
- 서버 API가 `pm_getPaymasterStubData` (gas estimation) + `pm_getPaymasterData` (final) 양쪽 처리

**메인넷 전환 시**: `src/constants/contracts.ts`의 `MAINNET_CONTRACTS.TON_PAYMASTER` 주소만 업데이트하면 자동 연결

## Critical: Exchange Constraints

**Upbit (업비트)**: 개인지갑 인증 시 **MetaMask 연결만 지원** (주소 수동 입력 불가)
- Privy embedded wallet 주소를 Upbit에 등록할 수 없음
- 거래소 → Privy 지갑 직접 출금 불가
- MetaMask EOA로만 출금 가능 → MetaMask에서 gasless 스테이킹이 핵심 과제