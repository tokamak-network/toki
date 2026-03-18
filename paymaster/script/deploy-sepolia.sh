#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# TONPaymaster v4 — Sepolia Testnet Deployment Script
# ═══════════════════════════════════════════════════════════════
#
# 사용법:
#   cd paymaster && bash script/deploy-sepolia.sh
# ═══════════════════════════════════════════════════════════════

set -e

# ─── Private Key 입력 ─────────────────────────────────────────
if [ -z "$DEPLOYER_PRIVATE_KEY" ]; then
  echo -n "🔑 Private Key 입력 (0x 포함): "
  read DEPLOYER_PRIVATE_KEY
  if [ -z "$DEPLOYER_PRIVATE_KEY" ]; then
    echo "❌ Private Key가 입력되지 않았습니다"
    exit 1
  fi
fi

ALCHEMY_KEY=${NEXT_PUBLIC_ALCHEMY_API_KEY:-"PbqCcGx1oHN7yNaFdUJUYqPEN0QSp23S"}
RPC_URL=${RPC_URL:-"https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}"}
ETHERSCAN_API_KEY=${ETHERSCAN_API_KEY:-""}

echo -n "🔐 Guarantor 주소 입력 (보증인 계정): "
read GUARANTOR_ADDRESS
if [ -z "$GUARANTOR_ADDRESS" ]; then
  echo "❌ Guarantor 주소가 입력되지 않았습니다"
  exit 1
fi

# ─── 세폴리아 주소 ───────────────────────────────────────────
ENTRY_POINT="0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108"
TON_TOKEN="0xa30fe40285B8f5c0457DbC3B7C8A280373c40044"

# ─── 배포 파라미터 ────────────────────────────────────────────
TOKEN_PER_ETH="2500000000000000000000"  # 2500e18
STAKE_AMOUNT="0.01ether"
DEPOSIT_AMOUNT="0.1ether"
MARKUP_BPS="15000"        # 50% 마크업 (테스트용)
UNSTAKE_DELAY="86400"     # 24시간

# ─── 배포자 주소 확인 ─────────────────────────────────────────
DEPLOYER=$(cast wallet address "$DEPLOYER_PRIVATE_KEY")
BALANCE=$(cast balance "$DEPLOYER" --rpc-url "$RPC_URL" --ether)
echo ""
echo "═══════════════════════════════════════════════════"
echo "  TONPaymaster v4 — Sepolia Deployment"
echo "═══════════════════════════════════════════════════"
echo "  배포자:     $DEPLOYER"
echo "  잔액:       $BALANCE ETH"
echo "  RPC:        $RPC_URL"
echo "  Stake:      $STAKE_AMOUNT"
echo "  Deposit:    $DEPOSIT_AMOUNT"
echo "  Markup:     $MARKUP_BPS bps (50%, test)"
echo "  Guarantor:  $GUARANTOR_ADDRESS"
echo "  Oracle:     OFF (수동 환율 2500 TON/ETH)"
echo "═══════════════════════════════════════════════════"
echo ""
read -p "배포를 진행하시겠습니까? (y/N) " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
  echo "취소됨"
  exit 0
fi

# ─── Step 1: 컨트랙트 배포 ───────────────────────────────────
echo ""
echo "▶ [1/8] 컨트랙트 배포 중..."
DEPLOY_OUTPUT=$(forge create \
  --rpc-url "$RPC_URL" \
  --private-key "$DEPLOYER_PRIVATE_KEY" \
  --broadcast \
  src/TONPaymaster.sol:TONPaymaster \
  --constructor-args "$ENTRY_POINT" "$TON_TOKEN" "$TOKEN_PER_ETH" "$DEPLOYER")

PAYMASTER=$(echo "$DEPLOY_OUTPUT" | grep "Deployed to:" | awk '{print $3}')
echo "  ✅ 배포 완료: $PAYMASTER"

# ─── Step 2: 마크업 설정 ─────────────────────────────────────
echo ""
echo "▶ [2/8] 마크업 설정 ($MARKUP_BPS bps)..."
cast send "$PAYMASTER" \
  "setMarkup(uint256)" "$MARKUP_BPS" \
  --private-key "$DEPLOYER_PRIVATE_KEY" \
  --rpc-url "$RPC_URL"
echo "  ✅ 마크업 설정 완료"

# ─── Step 3: 보증인 화이트리스트 등록 ────────────────────────
echo ""
echo "▶ [3/8] 보증인 화이트리스트 등록 ($GUARANTOR_ADDRESS)..."
cast send "$PAYMASTER" \
  "setTrustedGuarantor(address,bool)" "$GUARANTOR_ADDRESS" true \
  --private-key "$DEPLOYER_PRIVATE_KEY" \
  --rpc-url "$RPC_URL"
echo "  ✅ 보증인 등록 완료"

