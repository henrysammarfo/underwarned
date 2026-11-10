"use client";

type Props = {
  observed: number | null;
  forecast: number | null;
  threshold: number;
  lead: number;
  unit?: string;
  reduced?: boolean;
};

export function MissRibbon({ observed, forecast, threshold, lead, unit = "°C", reduced }: Props) {
  if (observed === null || forecast === null) {
    return <p className="muted">No paired daily maximum at this lead for the selected day.</p>;
  }
  const lo = Math.min(observed, forecast, threshold) - 2;
  const hi = Math.max(observed, forecast, threshold) + 2;
  const span = hi - lo || 1;
  const x = (v: number) => ((v - lo) / span) * 100;
  const tooCool = forecast < observed;
  const x1 = x(Math.min(forecast, observed));
  const x2 = x(Math.max(forecast, observed));
  const ribbonW = Math.max(x2 - x1, 0);

  return (
    <div className="card" aria-label={`Lead ${lead} day forecast compared with the ERA5 daily maximum`}>
      <p className="muted" style={{ marginBottom: 8 }}>
        {lead} day lead, daily maximum ({unit})
      </p>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div className="figure" style={{ color: "var(--forecast)" }}>
          {forecast.toFixed(1)}
          <small>Forecast</small>
        </div>
        <div className="figure">
          {observed.toFixed(1)}
          <small>ERA5 observation</small>
        </div>
        <div className="figure" style={{ color: tooCool ? "var(--accent)" : "var(--success)" }}>
          {tooCool ? (observed - forecast).toFixed(1) : (forecast - observed).toFixed(1)}
          <small>{tooCool ? "Shortfall (too cool)" : "Over (too warm)"}</small>
        </div>
      </div>
      <svg viewBox="0 0 100 28" width="100%" height="84" role="img" style={{ marginTop: 12 }}>
        <title>
          {tooCool
            ? `Forecast ${forecast.toFixed(1)} is ${ (observed - forecast).toFixed(1) } degrees cooler than the observed ${observed.toFixed(1)}`
            : `Forecast ${forecast.toFixed(1)} versus observed ${observed.toFixed(1)}`}
        </title>
        <line x1="0" y1="16" x2="100" y2="16" stroke="#e6dfd3" strokeWidth="0.6" />
        <line
          x1={x(threshold)}
          y1="6"
          x2={x(threshold)}
          y2="26"
          stroke="#d4a017"
          strokeWidth="0.5"
          strokeDasharray="1.2 1"
        />
        {tooCool ? (
          <rect
            x={x1}
            y="11"
            width={ribbonW}
            height="10"
            fill="#c23b22"
            opacity="0.85"
            style={
              reduced
                ? undefined
                : { transformOrigin: "center", transformBox: "fill-box", animation: "ribbon 300ms ease-out" }
            }
          />
        ) : null}
        <circle cx={x(forecast)} cy="16" r="1.8" fill="#3f5b73" />
        <circle cx={x(observed)} cy="16" r="1.8" fill="#1c1917" />
        <text x={x(threshold)} y="5" fontSize="3.2" fill="#6b645c" textAnchor="middle">
          {threshold} threshold
        </text>
      </svg>
      <style>{`
        @keyframes ribbon { from { transform: scaleX(0.95); opacity: 0.4; } to { transform: scaleX(1); opacity: 0.85; } }
        @media (prefers-reduced-motion: reduce) { rect { animation: none !important; } }
      `}</style>
    </div>
  );
}
