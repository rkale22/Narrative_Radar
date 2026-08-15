import type { RadarWindow } from "./schema";

const WINDOW_TO_HOURS: Record<RadarWindow, number> = {
  "6h": 6,
  "24h": 24,
  "7d": 24 * 7,
};

export type RadarDateRange = {
  fromDate: string;
  toDate: string;
};

export function getRadarDateRange(
  window: RadarWindow,
  now: Date = new Date(),
): RadarDateRange {
  const to = new Date(now);
  const from = new Date(to.getTime() - WINDOW_TO_HOURS[window] * 60 * 60 * 1000);

  return {
    fromDate: toIsoDate(from),
    toDate: toIsoDate(to),
  };
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
