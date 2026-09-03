import { describe, expect, it } from "vitest";
import {
  calculatePriorityScore,
  DEFAULT_SCHOLARSHIP_WEIGHTS,
  evaluateEligibility,
  fieldMatches,
  scholarshipRecommendation,
  scoreScholarshipMatch,
  weightedScore,
} from "./scholarships";

describe("evaluateEligibility", () => {
  const fullApplicant = {
    hasBachelorsDegree: true,
    fieldOfStudy: "HR / Human Resources",
    cgpa: 3.69,
    ieltsScore: 7.0,
    toeflScore: null,
    yearsExperience: 5.8,
    nationality: "Bangladeshi",
    hasPassport: true,
  };

  it("returns NOT_ELIGIBLE when bachelor degree is required but not held", () => {
    const r = evaluateEligibility(
      { ...fullApplicant, hasBachelorsDegree: false },
      { requiresBachelors: true, requiredField: null, minCgpa: null, minIelts: null, minToefl: null, minYearsExperience: null },
    );
    expect(r.status).toBe("NOT_ELIGIBLE");
    expect(r.hardFailures).toContain("Bachelor's degree required");
  });

  it("returns UNCERTAIN when mandatory CGPA cannot be verified", () => {
    const r = evaluateEligibility(
      { ...fullApplicant, cgpa: null },
      { requiresBachelors: true, requiredField: null, minCgpa: 3.0, minIelts: null, minToefl: null, minYearsExperience: null },
    );
    expect(r.status).toBe("UNCERTAIN");
  });

  it("returns NOT_ELIGIBLE when CGPA is below minimum", () => {
    const r = evaluateEligibility(
      { ...fullApplicant, cgpa: 2.5 },
      { requiresBachelors: true, requiredField: null, minCgpa: 3.0, minIelts: null, minToefl: null, minYearsExperience: null },
    );
    expect(r.status).toBe("NOT_ELIGIBLE");
  });

  it("returns ELIGIBLE when all verifiable requirements pass", () => {
    const r = evaluateEligibility(fullApplicant, {
      requiresBachelors: true,
      requiredField: "Human Resources",
      minCgpa: 3.0,
      minIelts: 6.5,
      minToefl: null,
      minYearsExperience: null,
    });
    expect(r.status).toBe("ELIGIBLE");
  });

  it("returns LIKELY_ELIGIBLE when only the (obtainable) English test is missing", () => {
    const noIelts = { ...fullApplicant, ieltsScore: null, toeflScore: null };
    const r = evaluateEligibility(noIelts, {
      requiresBachelors: true,
      requiredField: null,
      minCgpa: null,
      minIelts: 6.5,
      minToefl: null,
      minYearsExperience: null,
    });
    expect(r.status).toBe("LIKELY_ELIGIBLE");
  });
});

describe("fieldMatches", () => {
  it("matches HR field via aliases", () => {
    expect(fieldMatches("Human Resources", "HR")).toBe(true);
  });
  it("returns null when either side is missing", () => {
    expect(fieldMatches(null, "HR")).toBeNull();
  });
});

describe("weightedScore", () => {
  it("computes weighted average", () => {
    const score = weightedScore({
      academic: 90,
      career: 96,
      subject: 94,
      experience: 95,
      eligibility: 100,
      language: 90,
      leadership: 88,
      mobility: 100,
    });
    expect(score).toBe(94);
  });
});

describe("scholarshipRecommendation", () => {
  it("maps score bands", () => {
    expect(scholarshipRecommendation(96)).toBe("EXCELLENT_MATCH");
    expect(scholarshipRecommendation(93)).toBe("STRONG_MATCH");
    expect(scholarshipRecommendation(85)).toBe("GOOD_MATCH");
    expect(scholarshipRecommendation(74)).toBe("POSSIBLE_MATCH");
    expect(scholarshipRecommendation(60)).toBe("LOW_PRIORITY");
  });
});

describe("calculatePriorityScore", () => {
  it("averages the five factors", () => {
    const p = calculatePriorityScore({
      match: 94,
      scholarshipAvailable: true,
      eligibilityConfidence: 100,
      careerAlignment: 96,
      deadlineFeasibility: 90,
    });
    expect(p).toBe(96);
  });

  it("zeroes scholarship contribution when unavailable", () => {
    const p = calculatePriorityScore({
      match: 94,
      scholarshipAvailable: false,
      eligibilityConfidence: 100,
      careerAlignment: 96,
      deadlineFeasibility: 90,
    });
    expect(p).toBe(76);
  });
});

describe("weights", () => {
  it("scholarship weights sum to 1", () => {
    const sum = Object.values(DEFAULT_SCHOLARSHIP_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 5);
  });
});

describe("scoreScholarshipMatch", () => {
  it("returns bounded component scores", () => {
    const applicant = {
      hasBachelorsDegree: true,
      fieldOfStudy: "HR",
      cgpa: 3.69,
      ieltsScore: 7.0,
      toeflScore: null,
      yearsExperience: 5.8,
      nationality: "Bangladeshi",
      hasPassport: true,
      leadershipExperience: "Lead CoE",
      internationalExperience: null,
    };
    const req = { requiresBachelors: true, requiredField: "HR", minCgpa: 3.0, minIelts: 6.5, minToefl: null, minYearsExperience: 2 };
    const eligibility = evaluateEligibility(applicant, req);
    const comps = scoreScholarshipMatch(applicant, req, eligibility);
    for (const v of Object.values(comps)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });
});
