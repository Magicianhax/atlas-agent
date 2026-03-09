"use client";

import { useState, useMemo } from "react";
import { usePredictions } from "@/hooks/use-sse";
import { PredictionCard, type Prediction } from "@/components/prediction-card";
import dynamic from "next/dynamic";
import { P5Loading } from "@/components/p5-loading";
import { P5Reveal } from "@/components/p5-reveal";
const AccuracyChart = dynamic(
  () => import("@/components/accuracy-chart").then((m) => m.AccuracyChart),
  { ssr: false, loading: () => <P5Loading height="h-[280px]" text="ACCURACY" /> }
);
import { StatsBar } from "@/components/stats-bar";
import { cn } from "@/lib/utils";
import { Filter } from "lucide-react";

type StatusFilter = "all" | "pending" | "correct" | "incorrect" | "expired";

const STATUS_FILTERS: { value: StatusFilter; label: string; color: string }[] = [
  { value: "all", label: "All", color: "text-text" },
  { value: "pending", label: "Pending", color: "text-gold" },
  { value: "correct", label: "Correct", color: "text-status-correct" },
  { value: "incorrect", label: "Incorrect", color: "text-crimson" },
  { value: "expired", label: "Expired", color: "text-text-muted" },
];

function parsePrediction(raw: unknown): Prediction {
  const r = raw as Record<string, unknown>;
  return {
    id: r.id as string,
    createdAt: r.createdAt as string,
    resolvedAt: r.resolvedAt as string | undefined,
    claim: r.claim as string,
    evidence: (typeof r.evidence === "string"
      ? JSON.parse(r.evidence)
      : r.evidence) as string[],
    counterEvidence: (typeof r.counterEvidence === "string"
      ? JSON.parse(r.counterEvidence)
      : r.counterEvidence) as string[],
    confidence: r.confidence as number,
    timeframeHours: r.timeframeHours as number,
    exitCriteria: r.exitCriteria as string,
    status: r.status as Prediction["status"],
    outcome: r.outcome as string | undefined,
    postMortem: r.postMortem as string | undefined,
    chainId: r.chainId as number | undefined,
    category: r.category as string | undefined,
  };
}

export default function PredictionsPage() {
  const rawPredictions = usePredictions();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const predictions = useMemo(
    () => rawPredictions.map(parsePrediction),
    [rawPredictions]
  );

  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const p of predictions) {
      if (p.category) cats.add(p.category);
    }
    return Array.from(cats).sort();
  }, [predictions]);

  const filtered = useMemo(() => {
    return predictions.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (categoryFilter !== "all" && p.category !== categoryFilter)
        return false;
      return true;
    });
  }, [predictions, statusFilter, categoryFilter]);

  return (
    <div className="min-h-screen">
      <StatsBar />

      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        {/* Page header */}
        <div>
          <h1
            className="text-xl font-black tracking-[0.15em] text-crimson"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            PREDICTIONS LEDGER
          </h1>
          <p className="mt-1 text-xs text-text-muted font-bold">
            Every claim tracked with full accountability.
          </p>
        </div>

        {/* Charts */}
        <P5Reveal text="ACCURACY" height="h-[280px]" stagger={0}>
          <AccuracyChart predictions={predictions} />
        </P5Reveal>

        {/* Filter bar */}
        <P5Reveal text="FILTERS" height="h-12" stagger={200}>
          <div className="flex flex-wrap items-center gap-3">
            {/* Status filter buttons */}
            <div className="flex items-center gap-0.5 border-2 border-border bg-surface/80 p-1">
              {STATUS_FILTERS.map((sf) => (
                <button
                  key={sf.value}
                  onClick={() => setStatusFilter(sf.value)}
                  className={cn(
                    "px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all skew-x-[-2deg]",
                    statusFilter === sf.value
                      ? cn("bg-crimson/20 border border-crimson/40", sf.color)
                      : "text-text-muted hover:text-text hover:bg-surface-light"
                  )}
                >
                  <span className="inline-block skew-x-[2deg]">{sf.label}</span>
                </button>
              ))}
            </div>

            {/* Category dropdown */}
            {categories.length > 0 && (
              <div className="relative flex items-center gap-2">
                <Filter size={14} className="text-text-muted" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className={cn(
                    "appearance-none border-2 border-border bg-surface/80 px-3 py-1.5",
                    "text-[10px] font-bold uppercase tracking-wider text-text-muted",
                    "focus:outline-none focus:border-crimson/50",
                    "cursor-pointer"
                  )}
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Count */}
            <span className="ml-auto text-[11px] text-text-muted">
              {filtered.length} prediction{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        </P5Reveal>

        {/* Predictions list */}
        <P5Reveal text="PREDICTIONS" height="h-60" stagger={400}>
          {filtered.length === 0 ? (
            <div className="border-2 border-dashed border-crimson/20 bg-surface/80 p-12 text-center">
              <p className="text-sm text-text-muted font-bold">
                {predictions.length === 0
                  ? "No predictions recorded yet."
                  : "No predictions match the current filters."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((prediction) => (
                <PredictionCard key={prediction.id} prediction={prediction} />
              ))}
            </div>
          )}
        </P5Reveal>
      </div>
    </div>
  );
}
