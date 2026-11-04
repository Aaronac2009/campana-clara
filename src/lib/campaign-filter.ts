import type { Campaign, CampaignStatus } from "./types";

export interface CampaignFilter {
  q: string;
  status: "todos" | CampaignStatus;
  channel: string; // "" = any
  tag: string; // "" = any
  kind: "todas" | "efemeride" | "tematica";
  sort: "recientes" | "titulo" | "fecha";
}

export const DEFAULT_FILTER: CampaignFilter = { q: "", status: "todos", channel: "", tag: "", kind: "todas", sort: "recientes" };

export function allTags(list: Campaign[]) {
  return [...new Set(list.flatMap((c) => c.tags ?? []))].sort((a, b) => a.localeCompare(b, "es"));
}

export function filterCampaigns(list: Campaign[], f: CampaignFilter): Campaign[] {
  const q = f.q.trim().toLowerCase();
  const out = list.filter((c) => {
    if (f.status !== "todos" && c.status !== f.status) return false;
    if (f.channel && c.channel !== f.channel) return false;
    if (f.tag && !(c.tags ?? []).includes(f.tag)) return false;
    if (f.kind === "efemeride" && !c.efemeride.enabled) return false;
    if (f.kind === "tematica" && c.efemeride.enabled) return false;
    if (q && !`${c.title} ${c.theme} ${c.objective ?? ""} ${(c.tags ?? []).join(" ")}`.toLowerCase().includes(q)) return false;
    return true;
  });
  const byDate = (c: Campaign) => c.startDate || c.date || "9999";
  return out.sort((a, b) =>
    f.sort === "titulo" ? a.title.localeCompare(b.title, "es") : f.sort === "fecha" ? byDate(a).localeCompare(byDate(b)) : b.updatedAt.localeCompare(a.updatedAt),
  );
}

export const parseTags = (s: string) => [...new Set(s.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))].slice(0, 12);
