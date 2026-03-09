# Skill: Yield Analyzer

## Purpose
Compare yield opportunities across chains and protocols to identify the best risk-adjusted returns.

## Process

### Step 1: Gather Yield Data
- Pull Beefy vault APYs and filter for target chains (Arbitrum, Base, Optimism)
- Read Aave lending rates on target chain deployments
- Check major stablecoin yields (USDC, USDT, DAI)
- Note: focus on established protocols with >$10M TVL

### Step 2: Score Opportunities
For each yield opportunity, calculate:
- **Raw APY**: The advertised rate
- **Risk score** (1-10): Based on protocol age, TVL, audit status, complexity
- **Adjusted yield**: Raw APY * (1 - risk_score/20) — penalize risky yields
- **Gas cost**: Estimated entry/exit gas as % of position over 30 days
- **Net yield**: Adjusted yield - gas cost amortized

### Step 3: Compare Across Chains
- Rank opportunities by net yield
- Identify yield differentials between chains (same asset, different chain)
- Flag opportunities where differential > 2% (potential cross-chain move)

### Step 4: Historical Context
- Compare current yields to 7-day and 30-day averages
- Flag yields that are unsustainably high (>3x historical average)
- Note yield compression trends

## Output Format
Publish an ORIENT decision:
```json
{
  "phase": "ORIENT",
  "title": "Yield analysis: [top finding]",
  "reasoning": "Detailed comparison of yield opportunities",
  "observations": [
    "Top stable yield: X.X% on [protocol] ([chain]) — [risk_score]/10 risk",
    "Yield differential: [asset] pays X.X% more on [chain_a] vs [chain_b]",
    "Anomaly: [protocol] yield X.X% is 3x historical — likely unsustainable",
    "Gas-adjusted best: [protocol] on [chain] at X.X% net"
  ],
  "confidence": 70,
  "metadata": {
    "opportunities": [
      { "protocol": "...", "chain": "...", "asset": "...", "apy": 0, "risk": 0, "netYield": 0 }
    ]
  }
}
```

## Pendle Fixed Rate Comparison

In addition to lending rates and vault yields, always check Pendle implied APYs:

### Data Source
```
GET https://api-v2.pendle.finance/core/v3/{chainId}/markets?order_by=name%3A1&skip=0&limit=20&select=all
```

### Decision Framework
For each asset (e.g., USDC, stETH):
1. Get best lending rate (Aave, Morpho, Compound)
2. Get Pendle PT implied APY for same asset
3. Get Beefy best auto-compound vault APY for same asset
4. **If Pendle PT APY > lending rate for comparable duration → recommend PT**
5. **If Beefy vault APY > lending rate with acceptable risk → recommend vault**
6. Include all three in ORIENT decision observations

### Ranking Priority
1. Pendle PT (fixed, guaranteed if held to maturity)
2. Beefy auto-compound vaults (variable, auto-managed)
3. Direct lending (variable, simple)
4. Pendle YT (leveraged, high-risk — only for growth allocation)

## Active Vault Monitoring

When Beefy vault positions exist (check `/api/positions`), include in analysis:
- Current vault APY vs entry APY (is yield compressing?)
- Better alternatives available? (flag if >2% improvement exists)
- Vault TVL changes (declining TVL = risk signal)

## Red Flags (do NOT recommend)
- Yields >50% APY with no clear source
- Protocols <30 days old
- Protocols with <$1M TVL
- Yield farming requiring >3 token interactions (complexity risk)
- Pendle markets with <$500k liquidity
- PT maturity >90 days (duration risk for our timeframe)
