import { describe, expect, it } from "vitest";
import { computeDuplicateHash, descriptionSimilarity, isDuplicate } from "./dedupe";
import { normalizeJob } from "./normalize";
import { DemoJobSource } from "./demo-source";

describe("normalizeJob", () => {
  it("fills defaults for missing fields", () => {
    const n = normalizeJob({ source: "x", sourceJobId: null, url: "u", title: "T", company: "C" });
    expect(n.remoteType).toBe("ANY");
    expect(n.employmentType).toBe("ANY");
    expect(n.skills).toEqual([]);
  });
});

describe("dedupe", () => {
  const a = normalizeJob({ source: "demo", sourceJobId: "1", url: "https://x/j1", title: "HR Manager", company: "Demo Ltd", location: "Dhaka", description: "Lead HR operations and compensation" });
  const b = normalizeJob({ source: "demo", sourceJobId: "2", url: "https://x/j2", title: "HR Manager", company: "Demo Ltd", location: "Dhaka", description: "Lead HR operations and compensation" });

  it("same company+title+location => duplicate", () => {
    expect(computeDuplicateHash(a)).toBe(computeDuplicateHash(b));
    expect(isDuplicate(a, b)).toBe(true);
  });

  it("different roles are not duplicates", () => {
    const c = normalizeJob({ source: "demo", sourceJobId: "3", url: "https://x/j3", title: "Finance Manager", company: "Demo Ltd", location: "Dhaka", description: "Finance operations" });
    expect(isDuplicate(a, c)).toBe(false);
  });
});

describe("descriptionSimilarity", () => {
  it("returns 1 for identical text", () => {
    expect(descriptionSimilarity("a b c", "a b c")).toBe(1);
  });
});

describe("DemoJobSource", () => {
  it("returns demo jobs and does not support automation", async () => {
    const src = new DemoJobSource();
    const jobs = await src.searchJobs({});
    expect(jobs.length).toBeGreaterThan(0);
    expect(src.supportsApplicationAutomation()).toBe(false);
    const res = await src.apply(jobs[0], { name: "T", email: "t@x.com" });
    expect(res.status).toBe("MANUAL_APPLICATION_REQUIRED");
  });
});
