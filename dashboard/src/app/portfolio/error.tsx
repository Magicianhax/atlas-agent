"use client";

export default function PortfolioError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="rounded border border-red-500/30 bg-red-500/10 px-6 py-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-red-400">
          Portfolio Error
        </h2>
        <p className="mt-2 text-xs text-text-muted max-w-md">
          {error.message || "Something went wrong loading portfolio data."}
        </p>
      </div>
      <button
        onClick={reset}
        className="rounded border border-border bg-surface px-4 py-2 text-xs text-text hover:bg-surface-light transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
