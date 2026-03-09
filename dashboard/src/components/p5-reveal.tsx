"use client";

import { useEffect, useState } from "react";
import { P5Loading } from "@/components/p5-loading";

// ---------------------------------------------------------------------------
// P5Reveal — Guarantees a minimum 1s loading animation before revealing content.
//
// Sequence: Page transition finishes (1.5s) → P5Loading plays (1s) → content reveals
// The stagger prop offsets each section so they cascade one after another.
// ---------------------------------------------------------------------------

// Page transition duration — reveals wait for this before starting
const PAGE_TRANSITION_MS = 1500;

interface P5RevealProps {
  children: React.ReactNode;
  delay?: number;       // min ms to show loader (default 1000)
  text?: string;        // loader text (default "LOADING")
  height?: string;      // loader height (default "h-40")
  stagger?: number;     // additional stagger offset in ms (for sequential reveals)
}

export function P5Reveal({
  children,
  delay = 1000,
  text = "LOADING",
  height = "h-40",
  stagger = 0,
}: P5RevealProps) {
  const [phase, setPhase] = useState<"hidden" | "loading" | "ready">("hidden");

  useEffect(() => {
    // Phase 1: Stay hidden during page transition
    const showLoader = setTimeout(() => {
      setPhase("loading");
    }, PAGE_TRANSITION_MS + stagger);

    // Phase 2: After loading animation plays, reveal content
    const showContent = setTimeout(() => {
      setPhase("ready");
    }, PAGE_TRANSITION_MS + stagger + delay);

    return () => {
      clearTimeout(showLoader);
      clearTimeout(showContent);
    };
  }, [delay, stagger]);

  // During page transition — invisible placeholder to hold layout space
  if (phase === "hidden") {
    return <div className={height} />;
  }

  // Loading animation playing
  if (phase === "loading") {
    return <P5Loading height={height} text={text} />;
  }

  // Content revealed
  return (
    <div className="p5-reveal-enter">
      {children}
      <style jsx>{`
        .p5-reveal-enter {
          animation: p5RevealIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
        @keyframes p5RevealIn {
          0% {
            opacity: 0;
            transform: translateX(20px) skewX(-2deg);
          }
          60% {
            opacity: 1;
            transform: translateX(-3px) skewX(-0.3deg);
          }
          100% {
            opacity: 1;
            transform: translateX(0) skewX(0);
          }
        }
      `}</style>
    </div>
  );
}
