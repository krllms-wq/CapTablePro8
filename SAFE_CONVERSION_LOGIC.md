# SAFE Conversion Logic - Anti-Dilution Protection

## Core Principle: Pre-Money Conversion

SAFEs (Simple Agreements for Future Equity) must convert at **pre-money valuation** to ensure new investors are not diluted by the conversion.

## Conversion Sequence

1. **SAFE Conversion (Pre-Money)**: SAFEs convert first, based on the pre-money valuation
2. **New Investment**: New investors receive shares based on their investment amount and target ownership

## Example Scenario

### Before Round
- Existing shareholders: 5,000,000 shares
- SAFE: $350,000 principal with 30% discount

### Funding Round
- New investment: $750,000 at $0.49/share
- Target new investor ownership: 22.06%

### Conversion Process
1. **SAFE converts first** (pre-money):
   - Conversion price: $0.49 × (1 - 0.30) = $0.343/share
   - SAFE shares: $350,000 ÷ $0.343 = 1,020,408 shares

2. **Calculate post-SAFE share count**:
   - Total shares after SAFE: 5,000,000 + 1,020,408 = 6,020,408 shares

3. **New investor gets target ownership**:
   - For 22.06% ownership: 6,020,408 ÷ (1 - 0.2206) - 6,020,408 = 1,704,918 shares
   - New investor pays: 1,704,918 × $0.49 = $835,410

### Result
- New investor gets exactly 22.06% ownership
- SAFE holder gets benefit of discount
- No dilution of new investor's intended stake

## Implementation Notes

- The `calculateSAFEConversion` function respects this principle
- SAFE conversions are recorded in the database before new round investments
- Cap table calculations account for this sequence

## Why This Matters

Without pre-money conversion, SAFEs would dilute new investors, making funding rounds less attractive and potentially leading to down rounds or failed fundraising.