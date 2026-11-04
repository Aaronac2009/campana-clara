// Pure helpers for the multi-institution workspace. Real enforcement lives in
// database RLS policies and definer functions; these only drive the UI.
import { contentFor } from "./campaign-content";
import type { Campaign } from "./types";

export type CloudRole = "admin" | "editor" | "reviewer" | "reader";
export const CLOUD_ROLES: CloudRole[] = ["admin", "editor", "reviewer", "reader"];
export type CloudAction = "manageMembers" | "editCampaign" | "deleteCampaign" | "review" | "uploadAsset" | "viewAudit" | "view";

const MATRIX: Record<CloudAction, CloudRole[]> = {
  manageMembers: ["admin"],
  editCampaign: ["admin", "editor"],
  deleteCampaign: ["admin"],
  review: ["admin", "reviewer"],
  uploadAsset: ["admin", "editor"],
  viewAudit: ["admin", "reviewer"],
  view: ["admin", "editor", "reviewer", "reader"],
};
export const can = (role: CloudRole | null | undefined, action: CloudAction) => !!role && MATRIX[action].includes(role);

/** A reviewer may never decide on a campaign they created or last edited. */
export const canReviewCampaign = (role: CloudRole | null | undefined, uid: string, c: { created_by: string; updated_by: string | null; status: string }) =>
  can(role, "review") && c.created_by !== uid && c.updated_by !== uid && c.status === "revision";

export interface CloudCampaignInsert {
  institution_id: string; local_id: string; status: "borrador" | "revision";
  title_es: string; title_en: string; content_es: object; content_en: object; data: object; created_by: string;
}

/** Map a local campaign to a cloud row. Approval never migrates: it requires a real server-side decision. */
export function toCloudCampaign(c: Campaign, institutionId: string, uid: string): CloudCampaignInsert {
  const es = contentFor(c, "es");
  const en = c.contentEn ? contentFor(c, "en") : null;
  const { id: _id, title: _t, tagline: _g, bullets: _b, cta: _c, slogan: _s, contentEn: _e, status: _st, reviewHistory: _r, ...rest } = c;
  return {
    institution_id: institutionId, local_id: c.id, status: c.status === "revision" ? "revision" : "borrador",
    title_es: es.title.slice(0, 300), title_en: (en?.title ?? "").slice(0, 300),
    content_es: { tagline: es.tagline, bullets: es.bullets, cta: es.cta, slogan: es.slogan },
    content_en: en ? { tagline: en.tagline, bullets: en.bullets, cta: en.cta, slogan: en.slogan } : {},
    data: rest, created_by: uid,
  };
}
