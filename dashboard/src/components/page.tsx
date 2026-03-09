"use client";

import { useMemo } from "react";
import {
  usePortfolio,
  useTransactions,
  usePositions,
  useLivePortfolio,
} from "@/hooks/use-sse";
import { StatsBar } from "@/components/stats-bar";
import { PortfolioCharts } from "@/components/portfolio-charts";
import { HoldingsTable } from "@/components/holdings-table";
import { PositionsTable } from "@/components/positions-table";
import { TransactionHistory } from "@/components/transaction-history";
import { formatUsd } from "@/lib/utils";

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
      holdings:
        typeof s.holdings === "string"
          ? (JSON.parse(s.holdings) as Holding[])
          : s.holdings,
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
            <h1 className="text-lg font-bold tracking-widest text-text">
              PORTFOLIO
            </h1>
            <p className="mt-1 text-xs text-text-muted">
              Cross-chain holdings, allocation, and transaction history
            </p>
          </div>
          {livePortfolio && (
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-status-correct animate-pulse-glow" />
                <span className="text-xs text-status-correct uppercase tracking-wider font-bold">
                  Live from RPC
                </span>
              </div>
              <p className="text-lg font-bold text-text mt-0.5">
                {formatUsd(livePortfolio.totalValueUsd)}
              </p>
            </div>
          )}
        </div>

        {/* Charts: donut + line side by side */}
        <PortfolioCharts snapshots={snapshots} liveHoldings={liveHoldings} />

        {/* Active DeFi positions */}
        <PositionsTable positions={positions} />

        {/* Holdings table */}
        <div>
          {isLive && (
            <p className="mb-2 text-xs text-text-muted">
              Showing real-time balances from on-chain RPC (updated every 30s)
            </p>
          )}
          <HoldingsTable holdings={latestHoldings} />
        </div>

        {/* Transaction history */}
        <TransactionHistory transactions={transactions} />
      </div>
    </>
  );
}
