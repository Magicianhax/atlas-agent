"use client";

import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Variant =
  | "no-data"
  | "no-predictions"
  | "no-transactions"
  | "no-holdings"
  | "no-positions";

interface EmptyStateProps {
  variant: Variant;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

// ---------------------------------------------------------------------------
// Default messages per variant
// ---------------------------------------------------------------------------

const DEFAULT_MESSAGES: Record<Variant, string> = {
  "no-data": "No data available",
  "no-predictions": "No predictions found",
  "no-transactions": "No transactions recorded",
  "no-holdings": "No holdings detected",
  "no-positions": "No open positions",
};

// ---------------------------------------------------------------------------
// SVG Illustrations — all angular, P5-styled, 120x120
// ---------------------------------------------------------------------------

function NoDataIllustration() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Crosshair outer frame */}
      <path
        d="M20 20 L100 20 L100 100 L20 100 Z"
        stroke="#3a3a3a"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Crosshair lines */}
      <line x1="60" y1="25" x2="60" y2="50" stroke="#e63946" strokeWidth="1.5" />
      <line x1="60" y1="70" x2="60" y2="95" stroke="#e63946" strokeWidth="1.5" />
      <line x1="25" y1="60" x2="50" y2="60" stroke="#e63946" strokeWidth="1.5" />
      <line x1="70" y1="60" x2="95" y2="60" stroke="#e63946" strokeWidth="1.5" />
      {/* Target diamonds at crosshair ends */}
      <path d="M60 22 L63 25 L60 28 L57 25 Z" fill="#e63946" />
      <path d="M60 92 L63 95 L60 98 L57 95 Z" fill="#e63946" />
      <path d="M22 60 L25 57 L28 60 L25 63 Z" fill="#e63946" />
      <path d="M92 60 L95 57 L98 60 L95 63 Z" fill="#e63946" />
      {/* Inner frame */}
      <path
        d="M42 42 L78 42 L78 78 L42 78 Z"
        stroke="#3a3a3a"
        strokeWidth="1"
        fill="none"
        strokeDasharray="4 3"
      />
      {/* Question mark */}
      <text
        x="60"
        y="67"
        textAnchor="middle"
        fill="#ffd700"
        fontSize="24"
        fontFamily="var(--font-heading)"
        fontWeight="bold"
      >
        ?
      </text>
      {/* Corner accents */}
      <path d="M20 20 L30 20 L20 30 Z" fill="#e63946" opacity="0.3" />
      <path d="M100 100 L90 100 L100 90 Z" fill="#e63946" opacity="0.3" />
    </svg>
  );
}

function NoPredictionsIllustration() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Crystal ball base — angular trapezoid */}
      <path d="M38 95 L82 95 L78 88 L42 88 Z" fill="#3a3a3a" />
      <path d="M42 88 L78 88 L75 85 L45 85 Z" fill="#2a2a2a" />
      {/* Crystal ball body — angular octagon-ish */}
      <path
        d="M45 85 L40 70 L40 48 L48 32 L72 32 L80 48 L80 70 L75 85 Z"
        stroke="#e63946"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Crack lines across the ball */}
      <path
        d="M55 32 L52 45 L58 52 L50 65 L54 75"
        stroke="#ffd700"
        strokeWidth="1"
        fill="none"
        opacity="0.7"
      />
      <path
        d="M68 38 L72 50 L65 58 L70 68"
        stroke="#ffd700"
        strokeWidth="1"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M48 55 L55 58 L53 65"
        stroke="#ffd700"
        strokeWidth="0.8"
        fill="none"
        opacity="0.4"
      />
      {/* Highlight shard */}
      <path d="M45 42 L48 38 L50 44 L46 46 Z" fill="#e63946" opacity="0.15" />
      {/* Small stars around it */}
      <path d="M28 30 L30 26 L32 30 L30 34 Z" fill="#ffd700" opacity="0.3" />
      <path d="M90 25 L92 22 L94 25 L92 28 Z" fill="#ffd700" opacity="0.2" />
      <path d="M22 70 L24 67 L26 70 L24 73 Z" fill="#e63946" opacity="0.2" />
      {/* Base accent line */}
      <line x1="35" y1="95" x2="85" y2="95" stroke="#e63946" strokeWidth="1" />
    </svg>
  );
}

