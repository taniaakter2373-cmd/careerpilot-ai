// =============================================================================
// Europe Opportunity / Visa / IELTS analysis — pure, deterministic helpers.
//
// Data-quality rules:
//  - Never mark IELTS as universally required. It is evaluated per context.
//  - Absence of IELTS never blocks eligibility by itself.
//  - Sponsorship / visa / salary are always presented as assessments with a
//    confidence level and a "verify on official source" requirement.
// =============================================================================

export interface WorkPermitRoute {
  route: string;
  euBlueCard?: boolean;
  needsSponsor: boolean;
  salaryNote?: string | null;
  docs?: string[];
  source: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
}

export interface EuropeCountryRule {
  country: string;
  routes: WorkPermitRoute[];
  englishTestForVisa: boolean; // whether a recognised test is typically asked
  englishTestNote?: string | null;
  source: string;
  lastVerified?: string | null;
}

// ---- Visa opportunity score -------------------------------------------------

export interface VisaScoreInput {
  salaryAnnualLocal: number | null;
  salaryCurrency: string | null;
  yearsExperience: number | null;
  hasBachelors: boolean;
  sponsorship: SponsorshipStatus;
  englishOk: boolean; // candidate holds an accepted English test OR none required
  route: WorkPermitRoute | null;
  salaryThresholdLocal?: number | null; // for the likely route, if stated
}

export interface VisaScoreResult {
  score: number;
  breakdown: { salary: number; experience: number; education: number; occupation: number; sponsorship: number; language: number };
  eligibility: "LIKELY_ELIGIBLE" | "POTENTIALLY_ELIGIBLE" | "REQUIRES_SPONSORSHIP" | "REQUIRES_VERIFICATION" | "UNLIKELY_ELIGIBLE";
  label: string;
  note: string;
}

export function visaScore(i: VisaScoreInput): VisaScoreResult {
  const w = { salary: 0.2, experience: 0.15, education: 0.1, occupation: 0.15, sponsorship: 0.25, language: 0.15 };

  // Salary: >= threshold => 100; within 15% below => 70; else scaled.
  let salary = 60;
  if (i.salaryAnnualLocal != null) {
    if (i.salaryThresholdLocal != null) {
      if (i.salaryAnnualLocal >= i.salaryThresholdLocal) salary = 100;
      else if (i.salaryAnnualLocal >= i.salaryThresholdLocal * 0.85) salary = 70;
      else salary = Math.round((i.salaryAnnualLocal / i.salaryThresholdLocal) * 60);
    } else {
      salary = 70; // unknown threshold — assume possibly sufficient
    }
  }

  let experience = 60;
  if (i.yearsExperience != null) {
    if (i.yearsExperience >= 5) experience = 100;
    else if (i.yearsExperience >= 3) experience = 85;
    else experience = 50;
  }

  const education = i.hasBachelors ? 100 : i.yearsExperience != null && i.yearsExperience >= 8 ? 80 : 45;

  // Occupation eligibility: HR/People roles are generally recognised skilled
  // occupations on most EU skilled routes.
  const occupation = 85;

  let sponsorship = 0;
  if (i.sponsorship === "EXPLICIT") sponsorship = 100;
  else if (i.sponsorship === "POSSIBLE") sponsorship = 60;
  else if (i.sponsorship === "NOT_MENTIONED") sponsorship = 40;
  else sponsorship = 10;

  const language = i.englishOk ? 100 : 40;

  const breakdown = { salary, experience, education, occupation, sponsorship, language };
  const raw = salary * w.salary + experience * w.experience + education * w.education + occupation * w.occupation + sponsorship * w.sponsorship + language * w.language;
  const score = Math.round(raw);

  let eligibility: VisaScoreResult["eligibility"];
  if (i.sponsorship === "UNLIKELY") eligibility = "UNLIKELY_ELIGIBLE";
  else if (i.sponsorship === "EXPLICIT") eligibility = "LIKELY_ELIGIBLE";
  else if (score >= 75 && i.sponsorship !== "NOT_MENTIONED") eligibility = "LIKELY_ELIGIBLE";
  else if (score >= 55) eligibility = "REQUIRES_SPONSORSHIP";
  else if (score >= 40) eligibility = "POTENTIALLY_ELIGIBLE";
  else eligibility = "REQUIRES_VERIFICATION";

  const eligibilityLabel: Record<VisaScoreResult["eligibility"], string> = {
    LIKELY_ELIGIBLE: "Likely Eligible",
    POTENTIALLY_ELIGIBLE: "Potentially Eligible",
    REQUIRES_SPONSORSHIP: "Requires Employer Sponsorship",
    REQUIRES_VERIFICATION: "Requires Verification",
    UNLIKELY_ELIGIBLE: "Unlikely Eligible",
  };

  return {
    score,
    breakdown,
    eligibility,
    label: eligibilityLabel[eligibility],
    note: "AI-based preliminary assessment — not legal/immigration advice. Final eligibility depends on current country rules and the employer.",
  };
}

