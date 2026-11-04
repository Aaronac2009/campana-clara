import type { Campaign, Lang } from "./types";
import type { CampaignComposition } from "./composition";
import { bilingualReadiness } from "./composition";
import { contentFor } from "./campaign-content";

export interface EditorialPackage {
  schema: "campana-clara.editorial-package";
  schemaVersion: 1;
  exportedAt: string;
  campaign: {
    id: string; institutionName: string; campaignType: string; theme: string;
    audience: string; tone: string; format: string; status: string; date: string;
  };
  languages: Record<Lang, {
    content: ReturnType<typeof contentFor>;
    composition: CampaignComposition | null;
  }>;
  validation: { bilingualReady: boolean; missing: Record<Lang, string[]>; warnings: string[] };
}

/**
 * Produces a portable editorial handoff. It deliberately excludes user profiles,
 * auth tokens, reviewer personal data, local activity logs and binary asset bytes.
 */
export function buildEditorialPackage(
  campaign: Campaign,
  compositions: Partial<Record<Lang, CampaignComposition>>,
): EditorialPackage {
  const readiness = bilingualReadiness(campaign);
  const warnings: string[] = [];
  for (const lang of ["es", "en"] as const) {
    const composition = compositions[lang] ?? null;
    if (campaign.language === "Español e inglés" && !composition) warnings.push(`Falta la composición visual ${lang.toUpperCase()}.`);
    if (composition && composition.campaignId !== campaign.id) warnings.push(`La composición ${lang.toUpperCase()} pertenece a otra campaña.`);
    if (composition && composition.language !== lang) warnings.push(`La composición asignada a ${lang.toUpperCase()} tiene un idioma incorrecto.`);
  }
  if (!readiness.ready) warnings.push("El contenido no está completo en todos los idiomas requeridos.");
  return {
    schema: "campana-clara.editorial-package",
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    campaign: {
      id: campaign.id, institutionName: campaign.institutionName, campaignType: campaign.campaignType,
      theme: campaign.theme, audience: campaign.audience, tone: campaign.tone, format: campaign.format,
      status: campaign.status, date: campaign.date,
    },
    languages: {
      es: { content: contentFor(campaign, "es"), composition: compositions.es ?? null },
      en: { content: contentFor(campaign, "en"), composition: compositions.en ?? null },
    },
    validation: { bilingualReady: readiness.ready, missing: readiness.missing, warnings },
  };
}

export function editorialPackageBlob(pkg: EditorialPackage): Blob {
  return new Blob([JSON.stringify(pkg, null, 2)], { type: "application/json;charset=utf-8" });
}
