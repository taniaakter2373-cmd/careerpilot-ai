// FamilyRelocationPilot — family + child schooling feasibility engine (pure, testable).
// SAFETY: every visa/schooling/cost value used here is a label that MUST be
// verified against official immigration/education sources before acting on it.

export type ChildAccompanyStatus =
  | "CONFIRMED"
  | "LIKELY"
  | "COUNTRY_SPECIFIC"
  | "UNCERTAIN"
  | "NOT_PERMITTED";

export interface ChildProfileData {
  fullName: string;
  dateOfBirth: string | null;
  nationality: string | null;
  passportStatus: string | null;
  currentSchool: string | null;
  currentGrade: string | null;
  language: string | null;
  specialSchoolingRequirements: string | null;
  preferredSchoolingLanguage: string | null;
  preferredCurriculum: string | null;
  preferredCountry: string | null;
  preferredCity: string | null;
}

export function computeChildAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

export function childCanAccompanyScore(status: ChildAccompanyStatus): number {
  switch (status) {
    case "CONFIRMED":
      return 100;
    case "LIKELY":
      return 85;
    case "COUNTRY_SPECIFIC":
      return 60;
    case "UNCERTAIN":
      return 35;
    case "NOT_PERMITTED":
      return 0;
  }
}

export interface FamilyAssessmentInput {
  studyOpportunity: number; // 0-100
  funding: number; // 0-100
  childAccompaniment: number; // 0-100
  schoolingFeasibility: number; // 0-100
  totalFamilyCost: number; // 0-100 (higher = more affordable)
  visaFeasibility: number; // 0-100
  safetyStability: number; // 0-100
  longTermOpportunity: number; // 0-100
}

export const FAMILY_WEIGHTS = {
  study: 0.2,
  funding: 0.2,
  child: 0.2,
  schooling: 0.15,
  cost: 0.1,
  visa: 0.05,
  safety: 0.05,
  longTerm: 0.05,
} as const;

export type FamilyComponent = keyof typeof FAMILY_WEIGHTS;

export function familyFeasibilityScore(input: FamilyAssessmentInput): number {
  const values: Record<FamilyComponent, number> = {
    study: input.studyOpportunity,
    funding: input.funding,
    child: input.childAccompaniment,
    schooling: input.schoolingFeasibility,
    cost: input.totalFamilyCost,
    visa: input.visaFeasibility,
    safety: input.safetyStability,
    longTerm: input.longTermOpportunity,
  };
  let total = 0;
  for (const [k, w] of Object.entries(FAMILY_WEIGHTS)) {
    total += values[k as FamilyComponent] * w;
  }
  return Math.round(total);
}

export type FamilyVerdict = "STRONG_OPTION" | "POSSIBLE" | "MAJOR_OBSTACLE";

export function familyVerdict(score: number): FamilyVerdict {
  if (score >= 80) return "STRONG_OPTION";
  if (score >= 55) return "POSSIBLE";
  return "MAJOR_OBSTACLE";
}

export interface FamilyDocumentChecklist {
  parent: { type: string; status: string }[];
  child: { type: string; status: string }[];
  spouse: { type: string; status: string }[];
}

export function familyDocumentChecklist(childHasPassport: boolean): FamilyDocumentChecklist {
  return {
    parent: [
      { type: "Passport", status: "VERIFIED" },
      { type: "Admission Letter", status: "MISSING" },
      { type: "Scholarship Letter", status: "MISSING" },
      { type: "Academic Certificates", status: "READY" },
      { type: "Transcript", status: "READY" },
      { type: "CV", status: "VERIFIED" },
      { type: "Motivation Letter", status: "DRAFT" },
      { type: "Financial Documents", status: "MISSING" },
      { type: "Health Insurance", status: "MISSING" },
      { type: "Visa Documents", status: "MISSING" },
    ],
    child: [
      { type: "Passport", status: childHasPassport ? "VERIFIED" : "MISSING" },
      { type: "Birth Certificate", status: "VERIFIED" },
      { type: "Parent-Child Relationship Proof", status: "MISSING" },
      { type: "School Records", status: "READY" },
      { type: "Vaccination / Health Records", status: "MISSING" },
      { type: "School Admission Letter", status: "MISSING" },
      { type: "Insurance", status: "MISSING" },
      { type: "Visa / Residence Documents", status: "MISSING" },
      { type: "Parental Consent", status: "MISSING" },
    ],
    spouse: [
      { type: "Passport", status: "MISSING" },
      { type: "Marriage Certificate", status: "MISSING" },
      { type: "Visa Documents", status: "MISSING" },
      { type: "Insurance", status: "MISSING" },
    ],
  };
}

