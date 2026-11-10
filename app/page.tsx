"use client";

import Link from "next/link";
import { useSummary, DemoBanner } from "@/lib/hooks";
import { MissRibbon } from "@/components/MissRibbon";
import { fmtPct, fmtNum, CITY_NAMES } from "@/lib/format";
import { combineScores, weightedMean } from "@/lib/stats";
import type { SummaryCity } from "@/lib/types";

function both(city: SummaryCity, key: "t40" | "t35" | "t45" | "at406", lead: string) {
  const a = city.seasons["2024"]?.[key]?.[lead];
  const b = city.seasons["2025"]?.[key]?.[lead];
  return combineScores([a, b].filter(Boolean) as NonNullable<typeof a>[]);
}

function signed(v: number | null) {
  if (v === null) return "n/a";
  const n = fmtNum(v);
  return v > 0 ? `+${n} °C` : `${n} °C`;
}

function meanError(city: SummaryCity, lead: string) {
  return weightedMean(
    (["2024", "2025"] as const).map((s) => {
      const st = city.seasons[s]?.temperature_leads?.[lead];
      return { value: st?.daily_mean_error, n: st?.n_complete_days };
    }),
  );
}

export default function HomePage() {
  const { data, error, loading, demo } = useSummary();

  if (loading) {
    return (
      <div className="hero">
        <div className="skeleton" style={{ height: 140, width: "55%", marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 36, width: "70%", marginBottom: 20 }} />
        <div className="skeleton" style={{ height: 24, width: "80%", marginBottom: 28 }} />
        <div className="skeleton" style={{ height: 44, width: 200 }} />
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <DemoBanner demo={demo} />
        <div className="banner error" role="alert">
          <h1>The archive could not be loaded</h1>
          <p>{error}</p>
          <button className="btn" onClick={() => location.reload()}>
            Retry
          </button>
        </div>
        <p>
          You can still read the <Link href="/method">method</Link>.
        </p>
      </div>
    );
  }
  if (!data) {
    return (
      <div>
        <h1>The audit is not ready</h1>
        <p>The summary artifact has not been built. Run the ingest script, then refresh.</p>
        <Link href="/method" className="btn-ghost">
          Read the method
        </Link>
      </div>
    );
  }

  const phoenix = data.cities.find((c) => c.id === "phoenix")!;
  const houston = data.cities.find((c) => c.id === "houston")!;
  const madrid = data.cities.find((c) => c.id === "madrid")!;
  const delhi = data.cities.find((c) => c.id === "delhi")!;
  const phx40l3 = both(phoenix, "t40", "3");
  const phx40l7 = both(phoenix, "t40", "7");
  const hou35l3 = both(houston, "t35", "3");
  const mad35l7 = both(madrid, "t35", "7");
  const delAtL7 = both(delhi, "at406", "7");
  const houME = meanError(houston, "3");
  const delME = meanError(delhi, "3");

  return (
    <div>
      <DemoBanner demo={demo} />
      <section className="hero hero-enter">
        <h1>
          <span className="hero-stat">{fmtPct(phx40l3.miss_rate)}</span>
          <span className="hero-line">missed at a 3 day lead</span>
        </h1>
        <p className="lede">
          Of {phx40l3.observed_events} Phoenix days at or above 40 °C across May to September 2024 and
          2025, {phx40l3.misses} were forecast too cool to cross the mark. Mean shortfall on those
          misses: {fmtNum(phx40l3.mean_shortfall_on_misses)} °C.
        </p>
        <div className="hero-actions">
          <Link href="/audit?city=phoenix&season=both&threshold=t40&lead=3" className="btn-primary">
            Open the audit
          </Link>
          <Link href="/method" className="btn-ghost">
            How it was measured
          </Link>
        </div>
      </section>

      <section className="section">
        <h2>One day in Phoenix</h2>
        <MissRibbon
          observed={40.7}
          forecast={37.7}
          threshold={40}
          lead={3}
          caption="On 1 July 2024 the ERA5 daily maximum in Phoenix was 40.7 °C. The GFS forecast issued 3 days earlier called for 37.7 °C, 3.0 °C too cool, and below the 40 °C mark."
        />
        <p className="muted">
          At a 7 day lead, {fmtPct(phx40l7.miss_rate)} of the same {phx40l7.observed_events} days were
          missed, with a mean shortfall of {fmtNum(phx40l7.mean_shortfall_on_misses)} °C on those{" "}
          {phx40l7.misses} missed days.
        </p>
      </section>

      <section className="section">
        <h2>The four city record</h2>
        <p className="lede">
          Underprediction is not universal. Houston and Delhi ran too warm on average in dry bulb, so
          the audit reports false alarms and mean error as well as misses.
        </p>
        <div className="record">
          <article className="poster">
            <h3>{CITY_NAMES.phoenix}</h3>
            <div className="figure accent">{fmtPct(phx40l3.miss_rate)}</div>
            <p>
              Miss rate at 40 °C, 3 day lead, {phx40l3.misses} of {phx40l3.observed_events} days.
            </p>
          </article>
          <article className="poster">
            <h3>{CITY_NAMES.houston}</h3>
            <div className="figure">{signed(houME)}</div>
            <p>
              Mean error on daily maxima at a 3 day lead (too warm). At 35 °C, {hou35l3.false_alarms}{" "}
              false alarms and {hou35l3.misses} misses from {hou35l3.observed_events} events.
            </p>
          </article>
          <article className="poster">
            <h3>{CITY_NAMES.madrid}</h3>
            <div className="figure accent">{fmtPct(mad35l7.miss_rate)}</div>
            <p>
              Miss rate at 35 °C, 7 day lead, {mad35l7.misses} of {mad35l7.observed_events} days, mean
              shortfall {fmtNum(mad35l7.mean_shortfall_on_misses)} °C.
            </p>
          </article>
          <article className="poster">
            <h3>{CITY_NAMES.delhi}</h3>
            <div className="figure accent">{fmtPct(delAtL7.miss_rate)}</div>
            <p>
              Miss rate at 40.6 °C apparent temperature, 7 day lead, {delAtL7.misses} of{" "}
              {delAtL7.observed_events} days. Dry bulb mean error at a 3 day lead was{" "}
              {signed(delME)} (too warm).
            </p>
          </article>
        </div>
      </section>

      <p className="muted" style={{ marginTop: 48 }}>
        Model: {data.model}. Observation: ERA5. Generated {data.generated_at} (UTC). Day 0 is never used
        as truth. See the method for parameter names and the limitations for what is not in this build.
      </p>
    </div>
  );
}
