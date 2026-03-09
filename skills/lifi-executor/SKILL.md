# Skill: LI.FI Executor

## Purpose
Execute cross-chain swaps and bridges via LI.FI protocol with Privy server wallet signing.

## Pre-Execution Checklist
Before ANY execution, verify ALL of these:
1. ✅ Risk manager has approved the trade
2. ✅ Confidence >= 65% (from thesis)
3. ✅ Trade size <= 20% of portfolio
4. ✅ Resulting chain concentration <= 40%
5. ✅ Cooling period respected (2h since last losing trade)
6. ✅ Daily trade count < 5
7. ✅ Trade value >= $2

## Execution Flow

### Step 1: Get Quote
```
GET https://li.quest/v1/quote
  ?fromChain={fromChainId}
  &toChain={toChainId}
  &fromToken={fromTokenAddress}
  &toToken={toTokenAddress}
  &fromAmount={amountInWei}
  &fromAddress={walletAddress}
  &integrator=atlas-agent
```

### Step 2: Evaluate Route
From the quote response, extract:
- `estimate.toAmount` — expected output
- `estimate.executionDuration` — time estimate
- `estimate.gasCosts` — gas cost breakdown
- `estimate.feeCosts` — bridge/protocol fees
- `action.slippage` — slippage tolerance

Verify:
- Total fees (gas + bridge) < 2% of trade value
- Slippage is acceptable (<1% for stables, <3% for volatile)
- Route doesn't go through untrusted bridges

### Step 3: Token Approval (if needed)
If the `transactionRequest.data` requires approval:
1. Build approval tx for LI.FI diamond contract
2. Sign via Privy server wallet
3. Wait for confirmation
4. Publish EXECUTE decision about approval

### Step 4: Execute Swap/Bridge
1. Take `transactionRequest` from quote response
2. Sign via Privy server wallet API
3. Broadcast transaction
4. Get txHash

### Step 5: Monitor
1. Poll `GET https://li.quest/v1/status?txHash={txHash}&bridge={bridge}&fromChain={fromChainId}&toChain={toChainId}`
2. Or use LI.FI MCP `get_transaction_status`
3. Statuses: PENDING → DONE or FAILED
4. For bridges: may take 1-20 minutes

### Step 6: Record
Publish to dashboard:
- EXECUTE decision with full route details
- Transaction record with all costs and hashes

## Output Format
```json
{
  "phase": "EXECUTE",
  "title": "Bridge USDC: Optimism → Arbitrum",
  "reasoning": "Executing approved trade. Route: Stargate bridge, est. 3min, fees $0.42",
  "action": "bridge",
  "confidence": 75,
  "observations": [
    "Quote: 50 USDC → 49.85 USDC (0.3% slippage)",
    "Route: Stargate via LI.FI",
    "Gas: $0.12, Bridge fee: $0.30",
    "Est. duration: 3 minutes"
  ],
  "metadata": {
    "txHash": "0x...",
    "lifiRouteId": "...",
    "fromChain": 10,
    "toChain": 42161
  }
}
```

## Pendle PT/YT via LI.FI Composer

LI.FI Composer supports Pendle PTs and YTs natively (routed through GlueX protocol).
Use the standard `/v1/quote` endpoint with the PT or YT token address as `toToken`:

```
GET https://li.quest/v1/quote
  ?fromChain={chainId}&toChain={chainId}
  &fromToken={stablecoinAddress}
  &toToken={ptOrYtAddress}
  &fromAmount={amountInWei}
  &fromAddress={walletAddress}
  &integrator=atlas-agent
```

After execution, publish position to `/api/positions` with type "pt" or "yt" and protocol "pendle".

## Beefy Vault Operations

Beefy vaults are NOT routable via LI.FI — they require direct contract interaction.

### Deposit
1. Ensure you hold the vault's "want" token (e.g., USDC for a USDC vault)
2. Use `beefy-deposit.js` script: `echo '{"chainId":42161,"vaultAddress":"0x...","wantTokenAddress":"0x...","amount":"100","decimals":6}' | node beefy-deposit.js`
3. Script handles approval + deposit + returns shares received
4. Publish position to `/api/positions` with type "vault" and protocol "beefy"

### Withdraw
1. Use `beefy-withdraw.js` script: `echo '{"chainId":42161,"vaultAddress":"0x...","shares":"all"}' | node beefy-withdraw.js`
2. Update position status to "closed" via PATCH `/api/positions`

### Beefy Vault Discovery
```
GET https://api.beefy.finance/vaults
```
Filter by: `chain` (arbitrum/base/optimism), `status` = "active", sort by `totalApy` descending.

## Error Handling
- Quote fails → retry once, then abort and publish failure reason
- Tx reverts → publish EXECUTE decision with error, trigger cooling period
- Bridge stuck → keep polling for 30 min, then escalate in MONITOR
- Slippage exceeded → do not retry automatically, re-evaluate
- Beefy deposit fails → check approval, check want token balance, retry once
- Pendle route not found → fall back to manual swap + Pendle Router