// =============================================================================
// ParentWorkPilot — work-rights + parent job availability per destination.
// SAFETY: these are country-level LIKELIHOODS, not guarantees. Every claim must
// be verified against the official immigration authority before acting on it.
// =============================================================================

export interface WorkRights {
  studentWork: "ALLOWED" | "RESTRICTED" | "NOT_PERMITTED" | "COUNTRY_SPECIFIC";
  hoursPerWeek: number | null;
  dependentWork: "ALLOWED" | "RESTRICTED" | "NOT_PERMITTED" | "COUNTRY_SPECIFIC";
  postStudy: { jobSearchPeriod: string; statusChange: string; source: string };
  source: string;
}

export interface CountryFamilyData {
  country: string;
  childAccompany: ChildAccompanyStatus;
  childAccompanyNote: string;
  schooling: { type: string; feeLevel: "FREE" | "LOW_COST" | "MODERATE" | "HIGH_COST" | "UNKNOWN"; englishMedium: boolean };
  work: WorkRights;
  safety: number; // 0-100
  costOfLiving: number; // 0-100, higher = more affordable
  source: string;
}

const GOV = "Official immigration/education authority (verify)";

export const COUNTRY_FAMILY: Record<string, CountryFamilyData> = {
  Germany: {
    country: "Germany",
    childAccompany: "LIKELY",
    childAccompanyNote: "Child can join on residence permit; schooling allowed (verify with German embassy)",
    schooling: { type: "Public/international", feeLevel: "LOW_COST", englishMedium: true },
    work: { studentWork: "ALLOWED", hoursPerWeek: 120, dependentWork: "RESTRICTED", postStudy: { jobSearchPeriod: "18 months", statusChange: "EU Blue Card / work permit", source: GOV }, source: GOV },
    safety: 92,
    costOfLiving: 60,
    source: GOV,
  },
  Netherlands: {
    country: "Netherlands",
    childAccompany: "LIKELY",
    childAccompanyNote: "Dependent visa route available for children of study/residence permit holders (verify)",
    schooling: { type: "Public/international", feeLevel: "MODERATE", englishMedium: true },
    work: { studentWork: "ALLOWED", hoursPerWeek: 16, dependentWork: "COUNTRY_SPECIFIC", postStudy: { jobSearchPeriod: "1 year orientation year", statusChange: "Highly skilled migrant / orientation year", source: GOV }, source: GOV },
    safety: 90,
    costOfLiving: 55,
    source: GOV,
  },
  France: {
    country: "France",
    childAccompany: "LIKELY",
    childAccompanyNote: "Children can be included on family residence; schooling available (verify)",
    schooling: { type: "Public/international", feeLevel: "LOW_COST", englishMedium: true },
    work: { studentWork: "ALLOWED", hoursPerWeek: 20, dependentWork: "COUNTRY_SPECIFIC", postStudy: { jobSearchPeriod: "1 year", statusChange: "Work permit / talent passport", source: GOV }, source: GOV },
    safety: 82,
    costOfLiving: 65,
    source: GOV,
  },
  Sweden: {
    country: "Sweden",
    childAccompany: "LIKELY",
    childAccompanyNote: "Children of study-permit holders may accompany; schooling public (verify)",
    schooling: { type: "Public", feeLevel: "FREE", englishMedium: true },
    work: { studentWork: "ALLOWED", hoursPerWeek: null, dependentWork: "ALLOWED", postStudy: { jobSearchPeriod: "12 months", statusChange: "Work permit route", source: GOV }, source: GOV },
    safety: 94,
    costOfLiving: 45,
    source: GOV,
  },
  Finland: {
    country: "Finland",
    childAccompany: "LIKELY",
    childAccompanyNote: "Family members can accompany on residence permit; public schooling (verify)",
    schooling: { type: "Public", feeLevel: "FREE", englishMedium: true },
    work: { studentWork: "ALLOWED", hoursPerWeek: 30, dependentWork: "RESTRICTED", postStudy: { jobSearchPeriod: "2 years", statusChange: "Work permit", source: GOV }, source: GOV },
    safety: 93,
    costOfLiving: 50,
    source: GOV,
  },
  Belgium: {
    country: "Belgium",
    childAccompany: "COUNTRY_SPECIFIC",
    childAccompanyNote: "Family reunification route; conditions vary by region (verify)",
    schooling: { type: "Public/international", feeLevel: "LOW_COST", englishMedium: true },
    work: { studentWork: "ALLOWED", hoursPerWeek: 20, dependentWork: "COUNTRY_SPECIFIC", postStudy: { jobSearchPeriod: "12 months", statusChange: "Work permit", source: GOV }, source: GOV },
    safety: 88,
    costOfLiving: 58,
    source: GOV,
  },
  Italy: {
    country: "Italy",
    childAccompany: "COUNTRY_SPECIFIC",
    childAccompanyNote: "Family reunification route available; schooling public (verify)",
    schooling: { type: "Public", feeLevel: "FREE", englishMedium: false },
    work: { studentWork: "ALLOWED", hoursPerWeek: 20, dependentWork: "COUNTRY_SPECIFIC", postStudy: { jobSearchPeriod: "12 months", statusChange: "Work permit / EU Blue Card", source: GOV }, source: GOV },
    safety: 80,
    costOfLiving: 68,
    source: GOV,
  },
  Spain: {
    country: "Spain",
    childAccompany: "COUNTRY_SPECIFIC",
    childAccompanyNote: "Family reunification route; schooling public (verify)",
    schooling: { type: "Public", feeLevel: "FREE", englishMedium: false },
    work: { studentWork: "RESTRICTED", hoursPerWeek: 20, dependentWork: "COUNTRY_SPECIFIC", postStudy: { jobSearchPeriod: "2 years", statusChange: "Work permit", source: GOV }, source: GOV },
    safety: 86,
    costOfLiving: 72,
    source: GOV,
  },
  UK: {
    country: "United Kingdom",
    childAccompany: "COUNTRY_SPECIFIC",
    childAccompanyNote: "Student visa dependent rules apply (postgraduate research + eligible courses); schooling (verify)",
    schooling: { type: "State/international", feeLevel: "HIGH_COST", englishMedium: true },
    work: { studentWork: "ALLOWED", hoursPerWeek: 20, dependentWork: "RESTRICTED", postStudy: { jobSearchPeriod: "2 years Graduate route", statusChange: "Skilled Worker visa", source: GOV }, source: GOV },
    safety: 84,
    costOfLiving: 48,
    source: GOV,
  },
  Australia: {
    country: "Australia",
    childAccompany: "LIKELY",
    childAccompanyNote: "Student dependent visa available; schooling (verify)",
    schooling: { type: "Public/international", feeLevel: "HIGH_COST", englishMedium: true },
    work: { studentWork: "ALLOWED", hoursPerWeek: 24, dependentWork: "RESTRICTED", postStudy: { jobSearchPeriod: "2-3 years post-study work", statusChange: "Skilled visa routes", source: GOV }, source: GOV },
    safety: 88,
    costOfLiving: 50,
    source: GOV,
  },
  Japan: {
    country: "Japan",
    childAccompany: "LIKELY",
    childAccompanyNote: "Student visa family stay status; schooling (verify)",
    schooling: { type: "Public/international", feeLevel: "MODERATE", englishMedium: false },
    work: { studentWork: "ALLOWED", hoursPerWeek: 28, dependentWork: "RESTRICTED", postStudy: { jobSearchPeriod: "Limited", statusChange: "Work visa", source: GOV }, source: GOV },
    safety: 95,
    costOfLiving: 50,
    source: GOV,
  },
  Canada: {
    country: "Canada",
    childAccompany: "LIKELY",
    childAccompanyNote: "Study permit holders can bring minor children; schooling (verify)",
    schooling: { type: "Public", feeLevel: "FREE", englishMedium: true },
    work: { studentWork: "ALLOWED", hoursPerWeek: 20, dependentWork: "ALLOWED", postStudy: { jobSearchPeriod: "Post-graduation work permit", statusChange: "Express Entry / work permit", source: GOV }, source: GOV },
    safety: 90,
    costOfLiving: 52,
    source: GOV,
  },
  "United States": {
    country: "United States",
    childAccompany: "COUNTRY_SPECIFIC",
    childAccompanyNote: "F-2 dependent visa for children; school enrollment (verify)",
    schooling: { type: "Public/international", feeLevel: "HIGH_COST", englishMedium: true },
    work: { studentWork: "ALLOWED", hoursPerWeek: 20, dependentWork: "NOT_PERMITTED", postStudy: { jobSearchPeriod: "OPT 1-3 years", statusChange: "H-1B / employment", source: GOV }, source: GOV },
    safety: 78,
    costOfLiving: 55,
    source: GOV,
  },
  China: {
    country: "China",
    childAccompany: "COUNTRY_SPECIFIC",
    childAccompanyNote: "Dependent residence possible on study X1 visa; schooling (verify)",
    schooling: { type: "Public/international", feeLevel: "MODERATE", englishMedium: false },
    work: { studentWork: "NOT_PERMITTED", hoursPerWeek: null, dependentWork: "NOT_PERMITTED", postStudy: { jobSearchPeriod: "Limited", statusChange: "Work permit", source: GOV }, source: GOV },
    safety: 88,
    costOfLiving: 70,
    source: GOV,
  },
  "South Korea": {
    country: "South Korea",
    childAccompany: "COUNTRY_SPECIFIC",
    childAccompanyNote: "Family residence with study visa; schooling (verify)",
    schooling: { type: "Public/international", feeLevel: "MODERATE", englishMedium: false },
    work: { studentWork: "ALLOWED", hoursPerWeek: 20, dependentWork: "RESTRICTED", postStudy: { jobSearchPeriod: "Limited", statusChange: "Work visa", source: GOV }, source: GOV },
    safety: 92,
    costOfLiving: 60,
    source: GOV,
  },
};

