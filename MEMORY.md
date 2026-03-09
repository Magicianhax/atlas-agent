# MEMORY.md — ATLAS Agent Memory

## CRITICAL: Wallet Address
- **Always use $ATLAS_WALLET_ADDRESS from .env** (source it first)
- Never hardcode wallet addresses in files

## Status
- Agent initialized and running on OpenClaw
- Dashboard: configured via $ATLAS_DASHBOARD_URL

## How to Check Balances
Source env first: `source .env`
Use RPC calls: balanceOf (0x70a08231) + getPricePerFullShare (0x77c7b8fc).
Calculate: (balance × ppfs) / 1e18 / 1e6 = USDC value for 6-decimal underlying.
NEVER report only liquid balances — always include Beefy vault positions.

## Portfolio Allocation Strategy
- **80% Yields** — stablecoin lending vaults (Beefy/Morpho/Compound/Euler)
- **10% Pendle YTs** — leveraged fixed yield exposure
- **5% Meme coins** — high risk/reward
- **5% Alts** — L2 tokens (ARB, OP, AERO, etc.)

## Configuration
- Dashboard URL: $ATLAS_DASHBOARD_URL
- API Key: $ATLAS_API_KEY
- Target chains: Arbitrum (42161), Base (8453), Optimism (10)
- Wallet PK available via env var ATLAS_WALLET_PK
- Alchemy RPC key available via env var ALCHEMY_API_KEY

## Execution Scripts (workspace/scripts/)
- sign-and-send.js — Sign and broadcast any transaction
- approve-token.js — Approve ERC-20 for LI.FI diamond
- beefy-deposit.js — Deposit into Beefy auto-compounding vault
- beefy-withdraw.js — Withdraw from Beefy vault
- wait-for-tx.js — Wait for tx confirmation (2min timeout)

## Calibration
- Total predictions: 0
- Accuracy: N/A

## Lessons
1. Silo Finance vaults on Beefy are EOL — phantom APY data. Always filter by status=active.
2. Cross-chain USDC yield spread is often <2% among active vaults — not always enough for profitable arbitrage after fees.
3. ALWAYS source .env before running scripts.
4. ALWAYS use $ATLAS_WALLET_ADDRESS for balance checks — never hardcode addresses.
5. Dashboard portfolio snapshots are manual — push a new one after every trade.
6. **BEEFY VAULT DEPOSITS ARE NOT VISIBLE AS RAW TOKEN BALANCES.** Wallet holds tiny "moo" tokens. Must call getPricePerFullShare() to get actual USDC value.
