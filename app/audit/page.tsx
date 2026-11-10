"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCity, DemoBanner } from "@/lib/hooks";
import { MissRibbon } from "@/components/MissRibbon";
import { LeadChart } from "@/components/LeadChart";
import { FilterBar } from "@/components/FilterBar";
import { CITY_NAMES, THRESHOLDS, fmtNum, fmtPct, fmtDate } from "@/lib/format";
import { dailySkill, eventsFor, missRatesByLead, scoresFor } from "@/lib/stats";
import type { CityId, SeasonSel } from "@/lib/types";

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

  const rows = useMemo(
    () => (data ? missRatesByLead(data, season, effectiveThreshold) : []),
    [data, season, effectiveThreshold],
  );
  const score = data ? scoresFor(data, season, effectiveThreshold, lead) : null;
  const skill = data ? dailySkill(data, season, thMeta.variable, lead) : null;
  const events = data ? eventsFor(data, season, effectiveThreshold, lead) : [];
  const thBlock = data?.seasons[season === "both" ? "2024" : season]?.thresholds.find(
    (t) => t.id === effectiveThreshold,
  );
  const thresholdValue =
    thBlock?.value ??
    (effectiveThreshold === "t45" ? 45 : effectiveThreshold === "t35" ? 35 : effectiveThreshold === "at406" ? 40.6 : 40);

  const spotlight = events.find((e) => e.label === "miss") || events.find((e) => e.label === "hit");

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 72, width: "50%", marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 24, width: "70%", marginBottom: 32 }} />
        <div className="stat-row">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 96 }} />
          ))}
        </div>
        <div className="skeleton" style={{ height: 220 }} />
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <DemoBanner demo={demo} />
        <h1>This city archive could not be loaded</h1>
        <div className="banner error" role="alert">
          <p>{error}</p>
          <button className="btn" onClick={() => location.reload()}>
            Retry
          </button>
        </div>
        <p>
          Other cities remain available in the <Link href="/audit?city=phoenix">Phoenix audit</Link>.
        </p>
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

  const noEvents = !score || score.observed_events === 0;
  const showEmpty = noEvents || emptyForced;
  const thresholdLabel = thBlock?.label ?? thMeta.label;

  return (
    <div>
      <DemoBanner demo={demo} />
      {demo === "partial" ? (
        <div className="banner warn" role="status">
          <p>
            Partial treatment: a missing lead would be plotted as a gap and excluded from miss rates. This
            archive has zero dropped hours. The figures below are complete.
          </p>
        </div>
      ) : null}

      {showEmpty ? (
        <>
          <h1>No days met this threshold</h1>
          <p className="lede">
            {emptyForced ? CITY_NAMES[effectiveCity] : data.name} had{" "}
            {season === "both"
              ? data.seasons["2024"].n_days + data.seasons["2025"].n_days
              : data.seasons[season].n_days}{" "}
            days in the selected seasons, and none reached {thresholdLabel}. That is a real empty result,
            not a missing file.
          </p>
        </>
      ) : (
        <>
          <h1>
            <span className="accent">{fmtPct(score!.miss_rate)}</span> missed at a {lead} day lead
          </h1>
          <p className="lede">
            {data.name}, {thresholdLabel}
            {thBlock?.kind === "percentile" ? ` (${fmtNum(thBlock.value, 1)} °C at this city)` : ""}.{" "}
            {score!.misses} of {score!.observed_events} event days were forecast too cool. Mean shortfall
            on misses: {fmtNum(score!.mean_shortfall_on_misses)} °C. Grid cells are{" "}
            {fmtNum(data.grid_distance_km, 2)} km apart. Filters change the view only.
          </p>
        </>
      )}

      <FilterBar
        city={city}
        season={season}
        threshold={threshold}
        lead={lead}
        onChange={set}
        showLead={!showEmpty}
      />

      {emptyForced ? (
        <p className="muted">The empty demonstration forces Madrid at 45 °C.</p>
      ) : null}

      {showEmpty ? (
        <p>
          Try 35 °C or the local 95th percentile, or open another city in the filters above.
        </p>
      ) : (
        <>
          <div className="stat-row">
            <div className="stat">
              <div className="figure accent">{fmtPct(score!.miss_rate)}</div>
              <small className="muted">Miss rate at a {lead} day lead</small>
            </div>
            <div className="stat">
              <div className="figure">{fmtNum(score!.mean_shortfall_on_misses)} °C</div>
              <small className="muted">Mean shortfall on missed days</small>
            </div>
            <div className="stat">
              <div className="figure">{score!.observed_events}</div>
              <small className="muted">
                Event days: {score!.hits} hits, {score!.misses} misses, {score!.false_alarms} false alarms
              </small>
            </div>
            <div className="stat">
              <div className="figure">{fmtNum(skill?.skillP, 2)}</div>
              <small className="muted">
                Skill versus persistence. Versus climatology {fmtNum(skill?.skillC, 2)}. {skill?.n}{" "}
                days, mean error {fmtNum(skill?.me, 2)} °C
              </small>
            </div>
          </div>
          <p className="muted">
            Skill is 1 minus forecast MAE over reference MAE, on daily maxima, all complete days (not only
            events). Negative skill means the reference was closer.
          </p>
          {spotlight ? (
            <MissRibbon
              observed={spotlight.obs}
              forecast={spotlight.forecast}
              threshold={thresholdValue}
              lead={lead}
              caption={
                spotlight.label === "miss"
                  ? `Ribbon shows the first missed day in this view: ${fmtDate(spotlight.date)}, ERA5 ${fmtNum(spotlight.obs)} °C, forecast ${fmtNum(spotlight.forecast)} °C.`
                  : `No miss in this view. Ribbon shows ${fmtDate(spotlight.date)} (${spotlight.label.replace("_", " ")}).`
              }
            />
          ) : null}
          {spotlight ? (
            <p>
              <Link href={`/events/${city}/${spotlight.date}?threshold=${effectiveThreshold}&lead=${lead}`}>
                Open {fmtDate(spotlight.date)}
              </Link>
            </p>
          ) : null}
          <LeadChart rows={rows} />
        </>
      )}
    </div>
  );
}
