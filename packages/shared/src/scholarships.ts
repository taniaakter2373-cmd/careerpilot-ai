// ScholarshipPilot — Erasmus Mundus eligibility + matching engine (pure, testable).

export type EligibilityStatus = "ELIGIBLE" | "LIKELY_ELIGIBLE" | "UNCERTAIN" | "NOT_ELIGIBLE";

export type ScholarshipRecommendation =
  | "EXCELLENT_MATCH"
  | "STRONG_MATCH"
  | "GOOD_MATCH"
  | "POSSIBLE_MATCH"
  | "LOW_PRIORITY";

export interface ScholarshipApplicant {
  hasBachelorsDegree: boolean | null;
  fieldOfStudy: string | null;
  cgpa: number | null;
  ieltsScore: number | null;
  toeflScore: number | null;
  yearsExperience: number | null;
  nationality: string | null;
  hasPassport: boolean | null;
  leadershipExperience?: string | null;
  internationalExperience?: string | null;
}

export interface ProgrammeRequirements {
  requiresBachelors: boolean | null;
  requiredField: string | null;
  minCgpa: number | null;
  minIelts: number | null;
  minToefl: number | null;
  minYearsExperience: number | null;
}

export interface EligibilityCheckItem {
  label: string;
  pass: boolean | null;
  detail: string;
}

export interface EligibilityResult {
  status: EligibilityStatus;
  checks: EligibilityCheckItem[];
  hardFailures: string[];
}

const norm = (s: string | null | undefined) => (s ?? "").trim().toLowerCase();

/**
 * Field-of-study match: relaxed keyword overlap (soft check, not a hard gate).
 */
export function fieldMatches(applicantField: string | null, requiredField: string | null): boolean | null {
  const a = norm(applicantField);
  const r = norm(requiredField);
  if (!a || !r) return null;
  const aliases: Record<string, string[]> = {
    hr: ["human resource", "hr", "human resources", "people", "hr management"],
    business: ["business", "business administration", "management", "mba"],
    finance: ["finance", "financial"],
    management: ["management", "business administration", "administration"],
    "organizational development": ["organizational", "organisation", "od", "organizational development"],
  };
  const tokens = (r + " " + (aliases[r] ?? []).join(" ")).split(/\s+/);
  return tokens.some((t) => a.includes(t));
}

/**
 * Deterministic eligibility evaluation.
 * Mandatory, verifiable requirements drive hard failures; unverifiable
 * mandatory requirements yield UNCERTAIN (never ELIGIBLE).
 */
export function evaluateEligibility(
  applicant: ScholarshipApplicant,
  req: ProgrammeRequirements,
): EligibilityResult {
  const checks: EligibilityCheckItem[] = [];
  const hardFailures: string[] = [];

  // Bachelor's degree (mandatory)
  if (req.requiresBachelors) {
    if (applicant.hasBachelorsDegree === false) {
      checks.push({ label: "Bachelor's degree", pass: false, detail: "Bachelor's degree required but not held" });
      hardFailures.push("Bachelor's degree required");
    } else if (applicant.hasBachelorsDegree === true) {
      checks.push({ label: "Bachelor's degree", pass: true, detail: "Bachelor's degree held" });
    } else {
      checks.push({ label: "Bachelor's degree", pass: null, detail: "Degree status not verified" });
    }
  }

  // Minimum CGPA (mandatory where set)
  if (req.minCgpa != null) {
    if (applicant.cgpa == null) {
      checks.push({ label: `Minimum CGPA ${req.minCgpa}`, pass: null, detail: "CGPA not provided" });
    } else if (applicant.cgpa >= req.minCgpa) {
      checks.push({ label: `Minimum CGPA ${req.minCgpa}`, pass: true, detail: `CGPA ${applicant.cgpa} meets minimum` });
    } else {
      checks.push({ label: `Minimum CGPA ${req.minCgpa}`, pass: false, detail: `CGPA ${applicant.cgpa} below minimum` });
      hardFailures.push(`Minimum CGPA ${req.minCgpa} not met`);
    }
  }

  // English language (mandatory where set)
  if (req.minIelts != null || req.minToefl != null) {
    const label = req.minIelts != null ? `IELTS ≥ ${req.minIelts}` : `TOEFL ≥ ${req.minToefl}`;
    if (req.minIelts != null && applicant.ieltsScore != null) {
      const pass = applicant.ieltsScore >= req.minIelts;
      checks.push({ label, pass, detail: `IELTS ${applicant.ieltsScore}` });
      if (!pass) hardFailures.push(label + " not met");
    } else if (req.minToefl != null && applicant.toeflScore != null) {
      const pass = applicant.toeflScore >= req.minToefl;
      checks.push({ label, pass, detail: `TOEFL ${applicant.toeflScore}` });
      if (!pass) hardFailures.push(label + " not met");
    } else {
      // English test is obtainable (candidate can take IELTS/TOEFL) — NOT a hard exclusion.
      checks.push({ label, pass: null, detail: "English test score to be provided (obtainable)" });
    }
  }

  // Field of study (soft check — preferred, not always mandatory)
  const field = fieldMatches(applicant.fieldOfStudy, req.requiredField);
  if (req.requiredField) {
    checks.push({
      label: `Field: ${req.requiredField}`,
      pass: field,
      detail: field === true ? "Field matches" : field === false ? "Field may not match" : "Field not verified",
    });
  }

  // Experience (soft check — usually preferred)
  if (req.minYearsExperience != null) {
    if (applicant.yearsExperience == null) {
      checks.push({ label: `Experience ≥ ${req.minYearsExperience} years`, pass: null, detail: "Experience not provided" });
    } else if (applicant.yearsExperience >= req.minYearsExperience) {
      checks.push({ label: `Experience ≥ ${req.minYearsExperience} years`, pass: true, detail: `${applicant.yearsExperience} years` });
    } else {
      checks.push({ label: `Experience ≥ ${req.minYearsExperience} years`, pass: false, detail: `${applicant.yearsExperience} years below` });
    }
  }

  // Passport (advisory)
  if (applicant.hasPassport != null) {
    checks.push({ label: "Passport", pass: applicant.hasPassport, detail: applicant.hasPassport ? "Passport held" : "No passport" });
  }

  let status: EligibilityStatus;
  if (hardFailures.length > 0) {
    status = "NOT_ELIGIBLE";
  } else {
    const hasUnverifiedMandatory = checks.some((c) => c.pass === null);
    const hasSoftFailure = checks.some((c) => c.pass === false);
    // If the ONLY unverified mandatory item is the (obtainable) English test → LIKELY_ELIGIBLE.
    const englishOnlyUnverified =
      hasUnverifiedMandatory && checks.filter((c) => c.pass === null).every((c) => /ielts|toefl|english/i.test(c.label));
    if (hasUnverifiedMandatory && !englishOnlyUnverified) status = "UNCERTAIN";
    else if (hasSoftFailure || englishOnlyUnverified) status = "LIKELY_ELIGIBLE";
    else status = "ELIGIBLE";
  }

  return { status, checks, hardFailures };
}

