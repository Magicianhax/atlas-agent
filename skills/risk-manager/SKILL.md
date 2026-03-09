---
name: risk-manager
description: Enforce ATLAS SOUL.md risk parameters. Run before ANY trade execution to validate position size, chain concentration, confidence, cooling period, and drawdown limits. Blocks trades that violate safety limits.
metadata: {"openclaw":{"requires":{"bins":["curl","jq"],"env":["ATLAS_DASHBOARD_URL","ATLAS_API_KEY"]},"emoji":"🛡️"}}
allowed-tools: Read, Bash, Glob
user-invocable: true
argument-hint: "[check] --trade-value <usd> --dest-chain <chainId> --confidence <pct>"
---

# Risk Manager — ATLAS Skill

Enforces SOUL.md risk parameters. NO overrides. Limits are absolute.

## 8 Risk Checks (ALL must pass)

### 1. Position Size: trade value / portfolio total <= 20%
### 2. Chain Concentration: (current chain value + trade) / total <= 40%
### 3. Confidence: thesis confidence >= 65%
### 4. Cooling Period: >= 2h since last losing trade
### 5. Daily Trade Limit: trades in last 24h < 5
### 6. Minimum Trade Size: value >= $2
### 7. Emergency Halt: drawdown from peak < 25%
### 8. Fee Reasonableness: total fees < 5% of trade value

## Process
1. Get current portfolio from GET $ATLAS_DASHBOARD_URL/api/portfolio (latest snapshot)
2. Get recent transactions from GET $ATLAS_DASHBOARD_URL/api/transactions
3. Run all 8 checks
4. If ANY fails: BLOCK with reason
5. If ALL pass: APPROVE

## Output
POST a PREDICT decision:
```bash
# Approval
curl -X POST "$ATLAS_DASHBOARD_URL/api/decisions" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $ATLAS_API_KEY" \
  -d '{
    "phase": "PREDICT",
    "title": "Risk check PASSED",
    "reasoning": "All 8 checks passed",
    "action": "APPROVED",
    "confidence": 95,
    "observations": ["Size: X% (20%) PASS", "Concentration: X% (40%) PASS"]
  }'

# Block
curl -X POST "$ATLAS_DASHBOARD_URL/api/decisions" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $ATLAS_API_KEY" \
  -d '{
    "phase": "PREDICT",
    "title": "Risk check BLOCKED: reason",
    "reasoning": "Trade blocked",
    "action": "BLOCKED",
    "confidence": 99,
    "observations": ["FAILED: specific check"]
  }'
```

## Override Policy
There is NO override. Risk limits are absolute. The agent cannot bypass them.
