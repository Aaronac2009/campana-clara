import type { Campaign } from "./types";
import { missingFields, requiredLangs } from "./campaign-content";

export function isValidUrl(url: string) {
  return /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(url.trim());
}

/** Returns reasons blocking approval; empty array means it can be approved. */
export function approvalBlockers(c: Campaign): string[] {
  const out: string[] = [];
  if (c.efemeride.enabled) {
    if (!isValidUrl(c.efemeride.sourceUrl)) out.push("La efeméride vinculada no tiene una URL de fuente válida.");
    if (!c.efemeride.confirmed) out.push("Falta la confirmación manual de la fuente de la efeméride.");
  }
  for (const lang of requiredLangs(c)) {
    if (missingFields(c, lang).length) out.push(lang === "es" ? "Versión española incompleta: faltan campos esenciales." : "Versión inglesa incompleta: faltan campos esenciales.");
  }
  if (!c.reviewer.trim()) out.push("Indicá la persona revisora.");
  return out;
}

export const canApprove = (c: Campaign) => approvalBlockers(c).length === 0;

export function efemerideState(c: Campaign): "none" | "pendiente" | "confirmada" {
  if (!c.efemeride.enabled) return "none";
  return isValidUrl(c.efemeride.sourceUrl) && c.efemeride.confirmed ? "confirmada" : "pendiente";
}
