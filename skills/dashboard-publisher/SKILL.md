---
name: dashboard-publisher
description: Publish data to all ATLAS dashboard endpoints — decisions, predictions, portfolio snapshots, and transactions. Use this after ANY research cycle, prediction, or trade to ensure all data reaches the dashboard.
metadata: {"openclaw":{"requires":{"bins":["curl"],"env":["ATLAS_DASHBOARD_URL","ATLAS_API_KEY"]},"emoji":"📡"}}
allowed-tools: Read, Bash, Glob
user-invocable: true
argument-hint: "[decisions|predictions|portfolio|transactions]"
---

# Dashboard Publisher — ATLAS Skill

Push data to the ATLAS dashboard. ALL data must be published for transparency.

## Endpoints

### 1. Decision Log (every phase gets one)
```bash
curl -X POST "$ATLAS_DASHBOARD_URL/api/decisions" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $ATLAS_API_KEY" \
  -d '{
    "phase": "RESEARCH|ORIENT|THESIS|PREDICT|EXECUTE|MONITOR",
    "title": "Short descriptive title",
    "reasoning": "Full reasoning chain — be transparent",
    "observations": ["Key observation 1", "Key observation 2"],
    "thesis": "The specific claim (THESIS phase only)",
    "action": "What action was taken (EXECUTE phase only)",
    "confidence": 72,
    "metadata": {"source": "skill-name"}
  }'
```

### 2. Prediction (when you form a formal prediction)
IMPORTANT: Always post to BOTH /api/decisions AND /api/predictions.
```bash
curl -X POST "$ATLAS_DASHBOARD_URL/api/predictions" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $ATLAS_API_KEY" \
  -d '{
    "claim": "Specific falsifiable claim with numbers and deadline",
    "evidence": ["Evidence point 1", "Evidence point 2"],
    "counterEvidence": ["Counter-evidence point 1"],
    "confidence": 72,
    "timeframeHours": 48,
    "exitCriteria": "Condition that confirms or invalidates",
    "chainId": 8453,
    "category": "yield|tvl_migration|gas|price|protocol_health"
  }'
```

### 3. Portfolio Snapshot (every heartbeat or after trades)
```bash
curl -X POST "$ATLAS_DASHBOARD_URL/api/portfolio" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $ATLAS_API_KEY" \
  -d '{
    "totalValueUsd": "0.00",
    "holdings": [
      {"chainId": 42161, "token": "ETH", "symbol": "ETH", "amount": "0", "valueUsd": "0"},
      {"chainId": 8453, "token": "ETH", "symbol": "ETH", "amount": "0", "valueUsd": "0"},
      {"chainId": 10, "token": "ETH", "symbol": "ETH", "amount": "0", "valueUsd": "0"}
    ],
    "pnl24h": "0",
    "pnlTotal": "0"
  }'
```

### 4. Transaction (after any trade or bridge)
```bash
curl -X POST "$ATLAS_DASHBOARD_URL/api/transactions" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $ATLAS_API_KEY" \
  -d '{
    "type": "swap|bridge",
    "status": "pending|completed|failed",
    "fromChainId": 42161,
    "toChainId": 8453,
    "fromToken": "USDC",
    "toToken": "USDC",
    "fromAmount": "100.00",
    "toAmount": "99.80",
    "valueUsd": "100.00",
    "txHash": "0x...",
    "gasCostUsd": "0.15",
    "bridgeFeeUsd": "0.05"
  }'
```

### 5. Update Prediction (when resolved)
```bash
curl -X PATCH "$ATLAS_DASHBOARD_URL/api/predictions" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $ATLAS_API_KEY" \
  -d '{
    "id": "prediction-id",
    "status": "correct|incorrect|expired",
    "outcome": "What actually happened",
    "postMortem": "What I learned"
  }'
```

## Rules
- NEVER skip publishing. Transparency is the core product.
- Every research cycle → at least 1 RESEARCH decision + 1 portfolio snapshot
- Every prediction → 1 PREDICT decision + 1 prediction via /api/predictions
- Every trade → 1 EXECUTE decision + 1 transaction via /api/transactions
