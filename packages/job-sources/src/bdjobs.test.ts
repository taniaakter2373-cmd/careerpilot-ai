import { describe, expect, it } from "vitest";
import { BdjobsSource } from "./bdjobs";

const FIXTURE = `
<html><body>
<div class="job-list">
  <div class="job-title-text"><a href="/job/123/hr-manager" class="job-title">HR Manager</a></div>
  <div class="company-name">ABC Textiles Ltd</div>
  <div class="job-title-text"><a href="/job/456/reward-manager" class="job-title">Reward Manager</a></div>
  <div class="company-name">XYZ Holdings</div>
</div>
</body></html>
`;

describe("BdjobsSource (parser, no network)", () => {
  it("parses job titles from listing markup", () => {
    // @ts-expect-error accessing protected for test
    const jobs = new BdjobsSource().parseListings(FIXTURE);
    expect(jobs.length).toBe(2);
    expect(jobs[0].title).toBe("HR Manager");
    expect(jobs[0].source).toBe("bdjobs");
    expect(jobs[0].country).toBe("Bangladesh");
  });

  it("returns MANUAL_APPLICATION_REQUIRED (no automation)", async () => {
    const src = new BdjobsSource();
    expect(src.supportsApplicationAutomation()).toBe(false);
    const res = await src.apply({ source: "bdjobs", sourceJobId: null, url: "https://x", title: "T", company: "C" }, { name: "T", email: "t@x" });
    expect(res.status).toBe("MANUAL_APPLICATION_REQUIRED");
  });
});
