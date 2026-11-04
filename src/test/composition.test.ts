import { describe, expect, it } from "vitest";
import type { Campaign } from "@/lib/types";
import {
  addLayer, commitHistory, compositionFromLegacyCampaign, createComposition, createHistory,
  duplicateLayer, moveLayer, redoComposition, reorderLayer, toggleLayerLock, undoComposition,
  validateComposition, bilingualReadiness, type TextLayer,
} from "@/lib/composition";
import { buildEditorialPackage } from "@/lib/editorial-package";

const textLayer = (id: string, x = 10): TextLayer => ({
  id, kind: "text", name: id, x, y: 10, width: 300, height: 80, rotation: 0,
  opacity: 1, zIndex: 0, visible: true, locked: false, blendMode: "source-over",
  text: "Campaña Clara", fontFamily: "Arial, sans-serif", fontSize: 36, fontWeight: 700,
  color: "#123456", align: "center", verticalAlign: "middle", lineHeight: 1.2, letterSpacing: 0,
});
const campaign = (patch: Partial<Campaign> = {}) => ({
  id: "c1", title: "Seguridad digital", tagline: "Protegé tus datos", bullets: ["Usá contraseñas seguras"],
  cta: "Informate", note: "", institutionType: "Colegio", institutionName: "CTP Mercedes Norte",
  campaignType: "Ciberseguridad", theme: "Datos", audience: "Estudiantes", tone: "Formal",
  format: "afiche", language: "Español e inglés", date: "2026-10-30",
  efemeride: { enabled: false, name: "", date: "", sourceUrl: "", confirmed: false },
  status: "borrador", checklist: {}, reviewer: "", approvalDate: "", updatedAt: "2026-10-30",
  ...patch,
}) as Campaign;

describe("campaign composition engine", () => {
  it("creates bounded design-space canvas", () => {
    const c = createComposition({ campaignId: "c1", language: "es", width: 9000, height: 1080 });
    expect(c.width).toBe(4000);
    expect(c.height).toBe(1080);
  });
  it("adds layers, duplicates them and preserves unique ids", () => {
    let c = createComposition({ campaignId: "c1", language: "es", width: 1080, height: 1350 });
    c = addLayer(c, textLayer("title"));
    c = duplicateLayer(c, "title");
    expect(c.layers).toHaveLength(2);
    expect(new Set(c.layers.map(x => x.id)).size).toBe(2);
  });
  it("does not move a locked layer", () => {
    let c = createComposition({ campaignId: "c1", language: "es", width: 1080, height: 1350 });
    c = addLayer(c, textLayer("title"));
    c = toggleLayerLock(c, "title", true);
    const moved = moveLayer(c, "title", 250, 250);
    expect(moved.layers[0].x).toBe(10);
  });
  it("supports z-order changes", () => {
    let c = createComposition({ campaignId: "c1", language: "es", width: 1080, height: 1350 });
    c = addLayer(c, textLayer("a"));
    c = addLayer(c, textLayer("b"));
    c = reorderLayer(c, "a", "front");
    expect([...c.layers].sort((a,b) => a.zIndex-b.zIndex).at(-1)?.id).toBe("a");
  });
  it("supports bounded undo and redo", () => {
    const first = createComposition({ campaignId: "c1", language: "es", width: 1080, height: 1350 });
    const second = addLayer(first, textLayer("title"));
    const undone = undoComposition(commitHistory(createHistory(first), second));
    expect(undone.present.layers).toHaveLength(0);
    expect(redoComposition(undone).present.layers).toHaveLength(1);
  });
  it("reports missing image attribution and alt text", () => {
    const base = createComposition({ campaignId: "c1", language: "es", width: 1080, height: 1350 });
    const image = {
      id: "image", kind: "image", name: "Foto", x: 0, y: 0, width: 200, height: 200,
      rotation: 0, opacity: 1, zIndex: 0, visible: true, locked: false, blendMode: "source-over",
      src: "javascript:alert(1)", alt: "", fit: "cover",
    } as const;
    const checked = validateComposition({ ...base, layers: [image] });
    expect(checked.map(x => x.code)).toEqual(expect.arrayContaining(["empty-alt", "missing-license", "unsafe-source"]));
  });
  it("converts existing campaign copy without deleting the original campaign model", () => {
    const legacy = campaign();
    const composition = compositionFromLegacyCampaign(legacy, "es", 1080, 1350);
    expect(composition.layers.some(x => x.kind === "text" && x.text === legacy.title)).toBe(true);
    expect(legacy.title).toBe("Seguridad digital");
  });
  it("blocks bilingual approval when required English copy is incomplete", () => {
    const result = bilingualReadiness(campaign());
    expect(result.ready).toBe(false);
    expect(result.missing.en).toContain("title");
  });
  it("exports both language content records without leaking reviewer profile data", () => {
    const source = campaign({ reviewer: "Private reviewer", contentEn: { title: "Digital safety", tagline: "Protect your data", bullets: ["Use strong passwords"], cta: "Learn more", slogan: "" } });
    const pkg = buildEditorialPackage(source, {});
    expect(pkg.languages.en.content.title).toBe("Digital safety");
    expect(pkg.languages.es.content.title).toBe("Seguridad digital");
    expect(JSON.stringify(pkg)).not.toContain("Private reviewer");
  });
});
