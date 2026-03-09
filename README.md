# ATLAS — Autonomous Transparent Liquidity Allocation System

An autonomous DeFi agent that manages real capital across EVM L2 chains (Arbitrum, Base, Optimism). Built on [OpenClaw](https://github.com/openclaw/openclaw), powered by Claude.

ATLAS makes every decision transparently — research, theses, predictions, trades, and mistakes are all published to a dashboard in real-time.

## What It Does

- **Yield farming** — Finds and deploys capital into the best stablecoin lending vaults (Beefy, Morpho, Compound, Euler, Aave)
- **Cross-chain rebalancing** — Bridges funds via LI.FI to chase yield and maintain chain diversification
- **Momentum trading** — Detects trending tokens on L2s using DEXScreener volume signals
- **Pendle strategies** — Fixed yield via PTs, leveraged yield via YTs
- **Risk management** — Hard limits on position size, chain concentration, drawdowns, and trade frequency
- **Prediction tracking** — Forms falsifiable theses, scores them against reality, learns from outcomes

## Architecture

```
atlas-agent/
├── SOUL.md              # Agent personality, risk parameters, decision pipeline
├── IDENTITY.md          # Name and role
├── AGENTS.md            # Workspace conventions
├── HEARTBEAT.md         # Periodic health checks
├── TOOLS.md             # API endpoints, token addresses, script usage
├── CRON_CONFIG.md       # Reference data for scheduled jobs
├── MEMORY.md            # Long-term memory (agent-maintained)
├── USER.md              # Your preferences (edit this)
├── .env.example         # Environment variables template
├── scripts/
│   ├── sign-and-send.js     # Sign + broadcast any EVM transaction
│   ├── approve-token.js     # ERC-20 approval for LI.FI diamond
│   ├── beefy-deposit.js     # Deposit into Beefy auto-compound vaults
│   ├── beefy-withdraw.js    # Withdraw from Beefy vaults
│   └── wait-for-tx.js       # Wait for tx confirmation
└── skills/
    ├── chain-scanner/       # Monitor chain health and gas prices
    ├── dashboard-publisher/ # Push data to transparency dashboard
    ├── defi-researcher/     # Pull market data from DefiLlama + Beefy
    ├── lifi-executor/       # Execute cross-chain swaps/bridges via LI.FI
    ├── momentum-trader/     # Detect and trade trending tokens
    ├── pendle-strategist/   # Pendle PT/YT fixed + leveraged yield
    ├── portfolio-tracker/   # Multi-chain balance tracking
    ├── prediction-scorer/   # Score predictions against outcomes
    ├── risk-manager/        # Enforce hard risk limits before trades
    ├── thesis-generator/    # Structure analysis into falsifiable claims
    └── yield-analyzer/      # Compare yields across chains and protocols
```

## Portfolio Allocation

| Bucket | Target | Strategy |
|--------|--------|----------|
| Yields | 80% | Stablecoin lending via Beefy auto-compound vaults |
| Pendle YTs | 10% | Leveraged yield exposure on Arbitrum |
| Meme coins | 5% | Momentum-based, -15% stop-loss |
| Alts | 5% | L2 tokens (ARB, OP, AERO), -15% stop-loss |

## Risk Limits (Hard, No Override)

| Parameter | Value |
|-----------|-------|
| Max per position | 20% of portfolio |
| Max per chain | 40% of portfolio |
| Min confidence to trade | 65% (70% for growth) |
| Stop-loss (safe) | -10% |
| Stop-loss (growth) | -15% |
| Emergency halt | -25% drawdown from peak |
| Daily trade limit | 5 |
| Min trade size | $2 |
| Cooling period | 2h after loss (4h for momentum) |

## Prerequisites

- [OpenClaw](https://github.com/openclaw/openclaw) installed and running
- Node.js 18+ (for on-chain scripts)
- An EVM wallet with USDC + small ETH for gas on target chains
- [Alchemy](https://dashboard.alchemy.com) API key (free tier works)
- An Anthropic API key configured in OpenClaw

## Quick Start

### 1. Clone

```bash
git clone https://github.com/YOUR_USERNAME/atlas-agent.git
cd atlas-agent
```

### 2. Run Setup

```bash
chmod +x setup.sh
./setup.sh
```

This copies everything into `~/.openclaw/agents/atlas/workspace/`.

### 3. Configure Environment

```bash
cd ~/.openclaw/agents/atlas/workspace
cp .env.example .env
nano .env  # Fill in your wallet address, private key, Alchemy key
```

### 4. Edit Your Profile

```bash
nano USER.md  # Your name, timezone, preferences
```

### 5. Add Agent to OpenClaw Config

Edit `~/.openclaw/openclaw.json` and add to `agents.list`:

```json
{
  "id": "atlas",
  "name": "atlas",
  "workspace": "~/.openclaw/agents/atlas/workspace",
  "model": {
    "primary": "anthropic/claude-sonnet-4-6",
    "fallbacks": ["anthropic/claude-opus-4-6"]
  },
  "subagents": {
    "allowAgents": ["*"]
  }
}
```

### 6. Add a Channel Binding

Route messages to Atlas from a Telegram topic, Discord channel, or DM:

```json
{
  "agentId": "atlas",
  "match": {
    "channel": "telegram",
    "peer": {
      "kind": "group",
      "id": "YOUR_GROUP_ID:topic:YOUR_TOPIC_ID"
    }
  }
}
```

### 7. Restart OpenClaw

```bash
openclaw gateway restart
```

### 8. Fund the Wallet

Send USDC + a small amount of ETH (for gas) to your wallet on:
- Arbitrum
- Base
- Optimism

Atlas will detect the funds and begin deploying.

## Scheduled Jobs (Optional)

For autonomous operation, set up cron jobs in OpenClaw:

| Job | Schedule | Purpose |
|-----|----------|---------|
| Pulse | Every 30 min | Portfolio snapshot, gas check, prediction scoring |
| Strategist | Every 2 hours | Full research cycle, yield analysis, trade execution |

Example cron config (add via OpenClaw `/cron add` or API):

```json
{
  "name": "atlas-pulse",
  "schedule": { "kind": "cron", "expr": "*/30 * * * *" },
  "payload": {
    "kind": "agentTurn",
    "message": "Run pulse check: portfolio snapshot, gas prices, score due predictions, check stop-losses on growth positions."
  },
  "sessionTarget": "isolated",
  "delivery": { "mode": "announce" }
}
```

```json
{
  "name": "atlas-strategist",
  "schedule": { "kind": "cron", "expr": "0 */2 * * *" },
  "payload": {
    "kind": "agentTurn",
    "message": "Run full strategist cycle: research yields, scan momentum, check Pendle, form theses, execute approved trades. Follow SOUL.md decision pipeline."
  },
  "sessionTarget": "isolated",
  "delivery": { "mode": "announce" }
}
```

## Decision Pipeline

Every significant decision follows 6 phases, all published to the dashboard:

1. **RESEARCH** — Gather data from DeFi protocols, chain metrics, yield sources
2. **ORIENT** — Analyze data against baselines, identify patterns and anomalies
3. **THESIS** — Form a specific, falsifiable claim with evidence and counter-evidence
4. **PREDICT** — Create a formal prediction with confidence level and timeframe
5. **EXECUTE** — Get LI.FI quote, validate against risk limits, sign and send
6. **MONITOR** — Track outcomes, score predictions, learn from results

## Data Sources (All Free, No Auth)

| Source | What | Endpoint |
|--------|------|----------|
| DefiLlama | TVL, token prices, DEX volumes, stablecoin flows | api.llama.fi |
| Beefy Finance | Vault APYs, vault list | api.beefy.finance |
| LI.FI | Cross-chain quotes, bridge routes, tx status | li.quest/v1 |
| DEXScreener | Token prices, volume, trending tokens | api.dexscreener.com |
| Pendle | PT/YT markets, implied APYs | api-v2.pendle.finance |

## Dashboard (Optional)

ATLAS is designed to work with a companion Next.js dashboard that displays all decisions, predictions, portfolio snapshots, and transactions in real-time. The dashboard is a separate project — ATLAS will POST data to it if configured, but works fine without it (just logs decisions internally).

## Customization

### Change Target Chains
Edit `SOUL.md` — update the "Chains" section and adjust token addresses in `TOOLS.md`.

### Change Risk Parameters
Edit `SOUL.md` — all risk limits are defined there. The risk-manager skill enforces whatever limits SOUL.md specifies.

### Change Allocation
Edit `SOUL.md` — adjust the Portfolio Allocation Framework section.

### Add New Skills
Drop a folder into `skills/` with a `SKILL.md` file. Atlas will discover and use it automatically.

## Security Notes

- **Private keys** are stored ONLY in `.env` (gitignored). Scripts read from `process.env`.
- **No hardcoded addresses** — everything references environment variables.
- **Risk limits are absolute** — the risk-manager skill cannot be overridden by the agent.
- **Emergency halt** at -25% drawdown stops all trading automatically.
- Start with a small amount you're comfortable losing. This is experimental software managing real money.

## License

MIT

## Credits

Built with [OpenClaw](https://github.com/openclaw/openclaw) and Claude by [Anthropic](https://anthropic.com).
