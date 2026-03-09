"use client";

import { useState } from "react";
import Image from "next/image";
import { cn, timeAgo } from "@/lib/utils";
import { DecisionReplay } from "@/components/decision-replay";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Decision {
  id: string;
  timestamp: string;
  phase: string;
  title: string;
  reasoning: string;
  observations?: string[] | string | null;
  thesis?: string | null;
  action?: string | null;
  confidence?: number | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PHASE_COLORS: Record<string, string> = {
  RESEARCH: "var(--color-phase-research)",
  ORIENT: "var(--color-phase-orient)",
  THESIS: "var(--color-phase-thesis)",
  PREDICT: "var(--color-phase-predict)",
  EXECUTE: "var(--color-phase-execute)",
  MONITOR: "var(--color-phase-monitor)",
};

const PHASE_TW: Record<string, string> = {
  RESEARCH: "bg-phase-research/20 text-phase-research border-phase-research/40",
  ORIENT: "bg-crimson/20 text-crimson border-crimson/40",
  THESIS: "bg-gold/20 text-gold border-gold/40",
  PREDICT: "bg-phase-predict/20 text-phase-predict border-phase-predict/40",
  EXECUTE: "bg-crimson/20 text-crimson-glow border-crimson/40",
  MONITOR: "bg-text-muted/20 text-text-muted border-text-muted/40",
};

/** RPG-style action verb per phase */
const PHASE_VERB: Record<string, string> = {
  RESEARCH: "cast RESEARCH",
  ORIENT: "used ORIENT",
  THESIS: "formed THESIS",
  PREDICT: "cast PREDICT",
  EXECUTE: "attacked with EXECUTE",
  MONITOR: "activated MONITOR",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseObservations(raw: string[] | string | null | undefined): string[] {
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
  if (value < 50) return "bg-crimson";
  if (value < 75) return "bg-gold";
  return "bg-status-correct";
}

function confidenceTrackColor(value: number): string {
  if (value < 50) return "bg-crimson/20";
  if (value < 75) return "bg-gold/20";
  return "bg-status-correct/20";
}

function isThinking(latestTimestamp: string): boolean {
  const diff = Date.now() - new Date(latestTimestamp).getTime();
  return diff < 5 * 60 * 1000;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PhaseBadge({ phase }: { phase: string }) {
  const upper = phase.toUpperCase();
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border",
        "skew-x-[-3deg]",
        PHASE_TW[upper] ?? "bg-text-muted/20 text-text-muted border-text-muted/40"
      )}
    >
      <span className="skew-x-[3deg]">{upper}</span>
    </span>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">
        PWR
      </span>
      <div
        className={cn(
          "relative h-2 flex-1 max-w-[160px] overflow-hidden",
          confidenceTrackColor(clamped)
        )}
      >
        <div
          className={cn("absolute inset-y-0 left-0 transition-all", confidenceColor(clamped))}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-xs font-black text-text tabular-nums">
        {clamped}%
      </span>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-3 border-2 border-crimson/50 bg-surface px-4 py-3 mb-3 p5-card">
      <div className="relative h-8 w-8 shrink-0 overflow-hidden border border-crimson/30">
        <Image
          src="/assets/mascot-avatar.png"
          alt="ATLAS"
          width={32}
          height={32}
          className="object-cover"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full bg-crimson animate-pulse-glow" />
          <span className="relative inline-flex h-2.5 w-2.5 bg-crimson" />
        </span>
        <span className="text-sm text-text-muted font-bold">
          ATLAS is thinking<span className="animate-blink text-crimson">...</span>
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Decision Card — RPG Battle Log Style
// ---------------------------------------------------------------------------

function DecisionCard({ decision, index }: { decision: Decision; index: number }) {
  const observations = parseObservations(decision.observations);
  const upper = decision.phase.toUpperCase();
  const verb = PHASE_VERB[upper] ?? `used ${upper}`;

  return (
    <article
      className="group flex gap-3 animate-skew-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Mascot portrait — left gutter */}
      <div className="hidden sm:flex flex-col items-center shrink-0 pt-1">
        <div className="relative h-10 w-10 overflow-hidden border-2 border-crimson/40 group-hover:border-crimson transition-colors">
          <Image
            src="/assets/mascot-avatar.png"
            alt="ATLAS"
            width={40}
            height={40}
            className="object-cover"
          />
        </div>
        <div
          className="w-0.5 flex-1 mt-1"
          style={{ background: PHASE_COLORS[upper] ?? PHASE_COLORS.MONITOR }}
        />
      </div>

      {/* Card content */}
      <div
        className="flex-1 min-w-0 border-2 border-border bg-surface p-4 p5-card p5-shimmer transition-colors hover:border-crimson/50"
        style={{
          borderLeftWidth: "4px",
          borderLeftColor: PHASE_COLORS[upper] ?? PHASE_COLORS.MONITOR,
        }}
      >
        {/* Battle log header */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <PhaseBadge phase={decision.phase} />
          <span className="text-[11px] text-text-muted tabular-nums">
            {timeAgo(decision.timestamp)}
          </span>
          {decision.action && (
            <span className="ml-auto text-[10px] text-gold font-bold uppercase tracking-wider">
              {decision.action}
            </span>
          )}
        </div>

        {/* RPG action line */}
        <p className="text-[11px] text-text-muted mb-1.5 font-bold">
          <span className="text-crimson">ATLAS</span> {verb}!
        </p>

        {/* Title */}
        <h3 className="text-sm font-black text-text mb-2 leading-snug">
          {decision.title}
        </h3>

        {/* Reasoning — dark box */}
        <div className="bg-background/80 border border-border/60 px-3 py-2 mb-2 overflow-x-auto">
          <pre className="whitespace-pre-wrap text-xs text-text-muted leading-relaxed font-mono">
            {decision.reasoning}
          </pre>
        </div>

        {/* Observations as "hits" */}
        {observations.length > 0 && (
          <div className="mb-2 space-y-1">
            {observations.map((obs, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-xs text-text-muted"
              >
                <span className="text-crimson font-bold shrink-0 mt-px">{">"}</span>
                <span>{obs}</span>
              </div>
            ))}
          </div>
        )}

        {/* Thesis — gold highlight box */}
        {decision.thesis && (
          <div className="border-2 border-gold/30 bg-gold/5 px-3 py-2 mb-2">
            <span className="block text-[9px] uppercase tracking-[0.2em] text-gold font-bold mb-0.5">
              Thesis
            </span>
            <p className="text-xs text-gold/90 leading-relaxed">
              {decision.thesis}
            </p>
          </div>
        )}

        {/* Confidence as power bar */}
        {decision.confidence != null && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <ConfidenceBar value={decision.confidence} />
          </div>
        )}

        {/* Decision Replay */}
        <div className="mt-3 pt-2 border-t border-border/30">
          <DecisionReplay decision={decision} />
        </div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Main Feed
// ---------------------------------------------------------------------------

interface BrainFeedProps {
  decisions: Decision[];
}

const PAGE_SIZE = 15;

export function BrainFeed({ decisions }: BrainFeedProps) {
  const [page, setPage] = useState(0);

  const sorted = [...decisions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageDecisions = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const showThinking =
    sorted.length > 0 && isThinking(sorted[0].timestamp);

  return (
    <section className="flex flex-col gap-3">
      {/* Thinking indicator */}
      {showThinking && <ThinkingIndicator />}

      {/* Empty state */}
      {sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-crimson/30 bg-surface/40 py-16 text-center">
          <div className="relative h-20 w-20 mb-4 opacity-40">
            <Image
              src="/assets/mascot.png"
              alt="ATLAS"
              width={80}
              height={80}
              className="object-contain"
            />
          </div>
          <p className="text-sm text-text-muted font-bold">
            No decisions yet. The battle log will appear here.
          </p>
        </div>
      )}

      {/* Decision cards */}
      {pageDecisions.map((d, i) => (
        <DecisionCard key={d.id} decision={d} index={i} />
      ))}

      {/* Pagination — angular P5 style */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 py-3">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className={cn(
              "px-4 py-1.5 text-xs font-bold uppercase tracking-wider border-2 transition-all",
              "skew-x-[-3deg]",
              page === 0
                ? "border-border text-text-muted opacity-30 cursor-not-allowed"
                : "border-crimson text-crimson hover:bg-crimson hover:text-white"
            )}
          >
            <span className="inline-block skew-x-[3deg]">Prev</span>
          </button>
          <span className="text-xs text-text-muted tabular-nums font-bold">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className={cn(
              "px-4 py-1.5 text-xs font-bold uppercase tracking-wider border-2 transition-all",
              "skew-x-[-3deg]",
              page >= totalPages - 1
                ? "border-border text-text-muted opacity-30 cursor-not-allowed"
                : "border-crimson text-crimson hover:bg-crimson hover:text-white"
            )}
          >
            <span className="inline-block skew-x-[3deg]">Next</span>
          </button>
        </div>
      )}
    </section>
  );
}