export const VISA_STATUS_EMOJI: Record<string, string> = {
  LIKELY_ELIGIBLE: "🟢",
  POTENTIALLY_ELIGIBLE: "🔵",
  REQUIRES_SPONSORSHIP: "🟡",
  REQUIRES_VERIFICATION: "🔵",
  UNLIKELY_ELIGIBLE: "🔴",
};


export interface EnglishProfileInput {
  ieltsStatus?: string | null; // NOT_AVAILABLE | AVAILABLE | SCHEDULED | EXEMPT
  ieltsOverallBand?: number | null;
  otherEnglishTest?: string | null;
  toeflScore?: number | null;
  pteScore?: number | null;
  duolingoScore?: number | null;
  englishProficiency?: string | null;
}

export interface JobEnglishContext {
  /** Raw job description / requirements text used only for keyword signals. */
  text?: string;
  /** Pre-parsed signal: employer explicitly asks for IELTS. */
  ieltsExplicitlyRequired?: boolean;
  /** Pre-parsed signal: employer mentions english proficiency or a test. */
  englishRequired?: boolean;
  /** Alternative tests the employer lists (toefl/pte/duolingo/other). */
  alternativeTestsAccepted?: string[];
}

// ---- Case outcomes ----------------------------------------------------------

export type IeltsDecisionCase =
  | "NOT_REQUIRED" // Case 1
  | "ENGLISH_PROFICIENCY_REQUIRED" // Case 2
  | "REQUIRED_BY_EMPLOYER" // Case 3
  | "REQUIRED_FOR_VISA" // Case 4
  | "UNKNOWN"; // Case 5

export interface IeltsDecision {
  status: IeltsDecisionCase;
  label: string;
  recommendation: string;
  applyImmediately: boolean;
  candidateHasAcceptedTest: boolean;
  eligibilityImpact: "NONE" | "GAP" | "VERIFY";
  /** Test the candidate can actually use to satisfy the requirement. */
  availableTest: string | null;
}

const DETECT = {
  ielts: /(ielts)/i,
  toefl: /(toefl)/i,
  pte: /(\bpte\b|pearson test)/i,
  duolingo: /(duolingo)/i,
  englishProficiency: /(english (?:proficiency|language|fluency)|fluent english|good (?:command|knowledge) of english|working level english|english speaking)/i,
  englishRequiredHard: /(english (?:is )?(?:required|mandatory)|must (?:be )?(?:fluent|proficient) in english|requires? (?:fluent|proficient) english)/i,
  ieltsRequiredHard: /(ielts (?:is )?(?:required|mandatory)|ielts score|minimum ielts|ielts band)/i,
  altAccepted: /(toefl|pte|duolingo|academic ielts|alternative english test)/i,
  englishNotRequired: /(english (?:not|optional)|no english (?:required|test)|german (?:language )?(?:only|sufficient))/i,
};

export function parseJobEnglishSignals(text: string | null | undefined): JobEnglishContext {
  const t = text ?? "";
  return {
    text: t,
    ieltsExplicitlyRequired: DETECT.ieltsRequiredHard.test(t) || (DETECT.ielts.test(t) && DETECT.englishRequiredHard.test(t)),
    englishRequired: DETECT.englishRequiredHard.test(t) || DETECT.englishProficiency.test(t),
    alternativeTestsAccepted: DETECT.altAccepted.test(t) ? ["IELTS", "TOEFL", "PTE", "Duolingo"] : [],
  };
}

