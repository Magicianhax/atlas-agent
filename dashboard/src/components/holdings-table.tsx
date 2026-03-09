"use client";

import { useMemo } from "react";
import { cn, formatUsd } from "@/lib/utils";
import { ChainLogo, TokenLogo, ProtocolLogo } from "@/components/logos";

const CHAIN_COLORS: Record<number, string> = {
  42161: "#2d374b",
  8453: "#0052ff",
  10: "#ff0420",
};

const CHAIN_NAMES: Record<number, string> = {
  42161: "Arbitrum",
  8453: "Base",
  10: "Optimism",
};

// Well-known token addresses → symbol (lowercase keys for lookup)
const TOKEN_SYMBOLS: Record<string, string> = {
  "0xaf88d065e77c8cc2239327c5edb3a432268e5831": "USDC",   // Arbitrum USDC
  "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8": "USDC.e", // Arbitrum USDC.e
  "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9": "USDT",   // Arbitrum USDT
  "0x82af49447d8a07e3bd95bd0d56f35241523fbab1": "WETH",   // Arbitrum WETH
  "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": "USDC",   // Base USDC
  "0x4200000000000000000000000000000000000006": "WETH",   // Base/OP WETH
  "0x0b2c639c533813f4aa9d7837caf62653d097ff85": "USDC",   // Optimism USDC
  "0x7f5c764cbc14f9669b88837ca1490cca17c31607": "USDC.e", // Optimism USDC.e
  "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58": "USDT",   // Optimism USDT
  "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1": "DAI",    // Arbitrum/OP DAI
};

function resolveTokenName(token: string): string {
  // Already a readable name (not a hex address)
  if (!token.startsWith("0x") || token.length !== 42) return token;
  return TOKEN_SYMBOLS[token.toLowerCase()] ?? `${token.slice(0, 6)}...${token.slice(-4)}`;
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

const TYPE_LABELS: Record<string, { text: string; color: string }> = {
  token: { text: "TOKEN", color: "text-text-muted" },
  vault: { text: "VAULT", color: "text-status-correct" },
  lp: { text: "LP", color: "text-phase-research" },
  pt: { text: "PT", color: "text-crimson" },
  yt: { text: "YT", color: "text-gold" },
};

interface HoldingsTableProps {
  holdings: Holding[];
}

export function HoldingsTable({ holdings }: HoldingsTableProps) {
  const sorted = useMemo(
    () => [...holdings].sort((a, b) => b.valueUsd - a.valueUsd),
    [holdings]
  );

  if (sorted.length === 0) {
    return (
      <div className="border-2 border-dashed border-crimson/20 bg-surface/60 p-6 text-center text-sm text-text-muted font-bold">
        No holdings to display
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
          Current Holdings
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-border text-left text-[10px] uppercase tracking-wider text-text-muted font-bold">
              <th className="px-4 py-2.5">Chain</th>
              <th className="px-4 py-2.5">Token</th>
              <th className="px-4 py-2.5">Type</th>
              <th className="px-4 py-2.5 text-right">Amount</th>
              <th className="px-4 py-2.5 text-right">Value (USD)</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((h, i) => {
              const chainName =
                CHAIN_NAMES[h.chainId] ?? `Chain ${h.chainId}`;
              const chainColor = CHAIN_COLORS[h.chainId] ?? "#6b7280";

              return (
                <tr
                  key={`${h.chainId}-${h.tokenAddress}-${i}`}
                  className={cn(
                    "border-b border-border/50 transition-colors hover:bg-crimson/5 p5-shimmer",
                    i === sorted.length - 1 && "border-b-0"
                  )}
                >
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-2">
                      <ChainLogo chainId={h.chainId} size={18} />
                      <span className="text-text-muted">{chainName}</span>
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-medium text-text">
                    <span className="flex items-center gap-2">
                      <TokenLogo symbol={resolveTokenName(h.token)} size={18} />
                      <span>{resolveTokenName(h.token)}</span>
                      {h.protocol && (
                        <ProtocolLogo protocol={h.protocol} size={16} className="opacity-60" />
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {(() => {
                      const t = TYPE_LABELS[h.type ?? "token"] ?? TYPE_LABELS.token;
                      return (
                        <span className={cn("text-xs font-bold", t.color)}>
                          {t.text}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-2.5 text-right text-text-muted">
                    {Number(h.amount).toLocaleString("en-US", {
                      maximumFractionDigits: 6,
                    })}
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium text-text">
                    {formatUsd(h.valueUsd)}
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
