"use client";

import { useMemo } from "react";
import { cn, formatUsd } from "@/lib/utils";

function formatTxTime(timestamp: string): string {
  const d = new Date(timestamp);
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

const CHAIN_NAMES: Record<number, string> = {
  42161: "Arbitrum",
  8453: "Base",
  10: "Optimism",
};

const CHAIN_EXPLORERS: Record<number, string> = {
  42161: "https://arbiscan.io/tx/",
  8453: "https://basescan.org/tx/",
  10: "https://optimistic.etherscan.io/tx/",
};

// Well-known token addresses → symbol (lowercase keys for lookup)
const TOKEN_SYMBOLS: Record<string, string> = {
  "0xaf88d065e77c8cc2239327c5edb3a432268e5831": "USDC",
  "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8": "USDC.e",
  "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9": "USDT",
  "0x82af49447d8a07e3bd95bd0d56f35241523fbab1": "WETH",
  "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": "USDC",
  "0x4200000000000000000000000000000000000006": "WETH",
  "0x0b2c639c533813f4aa9d7837caf62653d097ff85": "USDC",
  "0x7f5c764cbc14f9669b88837ca1490cca17c31607": "USDC.e",
  "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58": "USDT",
  "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1": "DAI",
};

function resolveTokenName(token: string): string {
  if (!token.startsWith("0x") || token.length !== 42) return token;
  return TOKEN_SYMBOLS[token.toLowerCase()] ?? `${token.slice(0, 6)}...${token.slice(-4)}`;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#ffd700",
  confirmed: "#22c55e",
  failed: "#e63946",
  bridging: "#4a9eff",
};

const TYPE_COLORS: Record<string, string> = {
  swap: "bg-crimson/20 text-crimson border-crimson/30",
  bridge: "bg-phase-research/20 text-phase-research border-phase-research/30",
  deposit: "bg-status-correct/20 text-status-correct border-status-correct/30",
  withdraw: "bg-gold/20 text-gold border-gold/30",
  approve: "bg-text-muted/20 text-text-muted border-text-muted/30",
};

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

interface TransactionHistoryProps {
  transactions: Transaction[];
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const sorted = useMemo(
    () =>
      [...transactions].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    [transactions]
  );

  if (sorted.length === 0) {
    return (
      <div className="border-2 border-dashed border-crimson/20 bg-surface/60 p-6 text-center text-sm text-text-muted font-bold">
        No transactions yet
      </div>
    );
  }

  return (
    <div className="border-2 border-border bg-surface/60">
      <div className="border-b-2 border-crimson/30 px-4 py-3 p5-stripes">
        <h3
          className="text-xs font-black uppercase tracking-[0.2em] text-crimson"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Transaction History
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-border text-left text-[10px] uppercase tracking-wider text-text-muted font-bold">
              <th className="px-4 py-2.5">Time</th>
              <th className="px-4 py-2.5">Type</th>
              <th className="px-4 py-2.5">Route</th>
              <th className="px-4 py-2.5">Chains</th>
              <th className="px-4 py-2.5 text-right">Value</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Explorer</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((tx, i) => {
              const fromChain =
                CHAIN_NAMES[tx.fromChainId] ?? `${tx.fromChainId}`;
              const toChain =
                CHAIN_NAMES[tx.toChainId] ?? `${tx.toChainId}`;
              const statusColor = STATUS_COLORS[tx.status] ?? "#6b7280";
              const typeClass =
                TYPE_COLORS[tx.type] ?? TYPE_COLORS.approve;

              const explorerUrl = tx.txHash
                ? CHAIN_EXPLORERS[tx.fromChainId]
                  ? `${CHAIN_EXPLORERS[tx.fromChainId]}${tx.txHash}`
                  : null
                : null;

              // Only show LI.FI explorer for bridge/swap txs (vault deposits/withdraws are direct)
              const isLifiTx = tx.type === "bridge" || tx.type === "swap";
              const lifiUrl = tx.txHash && isLifiTx
                ? `https://explorer.li.fi/tx/${tx.txHash}`
                : null;

              return (
                <tr
                  key={tx.id}
                  className={cn(
                    "border-b border-border/50 transition-colors hover:bg-crimson/5 p5-shimmer",
                    i === sorted.length - 1 && "border-b-0"
                  )}
                >
                  {/* Time */}
                  <td className="whitespace-nowrap px-4 py-2.5 text-text-muted" title={tx.timestamp}>
                    {formatTxTime(tx.timestamp)}
                  </td>

                  {/* Type badge */}
                  <td className="px-4 py-2.5">
                    <span
                      className={cn(
                        "inline-block border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        typeClass
                      )}
                    >
                      {tx.type}
                    </span>
                  </td>

                  {/* Route */}
                  <td className="whitespace-nowrap px-4 py-2.5 text-text">
                    <span className="font-medium">{resolveTokenName(tx.fromToken)}</span>
                    <span className="mx-1.5 text-text-muted">&rarr;</span>
                    <span className="font-medium">{resolveTokenName(tx.toToken)}</span>
                  </td>

                  {/* Chains */}
                  <td className="whitespace-nowrap px-4 py-2.5 text-text-muted">
                    {fromChain}
                    {tx.fromChainId !== tx.toChainId && (
                      <>
                        <span className="mx-1">&rarr;</span>
                        {toChain}
                      </>
                    )}
                  </td>

                  {/* Value */}
                  <td className="whitespace-nowrap px-4 py-2.5 text-right font-medium text-text">
                    {formatUsd(tx.valueUsd)}
                  </td>

                  {/* Status badge */}
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="inline-block h-2 w-2"
                        style={{ backgroundColor: statusColor }}
                      />
                      <span
                        className="text-xs capitalize"
                        style={{ color: statusColor }}
                      >
                        {tx.status}
                      </span>
                    </span>
                  </td>

                  {/* Explorer links */}
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <span className="flex items-center gap-2">
                      {lifiUrl && (
                        <a
                          href={lifiUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-crimson hover:text-crimson-glow hover:underline font-bold"
                        >
                          LI.FI
                        </a>
                      )}
                      {explorerUrl && (
                        <a
                          href={explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-gold hover:text-gold/80 hover:underline font-bold"
                        >
                          Chain
                        </a>
                      )}
                      {!lifiUrl && !explorerUrl && (
                        <span className="text-xs text-text-muted">--</span>
                      )}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
