import { describe, expect, it } from "vitest";
import { localize } from "@/lib/i18n";
import { applyTheme, migrate } from "@/lib/store";
import { posterLayout } from "@/lib/poster";
import { isSafeLogo, readLogoFile } from "@/lib/logo";
import { parseBackup } from "@/lib/backup";
import { DEFAULT_PROFILE, demoCampaigns } from "@/lib/demo-data";
import type { Campaign } from "@/lib/types";

const base = demoCampaigns()[0] as Campaign;
const profile = { ...DEFAULT_PROFILE, headerText: "Dirección Regional demo", footerText: "www.ejemplo.ed.cr", slogan: "Lema demo" };

describe("idioma", () => {
  it("traduce frases conocidas y deja intacto el contenido del usuario", () => {
    expect(localize('en', "Guardar borrador")).toBe("Save draft");
    expect(localize('en', "Convivir también se aprende")).toBe("Convivir también se aprende");
    expect(localize('es', "Guardar borrador")).toBe("Guardar borrador");
  });
  it("cambia la interfaz a EN y la restaura a ES, sin tocar el arte ni el valor de los selects", () => {
    document.body.innerHTML = `<h1>Mis campañas</h1><input placeholder="Buscar…"><select><option>Colegio académico</option></select><svg><text>Campaña temática</text></svg>`;
    const original = document.body.innerHTML;
    expect(localize('en', 'Colegio académico')).toBe('Academic high school');
    expect(document.body.innerHTML).toBe(original);
  });
});

describe("tema", () => {
  it("aplica oscuro, claro y por defecto conserva el sistema", () => {
    applyTheme("dark"); expect(document.documentElement.classList.contains("dark")).toBe(true);
    applyTheme("light"); expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(migrate({ prefs: { lang: "en" } }).prefs).toMatchObject({ lang: "en", theme: "system" });
  });
});

describe("marca institucional", () => {
  it("dibuja encabezado, pie y eslogan del perfil sin superponer el texto", () => {
    const l = posterLayout(base, profile, "afiche");
    expect(l.svg).toContain("DIRECCIÓN REGIONAL DEMO");
    expect(l.svg).toContain("www.ejemplo.ed.cr");
    expect(l.svg).toContain("Lema demo");
    expect(l.boxes.text.y).toBeGreaterThanOrEqual(l.boxes.header!.h);
  });
  it("respeta los interruptores por campaña", () => {
    const l = posterLayout({ ...base, brand: { logo: false, header: false, footer: false, slogan: false } }, profile, "fb_h");
    expect(l.svg).not.toContain("DIRECCIÓN REGIONAL DEMO");
    expect(l.svg).not.toContain("www.ejemplo.ed.cr");
    expect(l.svg).not.toContain("Lema demo");
    expect(l.svg).not.toContain("escudo/logo");
  });
  it("sin logo muestra el aviso para añadir el escudo oficial y nunca dibuja un SVG guardado", () => {
    expect(posterLayout(base, DEFAULT_PROFILE, "afiche").svg).toContain("escudo/logo");
    const svgLogo = { ...DEFAULT_PROFILE, logoAuthorized: true, logoDataUrl: "data:image/svg+xml;base64,PHN2Zz4=" };
    expect(isSafeLogo(svgLogo.logoDataUrl)).toBe(false);
    expect(posterLayout(base, svgLogo, "afiche").svg).not.toContain("image/svg+xml");
  });
  it("rechaza un logo SVG al subirlo", async () => {
    const bytes = new TextEncoder().encode("<svg onload=alert(1)>");
    const fake = { size: bytes.length, type: "image/png", slice: () => ({ arrayBuffer: async () => bytes.buffer }) } as unknown as File;
    await expect(readLogoFile(fake)).rejects.toThrow(/SVG/);
  });
  it("el respaldo conserva encabezado, pie e interruptores", () => {
    const raw = JSON.stringify({ format: "campana-clara-backup", version: 2, exportedAt: "", campaigns: [{ ...base, brand: { logo: true, header: false, footer: true, slogan: false } }], calendar: [], activity: [], media: [], profile });
    const b = parseBackup(raw);
    expect(b.profile?.headerText).toBe("Dirección Regional demo");
    expect(b.campaigns[0]!.brand).toEqual({ logo: true, header: false, footer: true, slogan: false });
  });
});
