import { describe, expect, it } from "vitest";
import { formatSize, imageRect, orientationOf, posterLayout } from "@/lib/poster";
import { parseBackup } from "@/lib/backup";
import { searchStock, STOCK, STOCK_CATEGORIES, stockById } from "@/lib/stock";
import { sniffMedia } from "@/lib/media";
import { DEFAULT_PROFILE, demoCampaigns } from "@/lib/demo-data";
import { DEFAULT_IMAGE, type Campaign } from "@/lib/types";

const base = demoCampaigns()[0] as Campaign;
const img = { href: "data:image/png;base64,AA", w: 800, h: 600 };
const withImg: Campaign = { ...base, image: { ...DEFAULT_IMAGE, source: "stock", ref: "salud" } };
const overlaps = (a: { x: number; y: number; w: number; h: number }, b: typeof a) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe("formatos", () => {
  it("exporta las dimensiones del preset", () => {
    for (const [k, w, h] of [["afiche", 1080, 1350], ["historia", 1080, 1920], ["fb_h", 1200, 630], ["pantalla", 1920, 1080], ["wa_chat_h", 1600, 900]] as const) {
      const l = posterLayout(base, DEFAULT_PROFILE, k);
      expect([l.w, l.h]).toEqual([w, h]);
      expect(l.svg).toContain(`viewBox="0 0 ${w} ${h}"`);
    }
  });
  it("limita la medida personalizada a 320–4000 px", () => {
    expect(formatSize("personalizado", { customW: 10, customH: 99999 })).toEqual({ w: 320, h: 4000 });
  });
  it("detecta la orientación", () => {
    expect(orientationOf(1080, 1920)).toBe("vertical");
    expect(orientationOf(1080, 1080)).toBe("cuadrado");
    expect(orientationOf(1200, 630)).toBe("horizontal");
  });
  it("en horizontal la imagen va al lado del texto, en vertical arriba", () => {
    const hz = posterLayout(withImg, DEFAULT_PROFILE, "pantalla", img).boxes;
    expect(hz.image!.x).toBeGreaterThanOrEqual(hz.text.x + hz.text.w);
    const vt = posterLayout(withImg, DEFAULT_PROFILE, "historia", img).boxes;
    expect(vt.image!.y + vt.image!.h).toBeLessThanOrEqual(vt.text.y);
  });
  it("conserva la imagen al cambiar de formato", () => {
    for (const k of ["afiche", "cuadrado", "fb_h"] as const) expect(posterLayout(withImg, DEFAULT_PROFILE, k, img).svg).toContain("<image href=\"data:image/png");
  });
  it("texto, CTA, imagen y pie nunca se superponen", () => {
    for (const k of ["afiche", "historia", "cuadrado", "fb_h", "pantalla"] as const) {
      const b = posterLayout(withImg, DEFAULT_PROFILE, k, img).boxes;
      expect(overlaps(b.text, b.footer)).toBe(false);
      expect(overlaps(b.image!, b.footer)).toBe(false);
      expect(overlaps(b.image!, b.text)).toBe(false);
      expect(b.cta.y + b.cta.h).toBeLessThanOrEqual(b.footer.y);
    }
  });
  it("avisa y oculta ideas cuando el texto no cabe", () => {
    const long = { ...withImg, bullets: Array.from({ length: 12 }, () => "Una idea bastante larga que ocupa varias líneas en el afiche para forzar el ajuste, con más detalle del necesario para una pieza breve") };
    const l = posterLayout(long, DEFAULT_PROFILE, "fb_h", img);
    expect(l.hiddenBullets).toBeGreaterThan(0);
    expect(l.scale).toBeLessThan(1);
  });
  it("encuadre: cubrir llena la zona, contener cabe dentro", () => {
    const zone = { x: 0, y: 0, w: 400, h: 400 };
    const cover = imageRect(zone, { w: 800, h: 600 }, { ...DEFAULT_IMAGE, source: "stock", ref: "x", fit: "cover" });
    expect(cover.h).toBe(400); expect(cover.w).toBeGreaterThan(400);
    const contain = imageRect(zone, { w: 800, h: 600 }, { ...DEFAULT_IMAGE, source: "stock", ref: "x", fit: "contain", size: 50 });
    expect(contain.w).toBe(200);
  });
});

describe("catálogo e inserción", () => {
  it("preserva ilustraciones originales con categorías y búsqueda sin acentos", () => {
    expect(STOCK.length).toBeGreaterThanOrEqual(60);
    expect(STOCK_CATEGORIES.length).toBeGreaterThan(3);
    expect(searchStock("alimentacion").map((s) => s.id)).toContain("salud");
    expect(searchStock("", "Tecnología").every((s) => s.category === "Tecnología")).toBe(true);
    expect(stockById("lectura")?.svg).not.toMatch(/<script|on\w+=/i);
  });
  it("rechaza SVG y archivos falsos al subir", () => {
    expect(sniffMedia(new TextEncoder().encode("<svg xmlns="))).toBeNull();
    expect(sniffMedia(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]))).toBeNull();
  });
  it("el respaldo valida la imagen y la medida personalizada", () => {
    const bk = (c: object) => JSON.stringify({ format: "campana-clara-backup", version: 2, exportedAt: "", campaigns: [c], calendar: [], activity: [], media: [] });
    const ok = parseBackup(bk({ ...withImg, format: "fb_h", customW: 9000 })).campaigns[0]!;
    expect(ok.format).toBe("fb_h");
    expect(ok.image?.ref).toBe("salud");
    expect(ok.customW).toBe(4000);
    const bad = parseBackup(bk({ ...base, image: { source: "http", ref: "<x>" } })).campaigns[0]!;
    expect(bad.image).toBeUndefined();
    const old = parseBackup(bk({ ...base, image: undefined })).campaigns[0]!;
    expect(old.format).toBe(base.format);
  });
});
