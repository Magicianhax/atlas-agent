"use client";

import { useState, useCallback } from "react";

// ---------------------------------------------------------------------------
// Token Logo — official images via CoinGecko CDN with circular display
// ---------------------------------------------------------------------------

interface TokenLogoProps {
  symbol: string;
  size?: number;
  className?: string;
}

// -- Known token image URLs -------------------------------------------------

const TOKEN_IMAGES: Record<string, string> = {
  ETH: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  WETH: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  USDC: "https://assets.coingecko.com/coins/images/6319/small/usdc.png",
  "USDC.e": "https://assets.coingecko.com/coins/images/6319/small/usdc.png",
  USDT: "https://assets.coingecko.com/coins/images/325/small/Tether.png",
  DAI: "https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png",
  ARB: "https://assets.coingecko.com/coins/images/16547/small/arb.jpg",
  BRETT: "https://assets.coingecko.com/coins/images/35529/small/1000050750.png",
  OP: "https://assets.coingecko.com/coins/images/25244/small/Optimism.png",
  FRAX: "https://assets.coingecko.com/coins/images/13422/small/FRAX_icon.png",
};

// -- Deterministic color from symbol string ---------------------------------

function symbolToColor(symbol: string): string {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 45%)`;
}

// -- Circular fallback with first letter ------------------------------------

function TokenFallback({
  symbol,
  size,
  className,
}: {
  symbol: string;
  size: number;
  className?: string;
}) {
  const color = symbolToColor(symbol);
  const letter = symbol.charAt(0).toUpperCase();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
    >
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

// -- Exported component -----------------------------------------------------

export function TokenLogo({ symbol, size = 20, className }: TokenLogoProps) {
  const [failed, setFailed] = useState(false);

  const handleError = useCallback(() => {
    setFailed(true);
  }, []);

  // Normalize: exact match → uppercase → moo-vault underlying token
  let imageUrl = TOKEN_IMAGES[symbol] ?? TOKEN_IMAGES[symbol.toUpperCase()];

  // Beefy moo-vault tokens (mooEulerArbUSDC, mooCompoundBaseUSDC, etc.) → show underlying
  if (!imageUrl && symbol.toLowerCase().startsWith("moo")) {
    if (symbol.toLowerCase().includes("usdc")) imageUrl = TOKEN_IMAGES.USDC;
    else if (symbol.toLowerCase().includes("usdt")) imageUrl = TOKEN_IMAGES.USDT;
    else if (symbol.toLowerCase().includes("eth")) imageUrl = TOKEN_IMAGES.ETH;
    else if (symbol.toLowerCase().includes("dai")) imageUrl = TOKEN_IMAGES.DAI;
  }

  if (!imageUrl || failed) {
    return <TokenFallback symbol={symbol} size={size} className={className} />;
  }

  return (
    <img
      src={imageUrl}
      alt={`${symbol} logo`}
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
