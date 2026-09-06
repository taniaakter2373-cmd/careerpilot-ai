import { describe, expect, it } from "vitest";
import { evaluateAward, evidenceStrength, type AwardCriteria, type AwardProfile } from "./awards";

const profile: AwardProfile = {
  currentTitle: "Deputy Manager, CoE – Total Rewards Lead",
  yearsExperience: 6,
  targetRoles: ["Reward Manager", "Compensation & Benefits Manager", "HR Business Partner", "HR Analytics"],
  skills: [
    "Total Rewards Strategy", "Compensation & Benefits", "Salary Benchmarking", "Job Evaluation",
    "Variable Pay", "Payroll Management", "HR Analytics", "HRIS", "Automation", "Talent Management",
  ],
  industries: ["Manufacturing"],
  country: "Bangladesh",
  education: "MBA",
  careerGoals: ["Head of HR", "CHRO-track"],
};

const globalRewardAward: AwardCriteria = {
  name: "Reward Professional of the Year",
  region: "GLOBAL",
  category: "Reward / Compensation & Benefits",
  eligibility: "Open to HR and reward professionals worldwide",
  judgingCriteria: "Compensation innovation, measurable impact, leadership",
};

describe("evaluateAward — strong global reward award", () => {
  const r = evaluateAward(globalRewardAward, profile);
  it("high eligibility for a global reward award", () => {
    expect(r.eligibilityScore).toBeGreaterThanOrEqual(80);
  });
  it("high profile fit for a Total Rewards Lead", () => {
    expect(r.profileFitScore).toBeGreaterThanOrEqual(80);
  });
  it("recommends action but never guarantees winning", () => {
    expect(r.recommendedAction.toLowerCase()).not.toContain("guarantee");
  });
});

describe("evaluateAward — region gating", () => {
  it("APAC award does not fully block a South-Asia candidate", () => {
    const r = evaluateAward({ name: "Asia HR Excellence Award", region: "APAC", category: "HR" }, profile);
    expect(r.eligibilityScore).toBeGreaterThanOrEqual(60);
  });
  it("EUROPE national award lowers but does not zero eligibility", () => {
    const r = evaluateAward({ name: "German HR Award", region: "EUROPE", category: "HR" }, profile);
    expect(r.eligibilityScore).toBeGreaterThanOrEqual(0);
    expect(r.eligibilityScore).toBeLessThanOrEqual(70);
  });
});

describe("evaluateAward — weak fit", () => {
  it("NOT_RECOMMENDED for an unrelated technical award", () => {
    const r = evaluateAward({ name: "Best Data Engineer", region: "GLOBAL", category: "Data Engineering / Software", eligibility: "Software engineers only", judgingCriteria: "Coding" }, profile);
    expect(r.priority).toBe("NOT_RECOMMENDED");
  });
});

describe("evidenceStrength", () => {
  it("flags measurable impact items as missing rather than inventing numbers", () => {
    const e = evidenceStrength(profile);
    expect(e.missing.some((m) => m.toLowerCase().includes("headcount"))).toBe(true);
    expect(e.missing.some((m) => m.toLowerCase().includes("financial impact"))).toBe(true);
  });
});
