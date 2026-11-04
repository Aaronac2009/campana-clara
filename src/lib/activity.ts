import type { ActivityAction, ActivityEntry } from "./types";

export const MAX_ACTIVITY = 500;

export function makeActivity(action: ActivityAction, target: string, detail = "", at = new Date().toISOString(), id = `${at}-${Math.random().toString(36).slice(2, 8)}`): ActivityEntry {
  return { id, at, action, target, detail };
}

export function pushActivity(list: ActivityEntry[], entry: ActivityEntry): ActivityEntry[] {
  return [entry, ...list].slice(0, MAX_ACTIVITY);
}

const csvCell = (v: string) => {
  // Neutralize spreadsheet formula injection, then quote.
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
};

export function activityToCsv(list: ActivityEntry[]): string {
  const rows = [["fecha", "accion", "objeto", "detalle"], ...list.map((e) => [e.at, e.action, e.target, e.detail])];
  return rows.map((r) => r.map(csvCell).join(",")).join("\n");
}

export function filterActivity(list: ActivityEntry[], action: "todas" | ActivityAction, q: string) {
  const needle = q.trim().toLowerCase();
  return list.filter((e) => (action === "todas" || e.action === action) && (!needle || `${e.target} ${e.detail}`.toLowerCase().includes(needle)));
}