export const IELTS_STATUS_LABEL: Record<IeltsDecisionCase, string> = {
  NOT_REQUIRED: "IELTS Not Required",
  ENGLISH_PROFICIENCY_REQUIRED: "English Proficiency Required",
  REQUIRED_BY_EMPLOYER: "IELTS Required by Employer",
  REQUIRED_FOR_VISA: "English Test Required for Visa/Permit",
  UNKNOWN: "Unknown / Requires Verification",
};

export const IELTS_STATUS_EMOJI: Record<IeltsDecisionCase, string> = {
  NOT_REQUIRED: "🟢",
  ENGLISH_PROFICIENCY_REQUIRED: "🟡",
  REQUIRED_BY_EMPLOYER: "🟠",
  REQUIRED_FOR_VISA: "🟠",
  UNKNOWN: "🔵",
};

/**
 * Case 1..5 IELTS decision logic.
 * @param job     employer signals parsed from the posting.
 * @param visaNeedsEnglishTest whether the relevant visa/permit route commonly
 *                            asks for a recognised English test (pass only when
 *                            the route is known to require it; otherwise false).
 * @param profile candidate English profile.
 */
export function evaluateIelts(
  job: JobEnglishContext,
  visaNeedsEnglishTest: boolean,
  profile: EnglishProfileInput | null,
): IeltsDecision {
  const hasAnyTest = Boolean(
    profile?.ieltsStatus === "AVAILABLE" ||
      profile?.ieltsOverallBand ||
      profile?.toeflScore ||
      profile?.pteScore ||
      profile?.duolingoScore ||
      (profile?.otherEnglishTest && profile.otherEnglishTest !== "NONE"),
  );

  // A recognized test the candidate holds that would satisfy an IELTS request.
  const availableTest = profile?.ieltsOverallBand
    ? `IELTS ${profile.ieltsOverallBand}`
    : profile?.toeflScore
      ? `TOEFL ${profile.toeflScore}`
      : profile?.pteScore
        ? `PTE ${profile.pteScore}`
        : profile?.duolingoScore
          ? `Duolingo ${profile.duolingoScore}`
          : null;

  // Case 5 — unknown: no signal either way.
  if (!job.ieltsExplicitlyRequired && !job.englishRequired && !visaNeedsEnglishTest) {
    // Explicit "no english needed" or nothing at all -> treat as not required.
    if (job.text && DETECT.englishNotRequired.test(job.text)) {
      return {
        status: "NOT_REQUIRED",
        label: IELTS_STATUS_LABEL.NOT_REQUIRED,
        recommendation: "Apply Now — the employer does not require an English test for this role.",
        applyImmediately: true,
        candidateHasAcceptedTest: hasAnyTest,
        eligibilityImpact: "NONE",
        availableTest,
      };
    }
    return {
      status: "NOT_REQUIRED",
      label: IELTS_STATUS_LABEL.NOT_REQUIRED,
      recommendation: "Apply Now — neither the employer nor this route explicitly requires IELTS.",
      applyImmediately: true,
      candidateHasAcceptedTest: hasAnyTest,
      eligibilityImpact: "NONE",
      availableTest,
    };
  }

  // Case 4 — visa/permit route requires an English test (job itself may not).
  if (visaNeedsEnglishTest && !job.ieltsExplicitlyRequired) {
    const hasAccepted = hasAnyTest;
    return {
      status: "REQUIRED_FOR_VISA",
      label: IELTS_STATUS_LABEL.REQUIRED_FOR_VISA,
      recommendation: hasAccepted
        ? `Visa route commonly asks for an English test — your ${availableTest ?? "English test"} can be used. Confirm current route rules on the official immigration site.`
        : "Visa/permit route commonly requires a recognised English test. Verify which tests the current route accepts (IELTS, TOEFL, PTE, English-medium degree) before applying.",
      applyImmediately: true,
      candidateHasAcceptedTest: hasAccepted,
      eligibilityImpact: "VERIFY",
      availableTest,
    };
  }

  // Case 3 — IELTS explicitly required by employer.
  if (job.ieltsExplicitlyRequired) {
    const hasIelts = Boolean(profile?.ieltsStatus === "AVAILABLE" || profile?.ieltsOverallBand);
    const altOk = (job.alternativeTestsAccepted?.length ?? 0) > 0 && hasAnyTest;
    return {
      status: "REQUIRED_BY_EMPLOYER",
      label: IELTS_STATUS_LABEL.REQUIRED_BY_EMPLOYER,
      recommendation: hasIelts
        ? "Employer requires IELTS and you have it — apply."
        : altOk
          ? "Employer asks for IELTS but accepts an alternative English test you already hold — confirm and apply."
          : "Employer explicitly asks for IELTS. You do not currently have an accepted test. Do not self-reject — check whether an alternative test or post-selection IELTS is acceptable.",
      applyImmediately: hasIelts || altOk,
      candidateHasAcceptedTest: hasAnyTest,
      eligibilityImpact: hasIelts || altOk ? "NONE" : "GAP",
      availableTest,
    };
  }

  // Case 2 — English proficiency requested but no specific test mandated.
  return {
    status: "ENGLISH_PROFICIENCY_REQUIRED",
    label: IELTS_STATUS_LABEL.ENGLISH_PROFICIENCY_REQUIRED,
    recommendation:
      "English proficiency is expected — demonstrate it via your CV, cover letter and interview. IELTS is not currently required.",
    applyImmediately: true,
    candidateHasAcceptedTest: hasAnyTest,
    eligibilityImpact: "NONE",
    availableTest,
  };
}