# ─── Step 4: EntryPoint 스테이크 ─────────────────────────────
echo ""
echo "▶ [4/8] EntryPoint 스테이크 ($STAKE_AMOUNT)..."
cast send "$PAYMASTER" \
  "addStake(uint32)" "$UNSTAKE_DELAY" \
  --value "$STAKE_AMOUNT" \
  --private-key "$DEPLOYER_PRIVATE_KEY" \
  --rpc-url "$RPC_URL"
echo "  ✅ 스테이크 완료"

# ─── Step 5: EntryPoint 디포짓 ───────────────────────────────
echo ""
echo "▶ [5/8] EntryPoint 디포짓 ($DEPOSIT_AMOUNT)..."
cast send "$PAYMASTER" \
  "deposit()" \
  --value "$DEPOSIT_AMOUNT" \
  --private-key "$DEPLOYER_PRIVATE_KEY" \
  --rpc-url "$RPC_URL"
echo "  ✅ 디포짓 완료"

# ─── Step 6: TON approve ────────────────────────────────────
echo ""
echo "▶ [6/8] TON → Paymaster max approve..."
cast send "$TON_TOKEN" \
  "approve(address,uint256)" "$PAYMASTER" "$(cast max-uint)" \
  --private-key "$DEPLOYER_PRIVATE_KEY" \
  --rpc-url "$RPC_URL"
echo "  ✅ approve 완료"

# ─── Step 7: TON 풀 예치 (100 TON) ──────────────────────────
echo ""
TON_DEPOSIT_AMOUNT="100000000000000000000"  # 100 TON (18 decimals)
TON_BALANCE=$(cast call "$TON_TOKEN" "balanceOf(address)(uint256)" "$DEPLOYER" --rpc-url "$RPC_URL")
TON_BALANCE_FORMATTED=$(cast from-wei "$TON_BALANCE")
echo "▶ [7/8] TON 풀 예치 100 TON (현재 잔액: $TON_BALANCE_FORMATTED TON)..."

if [ "$TON_BALANCE" = "0" ] || [ "$TON_BALANCE" = "0x0" ]; then
  echo "  ⚠️  TON 잔액이 0입니다. 풀 예치를 건너뜁니다."
  echo "     나중에 수동으로 실행하세요:"
  echo "     cast send $PAYMASTER \"depositToken(uint256)\" $TON_DEPOSIT_AMOUNT --private-key \$PK --rpc-url $RPC_URL"
else
  cast send "$PAYMASTER" \
    "depositToken(uint256)" "$TON_DEPOSIT_AMOUNT" \
    --private-key "$DEPLOYER_PRIVATE_KEY" \
    --rpc-url "$RPC_URL"
  echo "  ✅ TON 100 TON 풀 예치 완료"
fi

# ─── Step 8: Etherscan Verify ─────────────────────────────────
echo ""
echo "▶ [8/8] Etherscan 컨트랙트 검증..."
if [ -z "$ETHERSCAN_API_KEY" ]; then
  echo "  ⚠️  ETHERSCAN_API_KEY가 설정되지 않았습니다. 검증을 건너뜁니다."
  echo "     나중에 수동으로 실행하세요:"
  echo "     forge verify-contract $PAYMASTER src/TONPaymaster.sol:TONPaymaster \\"
  echo "       --constructor-args \$(cast abi-encode \"constructor(address,address,uint256,address)\" $ENTRY_POINT $TON_TOKEN $TOKEN_PER_ETH $DEPLOYER) \\"
  echo "       --etherscan-api-key \$KEY --chain sepolia"
else
  CONSTRUCTOR_ARGS=$(cast abi-encode "constructor(address,address,uint256,address)" "$ENTRY_POINT" "$TON_TOKEN" "$TOKEN_PER_ETH" "$DEPLOYER")
  forge verify-contract "$PAYMASTER" \
    src/TONPaymaster.sol:TONPaymaster \
    --constructor-args "$CONSTRUCTOR_ARGS" \
    --etherscan-api-key "$ETHERSCAN_API_KEY" \
    --chain sepolia \
    --watch
  echo "  ✅ Etherscan 검증 완료"
fi

# ─── 완료 ────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════"
echo "  ✅ Sepolia 배포 완료!"
echo "═══════════════════════════════════════════════════"
echo "  Paymaster:   $PAYMASTER"
echo "  Owner:       $DEPLOYER"
echo "  Guarantor:   $GUARANTOR_ADDRESS"
echo "  EntryPoint:  $ENTRY_POINT"
echo "  Markup:      $MARKUP_BPS bps"
echo "  Stake:       $STAKE_AMOUNT"
echo "  Deposit:     $DEPOSIT_AMOUNT"
echo "═══════════════════════════════════════════════════"
echo ""
echo "📋 프론트엔드 반영:"
echo "  SEPOLIA_CONTRACTS.TON_PAYMASTER = \"$PAYMASTER\""
echo ""
