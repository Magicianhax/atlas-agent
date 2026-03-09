"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { cn, formatUsd, formatPercent, timeAgo } from "@/lib/utils";
import { ChainLogo } from "@/components/logos";
import { StatsBar } from "@/components/stats-bar";
import { P5Loading } from "@/components/p5-loading";
import { P5Reveal } from "@/components/p5-reveal";
import { useLivePortfolio } from "@/hooks/use-sse";
import { ChainWarMap } from "@/components/chain-war-map";
import { RiskHeatmap } from "@/components/risk-heatmap";
import { GasTracker } from "@/components/gas-tracker";

const VaultYieldRadar = dynamic(
  () => import("@/components/vault-yield-radar").then((m) => m.VaultYieldRadar),
  { ssr: false }
);

interface Stats {
  portfolioValueUsd: number;
  pnlTotal: number;
  predictionAccuracy: number;
  activePredictions: number;
  totalTradesExecuted: number;
  totalDecisions: number;
  totalPredictions: number;
  avgConfidence: number;
}

interface Prediction {
  id: string;
  createdAt: string;
  claim: string;
  confidence: number;
  status: string;
  category?: string;
}

interface Decision {
  id: string;
  timestamp: string;
  phase: string;
  title: string;
  reasoning: string;
  observations: string[];
}

interface Holding {
  chainId: number;
  token: string;
  tokenAddress: string;
  amount: number;
  valueUsd: number;
  type?: string;
  protocol?: string;
}

interface LivePortfolio {
  wallet: string;
  timestamp: string;
  totalValueUsd: number;
  holdings: Holding[];
}

interface Position {
  id: string;
  type: string;
  protocol: string;
  tokenSymbol: string;
  entryValueUsd: number;
  currentValueUsd?: number;
  status: string;
  pnlUsd?: number;
  apy?: number;
  chainId?: number;
}

const ALLOCATION_RULES = {
  safe: {
    label: "Safe Yield",
    target: 80,
    color: "bg-emerald-500",
    textColor: "text-status-correct",
    sub: [
      { label: "Lending (Morpho, Aave)", max: 40 },
      { label: "Pendle PTs (fixed yield)", max: 30 },
      { label: "Beefy Auto-Compound", max: 30 },
    ],
  },
  growth: {
    label: "Growth / Momentum",
    target: 20,
    color: "bg-amber-500",
    textColor: "text-gold",
    sub: [
      { label: "Alt/meme momentum", max: 5, note: "per token" },
      { label: "Pendle YTs", max: 10, note: "per position" },
    ],
  },
};

const RISK_PARAMS_SAFE = [
  { label: "Max per Position", value: "20%", color: "text-status-correct" },
  { label: "Max per Chain", value: "40%", color: "text-blue-400" },
  { label: "Min Confidence", value: "65%", color: "text-status-correct" },
  { label: "Stop Loss", value: "-10%", color: "text-crimson" },
  { label: "Cooling Period", value: "2h", color: "text-text-muted" },
];

const RISK_PARAMS_GROWTH = [
  { label: "Max per Token", value: "5%", color: "text-gold" },
  { label: "Total Growth Cap", value: "20%", color: "text-gold" },
  { label: "Min Confidence", value: "70%", color: "text-gold" },
  { label: "Stop Loss", value: "-15%", color: "text-crimson" },
  { label: "Cooling Period", value: "4h", color: "text-text-muted" },
];

const GLOBAL_LIMITS = [
  { label: "Emergency Halt", value: "-25% from peak", color: "text-crimson" },
  { label: "Daily Trade Limit", value: "5 trades", color: "text-text" },
  { label: "Min Trade Size", value: "$2", color: "text-text-muted" },
];

const CHAIN_NAMES: Record<number, string> = {
  42161: "Arbitrum",
  8453: "Base",
  10: "Optimism",
};

const CHAIN_COLORS: Record<number, string> = {
  42161: "text-[#2d374b]",
  8453: "text-[#0052ff]",
  10: "text-[#ff0420]",
};

