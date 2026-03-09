#!/usr/bin/env bash
set -euo pipefail

# ATLAS Agent Setup Script
# Installs the ATLAS agent workspace into your OpenClaw agents directory

AGENT_ID="atlas"
OPENCLAW_DIR="${OPENCLAW_DIR:-$HOME/.openclaw}"
AGENTS_DIR="$OPENCLAW_DIR/agents"
WORKSPACE="$AGENTS_DIR/$AGENT_ID/workspace"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "╔══════════════════════════════════════════╗"
echo "║  ATLAS Agent Setup                       ║"
echo "║  Autonomous DeFi Capital Allocator       ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Check OpenClaw exists
if [ ! -d "$OPENCLAW_DIR" ]; then
  echo "❌ OpenClaw directory not found at $OPENCLAW_DIR"
  echo "   Install OpenClaw first: https://docs.openclaw.ai"
  exit 1
fi

# Check if agent already exists
if [ -d "$WORKSPACE" ]; then
  echo "⚠️  Atlas workspace already exists at $WORKSPACE"
  read -p "   Overwrite? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
  fi
fi

# Create workspace
echo "📁 Creating workspace at $WORKSPACE..."
mkdir -p "$WORKSPACE"/{scripts,skills,memory}

# Copy workspace files
echo "📄 Copying agent files..."
for f in AGENTS.md SOUL.md IDENTITY.md HEARTBEAT.md TOOLS.md CRON_CONFIG.md MEMORY.md USER.md; do
  if [ -f "$SCRIPT_DIR/$f" ]; then
    cp "$SCRIPT_DIR/$f" "$WORKSPACE/$f"
  fi
done

# Copy scripts
echo "⚡ Copying execution scripts..."
cp "$SCRIPT_DIR"/scripts/*.js "$WORKSPACE/scripts/"

# Copy skills
echo "🧠 Copying skills..."
for skill_dir in "$SCRIPT_DIR"/skills/*/; do
  skill_name=$(basename "$skill_dir")
  mkdir -p "$WORKSPACE/skills/$skill_name"
  cp "$skill_dir"/* "$WORKSPACE/skills/$skill_name/" 2>/dev/null || true
done

# Setup .env
if [ ! -f "$WORKSPACE/.env" ]; then
  if [ -f "$SCRIPT_DIR/.env.example" ]; then
    cp "$SCRIPT_DIR/.env.example" "$WORKSPACE/.env"
    echo ""
    echo "📝 Created .env at $WORKSPACE/.env"
    echo "   ⚠️  You MUST edit this file with your real values!"
  fi
fi

# Install viem dependency
echo ""
echo "📦 Installing viem (required for on-chain scripts)..."
if command -v npm &> /dev/null; then
  mkdir -p /tmp/node_modules
  cd /tmp && npm install viem@latest --prefix /tmp 2>/dev/null && cd - > /dev/null
  echo "   ✅ viem installed at /tmp/node_modules"
else
  echo "   ⚠️  npm not found. Install Node.js, then run:"
  echo "      cd /tmp && npm install viem@latest --prefix /tmp"
fi

# Print OpenClaw config snippet
echo ""
echo "════════════════════════════════════════════"
echo "📋 Add this to your openclaw.json agents.list:"
echo "════════════════════════════════════════════"
echo ""
cat <<'EOF'
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
EOF

echo ""
echo "════════════════════════════════════════════"
echo "📋 Add a binding to route messages to Atlas:"
echo "════════════════════════════════════════════"
echo ""
cat <<'EOF'
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
EOF

echo ""
echo "════════════════════════════════════════════"
echo ""
echo "✅ Atlas agent installed!"
echo ""
echo "Next steps:"
echo "  1. Edit $WORKSPACE/.env with your wallet + API keys"
echo "  2. Edit $WORKSPACE/USER.md with your info"
echo "  3. Add the agent config to ~/.openclaw/openclaw.json"
echo "  4. Add a channel binding (Telegram/Discord/etc.)"
echo "  5. Restart OpenClaw: openclaw gateway restart"
echo "  6. Fund your wallet with USDC + small ETH for gas on Arb/Base/OP"
echo ""
echo "Dashboard (optional):"
echo "  Atlas works with a companion dashboard for real-time transparency."
echo "  See the README for dashboard setup instructions."
echo ""