export function getCountryFamily(country: string | null | undefined): CountryFamilyData | null {
  if (!country) return null;
  const c = country.trim().toLowerCase();
  const entry = Object.entries(COUNTRY_FAMILY).find(([k]) => k.toLowerCase() === c);
  return entry ? entry[1] : null;
}

// ---- Family financial model -------------------------------------------------
export interface FamilyFinancialInput {
  scholarshipStipendAnnual: number | null; // verified from scholarship
  parentWorkIncomeAnnual: number | null; // estimate
  parentTuitionAnnual: number | null;
  childTuitionAnnual: number | null;
  housingAnnual: number | null;
  foodAnnual: number | null;
  transportAnnual: number | null;
  insuranceAnnual: number | null;
  visaAnnual: number | null;
  schoolAnnual: number | null;
  otherAnnual: number | null;
}

export interface FamilyFinancialResult {
  incomeAnnual: number;
  expensesAnnual: number;
  netAnnual: number;
  estimated: boolean;
}

export function familyFinancialModel(input: FamilyFinancialInput): FamilyFinancialResult {
  const income = (input.scholarshipStipendAnnual ?? 0) + (input.parentWorkIncomeAnnual ?? 0);
  const expenses =
    (input.parentTuitionAnnual ?? 0) +
    (input.childTuitionAnnual ?? 0) +
    (input.housingAnnual ?? 0) +
    (input.foodAnnual ?? 0) +
    (input.transportAnnual ?? 0) +
    (input.insuranceAnnual ?? 0) +
    (input.visaAnnual ?? 0) +
    (input.schoolAnnual ?? 0) +
    (input.otherAnnual ?? 0);
  return {
    incomeAnnual: income,
    expensesAnnual: expenses,
    netAnnual: income - expenses,
    // employment income and any unverified scholarship benefit are estimates
    estimated: input.parentWorkIncomeAnnual != null || input.scholarshipStipendAnnual == null,
  };
}