export default function StrategyPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const livePortfolio = useLivePortfolio() as LivePortfolio | null;

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, predsRes, decsRes, posRes] = await Promise.all([
          fetch("/api/stats"),
          fetch("/api/predictions"),
          fetch("/api/decisions"),
          fetch("/api/positions"),
        ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (predsRes.ok) setPredictions(await predsRes.json());
        if (decsRes.ok) setDecisions(await decsRes.json());
        if (posRes.ok) setPositions(await posRes.json());
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Live allocation breakdown
  const allocation = useMemo(() => {
    const holdings = livePortfolio?.holdings ?? [];
    const total = livePortfolio?.totalValueUsd ?? 0;
    if (total === 0) return null;

    let safeValue = 0;
    let growthValue = 0;
    let idleValue = 0;
    const chainValues: Record<number, number> = {};

    for (const h of holdings) {
      chainValues[h.chainId] = (chainValues[h.chainId] ?? 0) + h.valueUsd;

      if (h.type === "vault" || h.type === "pt" || h.type === "lp") {
        safeValue += h.valueUsd;
      } else if (h.type === "yt") {
        growthValue += h.valueUsd;
      } else {
        // Plain tokens — check if it's a stablecoin (idle) or momentum
        const s = h.token.toUpperCase();
        if (["USDC", "USDC.E", "USDT", "DAI", "FRAX"].includes(s)) {
          idleValue += h.valueUsd;
        } else if (s === "ETH" || s === "WETH") {
          idleValue += h.valueUsd; // ETH dust is idle
        } else {
          growthValue += h.valueUsd; // unknown tokens = growth
        }
      }
    }

    // Note: positions are NOT added here to avoid double-counting with live holdings
    // The live portfolio already includes vault/token values from on-chain RPC

    const chains = Object.entries(chainValues)
      .map(([id, val]) => ({
        chainId: Number(id),
        name: CHAIN_NAMES[Number(id)] ?? `Chain ${id}`,
        value: val,
        pct: (val / total) * 100,
        overLimit: (val / total) * 100 > 40,
      }))
      .sort((a, b) => b.value - a.value);

    return {
      total,
      safe: { value: safeValue, pct: (safeValue / total) * 100 },
      growth: { value: growthValue, pct: (growthValue / total) * 100 },
      idle: { value: idleValue, pct: (idleValue / total) * 100 },
      chains,
    };
  }, [livePortfolio, positions]);

  // Category accuracy
  const categoryAccuracy = useMemo(() => {
    const groups: Record<string, { total: number; correct: number }> = {};
    for (const p of predictions) {
      const cat = p.category ?? "uncategorized";
      if (!groups[cat]) groups[cat] = { total: 0, correct: 0 };
      if (p.status === "correct" || p.status === "incorrect") {
        groups[cat].total++;
        if (p.status === "correct") groups[cat].correct++;
      }
    }
    return Object.entries(groups)
      .map(([category, data]) => ({
        category,
        accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0,
        total: data.total,
        correct: data.correct,
      }))
      .sort((a, b) => b.total - a.total);
  }, [predictions]);

  // Recent decisions by phase
  const phaseCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of decisions) {
      counts[d.phase] = (counts[d.phase] ?? 0) + 1;
    }
    return counts;
  }, [decisions]);

  // Lessons from MONITOR decisions
  const lessons = useMemo(() => {
    return decisions.filter((d) => d.phase === "MONITOR").slice(0, 10);
  }, [decisions]);

  // Last activity
  const lastDecision = decisions[0];
  const lastActivity = lastDecision ? timeAgo(lastDecision.timestamp) : "never";

  if (loading) {
    return (
      <>
        <StatsBar />
        <div className="mx-auto max-w-7xl px-4 py-6">
          <P5Loading height="min-h-[50vh]" text="STRATEGY" variant="full" />
        </div>
      </>
    );
  }

  return (
    <>
      <StatsBar />
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-xl font-black tracking-[0.15em] text-crimson"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              STRATEGY
            </h1>
            <p className="mt-1 text-xs text-text-muted font-bold">
              Portfolio allocation, risk parameters, and decision pipeline
            </p>
          </div>
          <div className="text-right text-xs text-text-muted">
            <div>Last activity: <span className="text-text">{lastActivity}</span></div>
            <div>{stats?.totalDecisions ?? 0} decisions / {stats?.totalTradesExecuted ?? 0} trades</div>
          </div>
        </div>

        {/* Live Allocation */}
        {allocation && (
          <P5Reveal text="ALLOCATION" height="h-40" stagger={0}>
          <div className="border-2 border-border bg-surface/60 p-5">
            <h3 className="mb-4 text-xs uppercase tracking-wider text-text-muted">
              Live Allocation — {formatUsd(allocation.total)}
            </h3>

            {/* Stacked bar */}
            <div className="mb-4 flex h-6 w-full overflow-hidden bg-surface-light">
              {allocation.safe.pct > 0 && (
                <div
                  className="flex items-center justify-center bg-emerald-500/80 text-[10px] font-bold text-white transition-all duration-500"
                  style={{ width: `${allocation.safe.pct}%` }}
                >
                  {allocation.safe.pct >= 8 ? `SAFE ${allocation.safe.pct.toFixed(0)}%` : ""}
                </div>
              )}
              {allocation.growth.pct > 0 && (
                <div
                  className="flex items-center justify-center bg-amber-500/80 text-[10px] font-bold text-white transition-all duration-500"
                  style={{ width: `${allocation.growth.pct}%` }}
                >
                  {allocation.growth.pct >= 8 ? `GROWTH ${allocation.growth.pct.toFixed(0)}%` : ""}
                </div>
              )}
              {allocation.idle.pct > 0 && (
                <div
                  className="flex items-center justify-center bg-gray-500/60 text-[10px] font-bold text-gray-300 transition-all duration-500"
                  style={{ width: `${allocation.idle.pct}%` }}
                >
                  {allocation.idle.pct >= 8 ? `IDLE ${allocation.idle.pct.toFixed(0)}%` : ""}
                </div>
              )}
            </div>

            {/* Breakdown grid */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-text-muted">Safe Yield</div>
                <div className="text-sm font-bold text-status-correct">
                  {formatUsd(allocation.safe.value)}
                </div>
                <div className="text-[11px] text-text-muted">
                  {allocation.safe.pct.toFixed(1)}% / 80% target
                </div>
              </div>
              <div>
                <div className="text-xs text-text-muted">Growth</div>
                <div className="text-sm font-bold text-gold">
                  {formatUsd(allocation.growth.value)}
                </div>
                <div className="text-[11px] text-text-muted">
                  {allocation.growth.pct.toFixed(1)}% / 20% target
                </div>
              </div>
              <div>
                <div className="text-xs text-text-muted">Idle</div>
                <div className="text-sm font-bold text-gray-400">
                  {formatUsd(allocation.idle.value)}
                </div>
                <div className={cn(
                  "text-[11px]",
                  allocation.idle.pct > 50 ? "text-crimson" : "text-text-muted"
                )}>
                  {allocation.idle.pct.toFixed(1)}% undeployed
                  {allocation.idle.pct > 50 && " — needs deployment"}
                </div>
              </div>
            </div>

            {/* Chain concentration */}
            <div className="mt-4 border-t border-border/50 pt-3">
              <div className="text-[11px] uppercase tracking-wider text-text-muted mb-2">
                Chain Concentration (40% limit)
              </div>
              <div className="flex gap-4">
                {allocation.chains.map((c) => (
                  <div key={c.chainId} className="flex items-center gap-2 text-xs">
                    <ChainLogo chainId={c.chainId} size={16} />
                    <span className={cn(
                      "font-medium",
                      c.overLimit ? "text-crimson" : "text-text-muted"
                    )}>
                      {c.name}: {c.pct.toFixed(1)}%
                    </span>
                    {c.overLimit && (
                      <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-crimson">
                        OVER
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          </P5Reveal>
        )}

        {/* Chain War Map */}
        <P5Reveal text="CHAIN MAP" height="h-40" stagger={200}>
        <ChainWarMap holdings={livePortfolio?.holdings ?? []} />
        </P5Reveal>

        {/* Allocation Framework + Risk Params */}
        <P5Reveal text="RISK PARAMS" height="h-40" stagger={400}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* 80% Safe Yield Rules */}
          <div className="border-2 border-border bg-surface/60 p-5">
            <h3 className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-text-muted">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              Safe Yield (80%)
            </h3>
            <div className="space-y-2.5">
              {RISK_PARAMS_SAFE.map((p) => (
                <div key={p.label} className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">{p.label}</span>
                  <span className={cn("font-semibold", p.color)}>{p.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-border/50 pt-3 space-y-1.5">
              {ALLOCATION_RULES.safe.sub.map((s) => (
                <div key={s.label} className="flex items-center justify-between text-xs text-text-muted">
                  <span>{s.label}</span>
                  <span className="text-text">up to {s.max}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* 20% Growth Rules */}
          <div className="border-2 border-border bg-surface/60 p-5">
            <h3 className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-text-muted">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
              Growth / Momentum (20%)
            </h3>
            <div className="space-y-2.5">
              {RISK_PARAMS_GROWTH.map((p) => (
                <div key={p.label} className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">{p.label}</span>
                  <span className={cn("font-semibold", p.color)}>{p.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-border/50 pt-3 space-y-1.5">
              {ALLOCATION_RULES.growth.sub.map((s) => (
                <div key={s.label} className="flex items-center justify-between text-xs text-text-muted">
                  <span>{s.label}</span>
                  <span className="text-text">max {s.max}% {s.note ?? ""}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Global Hard Limits */}
          <div className="border-2 border-crimson/30 bg-surface/60 p-5">
            <h3 className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-crimson">
              <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
              Hard Limits (non-overridable)
            </h3>
            <div className="space-y-2.5">
              {GLOBAL_LIMITS.map((p) => (
                <div key={p.label} className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">{p.label}</span>
                  <span className={cn("font-semibold", p.color)}>{p.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded bg-red-500/10 p-3 text-xs text-crimson/80 leading-relaxed">
              Anti-bias checks run before every trade: counter-evidence, recency bias, loss chasing, frequency, and position sizing.
            </div>
          </div>
        </div>
        </P5Reveal>

        {/* Risk Heatmap */}
        <P5Reveal text="RISK MAP" height="h-40" stagger={600}>
        <RiskHeatmap
          holdings={livePortfolio?.holdings ?? []}
          positions={positions}
          totalValue={livePortfolio?.totalValueUsd ?? 0}
        />
        </P5Reveal>

        {/* Gas Tracker */}
        <P5Reveal text="GAS" height="h-32" stagger={800}>
        <GasTracker />
        </P5Reveal>

        {/* Decision Pipeline Activity */}
        <P5Reveal text="PIPELINE" height="h-32" stagger={1000}>
        <div className="border-2 border-border bg-surface/60 p-5">
          <h3 className="mb-4 text-xs uppercase tracking-wider text-text-muted">
            Decision Pipeline
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {(["RESEARCH", "ORIENT", "THESIS", "PREDICT", "EXECUTE", "MONITOR"] as const).map((phase) => {
              const count = phaseCounts[phase] ?? 0;
              const colors: Record<string, string> = {
                RESEARCH: "border-phase-research/40 text-phase-research",
                ORIENT: "border-phase-orient/40 text-phase-orient",
                THESIS: "border-phase-thesis/40 text-phase-thesis",
                PREDICT: "border-phase-predict/40 text-phase-predict",
                EXECUTE: "border-phase-execute/40 text-phase-execute",
                MONITOR: "border-phase-monitor/40 text-phase-monitor",
              };
              return (
                <div
                  key={phase}
                  className={cn(
                    "rounded border bg-surface-light/20 p-3 text-center",
                    colors[phase]
                  )}
                >
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-[10px] uppercase tracking-wider opacity-80">
                    {phase}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </P5Reveal>

        {/* Performance by Category + Prediction Stats + Yield Radar */}
        <P5Reveal text="PERFORMANCE" height="h-40" stagger={1200}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Category accuracy */}
          <div className="border-2 border-border bg-surface/60 p-5">
            <h3 className="mb-4 text-xs uppercase tracking-wider text-text-muted">
              Prediction Accuracy by Category
            </h3>
            {categoryAccuracy.length === 0 ? (
              <div className="py-8 text-center text-sm text-text-muted">
                No resolved predictions yet
              </div>
            ) : (
              <div className="space-y-3">
                {categoryAccuracy.map((cat) => (
                  <div key={cat.category}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="capitalize text-text">{cat.category}</span>
                      <span className="text-text-muted">
                        {cat.correct}/{cat.total} ({cat.accuracy.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden bg-surface-light">
                      <div
                        className={cn(
                          "h-full transition-all duration-500",
                          cat.accuracy >= 70 ? "bg-emerald-500" : cat.accuracy >= 50 ? "bg-amber-500" : "bg-red-500"
                        )}
                        style={{ width: `${Math.max(cat.total > 0 ? 4 : 0, Math.min(cat.accuracy, 100))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats overview */}
          <div className="border-2 border-border bg-surface/60 p-5">
            <h3 className="mb-4 text-xs uppercase tracking-wider text-text-muted">
              Agent Performance
            </h3>
            {stats ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded bg-surface-light/30 p-3 text-center">
                  <div className="text-xl font-bold text-text">
                    {formatPercent(stats.predictionAccuracy, false)}
                  </div>
                  <div className="text-[11px] text-text-muted">Prediction Accuracy</div>
                </div>
                <div className="rounded bg-surface-light/30 p-3 text-center">
                  <div className="text-xl font-bold text-text">
                    {stats.avgConfidence.toFixed(0)}%
                  </div>
                  <div className="text-[11px] text-text-muted">Avg Confidence</div>
                </div>
                <div className="rounded bg-surface-light/30 p-3 text-center">
                  <div className="text-xl font-bold text-text">
                    {stats.totalTradesExecuted}
                  </div>
                  <div className="text-[11px] text-text-muted">Trades Executed</div>
                </div>
                <div className="rounded bg-surface-light/30 p-3 text-center">
                  <div className={cn(
                    "text-xl font-bold",
                    stats.pnlTotal >= 0 ? "text-status-correct" : "text-crimson"
                  )}>
                    {formatUsd(stats.pnlTotal)}
                  </div>
                  <div className="text-[11px] text-text-muted">Total P&L</div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-text-muted">
                Loading stats...
              </div>
            )}
          </div>

          {/* Vault Yield Radar */}
          <VaultYieldRadar positions={positions} />
        </div>
        </P5Reveal>

        {/* Lessons Learned */}
        <P5Reveal text="LESSONS" height="h-40" stagger={1400}>
        <div className="border-2 border-border bg-surface/60 p-5">
          <h3 className="mb-4 text-xs uppercase tracking-wider text-text-muted">
            Agent Lessons (from MONITOR phase)
          </h3>
          {lessons.length === 0 ? (
            <div className="py-8 text-center text-sm text-text-muted">
              No lessons recorded yet. The agent logs lessons during the MONITOR phase.
            </div>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="rounded border border-border/50 bg-surface-light/30 p-3"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium text-text">
                      {lesson.title}
                    </span>
                    <span className="text-[11px] text-text-muted">
                      {timeAgo(lesson.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-text-muted">
                    {lesson.reasoning}
                  </p>
                  {lesson.observations && lesson.observations.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {lesson.observations.slice(0, 5).map((obs, i) => (
                        <span
                          key={i}
                          className="rounded bg-surface-light px-2 py-0.5 text-[11px] text-text-muted"
                        >
                          {obs}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        </P5Reveal>
      </div>
    </>
  );
}
