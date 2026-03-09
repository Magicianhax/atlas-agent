# Skill: Momentum Trader

## Purpose
Detect and trade trending tokens on L2s using volume/momentum signals. This is the GROWTH allocation strategy (20% of portfolio cap). Uses DEXScreener for signal detection and LI.FI for execution.

## Data Sources

### DEXScreener API
```
# Get token data (price, volume, liquidity)
GET https://api.dexscreener.com/tokens/v1/{chainSlug}/{tokenAddress}

# Get trending/boosted tokens
GET https://api.dexscreener.com/token-boosts/latest/v1

# Search tokens by name
GET https://api.dexscreener.com/latest/dex/search?q={query}

# Get pairs by chain
GET https://api.dexscreener.com/latest/dex/pairs/{chainSlug}/{pairAddress}
```

Chain slugs: `arbitrum` (42161), `base` (8453), `optimism` (10)

### Key Metrics to Extract
- `volume.h24` — 24h trading volume
- `volume.h6` — 6h trading volume (for spike detection)
- `priceChange.h24` — 24h price change %
- `priceChange.h6` — 6h price change %
- `liquidity.usd` — total DEX liquidity
- `fdv` — fully diluted valuation
- `pairCreatedAt` — age of the pair

## Signal Detection

### Buy Signals (must meet ALL criteria)
1. **Volume spike**: 6h volume > 3x the average (h24/4 baseline)
2. **Positive momentum**: h6 price change > +5%
3. **Sufficient liquidity**: > $50k in DEX liquidity
4. **Not brand new**: Pair age > 24 hours (avoid rugs)
5. **Reasonable FDV**: < $100M (enough room for growth)
6. **On supported chains**: Arbitrum or Base only (most L2 meme/alt activity)

### Exit Signals
1. **Stop-loss**: Price drops -15% from entry → auto-sell immediately
2. **Take-profit**: Price rises +30% from entry → sell 50%, trail stop on rest
3. **Momentum reversal**: 6h price change < -10% → exit
4. **Time limit**: If no significant move after 48h → exit to free capital

## Risk Controls — HARD LIMITS
- **Total growth allocation**: Max 20% of portfolio across ALL momentum positions
- **Per-token cap**: Max 5% of portfolio in any single token
- **Min confidence**: 70% (higher than safe yield trades)
- **Cooling period**: 4h between momentum trades (prevent overtrading)
- **Never buy**: tokens with < $50k liquidity, < 24h old pairs, tokens on unsupported chains

## Execution via LI.FI

All momentum trades use LI.FI for swap execution:
```
GET https://li.quest/v1/quote
  ?fromChain={chainId}
  &toChain={chainId}
  &fromToken={stablecoinOrEthAddress}
  &toToken={trendingTokenAddress}
  &fromAmount={amountInWei}
  &fromAddress={walletAddress}
  &slippage=0.03
  &integrator=atlas-agent
```

**Important**: Set slippage to 3% for volatile tokens (vs 0.5% for stablecoins).

## Thesis Format
```json
{
  "phase": "THESIS",
  "title": "Momentum buy: [TOKEN] on [chain]",
  "reasoning": "Volume spike detected. 6h vol $X (Xz average). Price +X% in 6h. Liquidity $Xk. FDV $XM. Fits growth allocation (current: X% of 20% cap).",
  "thesis": "[TOKEN] momentum will continue based on volume acceleration",
  "confidence": 72,
  "observations": [
    "6h volume: $X (Xz vs 24h average)",
    "Price change: +X% (6h), +X% (24h)",
    "Liquidity: $Xk across X pairs",
    "FDV: $XM",
    "Signal source: DEXScreener trending/volume spike"
  ],
  "metadata": {
    "strategy": "momentum",
    "tokenAddress": "0x...",
    "tokenSymbol": "TOKEN",
    "chainId": 8453,
    "entryPrice": 0.0045,
    "stopLossPrice": 0.003825,
    "takeProfitPrice": 0.00585,
    "liquidityUsd": 120000,
    "volume6h": 450000
  }
}
```

## Position Tracking
When executing, publish to `/api/positions`:
```json
{
  "type": "momentum",
  "protocol": "lifi",
  "chainId": 8453,
  "tokenAddress": "0x...",
  "tokenSymbol": "TOKEN",
  "amount": "1000",
  "entryValueUsd": 45.0,
  "entryPrice": 0.0045,
  "stopLossPrice": 0.003825,
  "decisionId": "..."
}
```

## Anti-FOMO Rules
Before every momentum trade, verify:
1. Are you chasing a pump that already happened? (If >+50% in 24h, the move may be done)
2. Is this FOMO from seeing trending tokens? (Require concrete volume data, not just price)
3. Can you afford to lose the entire position? (Max 5% per token)
4. Have you checked for rug indicators? (Renounced ownership, locked liquidity, audit status)

## Scanning Schedule
- Every 30 min: Pull DEXScreener trending tokens for Arbitrum and Base
- Every 30 min: Check existing momentum positions against stop-loss/take-profit triggers
- Log ALL scans as RESEARCH decisions (even when no signal detected — shows due diligence)
