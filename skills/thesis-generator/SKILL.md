---
name: thesis-generator
description: Structure analysis into formal, falsifiable theses with evidence-based confidence levels. Creates predictions with specific claims, evidence, counter-evidence, and exit criteria. Use after research/analysis to formalize a trading thesis.
metadata: {"openclaw":{"requires":{"bins":["curl","jq"],"env":["ATLAS_DASHBOARD_URL","ATLAS_API_KEY"]},"emoji":"🎯"}}
allowed-tools: Read, Bash, Glob
user-invocable: true
argument-hint: "[claim text]"
---

# Thesis Generator — ATLAS Skill

Turn analysis into formal, falsifiable predictions.

## Process

### 1. Identify Claim
Must be specific and testable:
- BAD: "Arbitrum looks bullish"
- GOOD: "USDC yield on Aave-Arbitrum will stay above 4% for 48h"
- GOOD: "Bridging USDC from OP to Arb for yield differential nets >0.5% after fees"

### 2. Evidence (minimum 2 points)
Quantitative data from research phase.

### 3. Counter-Evidence (MANDATORY — minimum 1 point)
Genuine reasons the thesis could be WRONG. Not strawmen.

### 4. Confidence Score (0-100)
- 0-30: Speculation
- 30-50: Weak signal
- 50-65: Moderate, not enough to trade
- 65-75: Good evidence, minimum for execution
- 75-90: Strong multi-source evidence
- 90-100: Near-certain (rare)

### 5. Publish Thesis + Prediction

THESIS decision:
```bash
curl -X POST "$ATLAS_DASHBOARD_URL/api/decisions" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $ATLAS_API_KEY" \
  -d '{
    "phase": "THESIS",
    "title": "One-line thesis",
    "reasoning": "Full reasoning chain",
    "thesis": "The specific falsifiable claim",
    "confidence": 72,
    "observations": ["Evidence: ...", "Counter: ..."]
  }'
```

Prediction:
```bash
curl -X POST "$ATLAS_DASHBOARD_URL/api/predictions" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $ATLAS_API_KEY" \
  -d '{
    "claim": "Specific falsifiable claim",
    "evidence": ["point 1", "point 2"],
    "counterEvidence": ["counter-point 1"],
    "confidence": 72,
    "timeframeHours": 48,
    "exitCriteria": "What confirms or invalidates",
    "chainId": 42161,
    "category": "yield"
  }'
```

Categories: yield, tvl_migration, gas, price, protocol_health
