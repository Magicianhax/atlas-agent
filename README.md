<p align="center">
  <h1 align="center">🧠 ATLAS</h1>
  <p align="center"><strong>Autonomous Transparent Liquidity Allocation System</strong></p>
  <p align="center">
    An AI agent that manages real DeFi capital across EVM L2s with full transparency.
    <br />
    Built on <a href="https://github.com/openclaw/openclaw">OpenClaw</a> · Powered by Claude
  </p>
  <p align="center">
    <a href="#quick-start">Quick Start</a> •
    <a href="#skills">Skills</a> •
    <a href="#decision-pipeline">Decision Pipeline</a> •
    <a href="#customization">Customization</a>
  </p>
</p>

---

## What is ATLAS?

ATLAS is an autonomous DeFi portfolio manager that runs as an [OpenClaw](https://github.com/openclaw/openclaw) agent. Give it a wallet with some USDC, point it at Arbitrum/Base/Optimism, and it will:

- **Find yields** — Scans Beefy, Morpho, Compound, Euler, Aave for the best stablecoin lending rates
- **Deploy capital** — Deposits into auto-compounding vaults via on-chain transactions
- **Rebalance across chains** — Bridges funds via [LI.FI](https://li.fi) to chase yield and maintain diversification
- **Trade momentum** — Detects trending tokens on L2s using DEXScreener volume signals
- **Manage Pendle positions** — Fixed yield (PTs) and leveraged yield (YTs)
- **Enforce risk limits** — Hard caps on position size, chain concentration, drawdowns. No override possible.
- **Track predictions** — Forms falsifiable theses, scores them, learns from outcomes
- **Publish everything** — Every decision, trade, and mistake goes to a real-time dashboard

> **⚠️ This is experimental software managing real money. Start small. Understand the risks.**

---

## How It Works

```
You fund a wallet with USDC + ETH gas
        ↓
ATLAS researches yields across 3 L2 chains
        ↓
Forms a thesis → validates against risk limits
        ↓
Executes on-chain (deposit, bridge, swap)
        ↓
Monitors positions, scores predictions, repeats
```

Every step is published transparently. No black box.

### Decision Pipeline

| Phase | What Happens |
|-------|-------------|
| 🔬 **RESEARCH** | Pull data from DefiLlama, Beefy, DEXScreener, Pendle |
| 🧭 **ORIENT** | Compare against baselines, spot anomalies |
| 📝 **THESIS** | Form a falsifiable claim with evidence + counter-evidence |
| 🎯 **PREDICT** | Assign confidence level and timeframe |
| ⚡ **EXECUTE** | Get LI.FI quote → risk check → sign → broadcast |
| 📊 **MONITOR** | Track outcome, score prediction, update memory |

---

## Skills

ATLAS ships with 11 specialized skills:

| Skill | Purpose |
|-------|---------|
| `yield-analyzer` | Compare yields across chains and protocols |
| `defi-researcher` | Pull market data from DefiLlama + Beefy APIs |
| `chain-scanner` | Monitor gas prices and chain health |
| `thesis-generator` | Structure analysis into falsifiable predictions |
| `risk-manager` | Enforce hard risk limits before any trade |
| `lifi-executor` | Execute cross-chain swaps and bridges |
| `portfolio-tracker` | Multi-chain balance tracking (liquid + vaults) |
| `momentum-trader` | Detect and trade trending tokens via volume signals |
| `pendle-strategist` | Pendle PT/YT strategies for fixed/leveraged yield |
| `prediction-scorer` | Score predictions against actual outcomes |
| `dashboard-publisher` | Push all data to the transparency dashboard |

Plus 5 on-chain execution scripts (built with [viem](https://viem.sh)):

| Script | Purpose |
|--------|---------|
| `sign-and-send.js` | Sign and broadcast any EVM transaction |
| `approve-token.js` | ERC-20 approval for LI.FI diamond contract |
| `beefy-deposit.js` | Deposit into Beefy auto-compounding vaults |
| `beefy-withdraw.js` | Withdraw from Beefy vaults |
| `wait-for-tx.js` | Wait for transaction confirmation |

---

## Portfolio Allocation

| Bucket | Target | Strategy |
|--------|--------|----------|
| 🏦 Yields | 80% | Stablecoin lending via Beefy auto-compound vaults |
| 📈 Pendle YTs | 10% | Leveraged yield exposure |
| 🐸 Meme coins | 5% | Momentum-based, -15% stop-loss |
| 🔷 Alts | 5% | L2 tokens (ARB, OP, AERO), -15% stop-loss |

## Risk Limits

These are **hard limits** — the agent cannot override them.

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

---

## Quick Start

### Prerequisites

- [OpenClaw](https://github.com/openclaw/openclaw) installed and running
- Node.js 18+
- An EVM wallet with USDC + small ETH for gas
- [Alchemy](https://dashboard.alchemy.com) API key (free tier is fine)
- Anthropic API key configured in OpenClaw

### 1. Clone & Install

```bash
git clone https://github.com/Magicianhax/atlas-agent.git
cd atlas-agent
chmod +x setup.sh
./setup.sh
```

The setup script copies everything into `~/.openclaw/agents/atlas/workspace/` and installs the `viem` dependency.

### 2. Configure

```bash
cd ~/.openclaw/agents/atlas/workspace

# Set your wallet, keys, and API endpoints
nano .env

# Set your name, timezone, preferences
nano USER.md
```

Your `.env` needs:

```bash
ATLAS_WALLET_ADDRESS=0xYourWalletAddress
ATLAS_WALLET_PK=0xYourPrivateKey
ALCHEMY_API_KEY=your_alchemy_key
ATLAS_DASHBOARD_URL=http://localhost:3100   # optional
ATLAS_API_KEY=your_dashboard_key            # optional
```

### 3. Register the Agent in OpenClaw

Add to `agents.list` in `~/.openclaw/openclaw.json`:

```jsonc
{
  "id": "atlas",
  "name": "atlas",
  "workspace": "~/.openclaw/agents/atlas/workspace",
  "model": {
    "primary": "anthropic/claude-sonnet-4-6",
    "fallbacks": ["anthropic/claude-opus-4-6"]
  },
  "subagents": { "allowAgents": ["*"] }
}
```

### 4. Bind to a Channel

Route a Telegram topic, Discord channel, or DM to Atlas. Add to `bindings` in `openclaw.json`:

```jsonc
// Telegram group topic example
{
  "agentId": "atlas",
  "match": {
    "channel": "telegram",
    "peer": { "kind": "group", "id": "YOUR_GROUP:topic:YOUR_TOPIC" }
  }
}

// Discord channel example
{
  "agentId": "atlas",
  "match": {
    "channel": "discord",
    "peer": { "kind": "channel", "id": "YOUR_CHANNEL_ID" }
  }
}
```

### 5. Restart & Fund

```bash
openclaw gateway restart
```

Send USDC + ETH (for gas) to your wallet on Arbitrum, Base, and/or Optimism. Atlas will detect the funds and start working.

---

## Autonomous Mode (Cron Jobs)

For hands-off operation, add scheduled jobs:

**Pulse** (every 30 min) — portfolio snapshot, gas check, stop-loss monitoring:

```json
{
  "name": "atlas-pulse",
  "schedule": { "kind": "cron", "expr": "*/30 * * * *" },
  "payload": {
    "kind": "agentTurn",
    "message": "Run pulse: portfolio snapshot, gas prices, score predictions, check stop-losses."
  },
  "sessionTarget": "isolated",
  "delivery": { "mode": "announce" }
}
```

**Strategist** (every 2 hours) — full research + trade execution cycle:

```json
{
  "name": "atlas-strategist",
  "schedule": { "kind": "cron", "expr": "0 */2 * * *" },
  "payload": {
    "kind": "agentTurn",
    "message": "Full strategist cycle: research yields, scan momentum, check Pendle, form theses, execute approved trades. Follow SOUL.md decision pipeline."
  },
  "sessionTarget": "isolated",
  "delivery": { "mode": "announce" }
}
```

---

## Data Sources

All free, no API keys required (except Alchemy for RPC):

| Source | What | URL |
|--------|------|-----|
| [DefiLlama](https://defillama.com) | TVL, prices, DEX volumes, stablecoin flows | `api.llama.fi` |
| [Beefy](https://beefy.finance) | Auto-compound vault APYs and metadata | `api.beefy.finance` |
| [LI.FI](https://li.fi) | Cross-chain quotes, bridge routes, tx status | `li.quest/v1` |
| [DEXScreener](https://dexscreener.com) | Token prices, volume, trending tokens | `api.dexscreener.com` |
| [Pendle](https://pendle.finance) | PT/YT markets, implied APYs | `api-v2.pendle.finance` |

---

## Project Structure

```
atlas-agent/
├── README.md                # You are here
├── setup.sh                 # One-command installer
├── .env.example             # Environment variables template
├── .gitignore
│
├── SOUL.md                  # Agent personality + risk parameters
├── IDENTITY.md              # Name and role
├── AGENTS.md                # Workspace conventions
├── HEARTBEAT.md             # Periodic health check tasks
├── TOOLS.md                 # API endpoints, token addresses, scripts
├── CRON_CONFIG.md           # Reference data for cron jobs
├── MEMORY.md                # Long-term memory (agent-maintained)
├── USER.md                  # Your preferences (edit this!)
│
├── scripts/                 # On-chain execution (viem)
│   ├── sign-and-send.js
│   ├── approve-token.js
│   ├── beefy-deposit.js
│   ├── beefy-withdraw.js
│   └── wait-for-tx.js
│
└── skills/                  # Agent skills (11 total)
    ├── chain-scanner/
    ├── dashboard-publisher/
    ├── defi-researcher/
    ├── lifi-executor/
    ├── momentum-trader/
    ├── pendle-strategist/
    ├── portfolio-tracker/
    ├── prediction-scorer/
    ├── risk-manager/
    ├── thesis-generator/
    └── yield-analyzer/
```

---

## Customization

| Want to... | Edit... |
|-----------|---------|
| Change target chains | `SOUL.md` (Chains section) + `TOOLS.md` (token addresses) |
| Adjust risk limits | `SOUL.md` (Risk Parameters tables) |
| Change allocation split | `SOUL.md` (Portfolio Allocation Framework) |
| Add a new skill | Drop a folder in `skills/` with a `SKILL.md` |
| Change the model | `openclaw.json` agent config (`model.primary`) |

---

## Security

- **Private keys** live ONLY in `.env` (gitignored). Scripts read from `process.env` at runtime.
- **No hardcoded addresses** — everything uses environment variables.
- **Risk limits are absolute** — the risk-manager skill blocks trades that violate limits. The agent cannot override this.
- **Emergency halt** triggers automatically at -25% drawdown.
- **Start small.** This is experimental. Use an amount you're comfortable losing.

---

## Dashboard (Optional)

ATLAS can publish all decisions, predictions, portfolio snapshots, and transactions to a companion Next.js dashboard in real-time. The dashboard is optional — Atlas works fine without it, logging decisions internally.

If you want the dashboard, configure `ATLAS_DASHBOARD_URL` and `ATLAS_API_KEY` in your `.env`.

---

## Supported Chains

| Chain | Chain ID | RPC via |
|-------|----------|---------|
| Arbitrum | 42161 | Alchemy |
| Base | 8453 | Alchemy |
| Optimism | 10 | Alchemy |

Adding more chains requires updating the chain maps in `scripts/*.js` and token addresses in `TOOLS.md`.

---

## License

MIT

## Built With

- [OpenClaw](https://github.com/openclaw/openclaw) — Agent runtime
- [Claude](https://anthropic.com) — AI model (Anthropic)
- [viem](https://viem.sh) — EVM interaction library
- [LI.FI](https://li.fi) — Cross-chain execution
- [Beefy](https://beefy.finance) — Auto-compound vaults
