# Skill: Chain Scanner

## Purpose
Monitor chain health, gas prices, and network conditions across target chains.

## Data Sources

### LI.FI MCP Server
- `get_chains` — chain status, supported bridges
- `get_gas_prices` — current gas costs
- `get_connections` — available routes between chains

### On-chain RPC (via wallet tools)
- Block number and timestamp (chain liveness)
- Pending transaction count (congestion signal)

## Checks
1. **Gas prices**: Compare current vs 24h average. Flag if >2x average.
2. **Chain status**: Verify all target chains are operational via LI.FI
3. **Bridge availability**: Check which bridges are available for target chain pairs
4. **Sequencer health**: For L2s, verify sequencer is posting batches

## Output Format
Publish a RESEARCH decision:
```json
{
  "phase": "RESEARCH",
  "title": "Chain health scan",
  "reasoning": "Network conditions assessment",
  "observations": [
    "Arbitrum: gas X gwei (normal/elevated/high), sequencer OK",
    "Base: gas X gwei (normal/elevated/high), sequencer OK",
    "Optimism: gas X gwei (normal/elevated/high), sequencer OK",
    "Available bridges: Stargate, Hop, Across for all pairs",
    "No anomalies detected / ANOMALY: [description]"
  ]
}
```

## Anomaly Triggers
- Gas >5x 24h average → flag, consider delaying trades
- Chain unreachable → flag, halt trades on that chain
- Bridge unavailable → flag, update available routes
- Block production stopped >5min → critical alert

## Frequency
- Every heartbeat (30 min)
- Before every trade execution
