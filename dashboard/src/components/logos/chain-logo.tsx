"use client";

import { useState, useCallback } from "react";

// ---------------------------------------------------------------------------
// Chain Logo — official logos via DefiLlama CDN with inline SVG fallback
// ---------------------------------------------------------------------------

interface ChainLogoProps {
  chainId: number;
  size?: number;
  className?: string;
}

// Chain ID → DefiLlama slug
const CHAIN_SLUGS: Record<number, string> = {
  42161: "arbitrum",
  8453: "base",
  10: "optimism",
  1: "ethereum",
  137: "polygon",
  56: "bsc",
  43114: "avalanche",
  250: "fantom",
};

// Chain colors for fallback
const CHAIN_COLORS: Record<number, string> = {
  42161: "#2d374b",
  8453: "#0052FF",
  10: "#FF0420",
  1: "#627EEA",
  137: "#8247E5",
  56: "#F3BA2F",
};

const CHAIN_ABBREVS: Record<number, string> = {
  42161: "A",
  8453: "B",
  10: "OP",
  1: "E",
  137: "P",
  56: "B",
};

function ChainFallback({ chainId, size, className }: { chainId: number; size: number; className?: string }) {
  const color = CHAIN_COLORS[chainId] ?? "#6b7280";
  const letter = CHAIN_ABBREVS[chainId] ?? "?";

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <circle cx="20" cy="20" r="20" fill={color} />
      <text
        x="20"
        y="26"
        textAnchor="middle"
        fill="white"
        fontSize="16"
        fontWeight="bold"
        fontFamily="monospace"
      >
        {letter}
      </text>
    </svg>
  );
}

export function ChainLogo({ chainId, size = 20, className }: ChainLogoProps) {
  const [failed, setFailed] = useState(false);
  const handleError = useCallback(() => setFailed(true), []);

  const slug = CHAIN_SLUGS[chainId];

  if (!slug || failed) {
    return <ChainFallback chainId={chainId} size={size} className={className} />;
  }

  return (
    <img
      src={`https://icons.llamao.fi/icons/chains/rsz_${slug}?w=${size * 2}&h=${size * 2}`}
      alt={`${slug} chain`}
      width={size}
      height={size}
      onError={handleError}
      className={className}
      style={{
        display: "inline-block",
        borderRadius: "50%",
      }}
    />
  );
}
