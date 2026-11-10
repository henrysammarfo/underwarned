"use client";

import type { LeadScore } from "@/lib/types";
import { fmtPct, fmtNum } from "@/lib/format";

export function LeadChart({
  rows,
}: {
  rows: { lead: number; score: LeadScore }[];
}) {
  const max = Math.max(...rows.map((r) => r.score.miss_rate ?? 0), 0.05);
  return (
    <div className="card">
      <h3 style={{ marginBottom: 12 }}>Miss rate by lead time</h3>
      <svg viewBox="0 0 420 200" width="100%" height="220" role="img">
        <title>Miss rate at leads 1 through 7</title>
        {rows.map((r, i) => {
          const x = 40 + i * 52;
          const h = ((r.score.miss_rate ?? 0) / max) * 140;
          const y = 160 - h;
          const empty = r.score.observed_events === 0;
          return (
            <g key={r.lead}>
              <rect x={x} y={y} width="32" height={Math.max(h, empty ? 0 : 0)} fill="#c23b22" />
              <text x={x + 16} y="176" textAnchor="middle" fontSize="11" fill="#6b645c">
                {r.lead}d
              </text>
              <text x={x + 16} y={y - 6} textAnchor="middle" fontSize="10" fill="#1c1917">
                {empty ? "n/a" : fmtPct(r.score.miss_rate)}
              </text>
            </g>
          );
        })}
        <line x1="32" y1="160" x2="400" y2="160" stroke="#e6dfd3" />
      </svg>
      <p className="muted" style={{ margin: 0, fontSize: 12 }}>
        Miss rate is the share of days that crossed the threshold in ERA5 while the forecast stayed below it.
        n/a means no days in the sample met the threshold. Shortfall on misses:{" "}
        {rows
          .map((r) => `${r.lead}d ${fmtNum(r.score.mean_shortfall_on_misses)} °C`)
          .join(", ")}
        .
      </p>
    </div>
  );
}
