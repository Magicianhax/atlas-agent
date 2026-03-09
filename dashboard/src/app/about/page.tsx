"use client";

import { cn } from "@/lib/utils";
import { StatsBar } from "@/components/stats-bar";
import { ChainLogo } from "@/components/logos/chain-logo";
import { ProtocolLogo } from "@/components/logos/protocol-logo";
import { LiFiFlowDiagram } from "@/components/lifi-flow-diagram";
import { P5Reveal } from "@/components/p5-reveal";

// ─── Decision Pipeline Phases ────────────────────────────────────────────────

const PHASES = [
  {
    name: "RESEARCH",
    color: "border-phase-research text-phase-research",
    bg: "bg-phase-research/10",
    description: "Scans on-chain data, DeFi yields, token prices, and market conditions across Arbitrum, Base, and Optimism.",
  },
  {
    name: "ORIENT",
    color: "border-phase-orient text-phase-orient",
    bg: "bg-phase-orient/10",
    description: "Interprets raw data into context — identifies trends, compares yields, and spots anomalies or opportunities.",
  },
  {
    name: "THESIS",
    color: "border-phase-thesis text-phase-thesis",
    bg: "bg-phase-thesis/10",
    description: "Forms a conviction. Decides whether to act: deposit, withdraw, rebalance, or hold. Assigns confidence score.",
  },
  {
    name: "PREDICT",
    color: "border-phase-predict text-phase-predict",
    bg: "bg-phase-predict/10",
    description: "Logs verifiable predictions with confidence levels. Tracks accuracy over time to calibrate future decisions.",
  },
  {
    name: "EXECUTE",
    color: "border-phase-execute text-phase-execute",
    bg: "bg-phase-execute/10",
    description: "Sends on-chain transactions via LI.FI for swaps/bridges, and direct vault deposits/withdrawals through Beefy.",
  },
  {
    name: "MONITOR",
    color: "border-phase-monitor text-phase-monitor",
    bg: "bg-phase-monitor/10",
    description: "Continuously watches position health, checks stop-losses, monitors gas costs, and logs operational lessons.",
  },
];

// ─── Supported Chains ────────────────────────────────────────────────────────

const CHAINS = [
  { id: 42161, name: "Arbitrum", desc: "Primary chain — lending vaults, growth tokens" },
  { id: 8453, name: "Base", desc: "Compound USDC lending, BRETT momentum" },
  { id: 10, name: "Optimism", desc: "Morpho Gauntlet USDC vault" },
];

// ─── Protocol Integrations ───────────────────────────────────────────────────

const PROTOCOLS = [
  { name: "Beefy", desc: "Auto-compounding vault aggregator — wraps lending positions for yield optimization" },
  { name: "Morpho", desc: "Peer-to-peer lending protocol — higher yields than traditional pools" },
  { name: "Compound", desc: "Battle-tested lending markets — safe USDC lending on Base" },
  { name: "Euler", desc: "Modular lending protocol — flexible risk-adjusted lending on Arbitrum" },
  { name: "Ionic", desc: "Isolated lending markets — used via Morpho aggregation on Base" },
  { name: "LI.FI", desc: "Cross-chain execution layer — bridges and swaps across all supported chains" },
  { name: "Pendle", desc: "Yield tokenization — splits yield into PT (fixed) and YT (variable) components" },
];

// ─── Tech Stack ──────────────────────────────────────────────────────────────

const TECH_STACK = [
  { category: "AI Engine", items: ["Claude Opus 4.6 (strategist)", "Claude Sonnet 4.6 (monitoring)"] },
  { category: "Frontend", items: ["Next.js 15", "Tailwind CSS v4", "Recharts", "Server-Sent Events"] },
  { category: "Database", items: ["Turso (SQLite edge)", "Drizzle ORM"] },
  { category: "Blockchain", items: ["Viem (chain interactions)", "Alchemy RPC", "LI.FI SDK (bridges/swaps)"] },
  { category: "Orchestration", items: ["OpenClaw (agent framework)", "6 automated cron jobs", "Telegram alerts"] },
];