/**
 * Deterministic baseline component scoring (transparent; refined by the AI
 * provider later). Returns a 0-100 score per weighted component.
 */
export function scoreScholarshipMatch(
  applicant: ScholarshipApplicant,
  req: ProgrammeRequirements,
  eligibility: EligibilityResult,
): ScholarshipMatchComponents {
  let academic = 50;
  if (req.minCgpa != null && applicant.cgpa != null) {
    academic =
      applicant.cgpa >= req.minCgpa
        ? Math.min(100, 70 + Math.round((applicant.cgpa - req.minCgpa) * 40))
        : Math.max(0, 60 - Math.round((req.minCgpa - applicant.cgpa) * 40));
  }

  const fm = fieldMatches(applicant.fieldOfStudy, req.requiredField);
  const subject = fm === true ? 100 : fm === false ? 55 : 50;

  let experience = 50;
  if (req.minYearsExperience != null && applicant.yearsExperience != null) {
    experience =
      applicant.yearsExperience >= req.minYearsExperience
        ? Math.min(100, 75 + Math.round((applicant.yearsExperience - req.minYearsExperience) * 10))
        : Math.max(0, 60 - Math.round((req.minYearsExperience - applicant.yearsExperience) * 20));
  } else if (applicant.yearsExperience != null) {
    experience = Math.min(100, 60 + Math.round(applicant.yearsExperience * 5));
  }

  const eligibilityScore =
    eligibility.status === "ELIGIBLE"
      ? 100
      : eligibility.status === "LIKELY_ELIGIBLE"
        ? 85
        : eligibility.status === "UNCERTAIN"
          ? 50
          : 0;

  let language = 50;
  if (req.minIelts != null && applicant.ieltsScore != null) {
    language =
      applicant.ieltsScore >= req.minIelts
        ? Math.min(100, 75 + Math.round((applicant.ieltsScore - req.minIelts) * 40))
        : Math.max(0, 55 - Math.round((req.minIelts - applicant.ieltsScore) * 40));
  }

  const leadership = applicant.leadershipExperience ? 88 : 55;
  const mobility =
    applicant.hasPassport === true ? 100 : applicant.hasPassport === false ? 40 : 70;

  const career = Math.min(100, Math.round((experience + subject) / 2 + 5));

  return {
    academic,
    career,
    subject,
    experience,
    eligibility: eligibilityScore,
    language,
    leadership,
    mobility,
  };
}

export const DEFAULT_SCHOLARSHIP_WEIGHTS = {
  academic: 0.2,
  career: 0.2,
  subject: 0.2,
  experience: 0.15,
  eligibility: 0.1,
  language: 0.05,
  leadership: 0.05,
  mobility: 0.05,
} as const;

export type ScholarshipMatchComponents = Record<keyof typeof DEFAULT_SCHOLARSHIP_WEIGHTS, number>;

export function weightedScore(
  components: ScholarshipMatchComponents,
  weights: Record<string, number> = DEFAULT_SCHOLARSHIP_WEIGHTS,
): number {
  let total = 0;
  for (const [k, w] of Object.entries(weights)) {
    const c = components[k as keyof ScholarshipMatchComponents] ?? 0;
    total += c * w;
  }
  return Math.round(total);
}

export function scholarshipRecommendation(score: number): ScholarshipRecommendation {
  if (score >= 95) return "EXCELLENT_MATCH";
  if (score >= 90) return "STRONG_MATCH";
  if (score >= 80) return "GOOD_MATCH";
  if (score >= 70) return "POSSIBLE_MATCH";
  return "LOW_PRIORITY";
}

export interface PriorityInput {
  match: number;
  scholarshipAvailable: boolean;
  eligibilityConfidence: number;
  careerAlignment: number;
  deadlineFeasibility: number;
}

export function calculatePriorityScore(input: PriorityInput): number {
  const scholarship = input.scholarshipAvailable ? 100 : 0;
  return Math.round(
    (input.match + scholarship + input.eligibilityConfidence + input.careerAlignment + input.deadlineFeasibility) / 5,
  );
}
