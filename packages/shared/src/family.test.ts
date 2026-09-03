import { describe, expect, it } from "vitest";
import {
  childCanAccompanyScore,
  computeChildAge,
  costFit,
  curriculumFit,
  familyFeasibilityScore,
  familyFinancialModel,
  familyRecommendation,
  familyVerdict,
  getCountryFamily,
  languageFit,
  parentJobStatus,
  schoolMatchScore,
  schoolRecommendation,
  hrCareerOpportunity,
  isFreePathway,
  familyFinancialEstimate,
  FAMILY_WEIGHTS,
  SCHOOL_WEIGHTS,
} from "./family";

describe("computeChildAge", () => {
  it("computes age from DOB", () => {
    const age = computeChildAge("2021-01-01");
    expect(age).toBeGreaterThanOrEqual(3);
  });
  it("returns null for missing DOB", () => {
    expect(computeChildAge(null)).toBeNull();
  });
});

describe("familyFeasibilityScore", () => {
  it("computes weighted score and verdict", () => {
    const input = {
      studyOpportunity: 90,
      funding: 90,
      childAccompaniment: 90,
      schoolingFeasibility: 90,
      totalFamilyCost: 70,
      visaFeasibility: 90,
      safetyStability: 90,
      longTermOpportunity: 85,
    };
    const score = familyFeasibilityScore(input);
    expect(score).toBeGreaterThanOrEqual(80);
    expect(familyVerdict(score)).toBe("STRONG_OPTION");
  });

  it("weights sum to 1", () => {
    const sum = Object.values(FAMILY_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 5);
  });
});

describe("childCanAccompanyScore", () => {
  it("maps statuses", () => {
    expect(childCanAccompanyScore("CONFIRMED")).toBe(100);
    expect(childCanAccompanyScore("NOT_PERMITTED")).toBe(0);
  });
});

describe("getCountryFamily / parentJobStatus", () => {
  it("finds Germany and allows student work", () => {
    const de = getCountryFamily("Germany");
    expect(de).not.toBeNull();
    expect(parentJobStatus(de, true)).toBe("LEGALLY_AVAILABLE");
  });
  it("US dependent work not permitted", () => {
    const us = getCountryFamily("United States");
    expect(parentJobStatus(us, false)).toBe("NOT_LEGALLY_AVAILABLE");
  });
  it("unknown country -> UNVERIFIED", () => {
    expect(parentJobStatus(getCountryFamily("Atlantis"), true)).toBe("UNVERIFIED");
  });
});

describe("familyFinancialModel", () => {
  it("computes net position and marks estimates", () => {
    const r = familyFinancialModel({
      scholarshipStipendAnnual: 12000,
      parentWorkIncomeAnnual: 8000,
      parentTuitionAnnual: 0,
      childTuitionAnnual: 4000,
      housingAnnual: 9000,
      foodAnnual: 5000,
      transportAnnual: 1000,
      insuranceAnnual: 2000,
      visaAnnual: 500,
      schoolAnnual: 0,
      otherAnnual: 1000,
    });
    expect(r.incomeAnnual).toBe(20000);
    expect(r.expensesAnnual).toBe(22500);
    expect(r.netAnnual).toBe(-2500);
    expect(r.estimated).toBe(true);
  });
});

describe("familyRecommendation", () => {
  it("maps score bands", () => {
    expect(familyRecommendation(90)).toBe("EXCELLENT_FAMILY_PATHWAY");
    expect(familyRecommendation(78)).toBe("STRONG_FAMILY_PATHWAY");
    expect(familyRecommendation(65)).toBe("POSSIBLE_WITH_CONDITIONS");
    expect(familyRecommendation(45)).toBe("HIGH_RISK");
    expect(familyRecommendation(30)).toBe("NOT_RECOMMENDED");
  });
});

describe("school matching", () => {
  it("schoolMatchScore computes weighted result", () => {
    const score = schoolMatchScore({ curriculum: 95, language: 100, ageGrade: 100, cost: 75, location: 85, admission: 70 });
    expect(score).toBeGreaterThanOrEqual(80);
    expect(schoolRecommendation(score)).toBe("STRONG_SCHOOL_FIT");
  });
  it("school weights sum to 1", () => {
    const sum = Object.values(SCHOOL_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 5);
  });
  it("curriculum/language/cost helpers", () => {
    expect(curriculumFit("International Baccalaureate (IB)", "International")).toBe(95);
    expect(languageFit("English")).toBe(100);
    expect(costFit("FREE")).toBe(100);
    expect(costFit("HIGH_COST")).toBe(40);
  });
  it("hrCareerOpportunity returns a score", () => {
    expect(hrCareerOpportunity("Germany")).toBe(85);
    expect(hrCareerOpportunity(null)).toBe(50);
  });
  it("isFreePathway requires all four factors", () => {
    expect(isFreePathway({ studyFunded: true, schoolingFreeOrLowCost: true, childCanAccompany: true, parentCanWork: true })).toBe(true);
    expect(isFreePathway({ studyFunded: true, schoolingFreeOrLowCost: false, childCanAccompany: true, parentCanWork: true })).toBe(false);
    expect(isFreePathway({ studyFunded: true, schoolingFreeOrLowCost: true, childCanAccompany: true, parentCanWork: false })).toBe(false);
  });
  it("familyFinancialEstimate computes net position and is marked estimated", () => {
    const f = familyFinancialEstimate("Germany");
    expect(f.familyLivingCost).toBe(22000);
    expect(f.totalIncome).toBe(f.scholarshipStipend + f.parentWorkIncome);
    expect(f.netAnnual).toBe(f.totalIncome - f.familyLivingCost);
    expect(f.estimated).toBe(true);
  });
});
