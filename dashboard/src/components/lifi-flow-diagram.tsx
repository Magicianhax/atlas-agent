"use client";

// ---------------------------------------------------------------------------
// LiFiFlowDiagram — Visual architecture diagram showing how ATLAS uses LI.FI
//
// Layout (desktop):
//
//   ┌─────────┐     ┌──────────┐     ┌──────────────────────┐     ┌──────────┐
//   │  ATLAS  │────▸│ LI.FI    │────▸│   LI.FI Diamond      │────▸│  Dest    │
//   │  Agent  │     │ Quote API│     │   Contract (on-chain) │     │  Chain   │
//   └─────────┘     └──────────┘     └──────────────────────┘     └──────────┘
//        │               │                     │                       │
//        │  1. Request    │  2. Aggregates      │  3. Executes          │
//        │     quote      │     30+ bridges     │     bridge/swap       │
//        │               │     100s DEXs       │                       │
//        ▼               ▼                     ▼                       ▼
//   ┌──────────────────────────────────────────────────────────────────────┐
//   │                    Status Tracking (li.quest/v1/status)              │
//   └──────────────────────────────────────────────────────────────────────┘
// ---------------------------------------------------------------------------

export function LiFiFlowDiagram() {
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[700px] p-4">
        {/* Title */}
        <div className="mb-6 text-center">
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-muted">
            End-to-End Execution Flow
          </div>
        </div>

        {/* Main flow — horizontal boxes with animated connectors */}
        <div className="relative flex items-start justify-between gap-0">

          {/* Step 1: ATLAS Agent */}
          <div className="relative z-10 w-[22%]">
            <div className="lifi-node border-2 border-crimson/60 bg-crimson/10 p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 bg-crimson lifi-pulse" />
                <span className="text-[10px] font-black uppercase tracking-wider text-crimson">
                  01 — Agent
                </span>
              </div>
              <div className="text-[11px] font-bold text-text">ATLAS decides to move capital</div>
              <div className="mt-1.5 space-y-1">
                <div className="text-[9px] text-text-muted flex items-center gap-1">
                  <span className="text-crimson/50">&#x25B8;</span> Identifies yield opportunity
                </div>
                <div className="text-[9px] text-text-muted flex items-center gap-1">
                  <span className="text-crimson/50">&#x25B8;</span> Picks source &amp; dest chain
                </div>
                <div className="text-[9px] text-text-muted flex items-center gap-1">
                  <span className="text-crimson/50">&#x25B8;</span> Sets token &amp; amount
                </div>
              </div>
              <div className="mt-2 border-t border-crimson/20 pt-1.5">
                <code className="text-[8px] text-crimson/60 block">
                  &quot;Move $50 USDC from Base → Arbitrum&quot;
                </code>
              </div>
            </div>
          </div>

          {/* Connector 1→2 */}
          <div className="relative z-0 flex flex-col items-center justify-center self-center w-[4%]">
            <div className="lifi-connector-h" />
            <div className="text-[7px] font-bold uppercase tracking-wider text-text-muted mt-1 whitespace-nowrap">
              API call
            </div>
          </div>

          {/* Step 2: LI.FI API */}
          <div className="relative z-10 w-[22%]">
            <div className="lifi-node border-2 border-gold/60 bg-gold/10 p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 bg-gold lifi-pulse" style={{ animationDelay: "0.3s" }} />
                <span className="text-[10px] font-black uppercase tracking-wider text-gold">
                  02 — LI.FI API
                </span>
              </div>
              <div className="text-[11px] font-bold text-text">Finds optimal route</div>
              <div className="mt-1.5 space-y-1">
                <div className="text-[9px] text-text-muted flex items-center gap-1">
                  <span className="text-gold/50">&#x25B8;</span> Queries 30+ bridges
                </div>
                <div className="text-[9px] text-text-muted flex items-center gap-1">
                  <span className="text-gold/50">&#x25B8;</span> Compares fees &amp; speed
                </div>
                <div className="text-[9px] text-text-muted flex items-center gap-1">
                  <span className="text-gold/50">&#x25B8;</span> Returns best path
                </div>
              </div>
              <div className="mt-2 border-t border-gold/20 pt-1.5">
                <code className="text-[8px] text-gold/60 block">
                  li.quest/v1/quote
                </code>
              </div>
            </div>
          </div>

          {/* Connector 2→3 */}
          <div className="relative z-0 flex flex-col items-center justify-center self-center w-[4%]">
            <div className="lifi-connector-h" />
            <div className="text-[7px] font-bold uppercase tracking-wider text-text-muted mt-1 whitespace-nowrap">
              Calldata
            </div>
          </div>

          {/* Step 3: On-Chain */}
          <div className="relative z-10 w-[22%]">
            <div className="lifi-node border-2 border-phase-research/60 bg-phase-research/10 p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 bg-phase-research lifi-pulse" style={{ animationDelay: "0.6s" }} />
                <span className="text-[10px] font-black uppercase tracking-wider text-phase-research">
                  03 — On-Chain
                </span>
              </div>
              <div className="text-[11px] font-bold text-text">Diamond contract executes</div>
              <div className="mt-1.5 space-y-1">
                <div className="text-[9px] text-text-muted flex items-center gap-1">
                  <span className="text-phase-research/50">&#x25B8;</span> ERC-20 approval
                </div>
                <div className="text-[9px] text-text-muted flex items-center gap-1">
                  <span className="text-phase-research/50">&#x25B8;</span> Bridge initiated
                </div>
                <div className="text-[9px] text-text-muted flex items-center gap-1">
                  <span className="text-phase-research/50">&#x25B8;</span> Swap if needed
                </div>
              </div>
              <div className="mt-2 border-t border-phase-research/20 pt-1.5">
                <code className="text-[8px] text-phase-research/60 block break-all">
                  0x1231DEB6...4EaE
                </code>
              </div>
            </div>
          </div>

          {/* Connector 3→4 */}
          <div className="relative z-0 flex flex-col items-center justify-center self-center w-[4%]">
            <div className="lifi-connector-h" />
            <div className="text-[7px] font-bold uppercase tracking-wider text-text-muted mt-1 whitespace-nowrap">
              Bridge
            </div>
          </div>

          {/* Step 4: Destination */}
          <div className="relative z-10 w-[22%]">
            <div className="lifi-node border-2 border-status-correct/60 bg-status-correct/10 p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 bg-status-correct lifi-pulse" style={{ animationDelay: "0.9s" }} />
                <span className="text-[10px] font-black uppercase tracking-wider text-status-correct">
                  04 — Received
                </span>
              </div>
              <div className="text-[11px] font-bold text-text">Assets arrive on dest chain</div>
              <div className="mt-1.5 space-y-1">
                <div className="text-[9px] text-text-muted flex items-center gap-1">
                  <span className="text-status-correct/50">&#x25B8;</span> Tokens in wallet
                </div>
                <div className="text-[9px] text-text-muted flex items-center gap-1">
                  <span className="text-status-correct/50">&#x25B8;</span> Ready for deposit
                </div>
                <div className="text-[9px] text-text-muted flex items-center gap-1">
                  <span className="text-status-correct/50">&#x25B8;</span> Logged to dashboard
                </div>
              </div>
              <div className="mt-2 border-t border-status-correct/20 pt-1.5">
                <code className="text-[8px] text-status-correct/60 block">
                  Position opened in vault
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Status tracking bar underneath */}
        <div className="mt-4 relative">
          <div className="lifi-status-bar border border-border/50 bg-surface-light/20 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 bg-gold lifi-pulse" />
              <span className="text-[9px] font-black uppercase tracking-wider text-gold/80">
                Status Tracking
              </span>
            </div>
            <div className="flex items-center gap-4 text-[9px] text-text-muted">
              <span>li.quest/v1/status</span>
              <span className="text-text-muted/40">|</span>
              <span>Polls until confirmed</span>
              <span className="text-text-muted/40">|</span>
              <span>Updates dashboard in real-time</span>
            </div>
          </div>
          {/* Vertical connectors from main flow to status bar */}
          <div className="absolute -top-4 left-[11%] w-px h-4 lifi-connector-v" />
          <div className="absolute -top-4 left-[37%] w-px h-4 lifi-connector-v" />
          <div className="absolute -top-4 left-[63%] w-px h-4 lifi-connector-v" />
          <div className="absolute -top-4 left-[89%] w-px h-4 lifi-connector-v" />
        </div>

        {/* LI.FI aggregation detail — what happens inside step 2 */}
        <div className="mt-6 border border-gold/20 bg-gold/5 p-4">
          <div className="mb-3 text-[10px] font-black uppercase tracking-wider text-gold/80">
            Inside LI.FI — Route Aggregation
          </div>
          <div className="grid grid-cols-3 gap-3">
            {/* Bridges */}
            <div className="text-center">
              <div className="text-lg font-black text-gold/60" style={{ fontFamily: "var(--font-heading)" }}>
                Bridges
              </div>
              <div className="mt-1 flex flex-wrap justify-center gap-1">
                {["Stargate", "Across", "Hop", "CCTP", "Connext", "Celer"].map((b) => (
                  <span key={b} className="border border-gold/15 bg-gold/5 px-1.5 py-0.5 text-[8px] text-gold/60">
                    {b}
                  </span>
                ))}
              </div>
              <div className="mt-1 text-[8px] text-text-muted">+ 24 more</div>
            </div>

            {/* DEXs */}
            <div className="text-center">
              <div className="text-lg font-black text-gold/60" style={{ fontFamily: "var(--font-heading)" }}>
                DEXs
              </div>
              <div className="mt-1 flex flex-wrap justify-center gap-1">
                {["Uniswap", "Curve", "1inch", "SushiSwap", "Balancer", "Paraswap"].map((d) => (
                  <span key={d} className="border border-gold/15 bg-gold/5 px-1.5 py-0.5 text-[8px] text-gold/60">
                    {d}
                  </span>
                ))}
              </div>
              <div className="mt-1 text-[8px] text-text-muted">+ hundreds more</div>
            </div>

            {/* Optimization */}
            <div className="text-center">
              <div className="text-lg font-black text-gold/60" style={{ fontFamily: "var(--font-heading)" }}>
                Optimizes
              </div>
              <div className="mt-1 space-y-1">
                {["Lowest fees", "Fastest speed", "Best price", "Least slippage"].map((o) => (
                  <div key={o} className="text-[9px] text-text-muted flex items-center justify-center gap-1">
                    <span className="text-gold/40">&#x25B8;</span> {o}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Concrete example flow */}
        <div className="mt-4 border border-border/30 bg-surface-light/10 p-4">
          <div className="mb-3 text-[10px] font-black uppercase tracking-wider text-text-muted">
            Real Example — Rebalancing to Higher Yield
          </div>
          <div className="flex items-center justify-between gap-2 overflow-x-auto">
            {[
              { label: "Morpho vault on Base", sub: "3.2% APY", color: "text-phase-research" },
              { label: "Agent detects", sub: "Better yield elsewhere", color: "text-crimson", arrow: true },
              { label: "LI.FI bridges USDC", sub: "Base → Arbitrum ($0.08 fee)", color: "text-gold", arrow: true },
              { label: "Deposits into Euler vault", sub: "4.7% APY", color: "text-status-correct", arrow: true },
              { label: "+1.5% yield gained", sub: "Logged to dashboard", color: "text-status-correct", arrow: true },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                {step.arrow && (
                  <span className="text-text-muted/30 text-sm shrink-0">&rarr;</span>
                )}
                <div className="text-center shrink-0">
                  <div className={`text-[10px] font-bold ${step.color}`}>{step.label}</div>
                  <div className="text-[8px] text-text-muted">{step.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .lifi-node {
          position: relative;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .lifi-node:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(230, 57, 70, 0.15);
        }

        .lifi-pulse {
          animation: lifi-pulse-anim 2s ease-in-out infinite;
        }
        @keyframes lifi-pulse-anim {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }

        .lifi-connector-h {
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, rgba(230,57,70,0.3), rgba(255,215,0,0.3));
          position: relative;
        }
        .lifi-connector-h::after {
          content: "";
          position: absolute;
          top: -2px;
          right: -1px;
          width: 0;
          height: 0;
          border-left: 5px solid rgba(255,215,0,0.4);
          border-top: 3px solid transparent;
          border-bottom: 3px solid transparent;
        }

        .lifi-connector-v {
          background: linear-gradient(180deg, rgba(255,215,0,0.2), rgba(255,215,0,0.1));
        }

        .lifi-status-bar {
          position: relative;
          overflow: hidden;
        }
        .lifi-status-bar::before {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,215,0,0.04), transparent);
          animation: status-sweep 3s linear infinite;
        }
        @keyframes status-sweep {
          to { left: 200%; }
        }
      `}</style>
    </div>
  );
}
