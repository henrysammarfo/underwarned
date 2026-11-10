import type { CityData, EventDay, LeadScore, LeadStats, SeasonSel, ThresholdBlock } from "./types";
import { LEADS } from "./types";

export function seasonList(sel: SeasonSel): string[] {
  return sel === "both" ? ["2024", "2025"] : [sel];
}

export function combineScores(parts: LeadScore[]): LeadScore {
  const hits = parts.reduce((a, p) => a + p.hits, 0);
  const misses = parts.reduce((a, p) => a + p.misses, 0);
  const false_alarms = parts.reduce((a, p) => a + p.false_alarms, 0);
  const incomplete_days = parts.reduce((a, p) => a + p.incomplete_days, 0);
  const observed = hits + misses;
  const forecasted = hits + false_alarms;
  const shortWeighted = parts.reduce((a, p) => {
    if (p.mean_shortfall_on_misses === null || p.misses === 0) return a;
    return a + p.mean_shortfall_on_misses * p.misses;
  }, 0);
  const shortN = parts.reduce((a, p) => a + (p.mean_shortfall_on_misses !== null ? p.misses : 0), 0);
  const csiDen = hits + misses + false_alarms;
  return {
    hits,
    misses,
    false_alarms,
    incomplete_days,
    observed_events: observed,
    pod: observed ? hits / observed : null,
    far: forecasted ? false_alarms / forecasted : null,
    csi: csiDen ? hits / csiDen : null,
    miss_rate: observed ? misses / observed : null,
    mean_shortfall_on_misses: shortN ? shortWeighted / shortN : null,
    lead: parts[0]?.lead ?? 0,
  };
}

export function findThreshold(city: CityData, seasonId: string, id: string): ThresholdBlock | undefined {
  return city.seasons[seasonId]?.thresholds.find((t) => t.id === id);
}

export function scoresFor(city: CityData, sel: SeasonSel, thresholdId: string, lead: number): LeadScore | null {
  const parts: LeadScore[] = [];
  for (const sid of seasonList(sel)) {
    const th = findThreshold(city, sid, thresholdId);
    if (!th) continue;
    const s = th.by_lead[String(lead)];
    if (s) parts.push(s);
  }
  if (!parts.length) return null;
  return combineScores(parts);
}

export function eventsFor(city: CityData, sel: SeasonSel, thresholdId: string, lead: number): EventDay[] {
  const rows: EventDay[] = [];
  for (const sid of seasonList(sel)) {
    const th = findThreshold(city, sid, thresholdId);
    if (!th) continue;
    rows.push(...(th.days_by_lead[String(lead)] ?? []));
  }
  rows.sort((a, b) => a.date.localeCompare(b.date));
  return rows;
}

export function missRatesByLead(city: CityData, sel: SeasonSel, thresholdId: string): { lead: number; score: LeadScore }[] {
  return LEADS.map((lead) => ({ lead, score: scoresFor(city, sel, thresholdId, lead)! })).filter((x) => x.score);
}

export function dailySkill(
  city: CityData,
  sel: SeasonSel,
  variable: "temperature_2m" | "apparent_temperature",
  lead: number,
): { mae: number | null; me: number | null; skillP: number | null; skillC: number | null; n: number } {
  const pairs: [number, number][] = [];
  const pers: [number, number][] = [];
  const clim: [number, number][] = [];
  for (const sid of seasonList(sel)) {
    const days = city.seasons[sid]?.days ?? [];
    for (const d of days) {
      const block = d[variable];
      const L = block.leads[String(lead)];
      if (!block.obs_complete || !L?.complete || block.obs === null || L.max === null) continue;
      pairs.push([L.max, block.obs]);
      if (block.persistence !== null) pers.push([block.persistence, block.obs]);
      if (block.climatology !== null) clim.push([block.climatology, block.obs]);
    }
  }
  const mae = meanAbs(pairs);
  return {
    n: pairs.length,
    me: meanErr(pairs),
    mae,
    skillP: skill(mae, meanAbs(pers)),
    skillC: skill(mae, meanAbs(clim)),
  };
}

function meanErr(pairs: [number, number][]): number | null {
  if (!pairs.length) return null;
  return pairs.reduce((a, [f, o]) => a + (f - o), 0) / pairs.length;
}
function meanAbs(pairs: [number, number][]): number | null {
  if (!pairs.length) return null;
  return pairs.reduce((a, [f, o]) => a + Math.abs(f - o), 0) / pairs.length;
}
function skill(mae: number | null, ref: number | null): number | null {
  if (mae === null || ref === null || ref === 0) return null;
  return 1 - mae / ref;
}

export function leadStatsFromSummary(
  stats: LeadStats | undefined,
): LeadStats | null {
  return stats ?? null;
}


export function weightedMean(
  parts: { value: number | null | undefined; n: number | null | undefined }[],
): number | null {
  let num = 0;
  let den = 0;
  for (const p of parts) {
    if (p.value === null || p.value === undefined || !p.n) continue;
    num += p.value * p.n;
    den += p.n;
  }
  return den ? num / den : null;
}
