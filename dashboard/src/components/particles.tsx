"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ParticlesProps {
  intensity?: number; // 0-1, default 0.3
  className?: string;
}

// ---------------------------------------------------------------------------
// Deterministic pseudo-random using a seed
// (avoids hydration mismatch between server and client)
// ---------------------------------------------------------------------------

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ---------------------------------------------------------------------------
// Particle config
// ---------------------------------------------------------------------------

interface Particle {
  id: number;
  x: number; // % position
  y: number; // % position
  size: number; // px (2-6)
  opacity: number; // 0.1-0.5
  duration: number; // seconds (8-20)
  delay: number; // seconds
  driftX: number; // px drift range
  driftY: number; // px drift range
  color: string; // crimson, gold, or white
}

const COLORS = ["#e63946", "#ffd700", "#ffffff"];

function generateParticles(intensity: number, seed: number): Particle[] {
  const rand = seededRandom(seed);
  // Scale count: 15 at intensity 0, 25 at intensity 1
  const count = Math.floor(15 + intensity * 10);
  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    particles.push({
      id: i,
      x: rand() * 100,
      y: rand() * 100,
      size: 2 + rand() * 4, // 2-6px
      opacity: 0.1 + rand() * 0.4, // 0.1-0.5
      duration: 8 + rand() * 12, // 8-20s
      delay: rand() * -20, // negative delay for staggered start
      driftX: 20 + rand() * 40, // 20-60px drift
      driftY: 20 + rand() * 40,
      color: COLORS[Math.floor(rand() * COLORS.length)],
    });
  }

  return particles;
}

// ---------------------------------------------------------------------------
// Particles — floating diamond particles for BrainHero overlay
// ---------------------------------------------------------------------------

export function Particles({ intensity = 0.3, className }: ParticlesProps) {
  const particles = useMemo(
    () => generateParticles(intensity, 42),
    [intensity],
  );

  return (
    <div
      className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}
      aria-hidden="true"
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className="p5-particle absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            opacity: p.opacity * intensity,
            transform: "rotate(45deg)",
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            // Encode drift values as custom properties for the keyframe
            ["--drift-x" as string]: `${p.driftX}px`,
            ["--drift-y" as string]: `${p.driftY}px`,
          }}
        />
      ))}

      <style jsx>{`
        .p5-particle {
          animation-name: p5-particle-float;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          animation-direction: alternate;
          will-change: transform;
        }

        @keyframes p5-particle-float {
          0% {
            transform: rotate(45deg) translate(0, 0);
          }
          25% {
            transform: rotate(45deg)
              translate(var(--drift-x), calc(var(--drift-y) * -0.5));
          }
          50% {
            transform: rotate(45deg)
              translate(
                calc(var(--drift-x) * -0.3),
                var(--drift-y)
              );
          }
          75% {
            transform: rotate(45deg)
              translate(
                calc(var(--drift-x) * 0.7),
                calc(var(--drift-y) * 0.3)
              );
          }
          100% {
            transform: rotate(45deg) translate(0, 0);
          }
        }
      `}</style>
    </div>
  );
}
