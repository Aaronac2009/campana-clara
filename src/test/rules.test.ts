import { describe, expect, it } from "vitest";
import { canApprove } from "@/lib/rules";
import { demoCampaigns } from "@/lib/demo-data";

const [thematic, , efem] = demoCampaigns();
if (!thematic || !efem) throw new Error("Missing approval test fixtures");

describe("approval rules", () => {
  it("blocks efeméride without source URL", () => {
    expect(canApprove({ ...efem, reviewer: "Ana" })).toBe(false);
  });
  it("blocks efeméride with URL but no manual confirmation", () => {
    expect(canApprove({ ...efem, reviewer: "Ana", efemeride: { ...efem.efemeride, sourceUrl: "https://example.org/x" } })).toBe(false);
  });
  it("allows efeméride with URL and confirmation", () => {
    expect(canApprove({ ...efem, reviewer: "Ana", efemeride: { ...efem.efemeride, sourceUrl: "https://example.org/x", confirmed: true } })).toBe(true);
  });
  it("allows thematic campaign without date", () => {
    expect(canApprove({ ...thematic, reviewer: "Ana" })).toBe(true);
  });
});
