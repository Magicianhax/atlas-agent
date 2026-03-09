<p align="center">
  <h1 align="center">🧠 ATLAS</h1>
  <p align="center"><strong>Autonomous Transparent Liquidity Allocation System</strong></p>
  <p align="center">
    An AI agent that manages real DeFi capital across EVM L2s with full transparency.
    <br />
    Built on <a href="https://github.com/openclaw/openclaw">OpenClaw</a> · Powered by Claude
  </p>
</p>

---

## What is ATLAS?

ATLAS is an autonomous DeFi agent that manages a real portfolio across **Arbitrum, Base, and Optimism**. It researches yields, deploys capital into vaults, bridges across chains, trades momentum tokens, and publishes every decision to a live dashboard — reasoning included.

It runs on [OpenClaw](https://github.com/openclaw/openclaw), an open-source agent runtime.

> **⚠️ This is experimental software managing real money. Start small. Understand the risks.**

### What it does

- Finds the best stablecoin yields across Beefy, Morpho, Compound, Euler, Aave
- Deposits into auto-compounding vaults via on-chain transactions
- Bridges funds across L2s via [LI.FI](https://li.fi) to chase yield
- Trades trending tokens on L2s using DEXScreener volume signals
- Manages Pendle PT/YT positions for fixed and leveraged yield
- Enforces hard risk limits (position caps, stop-losses, emergency halt)
- Forms predictions, scores them, learns from outcomes
- Publishes everything to a real-time transparency dashboard

---

## Quick Start

### Prerequisites

| Requirement | Notes |
|---|---|
| [OpenClaw](https://github.com/openclaw/openclaw) | Installed and running (`openclaw status` should work) |
| Node.js 18+ | For scripts and dashboard |
| EVM wallet | Funded with USDC + small ETH for gas on Arb/Base/OP |
| [Alchemy](https://dashboard.alchemy.com) key | Free tier is fine — used for RPC + transaction history |
| Anthropic API key | Already configured in OpenClaw |

### 1. Clone and run setup

```bash
git clone https://github.com/Magicianhax/atlas-agent.git
cd atlas-agent
chmod +x setup.sh
./setup.sh
```

This copies agent files into `~/.openclaw/agents/atlas/workspace/` and installs dependencies.

### 2. Configure the agent

```bash
cd ~/.openclaw/agents/atlas/workspace
```

Edit `.env` with your wallet and keys:

```bash
ATLAS_WALLET_ADDRESS=0xYourWalletAddress
ATLAS_WALLET_PK=0xYourPrivateKey
ALCHEMY_API_KEY=your_alchemy_key

# Optional — only if running the dashboard
ATLAS_DASHBOARD_URL=http://localhost:3100
ATLAS_API_KEY=your_dashboard_api_secret
```

Edit `USER.md` with your name, timezone, and preferences.

### 3. Register in OpenClaw

Add to the `agents.list` array in `~/.openclaw/openclaw.json`:

```json
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

### 4. Bind to a chat channel

Add to the `bindings` array in `openclaw.json`. Pick your platform:

**Telegram group topic:**
```json
{
  "agentId": "atlas",
  "match": {
    "channel": "telegram",
    "peer": { "kind": "group", "id": "YOUR_GROUP_ID:topic:YOUR_TOPIC_ID" }
  }
}
```

**Discord channel:**
```json
{
  "agentId": "atlas",
  "match": {
    "channel": "discord",
    "peer": { "kind": "channel", "id": "YOUR_CHANNEL_ID" }
  }
}
```

### 5. Start

```bash
openclaw gateway restart
```

Fund your wallet with USDC + a small amount of ETH for gas on whichever chains you want (Arbitrum, Base, Optimism). Atlas detects the funds and starts working.

---

## Dashboard Setup (Optional)

ATLAS comes with a Next.js dashboard that shows the portfolio, decisions, predictions, and transactions in real-time. The agent works fine without it — it just logs decisions internally instead.

### Dashboard install

```bash
cd atlas-agent/dashboard
cp .env.example .env.local
```

Edit `.env.local`:

```bash
# Local SQLite (simplest — just a file)
TURSO_DATABASE_URL=file:./atlas.db

# Leave empty for local SQLite
TURSO_AUTH_TOKEN=

# Secret the agent uses to authenticate API writes
API_SECRET=pick-a-random-secret

# Your agent wallet address (for transaction sync)
AGENT_WALLET=0xYourAgentWalletAddress

# Alchemy key for fetching on-chain tx history
ALCHEMY_API_KEY=your_alchemy_key
```

Then:

```bash
npm install
npx drizzle-kit push    # Creates the database tables
npm run build
npm start -- --port 3100
```

Dashboard is now at `http://localhost:3100`.

### Database options

| Option | `TURSO_DATABASE_URL` | When to use |
|---|---|---|
| **Local SQLite** | `file:./atlas.db` | Development, single machine |
| **Turso cloud** | `libsql://your-db.turso.io` | Remote/deployed dashboard |

For Turso, also set `TURSO_AUTH_TOKEN`.

### Running as a service (Linux)

To keep the dashboard alive across reboots:

```bash
mkdir -p ~/.config/systemd/user

cat > ~/.config/systemd/user/atlas-dashboard.service << 'EOF'
[Unit]
Description=ATLAS Dashboard
After=network.target

[Service]
Type=simple
WorkingDirectory=/path/to/atlas-agent/dashboard
ExecStartPre=/bin/bash -c 'fuser -k 3100/tcp 2>/dev/null || true; sleep 1'
ExecStart=/usr/bin/npx next start --hostname 0.0.0.0 --port 3100
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=default.target
EOF

systemctl --user daemon-reload
systemctl --user enable --now atlas-dashboard
```

### Dashboard pages

| Page | URL | Shows |
|---|---|---|
| Home | `/` | Live brain feed — every decision with reasoning |
| Portfolio | `/portfolio` | Holdings, PnL waterfall, chain distribution |
| Predictions | `/predictions` | Active predictions with accuracy tracking |
| Strategy | `/strategy` | Risk heatmap, vault yields, drawdown chart |
| About | `/about` | What ATLAS is and how it works |

### Dashboard API

The agent pushes data via these endpoints. All write endpoints require `x-api-key` header.

| Method | Endpoint | What |
|---|---|---|
| GET | `/api/decisions` | Decision log |
| POST | `/api/decisions` | Push a new decision |
| GET | `/api/portfolio` | Latest portfolio snapshot |
| POST | `/api/portfolio` | Push portfolio snapshot |
| GET | `/api/portfolio/live` | Real-time on-chain portfolio value |
| GET | `/api/positions` | Open/closed positions |
| POST | `/api/positions` | Create/update position |
| GET | `/api/predictions` | Prediction list |
| POST | `/api/predictions` | Create/resolve prediction |
| GET | `/api/stats` | Dashboard summary stats |
| GET | `/api/transactions` | Transaction history |
| GET | `/api/transactions/sync` | Sync from Alchemy (rate-limited) |
| GET | `/api/stream` | SSE stream for real-time updates |

---

## Autonomous Mode (Cron Jobs)

For hands-off operation, set up recurring cron jobs in OpenClaw.

### Pulse — every 30 minutes

Portfolio snapshot, gas check, stop-loss monitoring:

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

### Strategist — every 2 hours

Full research and trade execution cycle:

```json
{
  "name": "atlas-strategist",
  "schedule": { "kind": "cron", "expr": "0 */2 * * *" },
  "payload": {
    "kind": "agentTurn",
    "message": "Full strategist cycle: research yields, scan momentum, check Pendle, form theses, execute approved trades."
  },
  "sessionTarget": "isolated",
  "delivery": { "mode": "announce" }
}
```

---

## How It Works

### Decision pipeline

Every significant decision follows this flow:

```
RESEARCH → ORIENT → THESIS → PREDICT → EXECUTE → MONITOR
```

| Phase | What happens |
|---|---|
| **Research** | Pull data from DefiLlama, Beefy, DEXScreener, Pendle |
| **Orient** | Compare against baselines, spot anomalies |
| **Thesis** | Form a falsifiable claim with evidence + counter-evidence |
| **Predict** | Assign confidence level and timeframe |
| **Execute** | Get LI.FI quote → risk check → sign → broadcast |
| **Monitor** | Track outcome, score prediction, update memory |

### Portfolio allocation

| Bucket | Target | Strategy |
|---|---|---|
| Yields | 80% | Stablecoin lending via Beefy auto-compound vaults |
| Pendle YTs | 10% | Leveraged yield exposure |
| Meme coins | 5% | Momentum-based, -15% stop-loss |
| Alts | 5% | L2 tokens (ARB, OP, AERO), -15% stop-loss |

### Risk limits

These are **hard limits** — the agent cannot override them:

| Limit | Value |
|---|---|
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

## Skills

ATLAS has 11 skills that handle specific tasks:

| Skill | What it does |
|---|---|
| `yield-analyzer` | Compare yields across chains and protocols |
| `defi-researcher` | Pull market data from DefiLlama + Beefy |
| `chain-scanner` | Monitor gas prices and chain health |
| `thesis-generator` | Structure analysis into falsifiable predictions |
| `risk-manager` | Enforce hard risk limits before any trade |
| `lifi-executor` | Execute cross-chain swaps and bridges |
| `portfolio-tracker` | Multi-chain balance tracking |
| `momentum-trader` | Detect trending tokens via volume signals |
| `pendle-strategist` | PT/YT strategies for fixed/leveraged yield |
| `prediction-scorer` | Score predictions against outcomes |
| `dashboard-publisher` | Push data to the transparency dashboard |

Plus 5 on-chain scripts (built with [viem](https://viem.sh)):

| Script | What it does |
|---|---|
| `sign-and-send.js` | Sign and broadcast any EVM transaction |
| `approve-token.js` | ERC-20 token approval |
| `beefy-deposit.js` | Deposit into Beefy vaults |
| `beefy-withdraw.js` | Withdraw from Beefy vaults |
| `wait-for-tx.js` | Wait for transaction confirmation |

---

## Data Sources

All free APIs, no keys required (except Alchemy for RPC):

| Source | Data |
|---|---|
| [DefiLlama](https://defillama.com) | TVL, prices, DEX volumes, stablecoin flows |
| [Beefy](https://beefy.finance) | Auto-compound vault APYs and metadata |
| [LI.FI](https://li.fi) | Cross-chain quotes, bridge routes |
| [DEXScreener](https://dexscreener.com) | Token prices, volume, trending tokens |
| [Pendle](https://pendle.finance) | PT/YT markets, implied APYs |

---

## Project Structure

```
atlas-agent/
├── README.md
├── setup.sh                  # One-command installer
├── .env.example              # Agent env vars template
│
├── SOUL.md                   # Personality + risk parameters
├── IDENTITY.md               # Name and role
├── AGENTS.md                 # Workspace conventions
├── HEARTBEAT.md              # Periodic health checks
├── TOOLS.md                  # API endpoints, token addresses
├── CRON_CONFIG.md            # Cron job reference
├── MEMORY.md                 # Long-term memory (agent-maintained)
├── USER.md                   # Your preferences (edit this)
│
├── scripts/                  # On-chain execution (viem)
│   ├── sign-and-send.js
│   ├── approve-token.js
│   ├── beefy-deposit.js
│   ├── beefy-withdraw.js
│   └── wait-for-tx.js
│
├── skills/                   # Agent skills (11)
│   ├── chain-scanner/
│   ├── dashboard-publisher/
│   ├── defi-researcher/
│   ├── lifi-executor/
│   ├── momentum-trader/
│   ├── pendle-strategist/
│   ├── portfolio-tracker/
│   ├── prediction-scorer/
│   ├── risk-manager/
│   ├── thesis-generator/
│   └── yield-analyzer/
│
└── dashboard/                # Next.js transparency dashboard
    ├── .env.example
    ├── package.json
    ├── drizzle.config.ts     # Database schema config
    ├── src/
    │   ├── app/              # Pages (home, portfolio, predictions, strategy)
    │   ├── components/       # UI components (40+)
    │   ├── hooks/            # SSE hook for real-time updates
    │   └── lib/              # DB, RPC, auth, utilities
    └── public/assets/        # Mascot and background images
```

---

## Customization

| Want to... | Edit |
|---|---|
| Change target chains | `SOUL.md` + `TOOLS.md` (token addresses) |
| Adjust risk limits | `SOUL.md` (Risk Parameters) |
| Change allocation split | `SOUL.md` (Portfolio Allocation) |
| Add a new skill | Create a folder in `skills/` with a `SKILL.md` |
| Change the AI model | `openclaw.json` agent config (`model.primary`) |
| Customize dashboard UI | `dashboard/src/components/` |

---

## Supported Chains

| Chain | ID | RPC |
|---|---|---|
| Arbitrum | 42161 | Alchemy |
| Base | 8453 | Alchemy |
| Optimism | 10 | Alchemy |

Adding chains: update chain maps in `scripts/*.js` and token addresses in `TOOLS.md`.

---

## Security Notes

- Private keys live only in `.env` (gitignored). Scripts read from `process.env`.
- Risk limits are enforced by the `risk-manager` skill — the agent cannot bypass them.
- Emergency halt triggers automatically at -25% drawdown.
- Dashboard write endpoints require API key authentication.
- **Start small.** Use an amount you can afford to lose.

---

## License

MIT

## Built With

[OpenClaw](https://github.com/openclaw/openclaw) · [Claude](https://anthropic.com) · [viem](https://viem.sh) · [LI.FI](https://li.fi) · [Beefy](https://beefy.finance) · [Next.js](https://nextjs.org) · [Drizzle ORM](https://orm.drizzle.team) · [Recharts](https://recharts.org)
