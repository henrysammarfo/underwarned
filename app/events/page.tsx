"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCity, DemoBanner } from "@/lib/hooks";
import { FilterBar } from "@/components/FilterBar";
import { CITY_NAMES, fmtNum, fmtDate } from "@/lib/format";
import { eventsFor, scoresFor } from "@/lib/stats";
import type { CityId, SeasonSel } from "@/lib/types";

function statusClass(label: string) {
  if (label === "miss") return "status-miss";
  if (label === "hit") return "status-hit";
  if (label === "false_alarm") return "status-false";
  return "status-inc";
}

function statusLabel(label: string) {
  return label.replace("_", " ");
}

export default function EventsPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const city = (sp.get("city") as CityId) || "phoenix";
  const season = (sp.get("season") as SeasonSel) || "both";
  const threshold = sp.get("threshold") || "t40";
  const lead = Number(sp.get("lead") || "3");
  const { data, error, loading, demo } = useCity(city);

  function set(q: Record<string, string>) {
    const next = new URLSearchParams(sp.toString());
    Object.entries(q).forEach(([k, v]) => next.set(k, v));
    router.replace(`/events?${next.toString()}`, { scroll: false });
  }

  const effectiveThreshold = demo === "empty" ? "t45" : threshold;
  const score = data ? scoresFor(data, season, effectiveThreshold, lead) : null;
  const rows = data
    ? eventsFor(data, season, effectiveThreshold, lead).filter((r) => r.label !== "non_event")
    : [];

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 48, width: "40%", marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 280 }} />
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <DemoBanner demo={demo} />
        <h1>Events could not be loaded</h1>
        <div className="banner error" role="alert">
          <p>{error}</p>
          <button className="btn" onClick={() => location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }
  if (!data) {
    return (
      <div>
        <h1>The city artifact is missing</h1>
        <p>Run the ingest script and refresh.</p>
      </div>
    );
  }

  return (
    <div>
      <DemoBanner demo={demo} />
      <h1>Event days</h1>
      <p className="lede">
        Days in {CITY_NAMES[city]} when the observation or the forecast crossed the threshold at the
        selected lead. Incomplete days are listed separately and are not counted as misses.
      </p>
      <FilterBar
        city={city}
        season={season}
        threshold={threshold}
        lead={lead}
        onChange={set}
      />
      {score ? (
        <p>
          {score.observed_events} observed events, {score.hits} hits, {score.misses} misses,{" "}
          {score.false_alarms} false alarms, {score.incomplete_days} incomplete.
        </p>
      ) : null}
      {rows.length === 0 ? (
        <div>
          <h2>No event days</h2>
          <p>
            No day in this selection met the threshold. That is a real empty result. Try a lower
            threshold or another city.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="data">
            <thead>
              <tr>
                <th>Date</th>
                <th>Label</th>
                <th className="num">ERA5 °C</th>
                <th className="num">Forecast °C</th>
                <th className="num">Shortfall °C</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.date + r.label}>
                  <td>
                    <Link href={`/events/${city}/${r.date}?threshold=${effectiveThreshold}&lead=${lead}`}>
                      {fmtDate(r.date)}
                    </Link>
                  </td>
                  <td>
                    <span className={statusClass(r.label)}>{statusLabel(r.label)}</span>
                  </td>
                  <td className="num">{fmtNum(r.obs)}</td>
                  <td className="num">{fmtNum(r.forecast)}</td>
                  <td className="num">{r.shortfall === null ? "n/a" : fmtNum(r.shortfall)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
