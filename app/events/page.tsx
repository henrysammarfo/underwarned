"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCity, DemoBanner } from "@/lib/hooks";
import { CITY_NAMES, CITY_ORDER, THRESHOLDS, fmtNum } from "@/lib/format";
import { eventsFor, scoresFor } from "@/lib/stats";
import type { CityId, SeasonSel } from "@/lib/types";
import { LEADS } from "@/lib/types";

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
  const rows = data ? eventsFor(data, season, effectiveThreshold, lead).filter((r) => r.label !== "non_event") : [];

  if (loading) {
    return (
      <div>
        <h1>Events</h1>
        <div className="skeleton" style={{ height: 240, marginTop: 16 }} />
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <DemoBanner demo={demo} />
        <h1>Events</h1>
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
        <h1>Events</h1>
        <p>The city artifact is missing.</p>
      </div>
    );
  }

  return (
    <div>
      <DemoBanner demo={demo} />
      <h1>Events</h1>
      <p className="muted">
        Days when the observation or the forecast crossed the threshold at the selected lead. Incomplete days
        are listed separately and are not counted as misses.
      </p>
      <div className="filters">
        <label>
          City
          <select value={city} onChange={(e) => set({ city: e.target.value })}>
            {CITY_ORDER.map((id) => (
              <option key={id} value={id}>
                {CITY_NAMES[id]}
              </option>
            ))}
          </select>
        </label>
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
      {score ? (
        <p>
          {score.observed_events} observed events, {score.hits} hits, {score.misses} misses, {score.false_alarms}{" "}
          false alarms, {score.incomplete_days} incomplete.
        </p>
      ) : null}
      {rows.length === 0 ? (
        <div className="card">
          <h2>No event days</h2>
          <p>
            No day in this selection met the threshold. That is a real empty result. Try a lower threshold or
            another city.
          </p>
        </div>
      ) : (
        <div className="card" style={{ overflowX: "auto" }}>
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
                      {r.date}
                    </Link>
                  </td>
                  <td>
                    <span
                      className={
                        r.label === "miss"
                          ? "pill pill-miss"
                          : r.label === "hit"
                            ? "pill pill-hit"
                            : r.label === "false_alarm"
                              ? "pill pill-fa"
                              : "pill pill-inc"
                      }
                    >
                      {r.label.replace("_", " ")}
                    </span>
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