// ─── Risk Parameters ─────────────────────────────────────────────────────────

const RISK_RULES = [
  { label: "Max per position", value: "20%", type: "limit" as const },
  { label: "Max per chain", value: "40%", type: "limit" as const },
  { label: "Safe yield allocation", value: "80%", type: "target" as const },
  { label: "Growth allocation", value: "20%", type: "target" as const },
  { label: "Stop-loss (growth)", value: "-15%", type: "stop" as const },
  { label: "Emergency halt", value: "-25% from peak", type: "stop" as const },
  { label: "Daily trade limit", value: "5 trades", type: "limit" as const },
  { label: "Anti-bias checks", value: "Before every trade", type: "limit" as const },
];

// ─── Cron Jobs ───────────────────────────────────────────────────────────────

const CRON_JOBS = [
  { name: "Pulse", freq: "Every 60 min", desc: "Portfolio health check — balances, yields, stop-losses, gas" },
  { name: "Strategist", freq: "Every 2 hours", desc: "Deep analysis + trade execution using Opus reasoning" },
  { name: "Daily Review", freq: "Once daily", desc: "Performance summary, P&L reporting, lesson logging" },
  { name: "Weekly Adaptation", freq: "Weekly", desc: "Strategy review, parameter tuning, yield curve analysis" },
];

// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-5">
      <h2
        className="text-lg font-black uppercase tracking-[0.15em] text-crimson"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {children}
      </h2>
      {sub && <p className="mt-1 text-xs text-text-muted font-bold">{sub}</p>}
    </div>
  );
}

