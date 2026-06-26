# Toki Offline Event - Legal Risk Analysis (Korea)

> Date: 2026-03-25
> Status: Initial research (formal legal counsel recommended before execution)

## Proposed Event Flow

1. Bar visit / drink purchase -> Free lottery participation
2. Random TON quantity distribution
3. Toki AI assistant creates wallet and delivers TON
4. Additional incentive for community signup
5. Use TON at the bar for discounts or staking

## Risk Assessment by Stage

### 1. Lottery / Random TON Distribution

**HIGH RISK if "purchase" is required for participation.**

| Law | Risk |
|-----|------|
| Speculative Activity Regulation Act (사행행위 등 규제 및 처벌 특례법) | "Collecting money and distributing benefits by lottery" = Licensed lottery business. Requires police chief approval |
| Same law, enforcement decree | Lottery/prize businesses require separate licenses. Criminal penalties for unlicensed operation |
| Lottery and Lottery Fund Act (복권 및 복권기금법) | Only the Minister of Economy and Finance can issue lotteries. Private entities cannot use the form/name of "lottery" |

**Core issue:** Payment (purchase) + Random outcome (lottery) + Financial benefit (TON) = All 3 elements of speculative activity met.

**Mitigation strategies:**
- **Option A**: Free lottery — bar customers get free participation (promotional prize, no license needed)
- **Option B**: Everyone receives TON (random quantity only) — no winner/loser distinction, avoids lottery classification
- **Option C**: Fixed quantity for all — safest, removes all randomness

### 2. Wallet Creation via Toki Assistant

**NO RISK.** Technical service provision via Privy SDK.

### 3. Community Signup Incentive

**LOW RISK** with caution:
- Free airdrop has no direct regulation currently
- Fair Trade Commission prize value limits apply
- Tax withholding (22%) required for prizes exceeding 50,000 KRW per instance
- Must report to National Tax Service within 10 days of distribution

### 4. Using TON at Bar / Staking

**NO RISK.** Discount/loyalty programs and staking are voluntary user actions.

## Tax Obligations (All Methods)

| Condition | Obligation |
|-----------|-----------|
| Per-instance value ≤ 50,000 KRW | Tax-exempt |
| Per-instance value > 50,000 KRW | 22% withholding + NTS report (within 10 days) |
| Annual distribution records | Filing required |

## Summary

| Stage | Risk Level | Reason |
|-------|-----------|--------|
| Paid lottery -> random payout | **HIGH** | Speculative Activity Act violation |
| Free lottery -> random payout | LOW | Classified as promotional prize |
| Wallet creation | NONE | Technical service |
| Community signup incentive | LOW | Airdrop; watch tax obligations |
| Bar use / staking | NONE | Voluntary user action |

## Recommendation

Remove "purchase" requirement. Design as free promotional event for bar customers. This avoids most legal risks while preserving the engaging lottery experience.

**Formal legal counsel is strongly recommended before execution.**

## References

- Speculative Activity Regulation Act: https://ko.wikisource.org/wiki/사행행위_등_규제_및_처벌_특례법
- Fair Trade Commission Prize Guidelines: https://www.law.go.kr/LSW/admRulInfoP.do?admRulSeq=2000000026806
- Virtual Asset User Protection Act: https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=261099
- 2026 Virtual Asset Industry Key Issues: https://www.lawtimes.co.kr/LawFirm-NewsLetter/215219
