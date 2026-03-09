---
name: portfolio-tracker
description: Check wallet balances across Arbitrum, Base, and Optimism using RPC calls. Includes Beefy vault deposits. Calculate total portfolio value and push snapshots to the dashboard. Use during heartbeat or after trades.
metadata: {"openclaw":{"requires":{"bins":["curl","jq","bc"],"env":["ATLAS_DASHBOARD_URL","ATLAS_API_KEY","ATLAS_WALLET_ADDRESS","ALCHEMY_API_KEY"]},"emoji":"💰"}}
allowed-tools: Read, Bash, Glob
user-invocable: true
argument-hint: "[check|snapshot]"
---

# Portfolio Tracker — ATLAS Skill

Check multi-chain balances (liquid + vault deposits) and publish portfolio snapshots.

## Wallet
Address: Read from $ATLAS_WALLET_ADDRESS env var.
**CRITICAL:** Always `source .env` first. Never hardcode wallet addresses.

## RPC Endpoints (prefer Alchemy where available)
- Arbitrum: `https://arb-mainnet.g.alchemy.com/v2/$ALCHEMY_API_KEY`
- Base: `https://base-mainnet.g.alchemy.com/v2/$ALCHEMY_API_KEY`
- Optimism: `https://mainnet.optimism.io` (no Alchemy)

## Step 1: Check Liquid Balances

### Native ETH on each chain
```bash
source .env
WALLET=$ATLAS_WALLET_ADDRESS
WALLET_LOWER=$(echo "$WALLET" | tr '[:upper:]' '[:lower:]')
PADDED="000000000000000000000000${WALLET_LOWER:2}"
BAL_DATA="0x70a08231${PADDED}"

ARB_RPC="https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}"
BASE_RPC="https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}"
OP_RPC="https://mainnet.optimism.io"

for LABEL_RPC in "Arbitrum|$ARB_RPC" "Base|$BASE_RPC" "Optimism|$OP_RPC"; do
  LABEL=$(echo "$LABEL_RPC" | cut -d'|' -f1)
  RPC=$(echo "$LABEL_RPC" | cut -d'|' -f2)
  echo "$LABEL ETH:"
  curl -s -X POST "$RPC" -H "Content-Type: application/json" \
    -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getBalance\",\"params\":[\"$WALLET\",\"latest\"],\"id\":1}" | jq -r '.result'
done
```

### ERC-20 tokens (USDC, USDT)
```bash
# balanceOf(address) = 0x70a08231 + padded address
# USDC addresses
USDC_ARB="0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
USDC_BASE="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
USDC_OP="0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85"
# USDT addresses
USDT_ARB="0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"
USDT_OP="0x94b008aA00579c1307B0EF2c499aD98a8ce58e58"

# Query each with eth_call to token contract
```

## Step 2: Check Beefy Vault Deposits (CRITICAL — DO NOT SKIP)

The wallet has USDC deposited in Beefy auto-compounding vaults. These show up as "moo" tokens, NOT as USDC in the wallet. You MUST check these to get the true portfolio value.

### Known Active Vault Positions
| Vault | Contract | Chain | Underlying |
|-------|----------|-------|------------|
| mooMorphoArbHyperithmUSDC | `0x99925188f1B92661A443376319370ACFF1D68B87` | Arbitrum | USDC |
| mooEulerArbUSDC | `0x24a4fc8d00e33A3b7f158e3a455B88e674941DAC` | Arbitrum | USDC |
| mooCompoundBaseUSDC | `0xeF6ED674486E54507d0f711C0d388BD8a1552E6F` | Base | USDC |
| mooMorpho-Ionic-USDC | `0xf779fBa773b28472749c071C5185e99014850406` | Base | USDC |
| mooMorphoOpGauntletPrimeUSDC | `0xb3D2afBBc8485E3C89C8e511470988526763eAA8` | Optimism | USDC |

### How to value vault tokens
1. Get moo token balance: `balanceOf(wallet)` → 18 decimals
2. Get price per share: `getPricePerFullShare()` selector `0x77c7b8fc` → 18 decimals
3. Calculate underlying USDC: `(balance × pricePerFullShare) / 1e18` → result in USDC 6 decimals
4. Convert to USD: `result / 1e6`

```bash
# For each vault:
VAULT="0x99925188f1B92661A443376319370ACFF1D68B87"  # or Euler vault

# Balance
BAL_HEX=$(curl -s -X POST "$ARB_RPC" -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_call\",\"params\":[{\"to\":\"$VAULT\",\"data\":\"$BAL_DATA\"},\"latest\"],\"id\":1}" | jq -r '.result')
BAL_DEC=$((16#${BAL_HEX:66}))  # trim leading zeros

# Price per share
PPS_HEX=$(curl -s -X POST "$ARB_RPC" -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_call\",\"params\":[{\"to\":\"$VAULT\",\"data\":\"0x77c7b8fc\"},\"latest\"],\"id\":1}" | jq -r '.result')
PPS_DEC=$((16#${PPS_HEX:2}))

# USDC value
USDC_VALUE=$(echo "scale=6; $BAL_DEC * $PPS_DEC / 1000000000000000000 / 1000000" | bc)
echo "Vault USDC: $USDC_VALUE"
```

### Discovering NEW vault positions
If you suspect new vaults exist, use Alchemy's `alchemy_getAssetTransfers`:
```bash
curl -s -X POST "$ARB_RPC" -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"alchemy_getAssetTransfers\",\"params\":[{\"fromAddress\":\"$WALLET\",\"category\":[\"erc20\"],\"order\":\"desc\",\"maxCount\":\"0x14\"}],\"id\":1}" | jq '.result.transfers[] | {to, value, asset}'
```
Look for transfers TO known Beefy vault addresses (cross-reference with `https://api.beefy.finance/vaults`).

## Step 3: Get ETH Price
```bash
curl -s "https://coins.llama.fi/prices/current/coingecko:ethereum" | jq '.coins["coingecko:ethereum"].price'
```

## Step 4: Calculate Total Portfolio
Sum all:
- Liquid ETH (all chains) × ETH price
- Liquid USDC (all chains)
- Liquid USDT (all chains)
- Beefy vault USDC values (from Step 2)

## Step 5: Publish Snapshot
```bash
curl -X POST "$ATLAS_DASHBOARD_URL/api/portfolio" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $ATLAS_API_KEY" \
  -d '{
    "totalValueUsd": "44.53",
    "holdings": [
      {"asset": "ETH", "chain": "arbitrum", "amount": "0.000590", "valueUsd": "1.17"},
      {"asset": "USDC", "chain": "arbitrum", "amount": "1.02", "valueUsd": "1.02"},
      {"asset": "mooMorphoArbHyperithmUSDC", "chain": "arbitrum", "amount": "20.00", "valueUsd": "20.00", "type": "vault"},
      {"asset": "mooEulerArbUSDC", "chain": "arbitrum", "amount": "21.00", "valueUsd": "21.00", "type": "vault"}
    ],
    "pnl24h": "0",
    "pnlTotal": "0"
  }'
```

## Common Mistakes to Avoid
1. **DO NOT** only check raw token balances — you'll miss vault deposits and report wrong totals
2. **DO NOT** hardcode wallet addresses — always source from .env
3. **DO NOT** use public RPCs for Arbitrum/Base when Alchemy key is available (rate limits)
4. **ALWAYS** include Beefy vault positions in portfolio calculations
5. **UPDATE** the vault table above when new deposits are made