function NoTransactionsIllustration() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Vault body */}
      <path
        d="M25 25 L95 25 L95 100 L25 100 Z"
        stroke="#3a3a3a"
        strokeWidth="2"
        fill="#1a1a1a"
      />
      {/* Vault door — slightly open (shifted right) */}
      <path
        d="M30 30 L85 28 L87 95 L30 95 Z"
        stroke="#4a4a4a"
        strokeWidth="1.5"
        fill="#141414"
      />
      {/* Door frame accent */}
      <path
        d="M30 30 L30 95"
        stroke="#e63946"
        strokeWidth="2"
      />
      {/* Vault handle — angular wheel */}
      <path
        d="M55 62 L62 55 L69 62 L62 69 Z"
        stroke="#ffd700"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M62 52 L62 72"
        stroke="#ffd700"
        strokeWidth="1"
        opacity="0.5"
      />
      <path
        d="M52 62 L72 62"
        stroke="#ffd700"
        strokeWidth="1"
        opacity="0.5"
      />
      {/* Handle center dot */}
      <path d="M60 60 L64 60 L64 64 L60 64 Z" fill="#ffd700" opacity="0.6" />
      {/* Door ajar gap — dark interior visible */}
      <path
        d="M85 28 L95 25 L95 100 L87 95 Z"
        fill="#0a0a0a"
        stroke="#3a3a3a"
        strokeWidth="0.5"
      />
      {/* Lock bolts */}
      <path d="M32 42 L38 42 L38 46 L32 46 Z" fill="#3a3a3a" />
      <path d="M32 72 L38 72 L38 76 L32 76 Z" fill="#3a3a3a" />
      {/* Hinges on left */}
      <line x1="25" y1="40" x2="30" y2="40" stroke="#4a4a4a" strokeWidth="2" />
      <line x1="25" y1="85" x2="30" y2="85" stroke="#4a4a4a" strokeWidth="2" />
      {/* Floor shadow */}
      <path d="M25 100 L95 100 L100 105 L20 105 Z" fill="#0d0d0d" opacity="0.5" />
    </svg>
  );
}

function NoHoldingsIllustration() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Wallet body — angular bifold shape */}
      <path
        d="M20 35 L90 30 L95 90 L25 95 Z"
        stroke="#3a3a3a"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Wallet flap */}
      <path
        d="M20 35 L90 30 L88 50 L22 55 Z"
        stroke="#4a4a4a"
        strokeWidth="1"
        fill="#1a1a1a"
      />
      {/* Flap fold line */}
      <line x1="22" y1="55" x2="88" y2="50" stroke="#e63946" strokeWidth="1" opacity="0.6" />
      {/* Wallet clasp — diamond */}
      <path d="M55 40 L60 35 L65 40 L60 45 Z" fill="#ffd700" opacity="0.5" />
      {/* Interior lines suggesting emptiness */}
      <line
        x1="35"
        y1="65"
        x2="80"
        y2="63"
        stroke="#2a2a2a"
        strokeWidth="1"
        strokeDasharray="6 4"
      />
      <line
        x1="36"
        y1="75"
        x2="78"
        y2="73"
        stroke="#2a2a2a"
        strokeWidth="1"
        strokeDasharray="6 4"
      />
      <line
        x1="37"
        y1="85"
        x2="76"
        y2="83"
        stroke="#2a2a2a"
        strokeWidth="1"
        strokeDasharray="6 4"
      />
      {/* Card slot outline */}
      <path
        d="M68 58 L86 57 L87 78 L69 79 Z"
        stroke="#3a3a3a"
        strokeWidth="0.8"
        fill="none"
        strokeDasharray="3 3"
      />
      {/* Empty indicator — small X */}
      <line x1="54" y1="70" x2="62" y2="78" stroke="#e63946" strokeWidth="1" opacity="0.4" />
      <line x1="62" y1="70" x2="54" y2="78" stroke="#e63946" strokeWidth="1" opacity="0.4" />
      {/* Corner accent */}
      <path d="M20 35 L28 35 L20 43 Z" fill="#e63946" opacity="0.2" />
    </svg>
  );
}