// ---- Parent job availability (work authorization is a HARD requirement) -----
export type ParentJobStatus = "LEGALLY_AVAILABLE" | "NOT_LEGALLY_AVAILABLE" | "UNVERIFIED";

export function parentJobStatus(countryFamily: CountryFamilyData | null, isStudent: boolean): ParentJobStatus {
  if (!countryFamily) return "UNVERIFIED";
  const rights = isStudent ? countryFamily.work.studentWork : countryFamily.work.dependentWork;
  if (rights === "ALLOWED") return "LEGALLY_AVAILABLE";
  if (rights === "RESTRICTED") return "LEGALLY_AVAILABLE";
  if (rights === "NOT_PERMITTED") return "NOT_LEGALLY_AVAILABLE";
  return "UNVERIFIED";
}

// Final family + work recommendation (sections 115-116)
export const FAMILY_FINAL_WEIGHTS = {
  study: 0.15,
  funding: 0.15,
  parentWork: 0.15,
  parentJobs: 0.15,
  childVisa: 0.1,
  childSchooling: 0.1,
  familyCost: 0.1,
  language: 0.05,
  longTermCareer: 0.05,
} as const;

export type FinalFamilyComponent = keyof typeof FAMILY_FINAL_WEIGHTS;

export function finalFamilyFeasibility(input: Record<FinalFamilyComponent, number>): number {
  let total = 0;
  for (const [k, w] of Object.entries(FAMILY_FINAL_WEIGHTS)) {
    total += (input[k as FinalFamilyComponent] ?? 0) * w;
  }
  return Math.round(total);
}

