"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { Decision } from "./brain-feed";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PHASE_COLORS: Record<string, string> = {
  RESEARCH: "#4a9eff",
  ORIENT: "#e63946",
  THESIS: "#ffd700",
  PREDICT: "#22c55e",
  EXECUTE: "#ff4757",
  MONITOR: "#8a8578",
};

const PHASE_TW: Record<string, string> = {
  RESEARCH: "border-phase-research text-phase-research",
  ORIENT: "border-crimson text-crimson",
  THESIS: "border-gold text-gold",
  PREDICT: "border-phase-predict text-phase-predict",
  EXECUTE: "border-crimson-glow text-crimson-glow",
  MONITOR: "border-text-muted text-text-muted",
};

const STEP_DELAY_MS = 300;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseObservations(
  raw: string[] | string | null | undefined
): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function confidenceColor(value: number): string {
  if (value < 40) return "#e63946";
  if (value < 70) return "#ffd700";
  return "#22c55e";
}

// ---------------------------------------------------------------------------
// Arrow connector (CSS-only)
// ---------------------------------------------------------------------------

function StepArrow({ color }: { color: string }) {
  return (
    <div className="flex flex-col items-center py-1">
      <div
        className="w-0.5 h-6 animate-arrow-grow origin-top"
        style={{ background: color }}
      />
      <div
        className="w-0 h-0 animate-arrow-grow"
        style={{
          borderLeft: "5px solid transparent",
          borderRight: "5px solid transparent",
          borderTop: `6px solid ${color}`,
        }}
      />
      <style jsx>{`
        @keyframes arrow-grow {
          0% {
            transform: scaleY(0);
            opacity: 0;
          }
          100% {
            transform: scaleY(1);
            opacity: 1;
          }
        }
        .animate-arrow-grow {
          animation: arrow-grow 0.25s ease-out both;
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step box
// ---------------------------------------------------------------------------

function StepBox({
  label,
  phase,
  visible,
  children,
  animationType = "fade",
}: {
  label: string;
  phase: string;
  visible: boolean;
  children: React.ReactNode;
  animationType?: "fade" | "slide-left" | "skew";
}) {
  const upper = phase.toUpperCase();
  const color = PHASE_COLORS[upper] ?? PHASE_COLORS.MONITOR;
  const twClass = PHASE_TW[upper] ?? PHASE_TW.MONITOR;

  const animClass = {
    fade: "replay-fade-in",
    "slide-left": "replay-slide-left",
    skew: "replay-skew-in",
  }[animationType];

  return (
    <div
      className={cn(
        "transition-all duration-500",
        visible ? "opacity-100" : "opacity-0 pointer-events-none h-0 overflow-hidden"
      )}
    >
      {visible && (
        <div
          className={cn(
            "border-2 bg-surface p-3 skew-x-[-3deg]",
            "shadow-[3px_3px_0_#0d0d0d]",
            twClass,
            animClass
          )}
          style={{ borderLeftWidth: "4px", borderLeftColor: color }}
        >
          <div className="skew-x-[3deg]">
            {/* Step label */}
            <span
              className="inline-block text-[9px] font-black uppercase tracking-[0.2em] mb-1.5 px-1.5 py-0.5"
              style={{ background: `${color}22`, color }}
            >
              {label}
            </span>
            {children}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes replay-fade {
          0% {
            opacity: 0;
            transform: skewX(-3deg) translateY(8px);
          }
          100% {
            opacity: 1;
            transform: skewX(-3deg) translateY(0);
          }
        }
        @keyframes replay-slide {
          0% {
            opacity: 0;
            transform: skewX(-3deg) translateX(-40px);
          }
          100% {
            opacity: 1;
            transform: skewX(-3deg) translateX(0);
          }
        }
        @keyframes replay-skew {
          0% {
            opacity: 0;
            transform: skewX(-12deg) translateX(-20px);
          }
          100% {
            opacity: 1;
            transform: skewX(-3deg) translateX(0);
          }
        }
        .replay-fade-in {
          animation: replay-fade 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
        .replay-slide-left {
          animation: replay-slide 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
        .replay-skew-in {
          animation: replay-skew 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Confidence bar (inline, for the ACTION step)
// ---------------------------------------------------------------------------

function ReplayConfidenceBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const color = confidenceColor(clamped);
  return (
    <div className="flex items-center gap-2 mt-2">
      <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">
        PWR
      </span>
      <div className="relative h-2 flex-1 max-w-[200px] overflow-hidden bg-border">
        <div
          className="absolute inset-y-0 left-0 replay-bar-fill"
          style={
            {
              "--bar-width": `${clamped}%`,
              "--bar-color": color,
              background: color,
            } as React.CSSProperties
          }
        />
      </div>
      <span className="text-xs font-black text-text tabular-nums">
        {clamped}%
      </span>
      <style jsx>{`
        @keyframes bar-fill {
          0% {
            width: 0%;
          }
          100% {
            width: var(--bar-width);
          }
        }
        .replay-bar-fill {
          animation: bar-fill 0.6s ease-out both;
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface DecisionReplayProps {
  decision: Decision;
}

export function DecisionReplay({ decision }: DecisionReplayProps) {
  const [expanded, setExpanded] = useState(false);
  const [visibleStep, setVisibleStep] = useState(0);

  const observations = parseObservations(decision.observations);
  const upper = decision.phase.toUpperCase();
  const phaseColor = PHASE_COLORS[upper] ?? PHASE_COLORS.MONITOR;

  // Animate steps in sequence when expanded
  useEffect(() => {
    if (!expanded) {
      setVisibleStep(0);
      return;
    }

    // Total steps: OBSERVE (1), REASON (2), THESIS (3), ACTION (4)
    const maxSteps = 4;
    let current = 0;

    const interval = setInterval(() => {
      current += 1;
      setVisibleStep(current);
      if (current >= maxSteps) clearInterval(interval);
    }, STEP_DELAY_MS);

    // Show first step immediately
    setVisibleStep(1);

    return () => clearInterval(interval);
  }, [expanded]);

  return (
    <div className="w-full">
      {/* Replay trigger button */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 border-2 text-xs font-black uppercase tracking-[0.15em]",
            "skew-x-[-3deg] transition-all duration-200",
            "border-crimson/60 bg-surface text-crimson",
            "hover:bg-crimson hover:text-white hover:shadow-[3px_3px_0_#0d0d0d]"
          )}
        >
          <span className="skew-x-[3deg] flex items-center gap-2">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className="shrink-0"
            >
              <path
                d="M3 2L12 7L3 12V2Z"
                fill="currentColor"
              />
            </svg>
            REPLAY DECISION
          </span>
        </button>
      )}

      {/* Expanded replay flowchart */}
      {expanded && (
        <div className="relative border-2 border-border bg-background p-4 shadow-[3px_3px_0_#0d0d0d]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div
                className="w-1.5 h-6"
                style={{ background: phaseColor }}
              />
              <span className="text-xs font-black uppercase tracking-[0.15em] text-text">
                DECISION REPLAY
              </span>
              <span className="text-[10px] text-text-muted">
                #{decision.id.slice(0, 8)}
              </span>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className={cn(
                "px-3 py-1 border-2 border-border text-[10px] font-black uppercase tracking-wider",
                "text-text-muted hover:border-crimson hover:text-crimson transition-colors",
                "skew-x-[-3deg]"
              )}
            >
              <span className="skew-x-[3deg]">CLOSE</span>
            </button>
          </div>

          {/* Flowchart steps */}
          <div className="flex flex-col items-stretch gap-0">
            {/* Step 1: OBSERVE */}
            <StepBox
              label="01 // OBSERVE"
              phase={upper}
              visible={visibleStep >= 1}
              animationType="fade"
            >
              {observations.length > 0 ? (
                <div className="space-y-1">
                  {observations.map((obs, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs text-text-muted replay-obs-item"
                      style={{ animationDelay: `${i * 120}ms` }}
                    >
                      <span
                        className="font-bold shrink-0 mt-px"
                        style={{ color: phaseColor }}
                      >
                        {">"}
                      </span>
                      <span>{obs}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-muted italic">
                  No observations recorded.
                </p>
              )}
              <style jsx>{`
                @keyframes obs-appear {
                  0% {
                    opacity: 0;
                    transform: translateX(-10px);
                  }
                  100% {
                    opacity: 1;
                    transform: translateX(0);
                  }
                }
                .replay-obs-item {
                  animation: obs-appear 0.3s ease-out both;
                }
              `}</style>
            </StepBox>

            {visibleStep >= 2 && (
              <StepArrow color={phaseColor} />
            )}

            {/* Step 2: REASON */}
            <StepBox
              label="02 // REASON"
              phase={upper}
              visible={visibleStep >= 2}
              animationType="fade"
            >
              <div className="bg-background/80 border border-border/60 px-3 py-2">
                <pre className="whitespace-pre-wrap text-xs text-text-muted leading-relaxed font-mono">
                  {decision.reasoning}
                </pre>
              </div>
            </StepBox>

            {visibleStep >= 3 && decision.thesis && (
              <StepArrow color={PHASE_COLORS.THESIS} />
            )}

            {/* Step 3: THESIS (if exists) */}
            {decision.thesis && (
              <StepBox
                label="03 // THESIS"
                phase="THESIS"
                visible={visibleStep >= 3}
                animationType="slide-left"
              >
                <p className="text-xs text-gold/90 leading-relaxed">
                  {decision.thesis}
                </p>
              </StepBox>
            )}

            {visibleStep >= 4 && decision.action && (
              <StepArrow color={PHASE_COLORS.EXECUTE} />
            )}

            {/* Step 4: ACTION (if exists) */}
            {decision.action && (
              <StepBox
                label="04 // ACTION"
                phase="EXECUTE"
                visible={visibleStep >= 4}
                animationType="skew"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-crimson-glow font-bold uppercase tracking-wider">
                    {decision.action}
                  </span>
                </div>
                {decision.confidence != null && (
                  <ReplayConfidenceBar value={decision.confidence} />
                )}
              </StepBox>
            )}
          </div>

          {/* Progress dots at the bottom */}
          <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-border/50">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={cn(
                  "w-2 h-2 transition-all duration-300",
                  visibleStep >= step
                    ? "scale-100"
                    : "scale-75 opacity-30"
                )}
                style={{
                  background:
                    visibleStep >= step ? phaseColor : "#2a2a2a",
                  boxShadow:
                    visibleStep >= step
                      ? `0 0 6px ${phaseColor}66`
                      : "none",
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
