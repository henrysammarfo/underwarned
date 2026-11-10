"use client";

import { CITY_NAMES, CITY_ORDER, THRESHOLDS } from "@/lib/format";
import { LEADS } from "@/lib/types";
import type { CityId, SeasonSel } from "@/lib/types";

const SEASONS: { id: SeasonSel; label: string }[] = [
  { id: "both", label: "Both summers" },
  { id: "2024", label: "2024" },
  { id: "2025", label: "2025" },
];

const TH_SHORT: Record<string, string> = {
  t35: "35 °C",
  t40: "40 °C",
  t45: "45 °C",
  at406: "40.6 °C apparent",
  temperature_2m_p95: "Local p95",
  temperature_2m_p99: "Local p99",
};

type Props = {
  city?: CityId;
  season?: SeasonSel;
  threshold?: string;
  lead?: number;
  onChange: (q: Record<string, string>) => void;
  showCity?: boolean;
  showSeason?: boolean;
  showThreshold?: boolean;
  showLead?: boolean;
};

export function FilterBar({
  city,
  season,
  threshold,
  lead,
  onChange,
  showCity = true,
  showSeason = true,
  showThreshold = true,
  showLead = true,
}: Props) {
  return (
    <div className="filters">
      {showCity && city ? (
        <div className="filter-group">
          <div className="filter-label" id="flt-city">
            City
          </div>
          <div className="seg" role="group" aria-labelledby="flt-city">
            {CITY_ORDER.map((id) => (
              <button
                key={id}
                type="button"
                className={id === city ? "active" : ""}
                aria-pressed={id === city}
                onClick={() => onChange({ city: id })}
              >
                {CITY_NAMES[id]}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {showSeason && season ? (
        <div className="filter-group">
          <div className="filter-label" id="flt-season">
            Season
          </div>
          <div className="seg" role="group" aria-labelledby="flt-season">
            {SEASONS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={s.id === season ? "active" : ""}
                aria-pressed={s.id === season}
                onClick={() => onChange({ season: s.id })}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {showThreshold && threshold ? (
        <div className="filter-group">
          <div className="filter-label" id="flt-th">
            Threshold
          </div>
          <div className="seg" role="group" aria-labelledby="flt-th">
            {THRESHOLDS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={t.id === threshold ? "active" : ""}
                aria-pressed={t.id === threshold}
                onClick={() => onChange({ threshold: t.id })}
              >
                {TH_SHORT[t.id] || t.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {showLead && lead ? (
        <div className="filter-group">
          <div className="filter-label" id="flt-lead">
            Lead time
          </div>
          <div className="seg" role="group" aria-labelledby="flt-lead">
            {LEADS.map((L) => (
              <button
                key={L}
                type="button"
                className={L === lead ? "active" : ""}
                aria-pressed={L === lead}
                onClick={() => onChange({ lead: String(L) })}
              >
                {L} day
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