// ---- Sponsorship detection --------------------------------------------------

export type SponsorshipStatus =
  | "EXPLICIT"
  | "POSSIBLE"
  | "NOT_MENTIONED"
  | "UNLIKELY";

export interface SponsorshipSignal {
  status: SponsorshipStatus;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  note: string;
}

const SPONSOR_POSITIVE =
  /(visa (?:sponsorship|sponsor)|sponsorship (?:is )?(?:available|provided|offered)|work permit (?:sponsorship|provided|assistance)|relocation (?:and )?visa (?:support|assistance)|will (?:sponsor|arrange).*visa|sponsor.*(?:work permit|relocation))/i;
const SPONSOR_NEGATIVE =
  /(no visa sponsorship|cannot sponsor|unable to sponsor|no (?:work )?permit sponsorship|sponsorship (?:is )?not (?:available|offered|provided)|local candidates only|must (?:already )?have (?:the right to work|valid work permit))/i;
const REMOTE_OPEN =
  /(worldwide|remote (?:globally|worldwide)|open to (?:international|global) candidates|anywhere in the (?:world|europe|eu))/i;

export function detectSponsorship(text: string | null | undefined, employerMentionsVisa?: boolean): SponsorshipSignal {
  const t = text ?? "";
  if (DETECT_UNLIKELY(t)) return { status: "UNLIKELY", confidence: "HIGH", note: "Posting states sponsorship is not available." };
  if (SPONSOR_POSITIVE.test(t)) return { status: "EXPLICIT", confidence: "MEDIUM", note: "Sponsorship or visa assistance is mentioned in the posting." };
  if (REMOTE_OPEN.test(t)) return { status: "POSSIBLE", confidence: "LOW", note: "Open to global candidates — sponsorship may be possible. Verify with the employer." };
  if (employerMentionsVisa) return { status: "POSSIBLE", confidence: "LOW", note: "Employer refers to visa topics — confirm sponsorship explicitly." };
  return { status: "NOT_MENTIONED", confidence: "LOW", note: "Sponsorship is not mentioned. Do not assume it exists — confirm with the employer." };
}

function DETECT_UNLIKELY(text: string): boolean {
  return SPONSOR_NEGATIVE.test(text);
}

// ---- Relocation support detection ------------------------------------------

export function detectRelocationSupport(text: string | null | undefined): {
  status: "YES" | "NO" | "NOT_MENTIONED";
  note: string;
} {
  const t = text ?? "";
  const yes = /(relocation (?:support|assistance|package|allowance|bonus)|relocation costs covered|temporary accommodation|flight.*(?:covered|reimburs)|assistance with (?:relocation|moving|immigration|visa))/i;
  const no = /(no relocation (?:support|assistance|package|allowance)|relocation (?:is )?not (?:provided|offered|covered))/i;
  if (yes.test(t)) return { status: "YES", note: "Relocation support is mentioned in the posting." };
  if (no.test(t)) return { status: "NO", note: "Posting states relocation is not covered." };
  return { status: "NOT_MENTIONED", note: "Relocation support is not mentioned — verify with the employer." };
}

// ---- Salary normalisation (display + threshold comparison helper) ----------