export type FamilyRecommendation =
  | "EXCELLENT_FAMILY_PATHWAY"
  | "STRONG_FAMILY_PATHWAY"
  | "POSSIBLE_WITH_CONDITIONS"
  | "HIGH_RISK"
  | "NOT_RECOMMENDED";

export function familyRecommendation(score: number): FamilyRecommendation {
  if (score >= 88) return "EXCELLENT_FAMILY_PATHWAY";
  if (score >= 75) return "STRONG_FAMILY_PATHWAY";
  if (score >= 60) return "POSSIBLE_WITH_CONDITIONS";
  if (score >= 40) return "HIGH_RISK";
  return "NOT_RECOMMENDED";
}

// =============================================================================
// Child schooling — school matching engine
// =============================================================================

export interface SchoolMatchInput {
  curriculum: number;
  language: number;
  ageGrade: number;
  cost: number;
  location: number;
  admission: number;
}

export const SCHOOL_WEIGHTS = {
  curriculum: 0.25,
  language: 0.2,
  ageGrade: 0.2,
  cost: 0.15,
  location: 0.1,
  admission: 0.1,
} as const;

export function schoolMatchScore(input: SchoolMatchInput): number {
  let total = 0;
  for (const [k, w] of Object.entries(SCHOOL_WEIGHTS)) {
    total += (input[k as keyof SchoolMatchInput] ?? 0) * w;
  }
  return Math.round(total);
}

export type SchoolRecommendation = "STRONG_SCHOOL_FIT" | "GOOD_SCHOOL_FIT" | "POSSIBLE_SCHOOL_FIT" | "LOW_SCHOOL_FIT";

export function schoolRecommendation(score: number): SchoolRecommendation {
  if (score >= 85) return "STRONG_SCHOOL_FIT";
  if (score >= 70) return "GOOD_SCHOOL_FIT";
  if (score >= 55) return "POSSIBLE_SCHOOL_FIT";
  return "LOW_SCHOOL_FIT";
}

// HR career opportunity by country (estimate; verify against live job market)
export const COUNTRY_HR_OPPORTUNITY: Record<string, number> = {
  Germany: 85,
  Netherlands: 82,
  Sweden: 85,
  Canada: 88,
  Finland: 80,
  France: 72,
  Belgium: 75,
  Italy: 60,
  Spain: 62,
  "United Kingdom": 85,
  Australia: 82,
  "United States": 80,
  Japan: 55,
  "South Korea": 55,
  China: 40,
};

