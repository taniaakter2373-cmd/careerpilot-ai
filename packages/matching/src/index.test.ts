import { describe, expect, it } from "vitest";
import {
  hardRequirementFailures,
  isBlockedCompany,
  isHrRole,
  parseExperienceYears,
  scoreJob,
  type CandidateForMatching,
  type JobForMatching,
} from "./index";

const candidate: CandidateForMatching = {
  currentTitle: "Deputy Manager, CoE – Total Rewards Lead",
  yearsExperience: 5.8,
  skills: [
    "Total Rewards",
    "Compensation & Benefits",
    "Salary Benchmarking",
    "Payroll Management",
    "HR Analytics",
    "HR Business Partnering",
    "Performance Management",
  ],
  targetRoles: ["Manager – HR", "HR Manager", "Reward Manager", "Manager – Compensation & Benefits"],
  industries: ["HR", "Human Capital"],
  preferredLocations: ["Bangladesh", "UAE", "Singapore"],
  education: "MBA (Finance)",
  salaryExpectation: { min: 150000, currency: "BDT" },
  careerGoals: ["Head of HR"],
};

describe("parseExperienceYears", () => {
  it("parses ranges", () => expect(parseExperienceYears("5-8 years")).toEqual({ min: 5, max: 8 }));
  it("parses open-ended", () => expect(parseExperienceYears("10+ years")).toEqual({ min: 10, max: null }));
  it("parses single", () => expect(parseExperienceYears("6 years")).toEqual({ min: 6, max: 6 }));
  it("handles null", () => expect(parseExperienceYears(null)).toEqual({ min: null, max: null }));
});

describe("hardRequirementFailures", () => {
  it("flags when candidate is below minimum experience", () => {
    const job: JobForMatching = { title: "HR Manager", company: "X", location: null, country: null, industry: null, salaryMin: null, salaryMax: null, salaryCurrency: null, skills: [], requirements: [], educationRequirements: [], experienceRequired: "10 years" };
    const f = hardRequirementFailures(candidate, job);
    expect(f).toContain("Requires 10 years experience (candidate has 5.8)");
  });

  it("flags missing MBA when required", () => {
    const job: JobForMatching = { title: "HR Manager", company: "X", location: null, country: null, industry: null, salaryMin: null, salaryMax: null, salaryCurrency: null, skills: [], requirements: [], educationRequirements: ["Master's degree required"], experienceRequired: null };
    const noMba = { ...candidate, education: "BBA" };
    expect(hardRequirementFailures(noMba, job).length).toBeGreaterThan(0);
  });
});

describe("scoreJob", () => {
  it("produces a strong match for a well-aligned job", () => {
    const job: JobForMatching = {
      title: "Reward Manager",
      company: "Demo Holdings",
      location: "Dhaka",
      country: "Bangladesh",
      industry: "HR",
      salaryMin: 150000,
      salaryMax: 220000,
      salaryCurrency: "BDT",
      skills: ["Total Rewards", "Salary Benchmarking", "Payroll Management"],
      requirements: [],
      educationRequirements: ["MBA"],
      experienceRequired: "5-8 years",
    };
    const r = scoreJob(candidate, job);
    expect(r.overallScore).toBeGreaterThanOrEqual(85);
    expect(r.hardRequirementFailure).toBe(false);
    expect(r.action).toBe("APPLY");
  });

  it("returns SKIP when a hard requirement fails regardless of score", () => {
    const job: JobForMatching = {
      title: "Reward Manager",
      company: "X",
      location: "Dhaka",
      country: "Bangladesh",
      industry: "HR",
      salaryMin: 200000,
      salaryMax: 300000,
      salaryCurrency: "BDT",
      skills: ["Total Rewards", "Salary Benchmarking"],
      requirements: [],
      educationRequirements: [],
      experienceRequired: "10+ years",
    };
    const r = scoreJob(candidate, job);
    expect(r.hardRequirementFailure).toBe(true);
    expect(r.action).toBe("SKIP");
  });

  it("always skips blocked companies (nextjobz)", () => {
    expect(isBlockedCompany("nextjobz")).toBe(true);
    expect(isBlockedCompany("NextJobz Ltd")).toBe(true);
    const job: JobForMatching = {
      title: "HR Manager",
      company: "nextjobz",
      location: "Dhaka",
      country: "Bangladesh",
      industry: "HR",
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,
      skills: ["HR"],
      requirements: [],
      educationRequirements: [],
      experienceRequired: null,
    };
    const r = scoreJob(candidate, job);
    expect(r.action).toBe("SKIP");
    expect(r.hardRequirementFailure).toBe(true);
  });

  it("prefers Dhaka for local jobs", () => {
    const base = {
      title: "HR Manager",
      company: "Acme Ltd",
      industry: "HR",
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,
      skills: ["HR"],
      requirements: [],
      educationRequirements: [],
      experienceRequired: null,
    };
    const dhaka = scoreJob(candidate, { ...base, location: "Dhaka, Bangladesh", country: "Bangladesh" });
    const chattogram = scoreJob(candidate, { ...base, location: "Chattogram", country: "Bangladesh" });
    expect(dhaka.breakdown.location).toBe(100);
    expect(chattogram.breakdown.location).toBe(60);
  });

  it("prefers international jobs outside Bangladesh", () => {
    const base = {
      title: "HR Manager",
      company: "Acme Ltd",
      industry: "HR",
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,
      skills: ["HR"],
      requirements: [],
      educationRequirements: [],
      experienceRequired: null,
    };
    const intl = scoreJob(candidate, { ...base, location: "Dubai", country: "UAE" });
    expect(intl.breakdown.location).toBe(100);
  });
});

describe("isHrRole", () => {
  it("accepts HR titles", () => {
    for (const t of ["HR Manager", "Human Resources Officer", "Head Recruitment", "Talent Acquisition Specialist", "Manager - HR & Admin", "Reward Manager", "People Generalist", "HR Business Partner"]) {
      expect(isHrRole(t), t).toBe(true);
    }
  });
  it("rejects non-HR titles", () => {
    for (const t of ["Quantity Surveyor", "Production Manager", "Sales Representative", "Project Manager", "Accountant", "Structural Engineer"]) {
      expect(isHrRole(t), t).toBe(false);
    }
  });
});