export function parseSalaryText(text: string | null | undefined): {
  minMonthly: number | null;
  maxMonthly: number | null;
  currency: string | null;
  annual: boolean;
  note: string;
} {
  const t = text ?? "";
  const currencyRaw = t.match(/(EUR|€|GBP|£|USD|\$|CHF|SEK|DKK|NOK)/)?.[1] ?? null;
  const currencyMap: Record<string, string> = { "€": "EUR", "£": "GBP", "$": "USD" };
  const currency = currencyRaw ? (currencyMap[currencyRaw] ?? currencyRaw) : null;
  const annual = /(per year|annually|\/year|\bpa\b|annual salary|p\.?a\.?)/i.test(t) && !/per month|\/month|monthly/i.test(t);
  const monthly = /(per month|\/month|monthly)/i.test(t);

  // Remove currency symbols, then scan numeric tokens (k/K suffix supported).
  const cleaned = t
    .replace(/[€$£]/g, " ")
    .replace(/(\d)[.,](\d{3})(?=\D|$)/g, "$1$2"); // 1,000/1.000 -> 1000 only when thousands
  const nums: number[] = [];
  for (const m of cleaned.matchAll(/(\d+(?:\.\d+)?)\s*([kK])?/g)) {
    const n = parseFloat(m[1] ?? "");
    if (!Number.isNaN(n)) nums.push(m[2] ? n * 1000 : n);
  }

  let min: number | null = null;
  let max: number | null = null;
  if (nums.length >= 2) {
    min = Math.min(nums[0], nums[1]);
    max = Math.max(nums[0], nums[1]);
  } else if (nums.length === 1) {
    min = max = nums[0];
  }

  // If the figure is annual, keep both raw and note it; the caller decides how
  // to bucket it. We never fabricate a monthly conversion.
  return {
    minMonthly: min,
    maxMonthly: max,
    currency,
    annual: annual && !monthly,
    note: "Extracted from posting text if present. Not invented.",
  };
}

// ---- Job priority -----------------------------------------------------------

export interface EuropePriorityInput {
  careerMatch: number;
  visaScore: number;
  sponsorship: SponsorshipStatus;
  /** true when there is no IELTS barrier to applying now. */
  noIeltsBarrier: boolean;
  /** GAP when employer mandates a test the candidate lacks. */
  ieltsGap: boolean;
  relocation: "YES" | "NO" | "NOT_MENTIONED";
}

export type JobPriority = "P1" | "P2" | "P3" | "P4";

export interface PriorityResult {
  priority: JobPriority;
  label: string;
  recommendedAction: string;
}

export function europeJobPriority(i: EuropePriorityInput): PriorityResult {
  const strongCareer = i.careerMatch >= 75;
  const goodCareer = i.careerMatch >= 60;
  const strongVisa = i.visaScore >= 70;
  const visaOk = i.visaScore >= 50;
  const sponsored = i.sponsorship === "EXPLICIT" || i.sponsorship === "POSSIBLE";
  const noIeltsBarrier = i.noIeltsBarrier;
  const visaBarrier = i.visaScore < 40;

  // 🔥 Priority 1
  if (strongCareer && strongVisa && sponsored && noIeltsBarrier) {
    return {
      priority: "P1",
      label: "🔥 Priority 1 — Apply Now",
      recommendedAction:
        "Apply now — strong career match, solid visa potential and sponsorship indication with no IELTS barrier. Confirm sponsorship with the employer.",
    };
  }
  // 🟢 Priority 2 — strong but something to confirm
  if ((strongCareer || goodCareer) && visaOk && noIeltsBarrier) {
    return {
      priority: "P2",
      label: "🟢 Priority 2 — Strong Opportunity",
      recommendedAction:
        "Strong opportunity — confirm sponsorship / visa / language details before or while applying.",
    };
  }
  // 🔴 low
  if (visaBarrier || (!goodCareer && !strongCareer) || (!noIeltsBarrier && i.ieltsGap)) {
    return {
      priority: "P4",
      label: "🔴 Priority 4 — Low Priority",
      recommendedAction:
        "Major mismatch or unmet mandatory requirement — review before spending effort.",
    };
  }
  return {
    priority: "P3",
    label: "🟡 Priority 3 — Potential Opportunity",
    recommendedAction:
      "Reasonable match but important requirements are uncertain — verify visa / sponsorship / language before applying.",
  };
}
