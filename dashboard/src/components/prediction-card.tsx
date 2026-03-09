"use client";

import { useState } from "react";
import { cn, timeAgo } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";

export interface Prediction {
  id: string;
  createdAt: string;
  resolvedAt?: string;
  claim: string;
  evidence: string[];
  counterEvidence: string[];
  confidence: number;
  timeframeHours: number;
  exitCriteria: string;
  status: string;
  outcome?: string;
  postMortem?: string;
  chainId?: number;
  category?: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  pending: {
    label: "Pending",
    color: "#ffd700",
    bgColor: "bg-gold/10",
  },
  correct: {
    label: "Correct",
    color: "#22c55e",
    bgColor: "bg-status-correct/10",
  },
  incorrect: {
    label: "Incorrect",
    color: "#e63946",
    bgColor: "bg-crimson/10",
  },
  resolved: {
    label: "Resolved",
    color: "#8a8578",
    bgColor: "bg-text-muted/10",
  },
  expired: {
    label: "Expired",
    color: "#8a8578",
    bgColor: "bg-text-muted/10",
  },
  partially_correct: {
    label: "Partial",
    color: "#ffd700",
    bgColor: "bg-gold/10",
  },
};

const FALLBACK_STATUS = {
  label: "Unknown",
  color: "#6b7280",
  bgColor: "bg-gray-500/10",
};

const CHAIN_NAMES: Record<number, string> = {
  42161: "Arbitrum",
  8453: "Base",
  10: "Optimism",
};

function getTimeframeText(createdAt: string, timeframeHours: number): string {
  const expiresAt = new Date(createdAt).getTime() + timeframeHours * 3600_000;
  const now = Date.now();
  const diffMs = expiresAt - now;
  const diffHours = Math.abs(Math.round(diffMs / 3600_000));

  if (diffMs > 0) {
    if (diffHours < 1) {
      const diffMins = Math.round(diffMs / 60_000);
      return `expires in ${diffMins}m`;
    }
    return `expires in ${diffHours}h`;
  } else {
    if (diffHours < 1) {
      const diffMins = Math.round(Math.abs(diffMs) / 60_000);
      return `expired ${diffMins}m ago`;
    }
    return `expired ${diffHours}h ago`;
  }
}

export function PredictionCard({ prediction }: { prediction: Prediction }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[prediction.status] ?? FALLBACK_STATUS;
  const chainName = prediction.chainId
    ? CHAIN_NAMES[prediction.chainId] ?? `Chain ${prediction.chainId}`
    : null;

  return (
    <div
      className={cn(
        "border-2 border-border bg-surface/80 p5-card p5-shimmer transition-colors",
        "hover:border-crimson/40"
      )}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full cursor-pointer items-start gap-3 p-4 text-left"
      >
        <div className="flex-1 min-w-0">
          {/* Status + Tags Row */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {/* Status badge */}
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 text-[10px] font-black uppercase tracking-wider skew-x-[-2deg]",
                status.bgColor
              )}
              style={{ color: status.color }}
            >
              {status.label}
            </span>

            {/* Category tag */}
            {prediction.category && (
              <span className="bg-surface-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                {prediction.category}
              </span>
            )}

            {/* Chain tag */}
            {chainName && (
              <span className="bg-surface-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                {chainName}
              </span>
            )}

            {/* Timeframe */}
            <span className="ml-auto flex items-center gap-1 text-[11px] text-text-muted">
              <Clock size={12} />
              {getTimeframeText(prediction.createdAt, prediction.timeframeHours)}
            </span>
          </div>

          {/* Claim text */}
          <p className="text-sm leading-relaxed text-text">{prediction.claim}</p>

          {/* Confidence bar */}
          <div className="mt-3 flex items-center gap-3">
            <span className="text-[11px] uppercase tracking-wider text-text-muted">
              Confidence
            </span>
            <div className="relative h-2 flex-1 bg-surface-light">
              <div
                className="absolute left-0 top-0 h-full transition-all"
                style={{
                  width: `${prediction.confidence}%`,
                  backgroundColor: status.color,
                }}
              />
            </div>
            <span
              className="text-xs font-semibold"
              style={{ color: status.color }}
            >
              {prediction.confidence}%
            </span>
          </div>

          {/* Created time */}
          <div className="mt-2 text-[11px] text-text-muted">
            {timeAgo(prediction.createdAt)}
          </div>
        </div>

        {/* Expand chevron */}
        <div className="mt-1 text-text-muted">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
          {/* Evidence */}
          {prediction.evidence.length > 0 && (
            <div>
              <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-status-correct">
                Evidence
              </h4>
              <ul className="space-y-1">
                {prediction.evidence.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-text-muted"
                  >
                    <CheckCircle2
                      size={14}
                      className="mt-0.5 shrink-0 text-status-correct"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Counter-evidence */}
          {prediction.counterEvidence.length > 0 && (
            <div>
              <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-crimson">
                Counter-Evidence
              </h4>
              <ul className="space-y-1">
                {prediction.counterEvidence.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-text-muted"
                  >
                    <XCircle
                      size={14}
                      className="mt-0.5 shrink-0 text-crimson"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Exit criteria */}
          <div>
            <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Exit Criteria
            </h4>
            <p className="text-xs text-text-muted">{prediction.exitCriteria}</p>
          </div>

          {/* Outcome + Post-mortem (if resolved) */}
          {prediction.outcome && (
            <div className="border-2 border-border bg-surface-light/50 p-3">
              <div className="mb-1 flex items-center gap-2">
                <AlertTriangle size={14} className="text-gold" />
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gold">
                  Outcome
                </h4>
              </div>
              <p className="text-xs leading-relaxed text-text">
                {prediction.outcome}
              </p>
              {prediction.postMortem && (
                <div className="mt-3 border-t border-border pt-3">
                  <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-gold">
                    Post-Mortem
                  </h4>
                  <p className="text-xs leading-relaxed text-text-muted">
                    {prediction.postMortem}
                  </p>
                </div>
              )}
              {prediction.resolvedAt && (
                <p className="mt-2 text-[10px] text-text-muted">
                  Resolved {timeAgo(prediction.resolvedAt)}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
