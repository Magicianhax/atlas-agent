"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AlertType = "info" | "warning" | "danger" | "success";

interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
}

interface AlertToastProps {
  type: AlertType;
  title: string;
  message: string;
  onClose: () => void;
}

interface AlertToastContainerProps {
  alerts: Alert[];
  onDismiss: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Color config
// ---------------------------------------------------------------------------

const TYPE_ACCENT: Record<AlertType, { border: string; text: string; bg: string; glow: string }> = {
  info: {
    border: "#4a9eff",
    text: "#4a9eff",
    bg: "rgba(74, 158, 255, 0.06)",
    glow: "rgba(74, 158, 255, 0.15)",
  },
  warning: {
    border: "#ffd700",
    text: "#ffd700",
    bg: "rgba(255, 215, 0, 0.06)",
    glow: "rgba(255, 215, 0, 0.15)",
  },
  danger: {
    border: "#e63946",
    text: "#e63946",
    bg: "rgba(230, 57, 70, 0.06)",
    glow: "rgba(230, 57, 70, 0.15)",
  },
  success: {
    border: "#22c55e",
    text: "#22c55e",
    bg: "rgba(34, 197, 94, 0.06)",
    glow: "rgba(34, 197, 94, 0.15)",
  },
};

// ---------------------------------------------------------------------------
// AlertToast — single toast component
// ---------------------------------------------------------------------------

export function AlertToast({ type, title, message, onClose }: AlertToastProps) {
  const accent = TYPE_ACCENT[type];
  const [fading, setFading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setFading(true);
      // Allow fade animation to complete before closing
      setTimeout(onClose, 300);
    }, 5000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onClose]);

  return (
    <div
      className={cn(
        "relative border-2 border-border bg-surface/95 backdrop-blur-sm animate-slash-in",
        "transition-all duration-300",
        fading && "opacity-0 translate-x-4"
      )}
      style={{
        borderLeftWidth: "4px",
        borderLeftColor: accent.border,
        backgroundColor: accent.bg,
        boxShadow: `3px 3px 0 #0d0d0d, 0 0 12px ${accent.glow}`,
        maxWidth: "380px",
        width: "100%",
      }}
    >
      {/* P5 diagonal stripes overlay */}
      <div className="absolute inset-0 p5-stripes pointer-events-none" />

      <div className="relative flex items-start gap-3 px-4 py-3">
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4
            className="text-[11px] font-black uppercase tracking-[0.15em] mb-1"
            style={{
              color: accent.text,
              fontFamily: "var(--font-heading)",
              transform: "skewX(-3deg)",
              display: "inline-block",
            }}
          >
            <span style={{ transform: "skewX(3deg)", display: "inline-block" }}>
              {title}
            </span>
          </h4>
          <p className="text-xs leading-relaxed text-text-muted">{message}</p>
        </div>

        {/* Close button */}
        <button
          onClick={() => {
            if (timerRef.current) clearTimeout(timerRef.current);
            setFading(true);
            setTimeout(onClose, 150);
          }}
          className="shrink-0 p-0.5 text-text-muted hover:text-text transition-colors"
          style={{
            transform: "skewX(-3deg)",
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Auto-dismiss progress bar */}
      <div className="relative h-[2px] w-full overflow-hidden bg-border/30">
        <div
          className="absolute left-0 top-0 h-full"
          style={{
            backgroundColor: accent.border,
            animation: "toast-progress 5s linear forwards",
          }}
        />
      </div>

      <style jsx>{`
        @keyframes toast-progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AlertToastContainer — manages a stack of toasts
// ---------------------------------------------------------------------------

export function AlertToastContainer({ alerts, onDismiss }: AlertToastContainerProps) {
  // Show newest on top, limit to 3
  const visible = alerts.slice(-3).reverse();

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-3"
      style={{ pointerEvents: "none" }}
    >
      {visible.map((alert, i) => (
        <div
          key={alert.id}
          style={{
            pointerEvents: "auto",
            animationDelay: `${i * 80}ms`,
          }}
        >
          <AlertToast
            type={alert.type as AlertType}
            title={alert.title}
            message={alert.message}
            onClose={() => onDismiss(alert.id)}
          />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// useAlerts hook — state management for toasts
// ---------------------------------------------------------------------------

let alertCounter = 0;

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addAlert = useCallback(
    (type: AlertType, title: string, message: string) => {
      const id = `alert-${Date.now()}-${++alertCounter}`;
      const alert: Alert = { id, type, title, message };

      setAlerts((prev) => [...prev, alert]);

      // Auto-remove after 5.5s (toast fades at 5s, remove from state at 5.5s)
      const timer = setTimeout(() => {
        dismissAlert(id);
      }, 5500);
      timersRef.current.set(id, timer);

      return id;
    },
    [dismissAlert]
  );

  // Cleanup timers on unmount
  useEffect(() => {
    const currentTimers = timersRef.current;
    return () => {
      currentTimers.forEach((timer) => clearTimeout(timer));
      currentTimers.clear();
    };
  }, []);

  return { alerts, addAlert, dismissAlert };
}
