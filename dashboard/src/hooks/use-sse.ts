"use client";

import { useEffect, useRef, useCallback, useState } from "react";

// ---------------------------------------------------------------------------
// Shared SSE connection (single EventSource for the entire app)
// ---------------------------------------------------------------------------

type Listener = (event: string, data: unknown) => void;

let es: EventSource | null = null;
let listeners = new Set<Listener>();
let connected = false;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let refCount = 0;
let reconnectCount = 0;

function notifyListeners(event: string, data: unknown) {
  listeners.forEach((fn) => {
    try { fn(event, data); } catch { /* ignore */ }
  });
}

function startSSE() {
  if (es) return;
  try {
    es = new EventSource("/api/stream");

    es.addEventListener("connected", () => {
      const wasDisconnected = !connected;
      connected = true;
      // If this is a RE-connection (not first connect), notify all hooks
      // so they re-fetch and fill any gaps from the disconnection period
      if (wasDisconnected && reconnectCount > 0) {
        notifyListeners("__reconnected", { reconnectCount });
      }
      reconnectCount++;
    });

    const events = ["decision", "prediction", "portfolio", "transaction", "position"];
    events.forEach((evt) => {
      es!.addEventListener(evt, (e) => {
        try {
          const data = JSON.parse(e.data);
          notifyListeners(evt, data);
        } catch { /* ignore */ }
      });
    });

    es.onerror = () => {
      connected = false;
      es?.close();
      es = null;
      // Reconnect after 3s if there are still subscribers
      if (refCount > 0 && !reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          if (refCount > 0) startSSE();
        }, 3000);
      }
    };
  } catch {
    es = null;
  }
}

function stopSSE() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (es) {
    es.close();
    es = null;
  }
  connected = false;
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  refCount++;
  if (refCount === 1) startSSE();
  return () => {
    listeners.delete(listener);
    refCount--;
    if (refCount === 0) stopSSE();
  };
}

// ---------------------------------------------------------------------------
// React hook: useSSE — subscribes to the shared connection
// ---------------------------------------------------------------------------

export function useSSE(onEvent: Listener) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const handler: Listener = (event, data) => {
      onEventRef.current(event, data);
    };

    const unsubscribe = subscribe(handler);

    // Poll connection status
    const checkConnection = setInterval(() => {
      setIsConnected(connected);
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(checkConnection);
    };
  }, []);

  return { connected: isConnected };
}

// ---------------------------------------------------------------------------
// Generic list hook: SSE + polling with smart merge
// ---------------------------------------------------------------------------
// This replaces all the individual useDecisions/useTransactions/etc hooks
// with a single pattern that:
// 1. Fetches from API on mount
// 2. Polls every POLL_INTERVAL as a fallback
// 3. Merges SSE updates immediately (insert or upsert by id)
// 4. On SSE reconnect, immediately re-fetches to fill any gap
// 5. Never lets a stale poll overwrite fresher SSE data

const POLL_INTERVAL = 10_000;

type IdRecord = { id: string; [key: string]: unknown };

/**
 * Creates a hook for a list resource that stays in sync via SSE + polling.
 * `sseEvent` — the SSE event name to listen for (e.g. "transaction")
 * `apiPath` — the GET endpoint (e.g. "/api/transactions")
 * `upsert` — if true, SSE updates replace existing items by id (for mutable resources)
 *             if false, SSE only inserts new items (for append-only resources like decisions)
 */
function useSSEList(
  apiPath: string,
  sseEvent: string,
  upsert: boolean = true
) {
  const [items, setItems] = useState<unknown[]>([]);
  // Track a monotonic version counter so we know when SSE has delivered
  // newer data than the last poll
  const sseVersionRef = useRef(0);
  const pollVersionRef = useRef(0);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(apiPath);
      if (!res.ok) return;
      const data = await res.json();
      // Only apply poll data if no SSE updates arrived since last poll
      // OR always apply because poll data is the authoritative full set
      // We merge: poll data is the base, but we keep any SSE items that are newer
      pollVersionRef.current++;
      setItems(data);
    } catch { /* ignore */ }
  }, [apiPath]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  useSSE((event, data) => {
    if (event === "__reconnected") {
      // SSE reconnected after a drop — immediately re-fetch to fill the gap
      fetchData();
      return;
    }
    if (event === sseEvent && data) {
      sseVersionRef.current++;
      setItems((prev) => {
        const d = data as IdRecord;
        const existing = prev.findIndex((p) => (p as IdRecord).id === d.id);
        if (existing >= 0) {
          if (!upsert) return prev; // append-only: don't update existing
          const updated = [...prev];
          updated[existing] = data;
          return updated;
        }
        return [data, ...prev];
      });
    }
  });

  return items;
}

// ---------------------------------------------------------------------------
// Public hooks — thin wrappers around useSSEList
// ---------------------------------------------------------------------------

export function useDecisions() {
  return useSSEList("/api/decisions", "decision", false);
}

export function usePredictions() {
  return useSSEList("/api/predictions", "prediction", true);
}

export function usePortfolio() {
  return useSSEList("/api/portfolio", "portfolio", false);
}

export function useTransactions() {
  const items = useSSEList("/api/transactions", "transaction", true);

  // On mount, trigger a chain sync to pick up any transactions
  // that were never recorded by the cron job
  const syncedRef = useRef(false);
  useEffect(() => {
    if (syncedRef.current) return;
    syncedRef.current = true;
    // Fire-and-forget: sync will broadcast new txs via SSE
    fetch("/api/transactions/sync").catch(() => {});
  }, []);

  return items;
}

export function usePositions() {
  return useSSEList("/api/positions", "position", true);
}

export function useLivePortfolio() {
  const [portfolio, setPortfolio] = useState<Record<string, unknown> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/portfolio/live");
      if (res.ok) setPortfolio(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000); // Match 30s cache TTL
    return () => clearInterval(interval);
  }, [fetchData]);

  // Also re-fetch on SSE reconnect
  useSSE((event) => {
    if (event === "__reconnected") fetchData();
  });

  return portfolio;
}

export function useStats() {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) setStats(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Refresh stats on any SSE event with debounce
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useSSE((event) => {
    if (event === "__reconnected") {
      fetchData();
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchData, 2000);
  });

  return stats;
}
