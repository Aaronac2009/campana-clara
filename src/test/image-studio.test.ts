import { afterEach, describe, expect, it, vi } from "vitest";
import { changeHistory, encodeCanvas, importLocalImage, initialEdit, MAX_FILE_BYTES, rasterSvg, redoHistory, renderEdit, undoHistory, validateDimensions, validateImageBytes } from "@/lib/image-studio";

function png() {
  const bytes = new Uint8Array(33); bytes.set([137,80,78,71,13,10,26,10]);
  const view = new DataView(bytes.buffer); view.setUint32(8, 13); bytes.set([73,72,68,82], 12); view.setUint32(16, 200); view.setUint32(20, 100); return bytes;
}
afterEach(() => vi.restoreAllMocks());
describe("Secure image import", () => {
  it("accepts matching static PNG/JPEG/WebP signatures", () => {
    expect(validateImageBytes(png(), "image/png")).toBe("image/png");
    expect(validateImageBytes(new Uint8Array([255,216,255,224]), "image/jpeg")).toBe("image/jpeg");
    expect(validateImageBytes(new TextEncoder().encode("RIFFxxxxWEBPVP8 xxxxx"), "image/webp")).toBe("image/webp");
  });
  it("rejects misleading MIME types", () => { expect(() => validateImageBytes(png(), "image/jpeg")).toThrow(); });
  it("rejects SVG, GIF, HEIC and PDF regardless of filename", () => {
    for (const data of ['<svg onload="alert(1)"></svg>', "GIF89a", "xxxxftypheic", "%PDF-1.7"]) expect(() => validateImageBytes(new TextEncoder().encode(data), "image/png")).toThrow();
  });
  it("rejects files exceeding 12 MB and empty files", () => {
    expect(() => validateImageBytes(new Uint8Array(MAX_FILE_BYTES + 1), "image/png")).toThrow();
    expect(() => validateImageBytes(new Uint8Array(), "image/png")).toThrow();
  });
  it("rejects animated APNG and WebP", () => {
    const animated = new Uint8Array(45); animated.set(png()); animated.set([97,99,84,76], 37);
    expect(() => validateImageBytes(animated, "image/png")).toThrow();
    const webp = new TextEncoder().encode("RIFFxxxxWEBPVP8Xxxxx\x02xxx");
    expect(() => validateImageBytes(webp, "image/webp")).toThrow();
  });
  it("limits decoded dimensions to 24 MP and 8192 per side", () => {
    expect(() => validateDimensions(8193, 1)).toThrow(); expect(() => validateDimensions(6000, 5000)).toThrow();
    expect(() => validateDimensions(6000, 4000)).not.toThrow();
  });
  it("requires successful decoding and revokes failed object URLs", async () => {
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:local-test") });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
    Object.defineProperty(Image.prototype, "decode", { configurable: true, value: vi.fn().mockRejectedValue(new Error("bad data")) });
    const file = { size: 33, type: "image/png", name: "damaged.png", arrayBuffer: async () => png().buffer } as File;
    await expect(importLocalImage(file)).rejects.toThrow(); expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:local-test");
  });
});
describe("Edit and reversal", () => {
  it("restores the complete original through undo and redo", () => {
    const original = initialEdit(200, 100); const modified = { ...original, rotation: 90, flipX: true, crop: { x: 10, y: 20, width: 50, height: 60 }, width: 300, text: "Hola" };
    const changed = changeHistory({ past: [], present: original, future: [] }, modified);
    expect(undoHistory(changed).present).toEqual(original); expect(redoHistory(undoHistory(changed)).present).toEqual(modified);
    const restored = changeHistory(changed, original); expect(restored.present).toEqual(original); expect(undoHistory(restored).present).toEqual(modified);
  });
  it("clears redo on a new edit and caps history at 40", () => {
    let h = { past: [] as ReturnType<typeof initialEdit>[], present: initialEdit(200, 100), future: [] as ReturnType<typeof initialEdit>[] };
    for (let i = 1; i <= 50; i++) h = changeHistory(h, { ...h.present, text: String(i) });
    expect(h.past.length).toBe(40); h = changeHistory(undoHistory(h), { ...h.present, text: "new" }); expect(h.future).toHaveLength(0);
  });
  it("applies real crop coordinates, rotation, flip and text to canvas", () => {
    const ctx = { save: vi.fn(), restore: vi.fn(), beginPath: vi.fn(), rect: vi.fn(), clip: vi.fn(), translate: vi.fn(), rotate: vi.fn(), scale: vi.fn(), drawImage: vi.fn(), fillText: vi.fn(), fillRect: vi.fn() };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
    const image = { naturalWidth: 200, naturalHeight: 100 } as HTMLImageElement;
    const edited = { ...initialEdit(200, 100), rotation: 90, flipX: true, text: "Hola", crop: { x: 10, y: 20, width: 50, height: 60 } };
    const canvas = renderEdit(image, edited, { paper: "white", ink: "black" });
    expect(canvas.width).toBe(200); expect(ctx.drawImage).toHaveBeenCalledWith(image, 20, 20, 100, 60, -50, -30, 100, 60);
    expect(ctx.rotate).toHaveBeenCalledWith(Math.PI / 2); expect(ctx.scale).toHaveBeenCalledWith(-1, 1); expect(ctx.fillText).toHaveBeenCalledWith("Hola", 100, 88, 176);
  });
  it("restricts export size to 4096 per side", () => { expect(() => validateDimensions(4096, 4096, true)).not.toThrow(); expect(() => validateDimensions(4097, 10, true)).toThrow(); });
});
describe("Safe export", () => {
  it("generates SVG only with safe embedded PNG, never arbitrary markup", () => {
    const svg = rasterSvg(200, 100, "data:image/png;base64,aGVsbG8="); expect(svg).toContain('width="200"'); expect(svg).toContain("data:image/png;base64,aGVsbG8=");
    expect(() => rasterSvg(200, 100, '<svg onload="alert(1)">')).toThrow(); expect(() => rasterSvg(200, 100, "https://external/image.png")).toThrow();
  });
  it("rejects silent browser format fallback", async () => {
    const canvas = { toBlob: (cb: BlobCallback) => cb(new Blob(["PNG"], { type: "image/png" })) } as HTMLCanvasElement;
    await expect(encodeCanvas(canvas, "image/webp")).rejects.toThrow(); expect((await encodeCanvas(canvas, "image/png")).type).toBe("image/png");
  });
});