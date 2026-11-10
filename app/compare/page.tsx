"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import type { CityData, LeadScore } from "@/lib/types";
import { CITY_ORDER, CITY_NAMES, fmtNum, fmtPct } from "@/lib/format";
import { scoresFor } from "@/lib/stats";
import { useDemoState, DemoBanner } from "@/lib/hooks";
import { FilterBar } from "@/components/FilterBar";
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
        <div className="skeleton" style={{ height: 48, width: "40%", marginBottom: 16 }} />
        <div className="record" style={{ marginTop: 16 }}>
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
      <p className="lede">
        The same threshold and lead, across all four cities, for the selected seasons. A city with no
        events is labelled honestly, not left blank. Small samples always print their event count.
      </p>
      <FilterBar
        season={season}
        threshold={threshold}
        lead={lead}
        onChange={set}
        showCity={false}
      />
      <div className="record">
        {CITY_ORDER.map((id) => {
          const entry = cities[id];
          if (entry === "error") {
            return (
              <article key={id} className="poster">
                <h3>{CITY_NAMES[id]}</h3>
                <p className="danger">This city file failed to load.</p>
                <button className="btn" onClick={() => location.reload()}>
                  Retry
                </button>
              </article>
            );
          }
          if (entry === "loading" || !entry) {
            return (
              <article key={id} className="poster">
                <h3>{CITY_NAMES[id]}</h3>
                <p className="muted">Pending.</p>
              </article>
            );
          }
          const score: LeadScore | null = scoresFor(entry, season, effectiveThreshold, lead);
          if (!score || score.observed_events === 0) {
            return (
              <article key={id} className="poster">
                <h3>{CITY_NAMES[id]}</h3>
                <div className="figure">None</div>
                <p>No days at this threshold. Try 35 °C or the local 95th percentile.</p>
                <Link href={`/audit?city=${id}&threshold=${effectiveThreshold}&lead=${lead}`}>
                  Open audit
                </Link>
              </article>
            );
          }
          return (
            <article key={id} className="poster">
              <h3>{CITY_NAMES[id]}</h3>
              <div className="figure accent">{fmtPct(score.miss_rate)}</div>
              <p>
                Miss rate at a {lead} day lead, {score.misses} of {score.observed_events} events, mean
                shortfall {fmtNum(score.mean_shortfall_on_misses)} °C, {score.false_alarms} false alarms.
              </p>
              <Link href={`/audit?city=${id}&season=${season}&threshold=${effectiveThreshold}&lead=${lead}`}>
                Open audit
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
