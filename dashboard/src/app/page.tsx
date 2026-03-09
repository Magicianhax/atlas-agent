"use client";

import { useDecisions } from "@/hooks/use-sse";
import { BrainFeed, type Decision } from "@/components/brain-feed";
import { BrainHero } from "@/components/brain-hero";
import { MarketSidebar } from "@/components/market-sidebar";
import { ConfidenceGauge } from "@/components/confidence-gauge";
import { StatsBar } from "@/components/stats-bar";
import { P5Reveal } from "@/components/p5-reveal";

export default function HomePage() {
  const rawDecisions = useDecisions();

  const decisions: Decision[] = (rawDecisions as Record<string, unknown>[]).map(
    (d) => ({
      id: String(d.id ?? ""),
      timestamp: String(d.timestamp ?? ""),
      phase: String(d.phase ?? "MONITOR"),
      title: String(d.title ?? ""),
      reasoning: String(d.reasoning ?? ""),
      observations: d.observations
        ? typeof d.observations === "string"
          ? (() => {
              try {
                return JSON.parse(d.observations as string);
              } catch {
                return [];
              }
            })()
          : (d.observations as string[])
        : [],
      thesis: d.thesis ? String(d.thesis) : null,
      action: d.action ? String(d.action) : null,
      confidence:
        d.confidence != null ? Number(d.confidence) : null,
    })
  );

  const avgConfidence =
    decisions.filter((d) => d.confidence != null).reduce((sum, d) => sum + (d.confidence ?? 0), 0) /
    Math.max(1, decisions.filter((d) => d.confidence != null).length);

  return (
    <div className="flex flex-col">
      {/* Stats Bar */}
      <StatsBar />

      {/* Main Content */}
      <div className="mx-auto w-full max-w-7xl px-4 py-6">
        {/* Brain Visualization Hero */}
        <P5Reveal text="BRAIN" height="h-48" stagger={0}>
          <BrainHero decisions={decisions} pnlTotal={0} />
        </P5Reveal>

        <div className="flex flex-col gap-6 lg:flex-row mt-6">
          {/* Brain Feed — main column */}
          <div className="min-w-0 flex-1">
            <P5Reveal text="BATTLE LOG" height="h-60" stagger={200}>
              <div className="mb-4 flex items-center gap-3">
                <h1
                  className="text-xl font-black uppercase tracking-[0.15em] text-crimson"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Battle Log
                </h1>
                <span className="text-[10px] text-text-muted font-bold bg-surface-light px-2 py-0.5 border border-border">
                  {decisions.length} decision{decisions.length !== 1 ? "s" : ""}
                </span>
              </div>
              <BrainFeed decisions={decisions} />
            </P5Reveal>
          </div>

          {/* Sidebar */}
          <div className="w-full shrink-0 lg:w-72">
            <P5Reveal text="MARKET" height="h-40" stagger={400}>
              <MarketSidebar />
              <div className="mt-4 flex justify-center">
                <ConfidenceGauge confidence={avgConfidence} label="AVG CONFIDENCE" />
              </div>
            </P5Reveal>
          </div>
        </div>
      </div>
    </div>
  );
}
