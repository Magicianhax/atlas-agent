"use client";

import { useState, useCallback } from "react";

// ---------------------------------------------------------------------------
// Protocol Logo — official logos via DefiLlama CDN with fallback
// ---------------------------------------------------------------------------

interface ProtocolLogoProps {
  protocol: string;
  size?: number;
  className?: string;
}

// Protocol name → DefiLlama slug
const PROTOCOL_SLUGS: Record<string, string> = {
  beefy: "beefy",
  morpho: "morpho",
  compound: "compound-v3",
  aave: "aave-v3",
  pendle: "pendle",
  "li.fi": "li.fi",
  lifi: "li.fi",
  jumper: "jumper-exchange",
  aerodrome: "aerodrome",
  silo: "silo",
  euler: "euler",
  ionic: "ionic-protocol",
  gauntlet: "morpho",    // Gauntlet vaults run through Morpho
  uniswap: "uniswap-v3",
  curve: "curve-dex",
  yearn: "yearn-finance",
  convex: "convex-finance",
  balancer: "balancer-v2",
  stargate: "stargate",
  gmx: "gmx",
};

// Resolve compound protocol names like "Beefy/Euler" or "Beefy/Morpho Gauntlet"
// Returns the slug for the first recognized protocol part
function resolveSlug(protocol: string): string | undefined {
  const key = protocol.toLowerCase().trim();

  // Exact match first
  if (PROTOCOL_SLUGS[key]) return PROTOCOL_SLUGS[key];

  // Try splitting on "/" (e.g., "Beefy/Euler" → try "beefy", then "euler")
  const parts = key.split("/").map((s) => s.trim());
  for (const part of parts) {
    if (PROTOCOL_SLUGS[part]) return PROTOCOL_SLUGS[part];
    // Try first word of multi-word parts (e.g., "morpho gauntlet" → "morpho")
    const firstWord = part.split(/\s+/)[0];
    if (PROTOCOL_SLUGS[firstWord]) return PROTOCOL_SLUGS[firstWord];
  }

  return undefined;
}

// Brand colors for fallback
const PROTOCOL_COLORS: Record<string, string> = {
  beefy: "#4CAF50",
  morpho: "#2470FF",
  compound: "#00D395",
  aave: "#B6509E",
  pendle: "#26A69A",
  "li.fi": "#8B5CF6",
  lifi: "#8B5CF6",
  jumper: "#F7C2FF",
  aerodrome: "#3B82F6",
  silo: "#9CA3AF",
  euler: "#E84142",
  ionic: "#4F46E5",
};

function resolveFallbackColor(protocol: string): string {
  const key = protocol.toLowerCase().trim();
  if (PROTOCOL_COLORS[key]) return PROTOCOL_COLORS[key];
  // Try first part of compound name
  const firstPart = key.split("/")[0].trim().split(/\s+/)[0];
  return PROTOCOL_COLORS[firstPart] ?? "#6b7280";
}

function ProtocolFallback({ protocol, size, className }: { protocol: string; size: number; className?: string }) {
  const color = resolveFallbackColor(protocol);
  const letter = protocol.charAt(0).toUpperCase();

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect width="40" height="40" fill={color} rx="4" />
      <text
        x="20"
        y="26"
        textAnchor="middle"
        fill="white"
        fontSize="18"
        fontWeight="bold"
        fontFamily="monospace"
      >
        {letter}
      </text>
    </svg>
  );
}

export function ProtocolLogo({ protocol, size = 20, className }: ProtocolLogoProps) {
  const [failed, setFailed] = useState(false);
  const handleError = useCallback(() => setFailed(true), []);

  const slug = resolveSlug(protocol);

  if (!slug || failed) {
    return <ProtocolFallback protocol={protocol} size={size} className={className} />;
  }

  return (
    <img
      src={`https://icons.llamao.fi/icons/protocols/${slug}?w=${size * 2}&h=${size * 2}`}
      alt={`${protocol} protocol`}
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
