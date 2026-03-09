"use client";

import { useState, useEffect, useCallback } from "react";
import { ChainLogo } from "@/components/logos";

interface ChainInfo {
  chainId: number;
  name: string;
  defillamaName: string;
  color: string;
  abbrev: string;
}

const CHAINS: ChainInfo[] = [
  { chainId: 42161, name: "Arbitrum", defillamaName: "Arbitrum", color: "#2d374b", abbrev: "ARB" },
  { chainId: 8453, name: "Base", defillamaName: "Base", color: "#0052ff", abbrev: "BASE" },
  { chainId: 10, name: "Optimism", defillamaName: "OP Mainnet", color: "#ff0420", abbrev: "OP" },
];

interface ChainData {
  tvl: string;
  ethPrice: string;
}

function formatTvl(tvl: number): string {
  if (tvl >= 1e9) return `$${(tvl / 1e9).toFixed(1)}B`;
  if (tvl >= 1e6) return `$${(tvl / 1e6).toFixed(0)}M`;
  return `$${tvl.toFixed(0)}`;
}

function ChainCard({ chain, data }: { chain: ChainInfo; data?: ChainData }) {
  return (
    <div
      className="border-2 border-border bg-surface p-3 p5-card p5-shimmer transition-colors hover:border-crimson/50"
      style={{ borderLeftWidth: "4px", borderLeftColor: chain.color }}
    >
      <div className="flex items-center gap-2 mb-2">
        <ChainLogo chainId={chain.chainId} size={18} />
        <span className="text-xs font-black text-text uppercase tracking-wider">{chain.name}</span>
        <span className="ml-auto text-[10px] text-text-muted font-bold tabular-nums">{chain.chainId}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="block text-[9px] uppercase tracking-[0.15em] text-text-muted font-bold mb-0.5">TVL</span>
          <span className="text-xs font-black text-text tabular-nums">
            {data?.tvl ?? "--"}
          </span>
        </div>
        <div>
          <span className="block text-[9px] uppercase tracking-[0.15em] text-text-muted font-bold mb-0.5">ETH</span>
          <span className="text-xs font-black text-gold tabular-nums">
            {data?.ethPrice ?? "--"}
          </span>
        </div>
      </div>
    </div>
  );
}

export function MarketSidebar() {
  const [chainData, setChainData] = useState<Record<number, ChainData>>({});
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchMarketData = useCallback(async () => {
    try {
      const [chainsRes, priceRes] = await Promise.all([
        fetch("https://api.llama.fi/v2/chains"),
        fetch("https://coins.llama.fi/prices/current/coingecko:ethereum"),
      ]);

      if (!chainsRes.ok || !priceRes.ok) return;

      const chains = await chainsRes.json();
      const prices = await priceRes.json();
      const ethPrice = prices?.coins?.["coingecko:ethereum"]?.price;
      const ethStr = ethPrice ? `$${Math.round(ethPrice).toLocaleString()}` : "--";

      const newData: Record<number, ChainData> = {};
      for (const chain of CHAINS) {
        const match = chains.find((c: { name: string }) => c.name === chain.defillamaName);
        newData[chain.chainId] = {
          tvl: match ? formatTvl(match.tvl) : "--",
          ethPrice: ethStr,
        };
      }

      setChainData(newData);
      setLastUpdate(new Date());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 60_000);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  const minutesAgo = lastUpdate
    ? Math.floor((Date.now() - lastUpdate.getTime()) / 60_000)
    : null;

  return (
    <aside className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full bg-crimson animate-pulse-glow" />
          <span className="relative inline-flex h-2.5 w-2.5 bg-crimson" />
        </span>
        <h2
          className="text-sm font-black uppercase tracking-[0.2em] text-crimson"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Market Intel
        </h2>
        <span className="ml-auto text-[10px] text-gold font-bold tracking-wider">
          LIVE
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {CHAINS.map((chain) => (
          <ChainCard key={chain.chainId} chain={chain} data={chainData[chain.chainId]} />
        ))}
      </div>

      <div className="border-2 border-dashed border-crimson/20 bg-surface/40 px-3 py-2 text-center">
        <span className="text-[10px] text-text-muted font-bold">
          Data:{" "}
          <span className="text-text tabular-nums">
            {minutesAgo !== null ? `${minutesAgo}m ago` : "loading..."}
          </span>
        </span>
      </div>
    </aside>
  );
}
