"use client";

import { useMemo } from "react";
import {
  usePortfolio,
  useTransactions,
  usePositions,
  useLivePortfolio,
} from "@/hooks/use-sse";
import { StatsBar } from "@/components/stats-bar";
import dynamic from "next/dynamic";
import { P5Loading } from "@/components/p5-loading";
import { P5Reveal } from "@/components/p5-reveal";
const PortfolioCharts = dynamic(
  () => import("@/components/portfolio-charts").then((m) => m.PortfolioCharts),
  { ssr: false, loading: () => <P5Loading height="h-[320px]" text="CHARTS" /> }
);
const PnlWaterfall = dynamic(
  () => import("@/components/pnl-waterfall").then((m) => m.PnlWaterfall),
  { ssr: false, loading: () => <P5Loading height="h-[320px]" text="P&L" /> }
);
const DrawdownChart = dynamic(
  () => import("@/components/drawdown-chart").then((m) => m.DrawdownChart),
  { ssr: false, loading: () => <P5Loading height="h-[320px]" text="DRAWDOWN" /> }
);
import { HoldingsTable } from "@/components/holdings-table";
import { PositionsTable } from "@/components/positions-table";
import { PerformanceRankings } from "@/components/performance-rankings";
import { DrawdownIndicator } from "@/components/drawdown-indicator";
import { TransactionHistory } from "@/components/transaction-history";
import { formatUsd } from "@/lib/utils";

// Normalize holdings from 3 different DB schemas into a consistent format
function normalizeHoldings(raw: unknown): Holding[] {
  if (!raw) return [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!parsed) return [];

    // Format 1: already Holding[] (flat with `amount`)
    if (Array.isArray(parsed)) {
      return parsed.map(normalizeOneHolding);
    }

    // Format 3: nested { assets: [...] }
    if (parsed.assets && Array.isArray(parsed.assets)) {
      return parsed.assets.map(normalizeOneHolding);
    }

    return [];
  } catch {
    return [];
  }
}

function normalizeOneHolding(h: Record<string, unknown>): Holding {
  return {
    chainId: Number(h.chainId ?? 0),
    token: String(h.token ?? h.symbol ?? "UNKNOWN"),
    tokenAddress: String(h.tokenAddress ?? h.address ?? ""),
    amount: Number(h.amount ?? h.balance ?? 0),
    valueUsd: Number(h.valueUsd ?? h.value_usd ?? h.usdValue ?? 0),
    type: (h.type as Holding["type"]) ?? undefined,
    protocol: h.protocol as string | undefined,
    apy: h.apy != null ? Number(h.apy) : undefined,
  };
}

interface Holding {
  chainId: number;
  token: string;
  tokenAddress: string;
  amount: number;
  valueUsd: number;
  type?: "token" | "vault" | "lp" | "pt" | "yt";
  protocol?: string;
  apy?: number;
}

interface Snapshot {
  id: string;
  timestamp: string;
  totalValueUsd: number;
  holdings: Holding[];
  pnl24h?: number;
  pnlTotal?: number;
}

interface Transaction {
  id: string;
  timestamp: string;
  type: string;
  status: string;
  fromChainId: number;
  toChainId: number;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount?: string;
  valueUsd: number;
  txHash?: string;
  lifiRouteId?: string;
  gasCostUsd?: number;
  bridgeFeeUsd?: number;
}

interface Position {
  id: string;
  openedAt: string;
  closedAt?: string;
  type: string;
  protocol: string;
  chainId: number;
  tokenAddress: string;
  tokenSymbol: string;
  amount: string;
  entryValueUsd: number;
  currentValueUsd?: number;
  entryPrice?: number;
  stopLossPrice?: number;
  apy?: number;
  maturity?: string;
  status: string;
  pnlUsd?: number;
  decisionId?: string;
  metadata?: Record<string, unknown>;
}

interface LivePortfolioData {
  wallet: string;
  timestamp: string;
  totalValueUsd: number;
  holdings: Holding[];
}

export default function PortfolioPage() {
  const rawSnapshots = usePortfolio();
  const rawTransactions = useTransactions();
  const rawPositions = usePositions();
  const livePortfolio = useLivePortfolio() as LivePortfolioData | null;

  const snapshots = useMemo(() => {
    return (rawSnapshots as Snapshot[]).map((s) => ({
      ...s,
      holdings: normalizeHoldings(s.holdings),
    }));
  }, [rawSnapshots]);

  const transactions = rawTransactions as Transaction[];
  const positions = rawPositions as Position[];

  // Prefer live balances from RPC, fall back to latest snapshot
  const liveHoldings = livePortfolio?.holdings ?? [];
  const latestHoldings = useMemo(() => {
    if (liveHoldings.length > 0) return liveHoldings;
    if (snapshots.length === 0) return [];
    const sorted = [...snapshots].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return sorted[0].holdings;
  }, [liveHoldings, snapshots]);

  const isLive = liveHoldings.length > 0;

  return (
    <>
      <StatsBar />
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-xl font-black tracking-[0.15em] text-crimson"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              PORTFOLIO
            </h1>
            <p className="mt-1 text-xs text-text-muted font-bold">
              Cross-chain holdings, allocation, and transaction history
            </p>
          </div>
          {livePortfolio && (
            <div className="flex items-center gap-4">
              <DrawdownIndicator
                currentValue={livePortfolio.totalValueUsd}
                peakValue={Math.max(...snapshots.map(s => s.totalValueUsd), livePortfolio?.totalValueUsd ?? 0)}
              />
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 bg-crimson animate-pulse-glow" />
                  <span className="text-xs text-crimson uppercase tracking-wider font-bold">
                    Live from RPC
                  </span>
                </div>
                <p className="text-lg font-bold text-text mt-0.5">
                  {formatUsd(livePortfolio.totalValueUsd)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Charts: donut + line side by side */}
        <P5Reveal text="CHARTS" height="h-[320px]" stagger={0}>
          <PortfolioCharts snapshots={snapshots} liveHoldings={liveHoldings} />
        </P5Reveal>

        {/* PnL waterfall breakdown */}
        <P5Reveal text="P&L" height="h-[320px]" stagger={200}>
          <PnlWaterfall positions={positions} />
        </P5Reveal>

        {/* Drawdown from peak */}
        <P5Reveal text="DRAWDOWN" height="h-[320px]" stagger={400}>
          <DrawdownChart snapshots={snapshots} />
        </P5Reveal>

        {/* Active DeFi positions */}
        <P5Reveal text="POSITIONS" height="h-40" stagger={600}>
          <PositionsTable positions={positions} />
        </P5Reveal>

        {/* Performance rankings */}
        <P5Reveal text="RANKINGS" height="h-40" stagger={800}>
          <PerformanceRankings positions={positions} />
        </P5Reveal>

        {/* Holdings table */}
        <P5Reveal text="HOLDINGS" height="h-40" stagger={1000}>
          <div>
            {isLive && (
              <p className="mb-2 text-xs text-text-muted">
                Showing real-time balances from on-chain RPC (updated every 30s)
              </p>
            )}
            <HoldingsTable holdings={latestHoldings} />
          </div>
        </P5Reveal>

        {/* Transaction history */}
        <P5Reveal text="TRANSACTIONS" height="h-40" stagger={1200}>
          <TransactionHistory transactions={transactions} />
        </P5Reveal>
      </div>
    </>
  );
}
