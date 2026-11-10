export function fmtNum(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "n/a";
  return value.toFixed(digits);
}

export function fmtPct(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "n/a";
  return `${(value * 100).toFixed(1)}%`;
}

export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${d} ${months[m - 1]} ${y}`;
}

export const CITY_ORDER = ["phoenix", "houston", "madrid", "delhi"] as const;

export const CITY_NAMES: Record<string, string> = {
  phoenix: "Phoenix, US",
  houston: "Houston, US",
  madrid: "Madrid, Spain",
  delhi: "Delhi, India",
};

export const THRESHOLDS = [
  { id: "t35", label: "35 °C", variable: "temperature_2m" as const },
  { id: "t40", label: "40 °C", variable: "temperature_2m" as const },
  { id: "t45", label: "45 °C", variable: "temperature_2m" as const },
  { id: "at406", label: "40.6 °C apparent", variable: "apparent_temperature" as const },
  { id: "temperature_2m_p95", label: "Local 95th percentile", variable: "temperature_2m" as const },
  { id: "temperature_2m_p99", label: "Local 99th percentile", variable: "temperature_2m" as const },
];
