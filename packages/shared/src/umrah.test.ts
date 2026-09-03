import { describe, expect, it } from "vitest";
import { classifyUmrah, coveragePercent, isFullyFree, umrahRiskLevel, umrahRecommendable, UMRAH_CLASS_EMOJI, UMRAH_CLASS_LABEL } from "./umrah";

const FULLY = {
  visa: true,
  roundTripFlight: true,
  makkahHotel: true,
  madinahHotel: true,
  food: true,
  transport: true,
  insurance: true,
  mandatoryFees: true,
};

describe("isFullyFree", () => {
  it("TRUE only when every mandatory item is covered", () => {
    expect(isFullyFree(FULLY)).toBe(true);
  });
  it("FALSE when any mandatory item is missing", () => {
    for (const key of ["visa", "roundTripFlight", "makkahHotel", "madinahHotel", "food", "transport", "mandatoryFees"] as const) {
      expect(isFullyFree({ ...FULLY, [key]: false }), key).toBe(false);
    }
  });
  it("FALSE when insurance is missing and required", () => {
    expect(isFullyFree({ ...FULLY, insurance: false })).toBe(false);
  });
  it("TRUE when insurance is NOT_REQUIRED", () => {
    expect(isFullyFree({ ...FULLY, insurance: "NOT_REQUIRED" })).toBe(true);
  });
});

describe("coveragePercent", () => {
  it("computes coverage fraction", () => {
    expect(coveragePercent(FULLY)).toBe(1);
    expect(coveragePercent({ ...FULLY, visa: false })).toBe(0.875);
  });
});

describe("classifyUmrah", () => {
  it("FULLY FREE when all covered AND child covered", () => {
    expect(classifyUmrah(FULLY, true)).toBe("FULLY_FREE");
    expect(UMRAH_CLASS_EMOJI.FULLY_FREE).toBe("🟢");
  });
  it("FREE FOR APPLICANT ONLY when parent covered but child NOT covered", () => {
    expect(classifyUmrah(FULLY, false)).toBe("FREE_FOR_APPLICANT_ONLY");
    expect(UMRAH_CLASS_LABEL.FREE_FOR_APPLICANT_ONLY).toBe("FULLY FUNDED – CHILD NOT INCLUDED");
  });
  it("PARTIALLY SPONSORED when half covered", () => {
    expect(classifyUmrah({ ...FULLY, visa: false, roundTripFlight: false, makkahHotel: false, madinahHotel: false }, true)).toBe("PARTIALLY_SPONSORED");
  });
  it("SELF-FUNDED when nothing covered", () => {
    expect(classifyUmrah({ visa: false, roundTripFlight: false, makkahHotel: false, madinahHotel: false, food: false, transport: false, insurance: false, mandatoryFees: false }, true)).toBe("SELF_FUNDED");
  });
  it("EXPIRED when status is closed", () => {
    expect(classifyUmrah(FULLY, true, "EXPIRED")).toBe("EXPIRED");
    expect(UMRAH_CLASS_EMOJI.EXPIRED).toBe("🔴");
  });
});

describe("umrahRiskLevel", () => {
  it("CRITICAL for fake sponsorship / urgent payment / personal bank", () => {
    expect(umrahRiskLevel({ fakeSponsorship: true })).toBe("CRITICAL");
    expect(umrahRiskLevel({ personalBankPayment: true, urgentPayment: true })).toBe("CRITICAL");
    expect(umrahRiskLevel({ guaranteedVisa: true })).toBe("CRITICAL");
  });
  it("HIGH for unknown org / suspicious domain", () => {
    expect(umrahRiskLevel({ unknownOrganization: true })).toBe("HIGH");
  });
  it("LOW for clean opportunity", () => {
    expect(umrahRiskLevel({})).toBe("LOW");
  });
  it("not recommendable for HIGH/CRITICAL", () => {
    expect(umrahRecommendable("LOW")).toBe(true);
    expect(umrahRecommendable("MEDIUM")).toBe(true);
    expect(umrahRecommendable("HIGH")).toBe(false);
    expect(umrahRecommendable("CRITICAL")).toBe(false);
  });
});
