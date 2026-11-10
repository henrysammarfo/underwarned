"use client";

import Link from "next/link";
import { useSummary, DemoBanner } from "@/lib/hooks";
import { MissRibbon } from "@/components/MissRibbon";
import { fmtPct, fmtNum } from "@/lib/format";
import { combineScores } from "@/lib/stats";

export default function HomePage() {
  const { data, error, loading, demo } = useSummary();

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 64, width: "60%", marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 24, width: "80%", marginBottom: 24 }} />
        <div className="skeleton" style={{ height: 160 }} />
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <DemoBanner demo={demo} />
        <div className="banner error" role="alert">
          <p>The summary file could not be loaded. {error}</p>
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
        <Link href="/method">Read the method</Link>
      </div>
    );
  }

  const phoenix = data.cities.find((c) => c.id === "phoenix")!;
  const s24 = phoenix.seasons["2024"].t40["3"];
  const s25 = phoenix.seasons["2025"].t40["3"];
  const phx40l3 = combineScores([s24, s25]);
  const s24l7 = phoenix.seasons["2024"].t40["7"];
  const s25l7 = phoenix.seasons["2025"].t40["7"];
  const phx40l7 = combineScores([s24l7, s25l7]);

  return (
    <div>
      <DemoBanner demo={demo} />
      <p className="muted" style={{ marginBottom: 8 }}>
        DATANOVA 2026 · DN-OP-01 Open Innovation
      </p>
      <h1 className="hero-display">Underwarned</h1>
      <p className="lede">
        How often the forecast is too cool when the heat actually arrives. We compare Open-Meteo Previous
        Runs (GFS seamless) at fixed 1 to 7 day leads with ERA5, in four cities, across May to September
        2024 and 2025.
      </p>

      <h2 style={{ margin: "24px 0 12px" }}>One day in Phoenix</h2>
      <p>
        On 1 July 2024 the ERA5 daily maximum in Phoenix was 40.7 °C. The GFS forecast issued 3 days
        earlier called for 37.7 °C, 3.0 °C too cool, and below the 40 °C mark.
      </p>
      <MissRibbon observed={40.7} forecast={37.7} threshold={40} lead={3} />

      <div className="grid-2" style={{ marginTop: 20 }}>
        <div className="card">
          <div className="figure accent">{fmtPct(phx40l3.miss_rate)}</div>
          <p style={{ margin: "8px 0 0" }}>
            of 169 days at or above 40 °C in Phoenix (both summers) were missed at a 3 day lead. When the
            forecast missed, it was {fmtNum(phx40l3.mean_shortfall_on_misses)} °C too cool on average (
            {phx40l3.misses} misses).
          </p>
        </div>
        <div className="card">
          <div className="figure accent">{fmtPct(phx40l7.miss_rate)}</div>
          <p style={{ margin: "8px 0 0" }}>
            missed at a 7 day lead, with a mean shortfall of {fmtNum(phx40l7.mean_shortfall_on_misses)} °C
            on those {phx40l7.misses} missed days.
          </p>
        </div>
      </div>

      <p style={{ marginTop: 24 }}>
        That pattern is not universal. In Houston and Delhi the same model ran too warm on average (about
        3 °C at a 3 day lead), so dry bulb misses were rare and false alarms were common. Apparent
        temperature still shows underprediction at longer leads in those cities. The audit reports both
        sides.
      </p>
      <p>
        <Link href="/audit?city=phoenix&season=both&threshold=t40&lead=3" className="btn-primary">
          Open the Phoenix 40 °C audit
        </Link>
      </p>
      <p className="muted">
        Model: {data.model}. Observation: ERA5. Generated {data.generated_at} (UTC). Day 0 is never used
        as truth. See the method for parameter names and the limitations for what is not in this build.
      </p>
    </div>
  );
}
