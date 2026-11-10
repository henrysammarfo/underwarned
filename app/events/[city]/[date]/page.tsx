"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCity, DemoBanner } from "@/lib/hooks";
import { MissRibbon } from "@/components/MissRibbon";
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
        <p className="muted">{date}</p>
        <div className="skeleton" style={{ height: 240 }} />
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <DemoBanner demo={demo} />
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

  const w = 640;
  const h = 260;
  const pad = { l: 40, r: 12, t: 16, b: 28 };
  const times = hours ?? [];
  const vals: number[] = [];
  times.forEach((pt) => {
    const o = variable === "temperature_2m" ? pt.temperature_2m_obs : pt.apparent_temperature_obs;
    const f = variable === "temperature_2m" ? pt.temperature_2m_leads[String(lead)] : pt.apparent_temperature_leads[String(lead)];
    if (o !== null) vals.push(o);
    if (f !== null && f !== undefined) vals.push(f);
  });
  vals.push(thresholdValue);
  const lo = (vals.length ? Math.min(...vals) : 0) - 2;
  const hi = (vals.length ? Math.max(...vals) : 40) + 2;
  const x = (i: number) => pad.l + (i / Math.max(times.length - 1, 1)) * (w - pad.l - pad.r);
  const y = (v: number) => pad.t + ((hi - v) / (hi - lo)) * (h - pad.t - pad.b);
  const path = (getter: (i: number) => number | null | undefined) => {
    const parts: string[] = [];
    times.forEach((pt, i) => {
      const v = getter(i);
      if (v === null || v === undefined) {
        parts.push("");
        return;
      }
      parts.push(`${parts.filter(Boolean).length === 0 || parts[parts.length - 1] === "" ? "M" : "L"}${x(i)} ${y(v)}`);
    });
    return parts.join(" ");
  };

  const missingHours =
    times.filter((pt) => {
      const o = variable === "temperature_2m" ? pt.temperature_2m_obs : pt.apparent_temperature_obs;
      const f = variable === "temperature_2m" ? pt.temperature_2m_leads[String(lead)] : pt.apparent_temperature_leads[String(lead)];
      return o === null || f === null || f === undefined;
    }).length;

  return (
    <div>
      <DemoBanner demo={demo} />
      <p className="muted">
        <Link href={`/events?city=${city}&threshold=${thresholdId}&lead=${lead}`}>Events</Link>
        {" · "}
        {CITY_NAMES[city]}
      </p>
      <h1>{fmtDate(date)}</h1>
      <p>
        {variable === "temperature_2m" ? "2 m temperature" : "Apparent temperature"}, {lead} day lead.
        ERA5 grid {data.era5_grid.latitude.toFixed(4)}, {data.era5_grid.longitude.toFixed(4)}. Previous
        Runs grid {data.previous_runs_grid.latitude.toFixed(4)}, {data.previous_runs_grid.longitude.toFixed(4)}.
        Distance {fmtNum(data.grid_distance_km, 2)} km.
      </p>
      <MissRibbon observed={obs} forecast={forecast} threshold={thresholdValue} lead={lead} />
      {times.length === 0 ? (
        <div className="card" style={{ marginTop: 16 }}>
          <p>
            Hourly traces were stored only for days that reached 35 °C, 40.6 °C apparent temperature, or
            the local 95th percentile. This date has daily maxima but no stored hourly series.
          </p>
        </div>
      ) : (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>Hourly traces</h3>
          {missingHours > 0 ? (
            <p className="warn">
              {missingHours} hour{missingHours === 1 ? "" : "s"} are missing and are drawn as gaps, not as
              zeros.
            </p>
          ) : null}
          <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="280" role="img">
            <title>Hourly ERA5 and forecast temperature</title>
            <line x1={pad.l} y1={y(thresholdValue)} x2={w - pad.r} y2={y(thresholdValue)} stroke="#d4a017" strokeDasharray="4 3" />
            <path
              d={path((i) =>
                variable === "temperature_2m" ? times[i].temperature_2m_obs : times[i].apparent_temperature_obs,
              )}
              fill="none"
              stroke="#1c1917"
              strokeWidth="2"
            />
            <path
              d={path((i) =>
                variable === "temperature_2m"
                  ? times[i].temperature_2m_leads[String(lead)]
                  : times[i].apparent_temperature_leads[String(lead)],
              )}
              fill="none"
              stroke="#3f5b73"
              strokeWidth="2"
            />
            <text x={pad.l} y={14} fontSize="11" fill="#6b645c">
              {hi.toFixed(0)} °C
            </text>
            <text x={pad.l} y={h - 8} fontSize="11" fill="#6b645c">
              {lo.toFixed(0)} °C
            </text>
          </svg>
          <p className="muted" style={{ margin: 0, fontSize: 12 }}>
            Black: ERA5. Slate: forecast at this lead. Gold dashed: threshold ({fmtNum(thresholdValue)} °C).
          </p>
        </div>
      )}
    </div>
  );
}
