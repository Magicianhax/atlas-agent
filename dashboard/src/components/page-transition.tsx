"use client";

import { usePathname } from "next/navigation";

// ---------------------------------------------------------------------------
// PageTransition — Persona 5 style dramatic reveal (~2s)
//
// Uses pathname as key so the entire animation re-triggers on every
// client-side navigation. The sequence:
//   1. Black overlay covers screen instantly
//   2. Crimson diagonal slashes sweep across (0→0.6s)
//   3. Overlay splits open with angular clip-path (0.4→1.2s)
//   4. Content slides in with skew from the right (0.8→1.8s)
//   5. Gold accent line flashes at the top (1.2→1.6s)
// ---------------------------------------------------------------------------

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="p5-reveal">
      {/* Layer 1: Black backdrop that splits open */}
      <div className="p5-backdrop" />

      {/* Layer 2: Crimson diagonal slash */}
      <div className="p5-slash" />

      {/* Layer 3: Second slash (gold, delayed) */}
      <div className="p5-slash-gold" />

      {/* Layer 4: Gold top accent flash */}
      <div className="p5-top-flash" />

      {/* Content with skew entrance */}
      <div className="p5-content">{children}</div>

      <style jsx>{`
        .p5-reveal {
          position: relative;
          min-height: 100vh;
        }

        /* ── Black backdrop that wipes away diagonally ── */
        .p5-backdrop {
          position: fixed;
          inset: 0;
          z-index: 50;
          background: #0d0d0d;
          pointer-events: none;
          animation: backdrop-reveal 0.8s cubic-bezier(0.76, 0, 0.24, 1) 0.4s both;
        }

        @keyframes backdrop-reveal {
          0% {
            clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
          }
          100% {
            clip-path: polygon(100% 0, 100% 0, 100% 100%, 100% 100%);
          }
        }

        /* ── Crimson diagonal slash sweeping left to right ── */
        .p5-slash {
          position: fixed;
          inset: 0;
          z-index: 51;
          pointer-events: none;
          background: #e63946;
          animation: slash-sweep 0.6s cubic-bezier(0.65, 0, 0.35, 1) 0.1s both;
        }

        @keyframes slash-sweep {
          0% {
            clip-path: polygon(
              0 0,
              15% 0,
              0% 100%,
              0 100%
            );
            opacity: 1;
          }
          50% {
            clip-path: polygon(
              35% 0,
              65% 0,
              50% 100%,
              20% 100%
            );
            opacity: 0.9;
          }
          100% {
            clip-path: polygon(
              100% 0,
              115% 0,
              100% 100%,
              85% 100%
            );
            opacity: 0;
          }
        }

        /* ── Gold slash, delayed ── */
        .p5-slash-gold {
          position: fixed;
          inset: 0;
          z-index: 52;
          pointer-events: none;
          background: #ffd700;
          animation: slash-sweep-thin 0.5s cubic-bezier(0.65, 0, 0.35, 1) 0.25s both;
        }

        @keyframes slash-sweep-thin {
          0% {
            clip-path: polygon(
              0 0,
              8% 0,
              0% 100%,
              0 100%
            );
            opacity: 0.8;
          }
          50% {
            clip-path: polygon(
              40% 0,
              52% 0,
              44% 100%,
              32% 100%
            );
            opacity: 0.6;
          }
          100% {
            clip-path: polygon(
              100% 0,
              108% 0,
              100% 100%,
              92% 100%
            );
            opacity: 0;
          }
        }

        /* ── Gold accent line at top ── */
        .p5-top-flash {
          position: fixed;
          top: 56px;
          left: 0;
          right: 0;
          height: 2px;
          z-index: 53;
          background: linear-gradient(
            90deg,
            transparent 0%,
            #ffd700 30%,
            #ffd700 70%,
            transparent 100%
          );
          pointer-events: none;
          animation: top-flash 0.6s ease-out 1.0s both;
        }

        @keyframes top-flash {
          0% {
            opacity: 0;
            transform: scaleX(0);
          }
          30% {
            opacity: 1;
            transform: scaleX(1);
          }
          100% {
            opacity: 0;
            transform: scaleX(1);
          }
        }

        /* ── Content entrance: skew + slide from right ── */
        .p5-content {
          animation: content-enter 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.5s both;
        }

        @keyframes content-enter {
          0% {
            opacity: 0;
            transform: translateX(40px) skewX(-3deg);
          }
          60% {
            opacity: 1;
            transform: translateX(-4px) skewX(-0.3deg);
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
