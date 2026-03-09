# HEARTBEAT.md

Every heartbeat, do the following:

## 1. Check Vital Signs
- Read wallet balances on target chains (Arbitrum, Base, Optimism) if wallet is set up
- Check gas prices: curl -s "https://li.quest/v1/gas/prices" or use get_gas_prices tool
- Note any anomalies (gas spike, balance mismatch)

## 2. Score Due Predictions
- Check dashboard for pending predictions past their timeframe
- Score each as correct/incorrect/expired
- Update via PATCH /api/predictions

## 3. Portfolio Snapshot
- Calculate current portfolio value
- POST to /api/portfolio

## 4. Status Update
- POST a MONITOR decision to /api/decisions with:
  - Current portfolio value
  - Gas prices summary
  - Active predictions count
  - Any anomalies


If nothing is set up yet (no wallet, no dashboard), just reply HEARTBEAT_OK.
