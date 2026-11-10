export const LEADS = [1, 2, 3, 4, 5, 6, 7] as const;
export type Lead = (typeof LEADS)[number];
export type SeasonId = "2024" | "2025";
export type SeasonSel = SeasonId | "both";
export type CityId = "phoenix" | "houston" | "madrid" | "delhi";

export type LeadScore = {
  hits: number;
  misses: number;
  false_alarms: number;
  incomplete_days: number;
  observed_events: number;
  pod: number | null;
  far: number | null;
  csi: number | null;
  miss_rate: number | null;
  mean_shortfall_on_misses: number | null;
  lead: number;
};

export type LeadStats = {
  n_hours: number;
  hourly_mean_error: number | null;
  hourly_mae: number | null;
  hourly_rmse: number | null;
  n_complete_days: number;
  daily_mean_error: number | null;
  daily_mae: number | null;
  daily_rmse: number | null;
  skill_vs_persistence: number | null;
  skill_vs_climatology: number | null;
  n_persistence_days: number;
  n_climatology_days: number;
};

export type EventDay = {
  date: string;
  label: "hit" | "miss" | "false_alarm" | "incomplete" | "non_event";
  obs: number | null;
  forecast: number | null;
  shortfall: number | null;
};

export type ThresholdBlock = {
  id: string;
  variable: "temperature_2m" | "apparent_temperature";
  value: number;
  label: string;
  kind: string;
  by_lead: Record<string, LeadScore>;
  days_by_lead: Record<string, EventDay[]>;
};

export type DayLead = { max: number | null; complete: boolean };

export type DayVariable = {
  obs: number | null;
  obs_complete: boolean;
  persistence: number | null;
  climatology: number | null;
  leads: Record<string, DayLead>;
};

export type DayRecord = {
  date: string;
  temperature_2m: DayVariable;
  apparent_temperature: DayVariable;
};

export type HourlyPoint = {
  time: string;
  temperature_2m_obs: number | null;
  apparent_temperature_obs: number | null;
  temperature_2m_leads: Record<string, number | null>;
  apparent_temperature_leads: Record<string, number | null>;
};

export type CitySeason = {
  season: { id: string; label: string; start: string; end: string };
  status: "success" | "partial" | "error";
  error?: string;
  dropped_hours: number | null;
  n_days: number;
  n_incomplete_obs_days_temperature?: number;
  last_valid_date: string | null;
  leads: {
    temperature_2m: Record<string, LeadStats>;
    apparent_temperature: Record<string, LeadStats>;
  };
  thresholds: ThresholdBlock[];
  days: DayRecord[];
  hourly_events: Record<string, HourlyPoint[]>;
};

export type Grid = {
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
  utc_offset_seconds: number;
};

export type CityData = {
  id: CityId;
  name: string;
  requested: { latitude: number; longitude: number };
  timezone: string;
  asos: string | null;
  previous_runs_grid: Grid;
  era5_grid: Grid;
  grid_distance_km: number;
  model: string;
  climatology: {
    start: string;
    end: string;
    temperature_2m_p95: number;
    temperature_2m_p99: number;
    apparent_temperature_p95: number;
    apparent_temperature_p99: number;
    n_days_temperature: number;
    n_days_apparent: number;
  };
  seasons: Record<string, CitySeason>;
  status: "success" | "partial" | "error";
  notes: string[];
  request_log: { kind: string; url: string; season?: string; grid: Grid }[];
};

export type SummaryCity = {
  id: CityId;
  name: string;
  timezone: string;
  requested: { latitude: number; longitude: number };
  previous_runs_grid: Grid;
  era5_grid: Grid;
  grid_distance_km: number;
  asos: string | null;
  status: string;
  notes: string[];
  climatology: CityData["climatology"];
  seasons: Record<
    string,
    {
      status: string;
      error?: string;
      n_days: number;
      dropped_hours: number;
      last_valid_date: string;
      temperature_leads: Record<string, LeadStats>;
      apparent_leads: Record<string, LeadStats>;
      t35: Record<string, LeadScore>;
      t40: Record<string, LeadScore>;
      t45: Record<string, LeadScore>;
      at406: Record<string, LeadScore>;
      t_p95: Record<string, LeadScore>;
      t_p95_value: number;
      t_p99: Record<string, LeadScore>;
      t_p99_value: number;
    }
  >;
};

export type Summary = {
  generated_at: string;
  model: string;
  observation: string;
  seasons: { id: string; label: string; start: string; end: string }[];
  cities: SummaryCity[];
  sources: Record<string, string>;
};