export function hrCareerOpportunity(country: string | null | undefined): number {
  if (!country) return 50;
  const c = country.trim().toLowerCase();
  const entry = Object.entries(COUNTRY_HR_OPPORTUNITY).find(([k]) => k.toLowerCase() === c);
  return entry ? entry[1] : 50;
}

/**
 * A "free pathway" = study is fully funded, child schooling is free/low-cost,
 * the child can legally accompany, and the parent can legally work.
 */
export function isFreePathway(opts: {
  studyFunded: boolean;
  schoolingFreeOrLowCost: boolean;
  childCanAccompany: boolean;
  parentCanWork: boolean;
}): boolean {
  return opts.studyFunded && opts.schoolingFreeOrLowCost && opts.childCanAccompany && opts.parentCanWork;
}

// Approximate annual family living cost (EUR) — ESTIMATE, must be verified.
export const COUNTRY_ANNUAL_COST: Record<string, number> = {
  Germany: 22000,
  Sweden: 24000,
  Canada: 26000,
  Netherlands: 24000,
  France: 20000,
  Finland: 23000,
  Belgium: 22000,
  Italy: 18000,
  Spain: 18000,
  "United Kingdom": 26000,
  Australia: 28000,
  Japan: 22000,
  "United States": 28000,
  China: 14000,
  "South Korea": 18000,
};

export function countryAnnualCost(country: string | null | undefined): number | null {
  if (!country) return null;
  const c = country.trim().toLowerCase();
  const entry = Object.entries(COUNTRY_ANNUAL_COST).find(([k]) => k.toLowerCase() === c);
  return entry ? entry[1] : null;
}

export interface FinancialEstimate {
  scholarshipStipend: number;
  parentWorkIncome: number;
  totalIncome: number;
  familyLivingCost: number;
  netAnnual: number;
  estimated: boolean;
}

/**
 * Financial feasibility estimate. All values are ESTIMATES (labelled) — a
 * scholarship stipend and any employment income must be verified, never assumed.
 */
export function familyFinancialEstimate(
  country: string | null | undefined,
  opts: { scholarshipStipend?: number; parentWorkIncome?: number } = {},
): FinancialEstimate {
  const familyLivingCost = countryAnnualCost(country) ?? 20000;
  const scholarshipStipend = opts.scholarshipStipend ?? 11000; // typical funded-program stipend — verify
  const parentWorkIncome = opts.parentWorkIncome ?? 6500; // part-time employment estimate — verify
  const totalIncome = scholarshipStipend + parentWorkIncome;
  return {
    scholarshipStipend,
    parentWorkIncome,
    totalIncome,
    familyLivingCost,
    netAnnual: totalIncome - familyLivingCost,
    estimated: true,
  };
}

/** Curriculum fit: does the school offer an English-medium/international curriculum? */
export function curriculumFit(schoolCurriculum: string | null, preferred: string | null): number {
  const s = (schoolCurriculum ?? "").toLowerCase();
  const p = (preferred ?? "").toLowerCase();
  if (!s) return 50;
  if (/international|ib|myp|diploma|igcse|cambridge|british|american/.test(s)) return 95;
  if (p && (s.includes(p.split(" ")[0]) || p.includes(s.split(" ")[0]))) return 90;
  if (/english|bilingual/.test(s)) return 80;
  return 50;
}

/** Language fit: English-medium preferred for this child. */
export function languageFit(schoolLanguage: string | null): number {
  const s = (schoolLanguage ?? "").toLowerCase();
  if (!s) return 50;
  if (/english/.test(s)) return 100;
  if (/bilingual|international/.test(s)) return 85;
  return 40;
}

/** Cost fit: lower tuition = higher score for this family. */
export function costFit(feeLevel: "FREE" | "LOW_COST" | "MODERATE" | "HIGH_COST" | "UNKNOWN"): number {
  switch (feeLevel) {
    case "FREE":
      return 100;
    case "LOW_COST":
      return 85;
    case "MODERATE":
      return 65;
    case "HIGH_COST":
      return 40;
    default:
      return 50;
  }
}
