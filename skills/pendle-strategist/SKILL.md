# Skill: Pendle Strategist

## Purpose
Identify and execute Pendle PT/YT strategies for fixed-yield and leveraged-yield exposure. PTs provide fixed returns (like zero-coupon bonds); YTs provide leveraged variable yield.

## Data Sources

### Pendle API (Primary)
```
Base URL: https://api-v2.pendle.finance/core

# List active markets on a chain
GET /v3/{chainId}/markets?order_by=name%3A1&skip=0&limit=20&select=all

# Get market details (APY, PT discount, maturity)
GET /v3/{chainId}/markets/{marketAddress}
```

**Key fields from market data:**
- `pt.price` — PT price (discount from 1.0 = your fixed yield)
- `yt.price` — YT price (leveraged yield exposure)
- `impliedApy` — market-implied annual yield
- `underlyingApy` — actual underlying protocol yield
- `maturity` — ISO date when PT matures to full value
- `liquidity.usd` — market liquidity

### Supported Chains
- Arbitrum (42161) — Most Pendle markets
- Optimism (10) — Some markets
- Base (8453) — Growing ecosystem

## Strategy: PT Fixed Yield

### When to Buy PTs
1. `impliedApy` > best lending rate for same asset (e.g., Aave USDC rate)
2. Maturity within 7-90 days (shorter = less duration risk)
3. Market liquidity > $500k
4. PT discount > 2% annualized

### Thesis Format
```json
{
  "phase": "THESIS",
  "title": "Buy PT-stETH on Arbitrum: X.X% fixed yield to [maturity]",
  "reasoning": "PT-stETH trades at X% discount, implying X.X% fixed APY. Best lending alternative is X.X% on Aave. PT offers +X.X% premium with maturity in X days.",
  "thesis": "PT-stETH will converge to 1.0 at maturity, locking in X.X% fixed return",
  "confidence": 75,
  "observations": [
    "PT price: 0.XX (X% discount)",
    "Implied APY: X.X% vs Aave stETH: X.X%",
    "Maturity: YYYY-MM-DD (X days)",
    "Market liquidity: $X.XM"
  ],
  "metadata": {
    "strategy": "pendle-pt",
    "marketAddress": "0x...",
    "ptAddress": "0x...",
    "underlyingAsset": "stETH",
    "impliedApy": 5.2,
    "maturityDate": "2026-06-15",
    "chainId": 42161
  }
}
```

## Strategy: YT Leveraged Yield (Growth allocation)

### When to Buy YTs
1. Underlying APY is trending UP (YT value increases with yield)
2. YT price implies < current underlying yield (YT is undervalued)
3. Short maturity (< 30 days) to reduce time decay
4. **YTs count toward the 20% growth allocation** — they are leveraged instruments

### Risk Controls
- Max 10% of portfolio in any single PT/YT position
- YTs count as GROWTH allocation (20% cap applies)
- PTs count as SAFE allocation (80% bucket)
- Never buy PT/YT with maturity > 90 days
- Min market liquidity: $500k
- Always check that LI.FI Composer supports the specific PT/YT token

## Execution via LI.FI Composer

Pendle PTs and YTs are supported via LI.FI Composer (routed through GlueX protocol):

```
GET https://li.quest/v1/quote
  ?fromChain={chainId}
  &toChain={chainId}
  &fromToken={stablecoinAddress}
  &toToken={ptOrYtTokenAddress}
  &fromAmount={amountInWei}
  &fromAddress={walletAddress}
  &integrator=atlas-agent
```

If LI.FI doesn't find a route for a specific PT/YT, fall back to:
1. Swap to underlying asset via LI.FI
2. Use Pendle Router contract directly (requires custom tx construction)

## Monitoring
- Track PT positions: value converges to 1.0 at maturity (should always be profitable if held)
- Track YT positions: value depends on underlying yield — can go to zero at maturity
- Publish position updates to dashboard via `/api/positions`
- Score predictions: PT convergence is almost guaranteed; YT performance depends on yield thesis

## Output: Position Record
When executing, publish to `/api/positions`:
```json
{
  "type": "pt",
  "protocol": "pendle",
  "chainId": 42161,
  "tokenAddress": "0x...",
  "tokenSymbol": "PT-stETH-26Jun2026",
  "amount": "100.5",
  "entryValueUsd": 95.2,
  "entryPrice": 0.947,
  "apy": 5.2,
  "maturity": "2026-06-26T00:00:00Z",
  "decisionId": "..."
}
```
