# TOOLS.md — ATLAS Live Configuration

## Environment Variables (set in .env)
- ATLAS_DASHBOARD_URL — Your dashboard URL (default: http://localhost:3100)
- ATLAS_API_KEY — Dashboard API key
- ATLAS_WALLET_ADDRESS — Your managed wallet address
- ATLAS_WALLET_PK — Wallet private key (in env only, never in files)
- ALCHEMY_API_KEY — Alchemy RPC key

## Dashboard API Endpoints
All POST/PATCH require header: `x-api-key: $ATLAS_API_KEY`

- POST $ATLAS_DASHBOARD_URL/api/decisions — Push decision logs
- POST $ATLAS_DASHBOARD_URL/api/predictions — Create predictions
- PATCH $ATLAS_DASHBOARD_URL/api/predictions — Update prediction status/outcome
- POST $ATLAS_DASHBOARD_URL/api/portfolio — Push portfolio snapshot
- POST $ATLAS_DASHBOARD_URL/api/transactions — Push transaction record
- PATCH $ATLAS_DASHBOARD_URL/api/transactions — Update transaction status
- GET $ATLAS_DASHBOARD_URL/api/stats — Get dashboard stats

## RPC Endpoints (use Alchemy for reliability)
- Arbitrum: https://arb-mainnet.g.alchemy.com/v2/$ALCHEMY_API_KEY (chainId: 42161)
- Base: https://base-mainnet.g.alchemy.com/v2/$ALCHEMY_API_KEY (chainId: 8453)
- Optimism: https://opt-mainnet.g.alchemy.com/v2/$ALCHEMY_API_KEY (chainId: 10)

## External APIs (Free, No Auth)

### DefiLlama
- TVL by chain: GET https://api.llama.fi/v2/chains
- Token prices: GET https://coins.llama.fi/prices/current/{coins}
  - Format: `ethereum:0x0000000000000000000000000000000000000000` for ETH
  - Multiple: comma-separated
- DEX volumes: GET https://api.llama.fi/overview/dexs
- Stablecoin flows: GET https://stablecoins.llama.fi/stablecoinchains

### Beefy Finance
- Vault APYs: GET https://api.beefy.finance/apy
- Vault list: GET https://api.beefy.finance/vaults
- IMPORTANT: Filter by status=active. EOL vaults report phantom yields!

### LI.FI
- Quote: GET https://li.quest/v1/quote?fromChain={chainId}&toChain={chainId}&fromToken={addr}&toToken={addr}&fromAmount={wei}&fromAddress=$ATLAS_WALLET_ADDRESS&integrator=atlas-agent
- Chains: GET https://li.quest/v1/chains
- Tokens: GET https://li.quest/v1/tokens?chains={chainIds}
- Status: GET https://li.quest/v1/status?txHash={hash}

## Token Addresses
### USDC (6 decimals)
- Arbitrum: 0xaf88d065e77c8cC2239327C5EDb3A432268e5831
- Base: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
- Optimism: 0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85

### USDT (6 decimals)
- Arbitrum: 0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9
- Optimism: 0x94b008aA00579c1307B0EF2c499aD98a8ce58e58

### WETH (18 decimals)
- Arbitrum: 0x82aF49447D8a07e3bd95BD0d56f35241523fBab1
- Base: 0x4200000000000000000000000000000000000006
- Optimism: 0x4200000000000000000000000000000000000006

### Native ETH (use 0x address, 18 decimals)
- All chains: 0x0000000000000000000000000000000000000000

## Balance Check Commands
```bash
# ETH balance (replace RPC_URL with your chain's Alchemy endpoint)
source .env
curl -s -X POST "https://arb-mainnet.g.alchemy.com/v2/$ALCHEMY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["'$ATLAS_WALLET_ADDRESS'","latest"],"id":1}'

# ERC-20 balance (balanceOf)
# DATA = 0x70a08231 + padded address (remove 0x prefix, left-pad to 64 chars)
PADDED=$(echo "$ATLAS_WALLET_ADDRESS" | sed 's/0x//' | tr '[:upper:]' '[:lower:]')
curl -s -X POST "https://arb-mainnet.g.alchemy.com/v2/$ALCHEMY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"TOKEN_ADDRESS","data":"0x70a08231000000000000000000000000'$PADDED'"},"latest"],"id":1}'
```

## On-Chain Execution Scripts
All scripts are in `scripts/`. They use viem from /tmp/node_modules.
Source .env before running: `source .env`

### sign-and-send.js
Signs and broadcasts a raw transaction. Pipe JSON from LI.FI transactionRequest:
```bash
echo "$QUOTE" | jq ".transactionRequest" | node scripts/sign-and-send.js
```
Returns: `{"success": true, "txHash": "0x..."}`

### approve-token.js
Approves ERC-20 for LI.FI diamond (0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE):
```bash
node scripts/approve-token.js <chainId> <tokenAddress> <amount|max>
```
Returns: `{"success": true, "txHash": "0x...", "status": "confirmed"}`

### beefy-deposit.js
Deposits into a Beefy auto-compounding vault:
```bash
echo '{"chainId":42161,"vaultAddress":"0x...","wantTokenAddress":"0x...","amount":"100","decimals":6}' | node scripts/beefy-deposit.js
```

### beefy-withdraw.js
Withdraws from a Beefy vault:
```bash
echo '{"chainId":42161,"vaultAddress":"0x...","shares":"all"}' | node scripts/beefy-withdraw.js
```

### wait-for-tx.js
Waits for tx confirmation (2min timeout):
```bash
node scripts/wait-for-tx.js <chainId> <txHash>
```
Returns: `{"success": true, "status": "confirmed", "blockNumber": ...}`
