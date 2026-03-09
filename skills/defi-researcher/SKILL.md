---
name: defi-researcher
description: Pull DeFi market data from DefiLlama and Beefy APIs — TVL by chain, token prices, DEX volumes, yield rates, stablecoin flows. Use for market research, data gathering, or when ATLAS needs fresh data to form a thesis.
metadata: {"openclaw":{"requires":{"bins":["curl","jq"],"env":[]},"emoji":"🔬"}}
allowed-tools: Read, Bash, Glob
user-invocable: true
argument-hint: "[tvl|prices|yields|volumes|all]"
---

# DeFi Researcher — ATLAS Skill

You gather market data from free APIs to inform ATLAS investment decisions.

## Commands

### TVL Scan
```bash
curl -s "https://api.llama.fi/v2/chains" | jq '[.[] | select(.chainId == 42161 or .chainId == 8453 or .chainId == 10)] | sort_by(-.tvl) | .[] | {name, chainId, tvl: (.tvl / 1e9 | tostring + "B")}'
```

### Token Prices
```bash
# Format: {chain}:{address} — use "coingecko" for native tokens
curl -s "https://coins.llama.fi/prices/current/coingecko:ethereum,coingecko:usd-coin" | jq '.coins'
```

### Yield Data (Beefy)
```bash
# Get all vault APYs
curl -s "https://api.beefy.finance/apy" | jq 'to_entries | map(select(.key | test("arbitrum|base|optimism"; "i"))) | sort_by(-.value) | .[0:20] | from_entries'
```

### DEX Volumes
```bash
curl -s "https://api.llama.fi/overview/dexs?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true" | jq '[.protocols[] | select(.chains | index("Arbitrum") or index("Base") or index("Optimism"))] | sort_by(-.total24h) | .[0:10] | .[] | {name, total24h, chains}'
```

### Stablecoin Flows
```bash
curl -s "https://stablecoins.llama.fi/stablecoinchains" | jq '[.[] | select(.name == "Arbitrum" or .name == "Base" or .name == "Optimism")] | .[] | {name, totalCirculatingUSD}'
```

## After Gathering Data

POST a RESEARCH decision to the dashboard:
```bash
curl -X POST "$ATLAS_DASHBOARD_URL/api/decisions" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $ATLAS_API_KEY" \
  -d '{
    "phase": "RESEARCH",
    "title": "Market data snapshot",
    "reasoning": "Summary of findings",
    "observations": ["observation 1", "observation 2"],
    "metadata": {"source": "defi-researcher"}
  }'
```
