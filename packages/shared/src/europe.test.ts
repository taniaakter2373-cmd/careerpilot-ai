import { describe, expect, it } from "vitest";
import {
  evaluateIelts,
  parseJobEnglishSignals,
  detectSponsorship,
  detectRelocationSupport,
  parseSalaryText,
  europeJobPriority,
  type EnglishProfileInput,
} from "./europe";

const noIelts: EnglishProfileInput = { ieltsStatus: "NOT_AVAILABLE", ieltsOverallBand: null, otherEnglishTest: "NONE" };
const withIelts: EnglishProfileInput = { ieltsStatus: "AVAILABLE", ieltsOverallBand: 7.5, otherEnglishTest: "NONE" };
const withToefl: EnglishProfileInput = { ieltsStatus: "NOT_AVAILABLE", toeflScore: 105, otherEnglishTest: "TOEFL" };

describe("parseJobEnglishSignals", () => {
  it("detects explicit IELTS requirement", () => {
    const s = parseJobEnglishSignals("Must hold IELTS band 6.5 or above. English is required.");
    expect(s.ieltsExplicitlyRequired).toBe(true);
    expect(s.englishRequired).toBe(true);
  });
  it("does not over-detect when IELTS merely mentioned in generic text", () => {
    const s = parseJobEnglishSignals("We value diversity. Our team works in English.");
    expect(s.ieltsExplicitlyRequired).toBe(false);
    expect(s.englishRequired).toBe(false);
  });
});

describe("evaluateIelts — Case 1 (not required)", () => {
  it("NOT_AVAILABLE profile is NOT blocked when nothing requires it", () => {
    const d = evaluateIelts({}, false, noIelts);
    expect(d.status).toBe("NOT_REQUIRED");
    expect(d.applyImmediately).toBe(true);
    expect(d.eligibilityImpact).toBe("NONE");
  });
  it("never rejects just because IELTS is absent", () => {
    const d = evaluateIelts({ englishRequired: true }, false, noIelts);
    expect(d.applyImmediately).toBe(true); // proficiency-only path
  });
});

describe("evaluateIelts — Case 2 (proficiency only)", () => {
  it("recommends apply when employer wants English but no test mandated", () => {
    const d = evaluateIelts({ englishRequired: true, text: "Excellent communication skills in English" }, false, noIelts);
    expect(d.status).toBe("ENGLISH_PROFICIENCY_REQUIRED");
    expect(d.applyImmediately).toBe(true);
  });
});

describe("evaluateIelts — Case 3 (employer requires IELTS)", () => {
  it("gap when no test, but applyImmediately=false not hard ineligible", () => {
    const d = evaluateIelts({ ieltsExplicitlyRequired: true, text: "IELTS is required, minimum band 6.0" }, false, noIelts);
    expect(d.status).toBe("REQUIRED_BY_EMPLOYER");
    expect(d.eligibilityImpact).toBe("GAP");
    expect(d.recommendation).not.toContain("ineligible");
  });
  it("apply allowed when candidate holds IELTS", () => {
    const d = evaluateIelts({ ieltsExplicitlyRequired: true }, false, withIelts);
    expect(d.applyImmediately).toBe(true);
    expect(d.eligibilityImpact).toBe("NONE");
    expect(d.availableTest).toBe("IELTS 7.5");
  });
  it("alternative accepted test unlocks apply", () => {
    const d = evaluateIelts({ ieltsExplicitlyRequired: true, alternativeTestsAccepted: ["TOEFL"] }, false, withToefl);
    expect(d.applyImmediately).toBe(true);
  });
});

describe("evaluateIelts — Case 4 (visa route wants test)", () => {
  it("verify path keeps applyImmediately true and flags VERIFY, not gap", () => {
    const d = evaluateIelts({}, true, noIelts);
    expect(d.status).toBe("REQUIRED_FOR_VISA");
    expect(d.applyImmediately).toBe(true);
    expect(d.eligibilityImpact).toBe("VERIFY");
  });
});

describe("detectSponsorship", () => {
  it("explicit when sponsorship is offered", () => {
    expect(detectSponsorship("We provide visa sponsorship for the right candidate.").status).toBe("EXPLICIT");
  });
  it("unlikely when posting says no sponsorship", () => {
    expect(detectSponsorship("No visa sponsorship available. Local candidates only.").status).toBe("UNLIKELY");
  });
  it("not mentioned is not assumed", () => {
    const s = detectSponsorship("Join our growing team in Berlin.");
    expect(s.status).toBe("NOT_MENTIONED");
    expect(s.note.toLowerCase()).toContain("do not assume");
  });
});

describe("detectRelocationSupport", () => {
  it("detects support", () => {
    expect(detectRelocationSupport("Relocation assistance and visa support provided").status).toBe("YES");
  });
  it("not mentioned default", () => {
    expect(detectRelocationSupport("Competitive salary").status).toBe("NOT_MENTIONED");
  });
});

describe("parseSalaryText", () => {
  it("never fabricates a number when absent", () => {
    const p = parseSalaryText("Competitive package");
    expect(p.minMonthly).toBeNull();
    expect(p.maxMonthly).toBeNull();
  });
  it("parses annual EUR range but flags annual", () => {
    const p = parseSalaryText("€70,000 - €85,000 per year");
    expect(p.minMonthly).toBe(70000);
    expect(p.maxMonthly).toBe(85000);
    expect(p.currency).toBe("EUR");
    expect(p.annual).toBe(true);
  });
});

describe("europeJobPriority", () => {
  const base = { careerMatch: 85, visaScore: 80, sponsorship: "EXPLICIT" as const, relocation: "YES" as const, noIeltsBarrier: true, ieltsGap: false } as const;
  it("P1 for strong career + visa + sponsorship + no ielts barrier", () => {
    const r = europeJobPriority({ ...base });
    expect(r.priority).toBe("P1");
  });
  it("not P1 when visa weak", () => {
    const r = europeJobPriority({ careerMatch: 85, visaScore: 35, sponsorship: "EXPLICIT", relocation: "NO", noIeltsBarrier: true, ieltsGap: false });
    expect(r.priority).toBe("P4");
  });
});
