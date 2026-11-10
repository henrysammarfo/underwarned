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
    <div className="chart">
      <h3>Miss rate by lead time</h3>
      {rows.map((r, i) => {
        const empty = r.score.observed_events === 0;
        const pct = empty ? 0 : ((r.score.miss_rate ?? 0) / max) * 100;
        return (
          <div className="bar-row" key={r.lead}>
            <div className="bar-label">{r.lead} day</div>
            <div className="bar-track">
              {empty ? null : (
                <span
                  className="bar-fill"
                  style={{ width: `${Math.max(pct, 2)}%`, animationDelay: `${i * 70}ms` }}
                />
              )}
            </div>
            <div className="bar-meta">
              <span className="rate">{empty ? "n/a" : fmtPct(r.score.miss_rate)}</span>
              <span className="sub">
                {empty
                  ? "No days at this mark"
                  : `${r.score.misses} of ${r.score.observed_events}, shortfall ${fmtNum(r.score.mean_shortfall_on_misses)} °C`}
              </span>
            </div>
          </div>
        );
      })}
      <p className="muted" style={{ marginTop: 16, marginBottom: 0, fontSize: 13, lineHeight: "18px" }}>
        Miss rate is the share of days that crossed the threshold in ERA5 while the forecast stayed below
        it. n/a means no days in the sample met the threshold.
      </p>
    </div>
  );
}
