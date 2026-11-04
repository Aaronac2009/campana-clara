import { isSafeLogo } from "./logo";
import { CUSTOM_MAX, CUSTOM_MIN, DEFAULT_BRAND, FORMATS, type Campaign, type CampaignImage, type FormatKey, type Orientation, type Profile } from "./types";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function wrap(text: string, max: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > max) {
      if (cur) lines.push(cur);
      cur = w;
    } else cur = (cur + " " + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

type PosterInput = Pick<Campaign, "title" | "tagline" | "bullets" | "cta" | "campaignType" | "efemeride" | "institutionName"> & Partial<Pick<Campaign, "image" | "customW" | "customH" | "brand" | "slogan" | "artLang">>;
export interface PosterImage { href: string; w: number; h: number }
export interface Box { x: number; y: number; w: number; h: number }
export interface PosterLayout { svg: string; w: number; h: number; orientation: Orientation; scale: number; hiddenBullets: number; titleTruncated: boolean; boxes: { image?: Box | undefined; text: Box; cta: Box; footer: Box; header?: Box | undefined } }

const clampDim = (v: number | undefined) => Math.round(Math.min(CUSTOM_MAX, Math.max(CUSTOM_MIN, v || 1080)));
export function formatSize(fmt: FormatKey, c?: Partial<Pick<Campaign, "customW" | "customH">>) {
  if (fmt === "personalizado") return { w: clampDim(c?.customW), h: clampDim(c?.customH) };
  const f = FORMATS[fmt] ?? FORMATS.afiche;
  return { w: f.w, h: f.h };
}
export const orientationOf = (w: number, h: number): Orientation => (w / h > 1.15 ? "horizontal" : h / w > 1.15 ? "vertical" : "cuadrado");

/** Where the image goes, in [x,y,w,h], computed for the image zone and the user's fit settings. */
export function imageRect(zone: Box, img: { w: number; h: number }, s: CampaignImage): Box {
  const contain = Math.min(zone.w / img.w, zone.h / img.h);
  const cover = Math.max(zone.w / img.w, zone.h / img.h);
  const k = s.fit === "contain" ? contain * (s.size / 100) : s.fit === "crop" ? cover * (s.zoom / 100) : cover;
  const w = img.w * k, h = img.h * k;
  return { x: zone.x + (zone.w - w) * (s.focusX / 100), y: zone.y + (zone.h - h) * (s.focusY / 100), w, h };
}

export function posterLayout(c: PosterInput, p: Profile, fmt: FormatKey, img?: PosterImage | null): PosterLayout {
  const { w, h } = formatSize(fmt, c);
  const orientation = orientationOf(w, h);
  const u = Math.min(w, h) / 1080;
  const pad = Math.round(80 * u);
  const navy = p.primary || "#1d2b4f";
  const teal = p.secondary || "#2a8a85";
  const gold = p.accent || "#d4a84b";
  const serif = "Newsreader, Georgia, 'Times New Roman', serif";
  const sans = "Manrope, Helvetica, Arial, sans-serif";
  const label = c.artLang === 'en' ? (c.efemeride.enabled ? 'OBSERVANCE · VERIFICATION PENDING' : 'THEMATIC CAMPAIGN') : c.efemeride.enabled ? "EFEMÉRIDE · PENDIENTE DE VERIFICACIÓN" : "CAMPAÑA TEMÁTICA";
  const brand = { ...DEFAULT_BRAND, ...(c.brand ?? {}) };
  const headerText = brand.header ? (p.headerText ?? "").trim() : "";
  const headH = headerText ? Math.round(54 * u) : 0;
  const footerH = Math.round(150 * u);
  const footer: Box = { x: pad, y: h - footerH, w: w - pad * 2, h: footerH - pad * 0.4 };
  const contentBottom = h - footerH - pad * 0.4;
  const hasImg = !!(img && c.image);
  let imgZone: Box | undefined;
  let text: Box;
  if (hasImg && orientation === "horizontal") {
    imgZone = { x: w * 0.56, y: headH + pad, w: w * 0.44 - pad, h: contentBottom - pad - headH };
    text = { x: pad, y: headH + pad, w: w * 0.56 - pad * 1.5, h: contentBottom - pad - headH };
  } else if (hasImg) {
    const top = headH + pad;
    const ih = (contentBottom - top) * (orientation === "vertical" ? 0.36 : 0.3);
    imgZone = { x: pad, y: top, w: w - pad * 2, h: ih };
    text = { x: pad, y: top + ih + pad * 0.6, w: w - pad * 2, h: contentBottom - (top + ih + pad * 0.6) };
  } else {
    text = { x: pad, y: headH + pad * 1.4, w: w - pad * 2, h: contentBottom - headH - pad * 1.4 };
  }

  // Measure text blocks at a given scale; shrink, then drop bullets, never overlap.
  const per = (size: number, k: number) => Math.max(8, Math.floor(text.w / (size * k)));
  const measure = (s: number, nb: number, maxTitle = 99) => {
    const f = { label: 22 * u * s, title: 84 * u * s, tag: 40 * u * s, bul: 29 * u * s, cta: 36 * u * s };
    const title = wrap(c.title, per(f.title, 0.5));
    const titleLines = title.slice(0, maxTitle);
    const tag = wrap(c.tagline, per(f.tag, 0.47));
    const buls = c.bullets.slice(0, nb).map((b) => wrap(b, per(f.bul, 0.52)));
    const cta = wrap(c.cta, per(f.cta, 0.55));
    const ctaH = 50 * u * s + cta.length * f.cta * 1.2;
    let flow = f.label * 2.2 + titleLines.length * f.title * 1.08 + 26 * u * s + (tag.length ? 30 * u * s + tag.length * f.tag * 1.3 : 0);
    if (buls.length) flow += 24 * u * s + buls.reduce((a, l) => a + l.length * f.bul * 1.32 + 16 * u * s, 0);
    const need = flow + 30 * u * s + ctaH;
    return { f, titleLines, titleTruncated: titleLines.length < title.length, tag, buls, cta, ctaH, fits: need <= text.h };
  };
  let scale = 1, nb = c.bullets.length, m = measure(1, nb);
  while (!m.fits && scale > 0.62) { scale = +(scale - 0.05).toFixed(2); m = measure(scale, nb); }
  while (!m.fits && nb > 0) { nb--; m = measure(scale, nb); }
  for (let t = 3; !m.fits && t >= 1; t--) m = measure(scale, nb, t);

  const { f } = m;
  const parts: string[] = [];
  let y = text.y + f.label;
  parts.push(`<text x="${text.x}" y="${y}" font-family="${sans}" font-size="${f.label}" font-weight="700" letter-spacing="${4 * u}" fill="${gold}">${esc(label)}</text>`);
  y += f.label * 1.2;
  for (const line of m.titleLines) { y += f.title * 1.08; parts.push(`<text x="${text.x}" y="${y - f.title * 0.2}" font-family="${serif}" font-size="${f.title}" font-weight="600" fill="#fbf8f1">${esc(line)}</text>`); }
  y += 10 * u * scale;
  parts.push(`<rect x="${text.x}" y="${y}" width="${110 * u}" height="${6 * u}" rx="${3 * u}" fill="${gold}"/>`);
  y += 16 * u * scale;
  if (m.tag.length) { y += 30 * u * scale; for (const l of m.tag) { y += f.tag * 1.3; parts.push(`<text x="${text.x}" y="${y - f.tag * 0.3}" font-family="${serif}" font-style="italic" font-size="${f.tag}" fill="#bfe3df">${esc(l)}</text>`); } }
  if (m.buls.length) y += 24 * u * scale;
  for (const lines of m.buls) {
    parts.push(`<circle cx="${text.x + 8 * u}" cy="${y + f.bul * 0.68}" r="${7 * u}" fill="${gold}"/>`);
    lines.forEach((l, i) => parts.push(`<text x="${text.x + 34 * u}" y="${y + f.bul + i * f.bul * 1.32}" font-family="${sans}" font-size="${f.bul}" fill="#e9edf5">${esc(l)}</text>`));
    y += lines.length * f.bul * 1.32 + 16 * u * scale;
  }
  const cta: Box = { x: text.x, y: text.y + text.h - m.ctaH, w: text.w, h: m.ctaH };
  parts.push(`<rect x="${cta.x}" y="${cta.y}" width="${cta.w}" height="${cta.h}" rx="${16 * u}" fill="${gold}"/>`);
  m.cta.forEach((l, i) => parts.push(`<text x="${cta.x + cta.w / 2}" y="${cta.y + 25 * u * scale + f.cta * (0.95 + i * 1.2)}" text-anchor="middle" font-family="${serif}" font-size="${f.cta}" font-weight="700" fill="${navy}">${esc(l)}</text>`));

  let imgSvg = "";
  if (hasImg && img && imgZone && c.image) {
    const r = imageRect(imgZone, img, c.image);
    const rx = 24 * u;
    imgSvg = `<clipPath id="iz"><rect x="${imgZone.x}" y="${imgZone.y}" width="${imgZone.w}" height="${imgZone.h}" rx="${rx}"/></clipPath><g clip-path="url(#iz)"><rect x="${imgZone.x}" y="${imgZone.y}" width="${imgZone.w}" height="${imgZone.h}" fill="#ffffff14"/><image href="${esc(img.href)}" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" preserveAspectRatio="none"/>${c.image.shade ? `<rect x="${imgZone.x}" y="${imgZone.y}" width="${imgZone.w}" height="${imgZone.h}" fill="#000" opacity="${c.image.shade / 100}"/>` : ""}</g>`;
  }

  const ls = 100 * u, fy = footer.y + (footer.h - ls) / 2;
  const fs = (n: number) => n * u;
  const placeholder = c.artLang === 'en' ? ['Add', 'official crest', 'or logo'] : ['Añadir', 'escudo/logo', 'oficial'];
  if (brand.logo) {
    parts.push(p.logoDataUrl && p.logoAuthorized && isSafeLogo(p.logoDataUrl)
      ? `<image href="${esc(p.logoDataUrl)}" x="${pad}" y="${fy}" width="${ls}" height="${ls}" preserveAspectRatio="xMidYMid meet"/>`
      : `<rect x="${pad}" y="${fy}" width="${ls}" height="${ls}" rx="${fs(6)}" fill="none" stroke="#ffffff55" stroke-width="2" stroke-dasharray="8 6"/>${placeholder.map((line,i) => `<text x="${pad + ls / 2}" y="${fy + ls * (0.42 + i * 0.14)}" text-anchor="middle" font-family="${sans}" font-size="${fs(11)}" fill="#ffffffaa">${line}</text>`).join('')}`);
  }
  const nx = brand.logo ? pad + ls + fs(30) : pad;
  const footerText = brand.footer ? (p.footerText ?? "").trim() : "";
  const nameW = (footer.x + footer.w - nx) * (footerText && orientation === "horizontal" ? 0.6 : 1);
  const nameChars = Math.max(10, Math.floor(nameW / (fs(26) * 0.55)));
  wrap(c.institutionName || p.name, nameChars).slice(0, footerText && orientation !== "horizontal" ? 1 : 2).forEach((l, i) => parts.push(`<text x="${nx}" y="${fy + fs(36) + i * fs(30)}" font-family="${sans}" font-size="${fs(26)}" font-weight="700" fill="#fbf8f1">${esc(l)}</text>`));
  const slogan = c.slogan || (c.artLang === 'en' ? '' : p.slogan);
  if (brand.slogan && slogan) parts.push(`<text x="${nx}" y="${fy + ls - fs(6)}" font-family="${serif}" font-style="italic" font-size="${fs(22)}" fill="#bfe3df">${esc(wrap(slogan, Math.floor(nameChars * 1.15))[0] ?? "")}</text>`);
  if (footerText) {
    const line = esc(wrap(footerText, Math.floor((orientation === "horizontal" ? footer.w * 0.38 : footer.w - (nx - pad)) / (fs(19) * 0.55)))[0] ?? "");
    parts.push(orientation === "horizontal"
      ? `<text x="${footer.x + footer.w}" y="${fy + fs(40)}" text-anchor="end" font-family="${sans}" font-size="${fs(19)}" fill="#e9edf5">${line}</text>`
      : `<text x="${nx}" y="${fy + fs(66)}" font-family="${sans}" font-size="${fs(19)}" fill="#e9edf5">${line}</text>`);
  }
  if (headerText) {
    parts.push(`<rect x="0" y="0" width="${w}" height="${headH}" fill="${teal}"/><text x="${pad}" y="${headH * 0.64}" font-family="${sans}" font-size="${fs(20)}" font-weight="700" letter-spacing="${fs(2)}" fill="#fbf8f1">${esc(wrap(headerText.toUpperCase(), Math.floor((w - pad * 2) / (fs(20) * 0.62)))[0] ?? "")}</text>`);
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${navy}"/><stop offset="1" stop-color="#121a33"/></linearGradient>
<radialGradient id="glow" cx="1" cy="0" r="0.9"><stop offset="0" stop-color="${teal}" stop-opacity="0.7"/><stop offset="1" stop-color="${teal}" stop-opacity="0"/></radialGradient>
</defs>
<rect width="${w}" height="${h}" fill="url(#bg)"/>
<rect width="${w}" height="${h}" fill="url(#glow)"/>
<circle cx="${w - 60 * u}" cy="${h * 0.42}" r="${Math.min(w, h) * 0.22}" fill="none" stroke="${gold}" stroke-opacity="0.25" stroke-width="2"/>
<rect x="0" y="${footer.y - 10 * u}" width="${w}" height="1.5" fill="#ffffff22"/>
${imgSvg}
${parts.join("\n")}
</svg>`;
  return { svg, w, h, orientation, scale, hiddenBullets: c.bullets.length - nb, titleTruncated: m.titleTruncated, boxes: { image: imgZone, text, cta, footer, header: headH ? { x: 0, y: 0, w, h: headH } : undefined } };
}

export function posterSvg(c: PosterInput, p: Profile, fmt: FormatKey, img?: PosterImage | null): string {
  return posterLayout(c, p, fmt, img).svg;
}

export function rasterize(svg: string, w: number, h: number, mime: "image/png" | "image/jpeg" = "image/png"): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas"));
      ctx.drawImage(image, 0, 0, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => (b && b.type === mime ? resolve(b) : reject(new Error("export"))), mime, 0.92);
    };
    image.onerror = () => reject(new Error("img"));
    image.src = url;
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function svgToPng(svg: string, w: number, h: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas"));
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("png"))), "image/png");
    };
    img.onerror = () => reject(new Error("img"));
    img.src = url;
  });
}

export const slugify = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "campana";

export function campaignText(c: Pick<Campaign, "title" | "tagline" | "bullets" | "cta" | "institutionName">) {
  return [c.title, c.tagline, "", ...c.bullets.map((b) => `• ${b}`), "", c.cta, "", c.institutionName].join("\n");
}
