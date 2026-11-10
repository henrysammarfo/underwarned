"use client";

type Props = {
  observed: number | null;
  forecast: number | null;
  threshold: number;
  lead: number;
  unit?: string;
  caption?: string;
};

export function MissRibbon({ observed, forecast, threshold, lead, unit = "°C", caption }: Props) {
  if (observed === null || forecast === null) {
    return <p className="muted">No paired daily maximum at this lead for the selected day.</p>;
  }
  const lo = Math.min(observed, forecast, threshold) - 2;
  const hi = Math.max(observed, forecast, threshold) + 2;
  const span = hi - lo || 1;
  const x = (v: number) => ((v - lo) / span) * 100;
  const tooCool = forecast < observed;
  const left = x(Math.min(forecast, observed));
  const width = Math.max(x(Math.max(forecast, observed)) - left, 0.6);
  const delta = Math.abs(observed - forecast);

  return (
    <div className="ribbon" aria-label={`${lead} day lead forecast compared with the ERA5 daily maximum`}>
      <div className="ribbon-top">
        <div className="figure" style={{ color: "var(--forecast)" }}>
          {forecast.toFixed(1)}
          <small>Forecast, {lead} day lead ({unit})</small>
        </div>
        <div className="figure">
          {observed.toFixed(1)}
          <small>ERA5 daily maximum ({unit})</small>
        </div>
        <div className="figure" style={{ color: tooCool ? "var(--accent)" : "var(--success)" }}>
          {delta.toFixed(1)}
          <small>{tooCool ? "Shortfall, too cool" : "Over, too warm"}</small>
        </div>
      </div>
      <div className="ribbon-track" role="img" aria-hidden="false">
        <div
          className={`ribbon-band${tooCool ? "" : " ribbon-warm"}`}
          style={{ left: `${left}%`, width: `${width}%` }}
        />
        <div className="ribbon-tick" style={{ left: `${x(threshold)}%` }}>
          <span>{threshold} {unit} mark</span>
        </div>
        <div className="ribbon-mark fc" style={{ left: `${x(forecast)}%` }} />
        <div className="ribbon-mark obs" style={{ left: `${x(observed)}%` }} />
      </div>
      {caption ? <p className="muted" style={{ marginTop: 12 }}>{caption}</p> : null}
    </div>
  );
}
