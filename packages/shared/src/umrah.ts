// UmrahPilot — strict fully-funded Umrah classification engine (pure, testable).
// SAFETY: an opportunity is "FULLY FREE" ONLY if every mandatory expense is
// verified as covered. Never assume or fabricate sponsorship coverage.

export interface UmrahCoverage {
  visa: boolean;
  roundTripFlight: boolean;
  makkahHotel: boolean;
  madinahHotel: boolean;
  food: boolean;
  transport: boolean;
  insurance: boolean | "NOT_REQUIRED";
  mandatoryFees: boolean;
}

const mandatoryChecks: (keyof UmrahCoverage)[] = [
  "visa",
  "roundTripFlight",
  "makkahHotel",
  "madinahHotel",
  "food",
  "transport",
  "insurance",
  "mandatoryFees",
];

/** TRUE only if EVERY mandatory expense is covered (or insurance not required). */
export function isFullyFree(c: UmrahCoverage): boolean {
  return (
    c.visa === true &&
    c.roundTripFlight === true &&
    c.makkahHotel === true &&
    c.madinahHotel === true &&
    c.food === true &&
    c.transport === true &&
    (c.insurance === true || c.insurance === "NOT_REQUIRED") &&
    c.mandatoryFees === true
  );
}

/** Fraction (0-1) of mandatory expenses covered. */
export function coveragePercent(c: UmrahCoverage): number {
  let covered = 0;
  for (const k of mandatoryChecks) {
    if (k === "insurance") {
      if (c.insurance === true || c.insurance === "NOT_REQUIRED") covered++;
    } else if (c[k] === true) {
      covered++;
    }
  }
  return covered / mandatoryChecks.length;
}

export type UmrahClassification =
  | "FULLY_FREE"
  | "FREE_FOR_APPLICANT_ONLY"
  | "FULLY_SPONSORED_MINOR_EXCLUDED"
  | "PARTIALLY_SPONSORED"
  | "DISCOUNTED"
  | "EXPIRED"
  | "UNVERIFIED"
  | "SELF_FUNDED";

export const UMRAH_CLASS_LABEL: Record<UmrahClassification, string> = {
  FULLY_FREE: "FULLY FREE",
  FREE_FOR_APPLICANT_ONLY: "FULLY FUNDED – CHILD NOT INCLUDED",
  FULLY_SPONSORED_MINOR_EXCLUDED: "FULLY SPONSORED – MINOR EXCLUDED COST",
  PARTIALLY_SPONSORED: "PARTIALLY SPONSORED",
  DISCOUNTED: "DISCOUNTED",
  EXPIRED: "EXPIRED",
  UNVERIFIED: "UNVERIFIED",
  SELF_FUNDED: "SELF-FUNDED",
};

export const UMRAH_CLASS_EMOJI: Record<UmrahClassification, string> = {
  FULLY_FREE: "🟢",
  FREE_FOR_APPLICANT_ONLY: "🟡",
  FULLY_SPONSORED_MINOR_EXCLUDED: "🟡",
  PARTIALLY_SPONSORED: "🟠",
  DISCOUNTED: "🔵",
  EXPIRED: "🔴",
  UNVERIFIED: "⚪",
  SELF_FUNDED: "⚪",
};

export type UmrahStatus = "OPEN" | "UPCOMING" | "EXPIRED" | "CLOSED";

export function classifyUmrah(c: UmrahCoverage, childCovered: boolean, status: UmrahStatus = "OPEN"): UmrahClassification {
  if (status === "EXPIRED" || status === "CLOSED") return "EXPIRED";
  if (isFullyFree(c)) {
    if (childCovered) return "FULLY_FREE";
    return "FREE_FOR_APPLICANT_ONLY";
  }
  const pct = coveragePercent(c);
  if (pct >= 0.875) return "FULLY_SPONSORED_MINOR_EXCLUDED";
  if (pct >= 0.5) return "PARTIALLY_SPONSORED";
  if (pct > 0) return "DISCOUNTED";
  return "SELF_FUNDED";
}

// ---- Scam / risk detection (spec: never recommend HIGH/CRITICAL) -----------
export interface UmrahRiskFlags {
  fakeSponsorship?: boolean;
  guaranteedVisa?: boolean;
  guaranteedUmrah?: boolean;
  unknownOrganization?: boolean;
  personalBankPayment?: boolean;
  urgentPayment?: boolean;
  noOfficialSource?: boolean;
  fakeGovBranding?: boolean;
  unclearTerms?: boolean;
  suspiciousDomain?: boolean;
}

export type UmrahRisk = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export function umrahRiskLevel(flags: UmrahRiskFlags): UmrahRisk {
  const critical = flags.fakeSponsorship || flags.guaranteedVisa || flags.personalBankPayment || flags.urgentPayment || flags.fakeGovBranding;
  if (critical) return "CRITICAL";
  const high = flags.guaranteedUmrah || flags.suspiciousDomain || flags.unknownOrganization;
  if (high) return "HIGH";
  const medium = (flags.noOfficialSource ? 1 : 0) + (flags.unclearTerms ? 1 : 0);
  if (medium >= 2) return "MEDIUM";
  return "LOW";
}

export function umrahRecommendable(risk: UmrahRisk): boolean {
  return risk === "LOW" || risk === "MEDIUM";
}

export interface UmrahEvidence {
  sponsor: string;
  officialUrl: string;
  announcementUrl: string | null;
  announcementDate: string | null;
  applicationDeadline: string | null;
  travelPeriod: string | null;
  eligibility: string;
  coveredExpenses: string[];
  excludedExpenses: string[];
  verificationDate: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
}

export interface UmrahOpportunityData {
  title: string;
  coverage: UmrahCoverage;
  childCovered: boolean;
  evidence: UmrahEvidence;
}

export function buildUmrahOpportunity(data: UmrahOpportunityData) {
  const classification = classifyUmrah(data.coverage, data.childCovered);
  return {
    title: data.title,
    coverage: data.coverage,
    childCovered: data.childCovered,
    isFullyFree: isFullyFree(data.coverage),
    coveragePercent: Math.round(coveragePercent(data.coverage) * 100),
    classification,
    classificationLabel: UMRAH_CLASS_LABEL[classification],
    classificationEmoji: UMRAH_CLASS_EMOJI[classification],
    evidence: data.evidence,
    verified: data.evidence.confidence === "HIGH" && isFullyFree(data.coverage),
  };
}
