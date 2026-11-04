import { describe, expect, it } from "vitest";
import { can, canReviewCampaign, toCloudCampaign } from "@/lib/cloud";
import { demoCampaigns } from "@/lib/demo-data";

describe("matriz de roles (UI)", () => {
  it("solo administración gestiona miembros", () => {
    expect(can("admin", "manageMembers")).toBe(true);
    expect(can("editor", "manageMembers")).toBe(false);
    expect(can("reviewer", "manageMembers")).toBe(false);
  });
  it("lectura no edita ni revisa", () => {
    expect(can("reader", "editCampaign")).toBe(false);
    expect(can("reader", "review")).toBe(false);
    expect(can("reader", "view")).toBe(true);
  });
  it("sin rol no hay permisos", () => expect(can(null, "view")).toBe(false));
});

describe("revisión ajena", () => {
  const c = { created_by: "u1", updated_by: "u1", status: "revision" };
  it("quien creó no puede revisar su campaña", () => expect(canReviewCampaign("reviewer", "u1", c)).toBe(false));
  it("quien editó por última vez tampoco", () => expect(canReviewCampaign("admin", "u2", { ...c, updated_by: "u2" })).toBe(false));
  it("otra persona revisora sí", () => expect(canReviewCampaign("reviewer", "u2", c)).toBe(true));
  it("editor no revisa", () => expect(canReviewCampaign("editor", "u2", c)).toBe(false));
});

describe("migración local → institución", () => {
  const local = demoCampaigns();
  it("conserva id local para que repetir no duplique", () => {
    const rows = local.map(c => toCloudCampaign(c, "inst", "u"));
    expect(rows.map(r => r.local_id)).toEqual(local.map(c => c.id));
  });
  it("nunca copia una aprobación local", () => {
    const approved = { ...local[0]!, status: "aprobado" as const };
    expect(toCloudCampaign(approved, "i", "u").status).toBe("borrador");
  });
  it("separa textos ES y EN sin inventar inglés", () => {
    const c = { ...local[0]!, contentEn: undefined };
    const row = toCloudCampaign(c, "i", "u");
    expect(row.title_es).toBe(c.title);
    expect(row.title_en).toBe("");
    const en = toCloudCampaign({ ...c, contentEn: { title: "Hello", tagline: "", bullets: [], cta: "", slogan: "" } }, "i", "u");
    expect(en.title_en).toBe("Hello");
  });
  it("no modifica la campaña local", () => {
    const c = local[0]!; const before = JSON.stringify(c);
    toCloudCampaign(c, "i", "u");
    expect(JSON.stringify(c)).toBe(before);
  });
});
