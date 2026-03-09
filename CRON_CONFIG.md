# CRON_CONFIG.md — ATLAS Cron Job Reference Data

## Wallet
- Address: read from $ATLAS_WALLET_ADDRESS (source .env first)

## RPC Endpoints
- Arbitrum: https://arb-mainnet.g.alchemy.com/v2/$ALCHEMY_API_KEY
- Base: https://base-mainnet.g.alchemy.com/v2/$ALCHEMY_API_KEY
- Optimism: https://mainnet.optimism.io

## Beefy Vault Balance Check
Check with: balanceOf (0x70a08231) + getPricePerFullShare (0x77c7b8fc)
Formula: (balance × ppfs) / 1e18 / 1e6 = USDC value

## Growth Position Price Check
Use DefiLlama: `curl https://coins.llama.fi/prices/current/{chain}:{tokenAddress}`

## Dashboard API
- Base URL: $ATLAS_DASHBOARD_URL
- Auth: header `x-api-key: $ATLAS_API_KEY`
- POST /api/portfolio — Push snapshot
- POST /api/decisions — Push decision
- POST /api/transactions — Push transaction
- GET /api/predictions — List predictions
- PATCH /api/predictions — Score prediction

## Target Allocation
80% yields / 10% Pendle YT / 5% meme / 5% alts
Max per position: 20%, Max per chain: 40%
