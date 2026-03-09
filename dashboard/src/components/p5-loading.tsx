"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

// ---------------------------------------------------------------------------
// P5Loading — Persona 5 themed loading with mascot + pipeline animation
// ---------------------------------------------------------------------------

interface P5LoadingProps {
  height?: string;
  text?: string;
  variant?: "full" | "card" | "inline";
}

const PIPELINE = ["RESEARCH", "ORIENT", "THESIS", "PREDICT", "EXECUTE", "MONITOR"];

const PHASE_COLORS: Record<string, string> = {
  RESEARCH: "#4a9eff",
  ORIENT: "#e63946",
  THESIS: "#ffd700",
  PREDICT: "#22c55e",
  EXECUTE: "#ff4757",
  MONITOR: "#8a8578",
};

export function P5Loading({ height = "h-40", text = "LOADING", variant = "card" }: P5LoadingProps) {
  if (variant === "inline") {
    return (
      <div className={cn("flex items-center justify-center gap-2", height)}>
        <div className="p5-spinner" />
        <span className="text-xs font-bold uppercase tracking-wider text-text-muted p5-text-flicker">
          {text}
        </span>
        <style jsx>{`
          .p5-spinner {
            width: 16px;
            height: 16px;
            border: 2px solid transparent;
            border-top-color: #e63946;
            border-right-color: #ffd700;
            animation: p5-spin 0.8s linear infinite;
          }
          @keyframes p5-spin {
            to { transform: rotate(360deg); }
          }
          .p5-text-flicker {
            animation: p5-flicker 2s ease-in-out infinite;
          }
          @keyframes p5-flicker {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  const isFull = variant === "full";

  return (
    <div
      className={cn(
        "relative overflow-hidden border-2 border-border bg-surface/80",
        isFull ? "min-h-[60vh]" : height,
      )}
    >
      {/* Animated diagonal stripes background */}
      <div className="p5-bg-stripes absolute inset-0 pointer-events-none" />

      {/* Scanning horizontal line */}
      <div className="p5-scanline absolute left-0 right-0 h-px pointer-events-none" />

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
        {/* Mascot with pulse ring */}
        {isFull && (
          <div className="relative p5-mascot-enter">
            <div className="p5-pulse-ring absolute -inset-3 border-2 border-crimson/30 rounded-sm" />
            <div className="p5-pulse-ring-delayed absolute -inset-5 border border-crimson/15 rounded-sm" />
            <div className="relative h-16 w-16 border-2 border-crimson/50 rounded-sm overflow-hidden bg-surface">
              <Image
                src="/assets/mascot-avatar.png"
                alt="ATLAS"
                width={64}
                height={64}
                className="object-cover"
              />
            </div>
          </div>
        )}

        {/* ATLAS text */}
        <div className="p5-title-enter">
          <span
            className="text-xl font-black tracking-[0.3em] text-crimson p5-text-glow"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {text}
          </span>
        </div>

        {/* Decision pipeline phases animating */}
        <div className="flex items-center gap-1 p5-pipeline-enter">
          {PIPELINE.map((phase, i) => (
            <div
              key={phase}
              className="p5-phase-block"
              style={{
                animationDelay: `${i * 0.3}s`,
                ["--phase-color" as string]: PHASE_COLORS[phase],
              }}
            >
              <span
                className="block px-2 py-1 text-[8px] font-black uppercase tracking-wider"
                style={{
                  transform: "skewX(-3deg)",
                  color: PHASE_COLORS[phase],
                  borderColor: PHASE_COLORS[phase],
                }}
              >
                <span style={{ transform: "skewX(3deg)", display: "inline-block" }}>
                  {phase.slice(0, 3)}
                </span>
              </span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="w-32 h-[3px] bg-border/50 overflow-hidden p5-bar-enter">
          <div className="p5-progress-fill h-full" />
        </div>
      </div>

      {/* Corner brackets */}
      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-crimson/40 pointer-events-none p5-corner-tl" />
      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-crimson/40 pointer-events-none p5-corner-tr" />
      <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-crimson/40 pointer-events-none p5-corner-bl" />
      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-crimson/40 pointer-events-none p5-corner-br" />

      <style jsx>{`
        /* ── Background stripes ── */
        .p5-bg-stripes {
          background-image: repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 12px,
            rgba(230, 57, 70, 0.03) 12px,
            rgba(230, 57, 70, 0.03) 14px
          );
          background-size: 200% 200%;
          animation: stripe-move 3s linear infinite;
        }
        @keyframes stripe-move {
          to { background-position: 200% 200%; }
        }

        /* ── Scan line ── */
        .p5-scanline {
          background: linear-gradient(90deg, transparent 0%, #e63946 30%, #ffd700 50%, #e63946 70%, transparent 100%);
          opacity: 0.3;
          animation: scanline-sweep 2.5s ease-in-out infinite;
        }
        @keyframes scanline-sweep {
          0% { top: -2px; opacity: 0; }
          10% { opacity: 0.3; }
          90% { opacity: 0.3; }
          100% { top: 100%; opacity: 0; }
        }

        /* ── Mascot entrance ── */
        .p5-mascot-enter {
          animation: mascot-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
        }
        @keyframes mascot-pop {
          0% { transform: scale(0) rotate(-10deg); opacity: 0; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }

        /* ── Pulse rings around mascot ── */
        .p5-pulse-ring {
          animation: pulse-ring 2s ease-out infinite;
        }
        .p5-pulse-ring-delayed {
          animation: pulse-ring 2s ease-out 1s infinite;
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(1.3); opacity: 0; }
        }

        /* ── Title entrance ── */
        .p5-title-enter {
          animation: title-slide 0.4s ease-out 0.4s both;
        }
        @keyframes title-slide {
          0% { transform: translateX(-20px) skewX(-8deg); opacity: 0; }
          100% { transform: translateX(0) skewX(0); opacity: 1; }
        }

        /* ── Text glow ── */
        .p5-text-glow {
          animation: text-glow 2s ease-in-out infinite;
        }
        @keyframes text-glow {
          0%, 100% { text-shadow: 0 0 4px rgba(230, 57, 70, 0.3); }
          50% { text-shadow: 0 0 12px rgba(230, 57, 70, 0.6), 0 0 24px rgba(230, 57, 70, 0.2); }
        }

        /* ── Pipeline entrance ── */
        .p5-pipeline-enter {
          animation: pipeline-slide 0.3s ease-out 0.6s both;
        }
        @keyframes pipeline-slide {
          0% { transform: translateY(10px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }

        /* ── Phase blocks light up sequentially ── */
        .p5-phase-block {
          opacity: 0.2;
          animation: phase-pulse 1.8s ease-in-out infinite;
          transition: opacity 0.3s;
        }
        @keyframes phase-pulse {
          0%, 100% { opacity: 0.15; transform: scaleY(1); }
          25% { opacity: 1; transform: scaleY(1.1); }
          50% { opacity: 0.6; transform: scaleY(1); }
        }

        /* ── Progress bar ── */
        .p5-bar-enter {
          animation: bar-enter 0.3s ease-out 0.8s both;
        }
        @keyframes bar-enter {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
        .p5-progress-fill {
          background: linear-gradient(90deg, #e63946, #ffd700, #e63946);
          background-size: 200% 100%;
          animation: progress-sweep 1.5s ease-in-out infinite;
        }
        @keyframes progress-sweep {
          0% { width: 0%; background-position: 0% 0%; }
          50% { width: 100%; background-position: 100% 0%; }
          100% { width: 0%; background-position: 200% 0%; }
        }

        /* ── Corner bracket animations ── */
        .p5-corner-tl { animation: corner-fade 0.3s ease-out 0.1s both; }
        .p5-corner-tr { animation: corner-fade 0.3s ease-out 0.2s both; }
        .p5-corner-br { animation: corner-fade 0.3s ease-out 0.3s both; }
        .p5-corner-bl { animation: corner-fade 0.3s ease-out 0.4s both; }
        @keyframes corner-fade {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
