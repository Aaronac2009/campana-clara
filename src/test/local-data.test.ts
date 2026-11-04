import { describe, expect, it } from "vitest";
import { activityToCsv, filterActivity, makeActivity, pushActivity, MAX_ACTIVITY } from "@/lib/activity";
import { BackupError, buildBackup, mergeById, parseBackup } from "@/lib/backup";
import { DEFAULT_FILTER, filterCampaigns, parseTags } from "@/lib/campaign-filter";
import { demoCalendar, demoCampaigns, DEFAULT_PROFILE } from "@/lib/demo-data";
import { DICTS } from "@/lib/i18n";
import { sniffMedia } from "@/lib/media";
import { migrate } from "@/lib/store";

const camps = () => {
  const list = demoCampaigns();
  list[0] = { ...list[0]!, channel: "WhatsApp", tags: ["valores"] };
  return list;
};

describe("campaign filters", () => {
  it("combines channel and tag filters", () => {
    const r = filterCampaigns(camps(), { ...DEFAULT_FILTER, channel: "WhatsApp", tag: "valores" });
    expect(r.map((c) => c.id)).toEqual([camps()[0]!.id]);
  });
  it("tag filter excludes campaigns without the tag", () => {
    expect(filterCampaigns(camps(), { ...DEFAULT_FILTER, tag: "inexistente" })).toHaveLength(0);
  });
  it("normalizes tags: lowercase, trimmed, unique", () => {
    expect(parseTags(" Valores, valores ,, Salud")).toEqual(["valores", "salud"]);
  });
});

describe("backup import validation", () => {
  const valid = () => buildBackup({ campaigns: camps(), calendar: demoCalendar(), profile: DEFAULT_PROFILE, activity: [], media: [] });
  it("round-trips a valid backup", () => {
    expect(parseBackup(JSON.stringify(valid())).campaigns).toHaveLength(camps().length);
  });
  it("rejects non-JSON", () => {
    expect(() => parseBackup("not json")).toThrow(BackupError);
  });
  it("rejects files from another app", () => {
    expect(() => parseBackup(JSON.stringify({ format: "other", version: 2 }))).toThrow(BackupError);
  });
  it("rejects an unknown campaign status", () => {
    const b = valid() as unknown as { campaigns: { status: string }[] };
    b.campaigns[0]!.status = "publicado";
    expect(() => parseBackup(JSON.stringify(b))).toThrow(/Estado/);
  });
  it("strips javascript: source URLs and SVG logos", () => {
    const b = valid();
    b.campaigns[0]!.efemeride.sourceUrl = "javascript:alert(1)";
    b.profile!.logoDataUrl = "data:image/svg+xml;base64,PHN2Zz4=";
    const r = parseBackup(JSON.stringify(b));
    expect(r.campaigns[0]!.efemeride.sourceUrl).toBe("");
    expect(r.profile!.logoDataUrl).toBe("");
  });
  it("rejects files larger than 2 MB", () => {
    expect(() => parseBackup("x".repeat(2 * 1024 * 1024 + 1))).toThrow(/2 MB/);
  });
  it("merge never removes local items", () => {
    const { result, summary } = mergeById([{ id: "a", v: 1 }, { id: "b", v: 1 }], [{ id: "b", v: 2 }, { id: "c", v: 1 }]);
    expect(result.map((x) => x.id).sort()).toEqual(["a", "b", "c"]);
    expect(summary).toEqual({ added: 1, updated: 1, unchanged: 0 });
  });
});

describe("activity log", () => {
  it("caps the log at 500 entries", () => {
    let list = [makeActivity("crear", "x")];
    for (let i = 0; i < 600; i++) list = pushActivity(list, makeActivity("editar", `c${i}`));
    expect(list).toHaveLength(MAX_ACTIVITY);
  });
  it("CSV neutralizes spreadsheet formulas", () => {
    expect(activityToCsv([makeActivity("crear", "=HYPERLINK(1)")])).toContain(`"'=HYPERLINK(1)"`);
  });
  it("filters by action", () => {
    const l = [makeActivity("crear", "a"), makeActivity("eliminar", "b")];
    expect(filterActivity(l, "eliminar", "").map((e) => e.target)).toEqual(["b"]);
  });
});

describe("media signature check", () => {
  it("accepts PNG, GIF and MP4 by content", () => {
    expect(sniffMedia(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))?.mime).toBe("image/png");
    expect(sniffMedia(new TextEncoder().encode("GIF89a"))?.kind).toBe("gif");
    expect(sniffMedia(new Uint8Array([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70]))?.kind).toBe("video");
  });
  it("rejects SVG and HTML", () => {
    expect(sniffMedia(new TextEncoder().encode("<svg xmlns="))).toBeNull();
    expect(sniffMedia(new TextEncoder().encode("<html><script>"))).toBeNull();
  });
});

describe("language and data migration", () => {
  it("English dictionary covers every Spanish key", () => {
    expect(Object.keys(DICTS.en).sort()).toEqual(Object.keys(DICTS.es).sort());
  });
  it("migrating v1 data keeps campaigns and adds new sections", () => {
    const v1 = { campaigns: [{ ...demoCampaigns()[0]!, title: "Mía" }], profile: DEFAULT_PROFILE, calendar: [], onboardingDismissed: true };
    const s = migrate(v1);
    expect(s.campaigns[0]!.title).toBe("Mía");
    expect(s.campaigns[0]!.tags).toEqual([]);
    expect(s.activity).toEqual([]);
    expect(s.prefs.lang).toBe("es");
  });
});
