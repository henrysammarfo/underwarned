"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCity, DemoBanner } from "@/lib/hooks";
import { MissRibbon } from "@/components/MissRibbon";
import { HourlyChart } from "@/components/HourlyChart";
import { CITY_NAMES, fmtNum, fmtDate } from "@/lib/format";
import type { CityId } from "@/lib/types";

export default function DayPage() {
  const params = useParams<{ city: string; date: string }>();
  const sp = useSearchParams();
  const city = params.city as CityId;
  const date = params.date;
  const lead = Number(sp.get("lead") || "3");
  const thresholdId = sp.get("threshold") || "t40";
  const { data, error, loading, demo } = useCity(city);

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 40, width: "40%", marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 240 }} />
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <DemoBanner demo={demo} />
        <h1>This day could not be loaded</h1>
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
    return <p>The city artifact is missing.</p>;
  }

  const seasonId = date.startsWith("2025") ? "2025" : "2024";
  const season = data.seasons[seasonId];
  const hours = season?.hourly_events?.[date];
  const day = season?.days.find((d) => d.date === date);
  const th = season?.thresholds.find((t) => t.id === thresholdId);
  const thresholdValue = th?.value ?? 40;
  const variable = th?.variable ?? "temperature_2m";
  const block = day?.[variable];
  const forecast = block?.leads[String(lead)]?.max ?? null;
  const obs = block?.obs ?? null;

  if (!day) {
    return (
      <div>
        <h1>{fmtDate(date)}</h1>
        <p>
          This date is not in the {CITY_NAMES[city]} artifact. It may be outside May to September 2024 or
          2025.
        </p>
        <Link href={`/events?city=${city}`}>Back to events</Link>
      </div>
    );
  }

  const times = hours ?? [];
  const missingHours = times.filter((pt) => {
    const o = variable === "temperature_2m" ? pt.temperature_2m_obs : pt.apparent_temperature_obs;
    const f =
      variable === "temperature_2m"
        ? pt.temperature_2m_leads[String(lead)]
        : pt.apparent_temperature_leads[String(lead)];
    return o === null || f === null || f === undefined;
  }).length;

  return (
    <div>
      <DemoBanner demo={demo} />
      <p className="muted">
        <Link href={`/events?city=${city}&threshold=${thresholdId}&lead=${lead}`}>Events</Link>
        {" in "}
        {CITY_NAMES[city]}
      </p>
      <h1>{fmtDate(date)}</h1>
      <p className="lede">
        {variable === "temperature_2m" ? "2 m temperature" : "Apparent temperature"}, {lead} day lead.
        ERA5 grid {data.era5_grid.latitude.toFixed(4)}, {data.era5_grid.longitude.toFixed(4)}. Previous
        Runs grid {data.previous_runs_grid.latitude.toFixed(4)}, {data.previous_runs_grid.longitude.toFixed(4)}.
        Distance {fmtNum(data.grid_distance_km, 2)} km.
      </p>
      <MissRibbon
        observed={obs}
        forecast={forecast}
        threshold={thresholdValue}
        lead={lead}
        caption={`${CITY_NAMES[city]} on ${fmtDate(date)}, ${lead} day lead against the ${fmtNum(thresholdValue)} °C mark.`}
      />
      {times.length === 0 ? (
        <p>
          Hourly traces were stored only for days that reached 35 °C, 40.6 °C apparent temperature, or
          the local 95th percentile. This date has daily maxima but no stored hourly series.
        </p>
      ) : (
        <>
          {missingHours > 0 ? (
            <p className="warn">
              {missingHours} hour{missingHours === 1 ? "" : "s"} are missing and are drawn as gaps, not as
              zeros.
            </p>
          ) : null}
          <HourlyChart times={times} lead={lead} variable={variable} thresholdValue={thresholdValue} />
        </>
      )}
    </div>
  );
}