export default function AboutPage() {
  return (
    <>
      <StatsBar />
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6">
        {/* Hero Banner */}
        <P5Reveal text="ATLAS" height="h-48" stagger={0}>
        <div className="relative overflow-hidden border-2 border-crimson bg-surface/60 p-8 p5-stripes">
          <div className="relative z-10">
            <h1
              className="text-3xl font-black uppercase tracking-[0.2em] text-crimson sm:text-4xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              What is ATLAS?
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">
              ATLAS is a fully autonomous DeFi agent that manages a real portfolio across multiple blockchains.
              It researches opportunities, forms investment theses, executes on-chain transactions, and monitors
              positions — all without human intervention. Every decision is logged transparently on this dashboard.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <span className="border border-crimson/40 bg-crimson/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-crimson">
                Autonomous
              </span>
              <span className="border border-gold/40 bg-gold/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-gold">
                Multi-Chain
              </span>
              <span className="border border-phase-research/40 bg-phase-research/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-phase-research">
                Built on OpenClaw
              </span>
              <span className="border border-status-correct/40 bg-status-correct/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-status-correct">
                Powered by LI.FI
              </span>
            </div>
          </div>
          {/* Decorative corner accent */}
          <div className="absolute -right-4 -top-4 h-20 w-20 rotate-45 bg-crimson/10" />
          <div className="absolute -bottom-2 -left-2 h-12 w-12 rotate-45 bg-gold/10" />
        </div>
        </P5Reveal>

        {/* How It Works — Decision Pipeline */}
        <P5Reveal text="PIPELINE" height="h-60" stagger={200}>
        <div className="border-2 border-border bg-surface/60 p-6">
          <SectionHeader sub="A 6-phase OODA-inspired loop that runs continuously">
            Decision Pipeline
          </SectionHeader>

          {/* Pipeline flow visualization */}
          <div className="mb-6 flex items-center justify-center overflow-x-auto pb-2">
            <div className="flex items-center gap-0">
              {PHASES.map((phase, i) => (
                <div key={phase.name} className="flex items-center">
                  <div
                    className={cn(
                      "px-3 py-1.5 text-[10px] font-black uppercase tracking-wider border",
                      phase.color,
                      phase.bg,
                    )}
                    style={{ transform: "skewX(-3deg)" }}
                  >
                    <span style={{ transform: "skewX(3deg)", display: "inline-block" }}>
                      {phase.name}
                    </span>
                  </div>
                  {i < PHASES.length - 1 && (
                    <span className="mx-1 text-text-muted text-xs">&rarr;</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Phase detail cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PHASES.map((phase, i) => (
              <div
                key={phase.name}
                className={cn(
                  "border-l-3 border bg-surface-light/20 p-4 transition-colors p5-shimmer",
                  phase.color,
                )}
                style={{ borderLeftWidth: "3px" }}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className={cn("text-[10px] font-black", phase.color)}>
                    0{i + 1}
                  </span>
                  <span className="text-sm font-bold text-text">{phase.name}</span>
                </div>
                <p className="text-xs leading-relaxed text-text-muted">
                  {phase.description}
                </p>
              </div>
            ))}
          </div>

          {/* Loop indicator */}
          <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-text-muted">
            <span className="h-px w-8 bg-border" />
            <span className="font-bold uppercase tracking-wider">Continuous loop — runs 24/7</span>
            <span className="h-px w-8 bg-border" />
          </div>
        </div>
        </P5Reveal>

        {/* Portfolio Strategy */}
        <P5Reveal text="STRATEGY" height="h-40" stagger={400}>
        <div className="border-2 border-border bg-surface/60 p-6">
          <SectionHeader sub="How capital is allocated and protected">
            Portfolio Strategy
          </SectionHeader>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Safe Yield */}
            <div className="border border-status-correct/30 bg-status-correct/5 p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-block h-3 w-3 bg-status-correct" />
                <h3 className="text-sm font-black uppercase tracking-wider text-status-correct">
                  80% — Safe Yield
                </h3>
              </div>
              <p className="mb-4 text-xs leading-relaxed text-text-muted">
                The majority of capital is deployed into battle-tested lending protocols through Beefy&apos;s
                auto-compounding vaults. These positions earn stable yields on USDC with minimal risk.
              </p>
              <div className="space-y-2">
                {[
                  "Morpho lending (Arbitrum, Optimism)",
                  "Compound V3 lending (Base)",
                  "Euler lending (Arbitrum)",
                  "Auto-compounding via Beefy vaults",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-text-muted">
                    <span className="text-status-correct">&#x25B8;</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Growth */}
            <div className="border border-gold/30 bg-gold/5 p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-block h-3 w-3 bg-gold" />
                <h3 className="text-sm font-black uppercase tracking-wider text-gold">
                  20% — Growth
                </h3>
              </div>
              <p className="mb-4 text-xs leading-relaxed text-text-muted">
                A smaller allocation targets momentum plays — tokens showing strong technical signals
                across any supported chain. Every growth position has a mandatory -15% stop-loss.
              </p>
              <div className="space-y-2">
                {[
                  "Alt tokens with momentum signals",
                  "Memecoins with volume breakouts",
                  "Pendle YTs (variable yield bets)",
                  "Max 5% per individual token",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-text-muted">
                    <span className="text-gold">&#x25B8;</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </P5Reveal>

        {/* Chains */}
        <P5Reveal text="CHAINS" height="h-32" stagger={600}>
        <div className="border-2 border-border bg-surface/60 p-6">
          <SectionHeader sub="Operating across 3 L2 networks for diversification">
            Supported Chains
          </SectionHeader>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {CHAINS.map((chain) => (
              <div
                key={chain.id}
                className="flex items-start gap-3 border border-border/50 bg-surface-light/20 p-4 p5-shimmer"
              >
                <ChainLogo chainId={chain.id} size={32} />
                <div>
                  <div className="text-sm font-bold text-text">{chain.name}</div>
                  <div className="mt-0.5 text-xs text-text-muted">{chain.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </P5Reveal>

        {/* Protocol Integrations */}
        <P5Reveal text="PROTOCOLS" height="h-40" stagger={800}>
        <div className="border-2 border-border bg-surface/60 p-6">
          <SectionHeader sub="DeFi protocols used for yield generation and execution">
            Protocol Integrations
          </SectionHeader>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PROTOCOLS.map((proto) => (
              <div
                key={proto.name}
                className="flex items-start gap-3 border border-border/50 bg-surface-light/20 p-4 p5-shimmer"
              >
                <ProtocolLogo protocol={proto.name} size={28} />
                <div className="min-w-0">
                  <div className="text-sm font-bold text-text">{proto.name}</div>
                  <div className="mt-0.5 text-xs leading-relaxed text-text-muted">
                    {proto.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </P5Reveal>

        {/* LI.FI — The Core Infrastructure */}
        <P5Reveal text="LI.FI" height="h-60" stagger={1000}>
        <div className="border-2 border-crimson bg-surface/60 p-6 p5-stripes">
          <SectionHeader sub="ATLAS was built around LI.FI — it is the backbone of every cross-chain operation">
            LI.FI — Why It Powers Everything
          </SectionHeader>

          <p className="mb-6 max-w-3xl text-sm leading-relaxed text-text-muted">
            LI.FI isn&apos;t just another integration — it&apos;s the reason ATLAS can operate as a multi-chain agent at all.
            Without LI.FI, the agent would be locked to a single chain, unable to chase yield across networks or
            rebalance capital where it&apos;s needed most. Every cross-chain decision the agent makes flows through LI.FI&apos;s
            infrastructure.
          </p>

          {/* Why LI.FI */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { stat: "30+", label: "Bridges aggregated", detail: "Stargate, Across, Hop, Circle CCTP, and more" },
              { stat: "15+", label: "Chains supported", detail: "ATLAS uses Arbitrum, Base, Optimism via LI.FI" },
              { stat: "100s", label: "DEXs integrated", detail: "Uniswap, SushiSwap, Curve, 1inch, and more" },
              { stat: "1", label: "API call", detail: "One request finds the best route across all options" },
            ].map((item) => (
              <div key={item.label} className="border border-crimson/30 bg-crimson/5 p-4 text-center">
                <div className="text-2xl font-black text-crimson" style={{ fontFamily: "var(--font-heading)" }}>
                  {item.stat}
                </div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-text">
                  {item.label}
                </div>
                <div className="mt-1 text-[10px] text-text-muted">{item.detail}</div>
              </div>
            ))}
          </div>

          {/* How ATLAS uses LI.FI */}
          <div className="mb-6">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-crimson">
              How ATLAS Uses LI.FI
            </h3>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {[
                {
                  title: "Cross-Chain Rebalancing",
                  desc: "When a vault on Optimism yields higher than Arbitrum, the agent bridges USDC via LI.FI to capture the better rate. LI.FI finds the cheapest bridge route automatically.",
                  example: "USDC on Base → LI.FI bridge → USDC on Arbitrum → Beefy vault deposit",
                },
                {
                  title: "Token Swaps for Entry/Exit",
                  desc: "When entering a growth position (e.g., buying a momentum token), LI.FI handles the swap from USDC to the target token on-chain with best-price routing.",
                  example: "USDC → LI.FI swap → target token on the same chain",
                },
                {
                  title: "Multi-Step Execution",
                  desc: "LI.FI can bridge AND swap in a single transaction. If the agent wants ARB on Arbitrum but holds USDC on Base, LI.FI bridges and swaps atomically.",
                  example: "USDC on Base → bridge + swap → ARB on Arbitrum (one tx)",
                },
                {
                  title: "Gas-Optimized Routing",
                  desc: "LI.FI compares gas costs across all available routes. The agent doesn't need to know which bridge is cheapest — LI.FI handles that comparison and picks the optimal path.",
                  example: "Route A: $0.50 fee, 2 min | Route B: $0.12 fee, 5 min → picks B",
                },
              ].map((item) => (
                <div key={item.title} className="border border-border/50 bg-surface-light/20 p-4">
                  <div className="text-xs font-bold text-text">{item.title}</div>
                  <p className="mt-1 text-[11px] leading-relaxed text-text-muted">{item.desc}</p>
                  <div className="mt-2 flex items-center gap-1.5 border-t border-border/30 pt-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-crimson/60">Flow:</span>
                    <span className="text-[10px] text-text-muted">{item.example}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Flow Diagram */}
          <div className="mb-6">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-crimson">
              Execution Flow Diagram
            </h3>
            <div className="border border-border/50 bg-surface-light/10">
              <LiFiFlowDiagram />
            </div>
          </div>

          {/* The Execution Pipeline */}
          <div className="mb-6">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-crimson">
              LI.FI Execution Pipeline
            </h3>
            <div className="grid grid-cols-1 gap-0 sm:grid-cols-5">
              {[
                { step: "01", title: "Quote", desc: "Agent calls li.quest/v1/quote with source chain, dest chain, token, and amount" },
                { step: "02", title: "Evaluate", desc: "Compares returned routes by fee, speed, and slippage — picks the best one" },
                { step: "03", title: "Approve", desc: "Sets ERC-20 token approval on the LI.FI Diamond contract for the exact amount" },
                { step: "04", title: "Execute", desc: "Sends the transaction on-chain with LI.FI's calldata — bridge/swap happens atomically" },
                { step: "05", title: "Track", desc: "Polls LI.FI status API until confirmed on destination chain, logs result to DB" },
              ].map((item, i) => (
                <div key={item.step} className="relative border border-border/50 bg-surface-light/20 p-3 text-center">
                  <div className="text-lg font-black text-crimson/40">{item.step}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-text">{item.title}</div>
                  <div className="mt-1 text-[10px] leading-relaxed text-text-muted">{item.desc}</div>
                  {i < 4 && (
                    <div className="absolute -right-2 top-1/2 z-10 hidden -translate-y-1/2 text-crimson/40 sm:block">
                      &rarr;
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Technical details row */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="border border-border/50 bg-surface-light/30 p-4">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                LI.FI Diamond Contract
              </div>
              <code className="block break-all text-xs font-bold text-crimson/80">
                0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE
              </code>
              <div className="mt-1 text-[10px] text-text-muted">
                Same address on every chain — Arbitrum, Base, Optimism
              </div>
            </div>

            <div className="border border-border/50 bg-surface-light/30 p-4">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                API Endpoints Used
              </div>
              <div className="space-y-1">
                {[
                  { ep: "li.quest/v1/quote", use: "Get optimal route" },
                  { ep: "li.quest/v1/status", use: "Track transfer status" },
                  { ep: "li.quest/v1/connections", use: "Check supported pairs" },
                  { ep: "li.quest/v1/tokens", use: "Discover available tokens" },
                ].map((item) => (
                  <div key={item.ep} className="flex items-center justify-between text-[10px]">
                    <code className="text-crimson/70">{item.ep}</code>
                    <span className="text-text-muted">{item.use}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-border/50 bg-surface-light/30 p-4">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Supported Operations
              </div>
              <div className="flex flex-wrap gap-2">
                {["Cross-chain bridge", "Same-chain swap", "Bridge + swap combo", "Multi-hop routes", "Gas refuel", "Contract calls"].map((op) => (
                  <span
                    key={op}
                    className="border border-crimson/20 bg-crimson/5 px-2 py-0.5 text-[10px] font-bold text-crimson/70"
                  >
                    {op}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Why LI.FI matters callout */}
          <div className="mt-4 border border-gold/30 bg-gold/5 p-4 text-xs leading-relaxed text-text-muted">
            <span className="font-bold text-gold">Why LI.FI is essential:</span>{" "}
            Without a cross-chain execution layer, an autonomous agent would be trapped on one chain — unable to
            follow yield across networks, unable to diversify risk, and unable to access the best opportunities
            wherever they appear. LI.FI gives ATLAS the ability to treat multiple chains as a single unified
            liquidity space. The agent doesn&apos;t think in terms of bridges or DEXs — it thinks in terms of
            &quot;move X from here to there&quot; and LI.FI handles the complexity.
          </div>
        </div>
        </P5Reveal>

        {/* Risk Management */}
        <P5Reveal text="RISK" height="h-40" stagger={1200}>
        <div className="border-2 border-border bg-surface/60 p-6">
          <SectionHeader sub="Hard-coded guardrails that cannot be overridden by the AI">
            Risk Management
          </SectionHeader>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {RISK_RULES.map((rule) => (
              <div
                key={rule.label}
                className={cn(
                  "border p-3 text-center",
                  rule.type === "stop"
                    ? "border-crimson/30 bg-crimson/5"
                    : rule.type === "target"
                      ? "border-gold/30 bg-gold/5"
                      : "border-border/50 bg-surface-light/20",
                )}
              >
                <div
                  className={cn(
                    "text-lg font-black",
                    rule.type === "stop"
                      ? "text-crimson"
                      : rule.type === "target"
                        ? "text-gold"
                        : "text-text",
                  )}
                >
                  {rule.value}
                </div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  {rule.label}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 border border-crimson/20 bg-crimson/5 p-3 text-xs leading-relaxed text-text-muted">
            <span className="font-bold text-crimson">Anti-bias protection:</span>{" "}
            Before every trade, the agent runs 5 cognitive checks — counter-evidence analysis,
            recency bias detection, loss-chasing prevention, trade frequency limiting, and position
            sizing validation. If any check fails, the trade is blocked.
          </div>
        </div>
        </P5Reveal>

        {/* Automation / Cron Jobs */}
        <P5Reveal text="AUTOMATION" height="h-32" stagger={1400}>
        <div className="border-2 border-border bg-surface/60 p-6">
          <SectionHeader sub="Scheduled tasks that keep the agent running around the clock">
            Automation Schedule
          </SectionHeader>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {CRON_JOBS.map((job) => (
              <div
                key={job.name}
                className="flex items-start gap-3 border border-border/50 bg-surface-light/20 p-4 p5-shimmer"
              >
                <div
                  className="shrink-0 border border-crimson/30 bg-crimson/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-crimson"
                  style={{ transform: "skewX(-3deg)" }}
                >
                  <span style={{ transform: "skewX(3deg)", display: "inline-block" }}>
                    {job.freq}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-bold text-text">{job.name}</div>
                  <div className="mt-0.5 text-xs text-text-muted">{job.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </P5Reveal>

        {/* Tech Stack */}
        <P5Reveal text="TECH" height="h-40" stagger={1600}>
        <div className="border-2 border-border bg-surface/60 p-6">
          <SectionHeader sub="The technology behind the dashboard and agent">
            Tech Stack
          </SectionHeader>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TECH_STACK.map((group) => (
              <div key={group.category} className="border border-border/50 bg-surface-light/20 p-4">
                <h4 className="mb-2 text-[10px] font-black uppercase tracking-wider text-crimson/80">
                  {group.category}
                </h4>
                <div className="space-y-1.5">
                  {group.items.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-xs text-text-muted">
                      <span className="text-crimson/50">&#x25AA;</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        </P5Reveal>

        {/* Architecture Diagram */}
        <P5Reveal text="ARCHITECTURE" height="h-60" stagger={1800}>
        <div className="border-2 border-border bg-surface/60 p-6">
          <SectionHeader sub="How data flows from blockchain to dashboard">
            System Architecture
          </SectionHeader>

          <div className="overflow-x-auto">
            <div className="mx-auto min-w-[600px] max-w-3xl space-y-4">
              {/* Layer 1: Blockchains */}
              <div className="flex items-center gap-3">
                <div className="w-24 shrink-0 text-right text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Chains
                </div>
                <div className="flex flex-1 items-center gap-2">
                  {CHAINS.map((c) => (
                    <div
                      key={c.id}
                      className="flex flex-1 items-center justify-center gap-1.5 border border-border/50 bg-surface-light/20 py-2 text-xs font-bold text-text"
                    >
                      <ChainLogo chainId={c.id} size={14} />
                      {c.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center gap-3">
                <div className="w-24" />
                <div className="flex-1 text-center text-text-muted text-xs">&#x25BC; RPC calls via Alchemy</div>
              </div>

              {/* Layer 2: Agent */}
              <div className="flex items-center gap-3">
                <div className="w-24 shrink-0 text-right text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Agent
                </div>
                <div className="flex-1 border-2 border-crimson/30 bg-crimson/5 p-3 text-center">
                  <div className="text-xs font-black uppercase tracking-wider text-crimson">
                    ATLAS Agent (OpenClaw)
                  </div>
                  <div className="mt-1 text-[10px] text-text-muted">
                    Decision pipeline + strategy engine + risk management
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center gap-3">
                <div className="w-24" />
                <div className="flex-1 text-center text-text-muted text-xs">&#x25BC; Swap &amp; bridge requests</div>
              </div>

              {/* Layer 2.5: LI.FI */}
              <div className="flex items-center gap-3">
                <div className="w-24 shrink-0 text-right text-[10px] font-bold uppercase tracking-wider text-crimson/60">
                  Execution
                </div>
                <div className="flex-1 border-2 border-crimson/50 bg-crimson/10 p-3 text-center">
                  <div className="text-xs font-black uppercase tracking-wider text-crimson">
                    LI.FI Protocol
                  </div>
                  <div className="mt-1 text-[10px] text-text-muted">
                    Cross-chain bridges, DEX swaps, route optimization, gas estimation
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center gap-3">
                <div className="w-24" />
                <div className="flex-1 text-center text-text-muted text-xs">&#x25BC; Logs decisions, positions, predictions</div>
              </div>

              {/* Layer 3: Database */}
              <div className="flex items-center gap-3">
                <div className="w-24 shrink-0 text-right text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Database
                </div>
                <div className="flex-1 border border-border/50 bg-surface-light/20 p-3 text-center">
                  <div className="text-xs font-bold text-text">Turso (SQLite Edge)</div>
                  <div className="mt-1 text-[10px] text-text-muted">
                    Decisions, predictions, positions, transactions, portfolio snapshots
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center gap-3">
                <div className="w-24" />
                <div className="flex-1 text-center text-text-muted text-xs">&#x25BC; REST API + SSE streams</div>
              </div>

              {/* Layer 4: Dashboard */}
              <div className="flex items-center gap-3">
                <div className="w-24 shrink-0 text-right text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Dashboard
                </div>
                <div className="flex-1 border border-gold/30 bg-gold/5 p-3 text-center">
                  <div className="text-xs font-bold text-gold">This Dashboard (Next.js 15)</div>
                  <div className="mt-1 text-[10px] text-text-muted">
                    Real-time brain feed, portfolio charts, strategy view, predictions tracker
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </P5Reveal>

        {/* What Makes This Different */}
        <P5Reveal text="DIFFERENT" height="h-40" stagger={2000}>
        <div className="border-2 border-crimson bg-surface/60 p-6 p5-stripes">
          <SectionHeader sub="Why ATLAS isn't just another trading bot">
            What Makes This Different
          </SectionHeader>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Full Autonomy",
                desc: "No human approves trades. The agent researches, decides, and executes independently with real money on mainnet.",
              },
              {
                title: "Transparent Reasoning",
                desc: "Every decision is logged with full reasoning, observations, and confidence levels. Nothing is a black box.",
              },
              {
                title: "Self-Improving",
                desc: "The MONITOR phase logs lessons from outcomes. Weekly adaptation reviews adjust strategy based on performance data.",
              },
              {
                title: "Verifiable Predictions",
                desc: "The agent makes timestamped predictions with confidence scores. Accuracy is tracked and publicly visible.",
              },
              {
                title: "Multi-Chain Native",
                desc: "Capital moves freely across Arbitrum, Base, and Optimism via LI.FI bridges. Not locked to one chain.",
              },
              {
                title: "Hard-Coded Safety",
                desc: "Risk parameters are embedded in the agent's instructions — not suggestions, but non-overridable rules.",
              },
            ].map((item) => (
              <div key={item.title} className="p-4">
                <h4
                  className="mb-2 text-sm font-black uppercase tracking-wider text-text"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {item.title}
                </h4>
                <p className="text-xs leading-relaxed text-text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
        </P5Reveal>

        {/* Footer */}
        <div className="border-t-2 border-border pt-4 pb-8 text-center">
          <p className="text-xs text-text-muted">
            ATLAS is an experimental autonomous agent. It manages real capital and makes real trades.
          </p>
          <p className="mt-1 text-[10px] text-text-muted/60">
            Built with Claude AI &middot; Powered by OpenClaw &middot; Cross-chain via LI.FI
          </p>
        </div>
      </div>
    </>
  );
}
