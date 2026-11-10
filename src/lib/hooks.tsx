"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { CityData, Summary } from "./types";

export type DemoState = "success" | "loading" | "empty" | "error" | "partial";

export function useDemoState(): DemoState {
  const sp = useSearchParams();
  const v = sp.get("demo");
  if (v === "loading" || v === "empty" || v === "error" || v === "partial") return v;
  return "success";
}

export function useSummary() {
  const demo = useDemoState();
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (demo === "loading") {
      setLoading(true);
      setData(null);
      setError(null);
      return;
    }
    if (demo === "error") {
      setLoading(false);
      setData(null);
      setError("Demonstration of the error state. The archive itself is available when you leave this view.");
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch("/data/summary.json")
      .then((r) => {
        if (!r.ok) throw new Error(`Could not load summary (${r.status})`);
        return r.json();
      })
      .then((j) => {
        if (!cancelled) {
          setData(j);
          setError(null);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [demo]);

  return { data, error, loading: loading || demo === "loading", demo };
}

export function useCity(id: string | null) {
  const demo = useDemoState();
  const [data, setData] = useState<CityData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }
    if (demo === "loading") {
      setLoading(true);
      setData(null);
      setError(null);
      return;
    }
    if (demo === "error") {
      setLoading(false);
      setData(null);
      setError("Demonstration of the error state. Leave this view to load the real city archive.");
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/data/${id}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`Could not load ${id} (${r.status})`);
        return r.json();
      })
      .then((j) => {
        if (!cancelled) {
          setData(j);
          setError(null);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, demo]);

  return { data, error, loading: loading || demo === "loading", demo };
}

export function DemoBanner({ demo }: { demo: DemoState }) {
  if (demo === "success") return null;
  if (demo === "loading") return null;
  const text =
    demo === "error"
      ? "This is the error state, opened with ?demo=error, so you can review the treatment. It does not mean the archive failed."
      : demo === "empty"
        ? "This is the empty state, opened with ?demo=empty, forced to a threshold with no events (or shown because none occurred)."
        : "This is the partial data treatment, opened with ?demo=partial. The figures below are still from the complete archive. A real gap would be marked on the missing lead and excluded from miss rates.";
  return (
    <div className="banner warn" role="status">
      {text}
    </div>
  );
}
