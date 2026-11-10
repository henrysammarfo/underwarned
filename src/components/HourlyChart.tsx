"use client";

import { fmtNum } from "@/lib/format";
import type { HourlyPoint } from "@/lib/types";

export function HourlyChart({
  times,
  lead,
  variable,
  thresholdValue,
}: {
  times: HourlyPoint[];
  lead: number;
  variable: "temperature_2m" | "apparent_temperature";
  thresholdValue: number;
}) {
  const w = 720;
  const h = 280;
  const pad = { l: 48, r: 16, t: 24, b: 36 };
  const vals: number[] = [];
  times.forEach((pt) => {
    const o = variable === "temperature_2m" ? pt.temperature_2m_obs : pt.apparent_temperature_obs;
    const f =
      variable === "temperature_2m"
        ? pt.temperature_2m_leads[String(lead)]
        : pt.apparent_temperature_leads[String(lead)];
    if (o !== null) vals.push(o);
    if (f !== null && f !== undefined) vals.push(f);
  });
  vals.push(thresholdValue);
  const lo = (vals.length ? Math.min(...vals) : 0) - 2;
  const hi = (vals.length ? Math.max(...vals) : 40) + 2;
  const x = (i: number) => pad.l + (i / Math.max(times.length - 1, 1)) * (w - pad.l - pad.r);
  const y = (v: number) => pad.t + ((hi - v) / (hi - lo || 1)) * (h - pad.t - pad.b);
  const path = (getter: (i: number) => number | null | undefined) => {
    const parts: string[] = [];
    times.forEach((_pt, i) => {
      const v = getter(i);
      if (v === null || v === undefined) {
        parts.push("");
        return;
      }
      const cmd = parts.filter(Boolean).length === 0 || parts[parts.length - 1] === "" ? "M" : "L";
      parts.push(`${cmd}${x(i)} ${y(v)}`);
    });
    return parts.join(" ");
  };
  const ticks = [lo, (lo + hi) / 2, hi];
  const hourStep = times.length > 12 ? 6 : 3;

  return (
    <div className="hourly">
      <h3>Hourly traces</h3>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="280" role="img">
        <title>Hourly ERA5 and forecast temperature</title>
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={pad.l}
              y1={y(t)}
              x2={w - pad.r}
              y2={y(t)}
              stroke="#d9d0c4"
              strokeWidth="1"
            />
            <text x={pad.l - 8} y={y(t) + 4} fontSize="11" fill="#534e47" textAnchor="end" fontFamily="IBM Plex Mono, monospace">
              {t.toFixed(0)}
            </text>
          </g>
        ))}
        <line
          x1={pad.l}
          y1={y(thresholdValue)}
          x2={w - pad.r}
          y2={y(thresholdValue)}
          stroke="#c4a035"
          strokeDasharray="4 3"
          strokeWidth="1.5"
        />
        <path
          d={path((i) =>
            variable === "temperature_2m" ? times[i].temperature_2m_obs : times[i].apparent_temperature_obs,
          )}
          fill="none"
          stroke="#1c1917"
          strokeWidth="2.25"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d={path((i) =>
            variable === "temperature_2m"
              ? times[i].temperature_2m_leads[String(lead)]
              : times[i].apparent_temperature_leads[String(lead)],
          )}
          fill="none"
          stroke="#3f5b73"
          strokeWidth="2.25"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {times.map((pt, i) =>
          i % hourStep === 0 ? (
            <text key={pt.time} x={x(i)} y={h - 8} fontSize="11" fill="#534e47" textAnchor="middle" fontFamily="IBM Plex Mono, monospace">
              {pt.time.slice(11, 16)}
            </text>
          ) : null,
        )}
      </svg>
      <div className="legend">
        <span>
          <i /> ERA5
        </span>
        <span>
          <i className="fc" /> Forecast at this lead
        </span>
        <span>
          <i className="th" /> Threshold ({fmtNum(thresholdValue)} °C)
        </span>
      </div>
    </div>
  );
}
