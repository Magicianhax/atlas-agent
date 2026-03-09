---
name: prediction-scorer
description: Score pending predictions against current market data. Check if predictions have been confirmed or invalidated by their exit criteria. Use during heartbeat or daily review.
metadata: {"openclaw":{"requires":{"bins":["curl","jq"],"env":["ATLAS_DASHBOARD_URL","ATLAS_API_KEY"]},"emoji":"🎯"}}
allowed-tools: Read, Bash, Glob
user-invocable: true
argument-hint: "[score-all|score <prediction-id>]"
---

# Prediction Scorer — ATLAS Skill

Evaluate pending predictions against reality.

## Process

### 1. Get Pending Predictions
```bash
curl -s "$ATLAS_DASHBOARD_URL/api/predictions" | jq '[.[] | select(.status == "pending")]'
```

### 2. For Each Prediction
- Read the claim and exit criteria
- Pull current data from DefiLlama/Beefy to compare
- Determine: still pending, correct, incorrect, or expired

### 3. Score
If the prediction timeframe has passed OR exit criteria met:
```bash
curl -X PATCH "$ATLAS_DASHBOARD_URL/api/predictions" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $ATLAS_API_KEY" \
  -d '{
    "id": "prediction-id",
    "status": "correct|incorrect|expired",
    "outcome": "What actually happened (with data)",
    "postMortem": "What I learned from this prediction"
  }'
```

### 4. Log Decision
```bash
curl -X POST "$ATLAS_DASHBOARD_URL/api/decisions" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $ATLAS_API_KEY" \
  -d '{
    "phase": "MONITOR",
    "title": "Prediction Scoring: [summary]",
    "reasoning": "Detailed evaluation with data comparison",
    "observations": ["Prediction X was correct/incorrect because..."],
    "confidence": null,
    "metadata": {"source": "prediction-scorer", "scored": 3, "correct": 2}
  }'
```

## Calibration Update
After scoring, update MEMORY.md with running accuracy stats.
