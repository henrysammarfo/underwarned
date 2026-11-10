"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import type { CityData, LeadScore } from "@/lib/types";
import { CITY_ORDER, CITY_NAMES, THRESHOLDS, fmtNum, fmtPct } from "@/lib/format";
import { scoresFor } from "@/lib/stats";
import { useDemoState, DemoBanner } from "@/lib/hooks";
import { LEADS } from "@/lib/types";
import type { SeasonSel } from "@/lib/types";

export default function ComparePage() {
  const sp = useSearchParams();
  const router = useRouter();
  const demo = useDemoState();
  const season = (sp.get("season") as SeasonSel) || "both";
  const threshold = sp.get("threshold") || "t40";
  const lead = Number(sp.get("lead") || "3");
  const [cities, setCities] = useState<Record<string, CityData | "error" | "loading">>({
    phoenix: "loading",
    houston: "loading",
    madrid: "loading",
    delhi: "loading",
  });

  useEffect(() => {
    if (demo === "loading") {
      setCities({ phoenix: "loading", houston: "loading", madrid: "loading", delhi: "loading" });
      return;
    }
    if (demo === "error") {
      setCities({ phoenix: "error", houston: "error", madrid: "error", delhi: "error" });
      return;
    }
    let cancelled = false;
    CITY_ORDER.forEach((id) => {
      fetch(`/data/${id}.json`)
        .then((r) => {
          if (!r.ok) throw new Error("fail");
          return r.json();
        })
        .then((j) => {
          if (!cancelled) setCities((s) => ({ ...s, [id]: j }));
        })
        .catch(() => {
          if (!cancelled) setCities((s) => ({ ...s, [id]: "error" }));
        });
    });
    return () => {
      cancelled = true;
    };
  }, [demo]);

  function set(q: Record<string, string>) {
    const next = new URLSearchParams(sp.toString());
    Object.entries(q).forEach(([k, v]) => next.set(k, v));
    router.replace(`/compare?${next.toString()}`, { scroll: false });
  }

  const effectiveThreshold = demo === "empty" ? "t45" : threshold;
  const loading = Object.values(cities).some((v) => v === "loading") && demo !== "error";

  if (demo === "loading" || loading) {
    return (
      <div>
        <h1>Compare cities</h1>
        <div className="grid-4" style={{ marginTop: 16 }}>
          {CITY_ORDER.map((id) => (
            <div key={id} className="skeleton" style={{ height: 140 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <DemoBanner demo={demo} />
      <h1>Compare cities</h1>
      <p className="muted">
        The same threshold and lead, across all four cities, for the selected seasons. A city with no events
        is labelled honestly, not left blank.
      </p>
      <div className="filters">
        <label>
          Season
          <select value={season} onChange={(e) => set({ season: e.target.value })}>
            <option value="both">Both summers</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
          </select>
        </label>
        <label>
          Threshold
          <select value={threshold} onChange={(e) => set({ threshold: e.target.value })}>
            {THRESHOLDS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Lead
          <select value={String(lead)} onChange={(e) => set({ lead: e.target.value })}>
            {LEADS.map((L) => (
              <option key={L} value={String(L)}>
                {L} day
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid-2">
        {CITY_ORDER.map((id) => {
          const entry = cities[id];
          if (entry === "error") {
            return (
              <div key={id} className="card">
                <h3>{CITY_NAMES[id]}</h3>
                <p className="danger">This city file failed to load.</p>
                <button className="btn" onClick={() => location.reload()}>
                  Retry
                </button>
              </div>
            );
          }
          if (entry === "loading" || !entry) {
            return (
              <div key={id} className="card">
                <h3>{CITY_NAMES[id]}</h3>
                <p className="muted">Pending.</p>
              </div>
            );
          }
          const score: LeadScore | null = scoresFor(entry, season, effectiveThreshold, lead);
          if (!score || score.observed_events === 0) {
            return (
              <div key={id} className="card">
                <h3>{CITY_NAMES[id]}</h3>
                <p>No days at this threshold.</p>
                <Link href={`/audit?city=${id}&threshold=${effectiveThreshold}&lead=${lead}`}>Open audit</Link>
              </div>
            );
          }
          return (
            <div key={id} className="card">
              <h3>{CITY_NAMES[id]}</h3>
              <div className="figure accent">{fmtPct(score.miss_rate)}</div>
              <p style={{ margin: "8px 0 0" }}>
                Miss rate at a {lead} day lead, {score.observed_events} events, {score.misses} misses, mean
                shortfall {fmtNum(score.mean_shortfall_on_misses)} °C, {score.false_alarms} false alarms.
              </p>
              <Link href={`/audit?city=${id}&season=${season}&threshold=${effectiveThreshold}&lead=${lead}`}>
                Open audit
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