function NoPositionsIllustration() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Grid outer frame */}
      <path
        d="M20 20 L100 20 L100 100 L20 100 Z"
        stroke="#3a3a3a"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Vertical grid lines */}
      <line x1="46.67" y1="20" x2="46.67" y2="100" stroke="#2a2a2a" strokeWidth="0.8" />
      <line x1="73.33" y1="20" x2="73.33" y2="100" stroke="#2a2a2a" strokeWidth="0.8" />
      {/* Horizontal grid lines */}
      <line x1="20" y1="46.67" x2="100" y2="46.67" stroke="#2a2a2a" strokeWidth="0.8" />
      <line x1="20" y1="73.33" x2="100" y2="73.33" stroke="#2a2a2a" strokeWidth="0.8" />
      {/* Empty cell indicators — small dashes */}
      <line x1="30" y1="33" x2="38" y2="33" stroke="#3a3a3a" strokeWidth="1" />
      <line x1="56" y1="33" x2="64" y2="33" stroke="#3a3a3a" strokeWidth="1" />
      <line x1="83" y1="33" x2="91" y2="33" stroke="#3a3a3a" strokeWidth="1" />
      <line x1="30" y1="60" x2="38" y2="60" stroke="#3a3a3a" strokeWidth="1" />
      <line x1="56" y1="60" x2="64" y2="60" stroke="#3a3a3a" strokeWidth="1" />
      <line x1="83" y1="60" x2="91" y2="60" stroke="#3a3a3a" strokeWidth="1" />
      <line x1="30" y1="87" x2="38" y2="87" stroke="#3a3a3a" strokeWidth="1" />
      <line x1="56" y1="87" x2="64" y2="87" stroke="#3a3a3a" strokeWidth="1" />
      <line x1="83" y1="87" x2="91" y2="87" stroke="#3a3a3a" strokeWidth="1" />
      {/* Crimson accent on header row */}
      <line x1="20" y1="20" x2="100" y2="20" stroke="#e63946" strokeWidth="2" />
      {/* Gold accent column header markers */}
      <path d="M33 18 L35 15 L37 18 Z" fill="#ffd700" opacity="0.4" />
      <path d="M59 18 L61 15 L63 18 Z" fill="#ffd700" opacity="0.4" />
      <path d="M85 18 L87 15 L89 18 Z" fill="#ffd700" opacity="0.4" />
      {/* Diagonal "empty" slash across center cell */}
      <line x1="48" y1="48" x2="72" y2="72" stroke="#e63946" strokeWidth="1" opacity="0.25" />
      <line x1="72" y1="48" x2="48" y2="72" stroke="#e63946" strokeWidth="1" opacity="0.25" />
      {/* Corner accents */}
      <path d="M20 20 L26 20 L20 26 Z" fill="#e63946" opacity="0.3" />
      <path d="M100 100 L94 100 L100 94 Z" fill="#e63946" opacity="0.3" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Illustration map
// ---------------------------------------------------------------------------

const ILLUSTRATIONS: Record<Variant, () => JSX.Element> = {
  "no-data": NoDataIllustration,
  "no-predictions": NoPredictionsIllustration,
  "no-transactions": NoTransactionsIllustration,
  "no-holdings": NoHoldingsIllustration,
  "no-positions": NoPositionsIllustration,
};

// ---------------------------------------------------------------------------
// EmptyState component
// ---------------------------------------------------------------------------

export function EmptyState({
  variant,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const Illustration = ILLUSTRATIONS[variant];
  const displayMessage = message ?? DEFAULT_MESSAGES[variant];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 gap-5">
      {/* Illustration container with subtle angular frame */}
      <div
        className="relative"
        style={{ transform: "skewX(-3deg)" }}
      >
        {/* Top accent line */}
        <div className="absolute -top-2 left-0 right-0 h-[1px] bg-crimson opacity-30" />

        <div style={{ transform: "skewX(3deg)" }}>
          <Illustration />
        </div>

        {/* Bottom accent line */}
        <div className="absolute -bottom-2 left-0 right-0 h-[1px] bg-crimson opacity-30" />
      </div>

      {/* Message */}
      <p
        className="text-text-muted text-sm tracking-wide uppercase"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {displayMessage}
      </p>

      {/* Optional action button */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className={cn(
            "px-5 py-2 text-xs uppercase tracking-widest font-bold",
            "bg-crimson text-white border-none cursor-pointer",
            "transition-all duration-150",
            "hover:bg-crimson-glow hover:translate-y-[-1px]",
            "active:translate-y-0",
          )}
          style={{
            transform: "skewX(-3deg)",
            fontFamily: "var(--font-heading)",
            clipPath: "polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)",
          }}
        >
          <span style={{ display: "inline-block", transform: "skewX(3deg)" }}>
            {actionLabel}
          </span>
        </button>
      )}
    </div>
  );
}
