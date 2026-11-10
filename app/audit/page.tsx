"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCity, DemoBanner } from "@/lib/hooks";
import { MissRibbon } from "@/components/MissRibbon";
import { LeadChart } from "@/components/LeadChart";
import { CITY_NAMES, CITY_ORDER, THRESHOLDS, fmtNum, fmtPct } from "@/lib/format";
import { dailySkill, eventsFor, missRatesByLead, scoresFor } from "@/lib/stats";
import type { CityId, SeasonSel } from "@/lib/types";
import { LEADS } from "@/lib/types";

export default function AuditPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const city = (sp.get("city") as CityId) || "phoenix";
  const season = (sp.get("season") as SeasonSel) || "both";
  const threshold = sp.get("threshold") || "t40";
  const lead = Number(sp.get("lead") || "3") as 1 | 2 | 3 | 4 | 5 | 6 | 7;
  const { data, error, loading, demo } = useCity(city);

  function set(q: Record<string, string>) {
    const next = new URLSearchParams(sp.toString());
    Object.entries(q).forEach(([k, v]) => next.set(k, v));
    router.replace(`/audit?${next.toString()}`, { scroll: false });
  }

  const thMeta = THRESHOLDS.find((t) => t.id === threshold) || THRESHOLDS[1];
  const emptyForced = demo === "empty";
  const effectiveThreshold = emptyForced ? "t45" : threshold;
  const effectiveCity = emptyForced ? "madrid" : city;

  const rows = useMemo(() => (data ? missRatesByLead(data, season, effectiveThreshold) : []), [data, season, effectiveThreshold]);
  const score = data ? scoresFor(data, season, effectiveThreshold, lead) : null;
  const skill = data ? dailySkill(data, season, thMeta.variable, lead) : null;
  const events = data ? eventsFor(data, season, effectiveThreshold, lead) : [];
  const thBlock = data?.seasons[season === "both" ? "2024" : season]?.thresholds.find((t) => t.id === effectiveThreshold);
  const thresholdValue = thBlock?.value ?? (effectiveThreshold === "t45" ? 45 : effectiveThreshold === "t35" ? 35 : effectiveThreshold === "at406" ? 40.6 : 40);

  const spotlight = events.find((e) => e.label === "miss") || events.find((e) => e.label === "hit");

  if (loading) {
    return (
      <div>
        <h1>Audit</h1>
        <div className="skeleton" style={{ height: 48, margin: "16px 0" }} />
        <div className="grid-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 96 }} />
          ))}
        </div>
        <div className="skeleton" style={{ height: 180, marginTop: 16 }} />
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <DemoBanner demo={demo} />
        <h1>Audit</h1>
        <div className="banner error" role="alert">
          <p>This city archive could not be loaded. {error}</p>
          <button className="btn" onClick={() => location.reload()}>
            Retry
          </button>
        </div>
        <p>
          Other cities remain available in the{" "}
          <Link href="/audit?city=phoenix">Phoenix audit</Link>.
        </p>
      </div>
    );
  }
  if (!data) {
    return (
      <div>
        <h1>Audit</h1>
        <p>The city artifact is missing. Run the ingest script and refresh.</p>
      </div>
    );
  }

  const noEvents = !score || score.observed_events === 0;
  const showEmpty = noEvents || emptyForced;

  return (
    <div>
      <DemoBanner demo={demo} />
      {demo === "partial" ? (
        <div className="banner warn">
          Partial treatment: a missing lead would be plotted as a gap and excluded from miss rates. This
          archive has zero dropped hours. The figures below are complete.
        </div>
      ) : null}
      <h1>Audit</h1>
      <p className="muted">
        {data.name}. {data.model} versus ERA5. Grid cells are {fmtNum(data.grid_distance_km, 2)} km apart.
        Filters change the view only.
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
            <option value="both">May to September, 2024 and 2025</option>
            <option value="2024">May to September 2024</option>
            <option value="2025">May to September 2025</option>
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
      </div>
      <p className="muted">
        Threshold used: {thBlock?.label ?? thMeta.label}
        {thBlock?.kind === "percentile" ? ` (${fmtNum(thBlock.value, 1)} °C at this city).` : "."}
        {emptyForced ? " Empty demonstration forces Madrid at 45 °C." : ""}
      </p>

      {showEmpty ? (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2>No days met this threshold</h2>
          <p>
            {emptyForced ? CITY_NAMES[effectiveCity] : data.name} had {data.seasons["2024"].n_days + data.seasons["2025"].n_days}{" "}
            days in the two warm seasons (or the selected season), and none reached this mark. That is a
            real empty result, not a missing file. Try 35 °C or the local 95th percentile.
          </p>
        </div>
      ) : (
        <>
          <div className="grid-4" style={{ marginBottom: 20 }}>
            <div className="card">
              <div className="figure accent">{fmtPct(score!.miss_rate)}</div>
              <small className="muted">Miss rate at a {lead} day lead</small>
            </div>
            <div className="card">
              <div className="figure">{fmtNum(score!.mean_shortfall_on_misses)} °C</div>
              <small className="muted">Mean shortfall on missed days</small>
            </div>
            <div className="card">
              <div className="figure">{score!.observed_events}</div>
              <small className="muted">
                Observed event days ({score!.hits} hits, {score!.misses} misses, {score!.false_alarms} false alarms)
              </small>
            </div>
            <div className="card">
              <div className="figure">{fmtNum(skill?.skillP, 2)}</div>
              <small className="muted">
                Daily max skill versus persistence (climatology {fmtNum(skill?.skillC, 2)}). n = {skill?.n} days. Mean error {fmtNum(skill?.me, 2)} °C.
              </small>
            </div>
          </div>
          <p className="muted" style={{ marginTop: -8 }}>
            Skill is 1 minus forecast MAE over reference MAE, on daily maxima, all complete days (not only events).
            Negative skill means the reference was closer.
          </p>
          <div className="filters">
            <span className="muted" style={{ alignSelf: "center" }}>
              Lead time
            </span>
            <div className="lead-row">
              {LEADS.map((L) => (
                <button
                  key={L}
                  className={`lead-btn ${L === lead ? "active" : ""}`}
                  onClick={() => set({ lead: String(L) })}
                >
                  {L}d
                </button>
              ))}
            </div>
          </div>
          {spotlight ? (
            <MissRibbon
              observed={spotlight.obs}
              forecast={spotlight.forecast}
              threshold={thresholdValue}
              lead={lead}
            />
          ) : null}
          <p className="muted">
            {spotlight?.label === "miss"
              ? `Ribbon shows the first missed day in this view: ${spotlight.date}, ERA5 ${fmtNum(spotlight.obs)} °C, forecast ${fmtNum(spotlight.forecast)} °C.`
              : spotlight
                ? `No miss in this view. Ribbon shows ${spotlight.date} (${spotlight.label}).`
                : null}
            {spotlight ? (
              <>
                {" "}
                <Link href={`/events/${city}/${spotlight.date}?threshold=${effectiveThreshold}&lead=${lead}`}>
                  Open the day
                </Link>
              </>
            ) : null}
          </p>
          <div style={{ marginTop: 20 }}>
            <LeadChart rows={rows} />
          </div>
        </>
      )}
    </div>
  );
}
