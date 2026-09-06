import { prisma } from "@careerpilot/database";
import {
  detectRelocationSupport,
  detectSponsorship,
  europeJobPriority,
  evaluateIelts,
  parseJobEnglishSignals,
  visaScore,
  type EuropeCountryRule,
  type SponsorshipStatus,
  type WorkPermitRoute,
} from "@careerpilot/shared";

const parseJson = <T = unknown[]>(s: string | null | undefined, fb: T): T => {
  if (!s) return fb;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fb;
  }
};

/** Load a candidate EnglishProfile row (single-user app -> first candidate). */
export async function loadEnglishProfile() {
  const cand = await prisma.candidateProfile.findFirst({ select: { id: true } });
  if (!cand) return null;
  const p = await prisma.englishProfile.findUnique({ where: { candidateId: cand.id } });
  return p;
}

export async function loadCandidateForEurope() {
  const cand = await prisma.candidateProfile.findFirst({ include: { skills: true } });
  if (!cand) return null;
  const english = cand ? await prisma.englishProfile.findUnique({ where: { candidateId: cand.id } }).catch(() => null) : null;
  return {
    profile: {
      currentTitle: cand.currentTitle,
      yearsExperience: cand.yearsExperience,
      skills: cand.skills.map((s) => s.name),
      targetRoles: parseJson<string[]>(cand.targetRoles, []),
      preferredLocations: parseJson<string[]>(cand.preferredLocations, []),
      education: cand.education,
      country: cand.country,
    },
    english: english
      ? {
          ieltsStatus: english.ieltsStatus,
          ieltsOverallBand: english.ieltsOverallBand,
          otherEnglishTest: english.otherEnglishTest,
          toeflScore: english.toeflScore,
          pteScore: english.pteScore,
          duolingoScore: english.duolingoScore,
          englishProficiency: english.englishProficiency,
        }
      : null,
  };
}

export async function loadCountryRules(countries: string[]): Promise<Record<string, EuropeCountryRule>> {
  const rows = await prisma.europeCountryIntelligence.findMany({
    where: { country: { in: countries } },
  });
  const out: Record<string, EuropeCountryRule> = {};
  for (const r of rows) {
    const routes = parseJson<WorkPermitRoute[]>(r.workPermitRoutes, []);
    const englishReq = parseJson<{ status?: string; note?: string; ieltsOrAlt?: string; source?: string } | null>(r.englishRequirement, null);
    out[r.country] = {
      country: r.country,
      routes,
      englishTestForVisa: englishReq?.status === "TEST_REQUIRED",
      englishTestNote: englishReq?.note ?? null,
      source: r.notes ?? "Official immigration source — verify",
    };
  }
  return out;
}

export interface AnalyzedEuropeJob {
  careerMatch: number;
  visa: ReturnType<typeof visaScore>;
  ieltsStatus: string;
  ieltsLabel: string;
  sponsorshipStatus: SponsorshipStatus;
  sponsorshipNote: string;
  relocationStatus: "YES" | "NO" | "NOT_MENTIONED";
  relocationNote: string;
  priority: ReturnType<typeof europeJobPriority>;
  salaryAnnualLocal: number | null;
  salaryCurrency: string | null;
  eligibleRoute: WorkPermitRoute | null;
}

/**
 * Run the full analysis stack for one European job. Pure signal analysis —
 * never fabricates visa/sponsorship; always marks confidence + verify.
 */
export async function analyzeEuropeJob(job: {
  country: string;
  description: string;
  salaryText: string | null;
  salaryCurrency: string | null;
  yearsExperience: number | null;
  hasBachelors: boolean;
}): Promise<AnalyzedEuropeJob> {
  const english = await loadEnglishProfile();
  const englishProfile = english
    ? {
        ieltsStatus: english.ieltsStatus,
        ieltsOverallBand: english.ieltsOverallBand,
        otherEnglishTest: english.otherEnglishTest,
        toeflScore: english.toeflScore,
        pteScore: english.pteScore,
        duolingoScore: english.duolingoScore,
        englishProficiency: english.englishProficiency,
      }
    : null;

  const rules = await loadCountryRules([job.country]);
  const rule = rules[job.country];
  const eligibleRoute: WorkPermitRoute | null = rule?.routes?.[0] ?? null;

  const signals = parseJobEnglishSignals(job.description);
  const ielts = evaluateIelts(signals, rule?.englishTestForVisa ?? false, englishProfile);
  const sponsor = detectSponsorship(job.description);
  const reloc = detectRelocationSupport(job.description);

  // Career match is scored by the caller (needs the full candidate + job shape);
  // here we default 0 so callers can override after computing the real score.
  const visa = visaScore({
    salaryAnnualLocal: job.salaryText ? parseAnnual(job.salaryText) : null,
    salaryCurrency: job.salaryCurrency,
    yearsExperience: job.yearsExperience,
    hasBachelors: job.hasBachelors,
    sponsorship: sponsor.status,
    englishOk: ielts.applyImmediately,
    route: eligibleRoute,
  });

  const priority = europeJobPriority({
    careerMatch: 0,
    visaScore: visa.score,
    sponsorship: sponsor.status,
    noIeltsBarrier: ielts.applyImmediately,
    ieltsGap: ielts.eligibilityImpact === "GAP",
    relocation: reloc.status,
  });

  return {
    careerMatch: 0,
    visa,
    ieltsStatus: ielts.status,
    ieltsLabel: ielts.label,
    sponsorshipStatus: sponsor.status,
    sponsorshipNote: sponsor.note,
    relocationStatus: reloc.status,
    relocationNote: reloc.note,
    priority,
    salaryAnnualLocal: parseAnnual(job.salaryText),
    salaryCurrency: job.salaryCurrency,
    eligibleRoute,
  };
}

/** Very light annual-salary estimate when the posting has an explicit annual
 *  figure in EUR/GBP. Returns null rather than inventing a conversion. */
export function parseAnnual(text: string | null): number | null {
  if (!text) return null;
  const annual = /(?:EUR|€|GBP|£)\s*([\d.,]+)\s*(?:-|to|–)\s*([\d.,]+)/i.exec(text) ?? /(?:EUR|€|GBP|£)\s*([\d.,]+)/i.exec(text);
  if (!annual) return null;
  const first = parseFloat((annual[1] ?? annual[0]).replace(/[€£,\s]/g, ""));
  return Number.isNaN(first) ? null : first;
}

/** EU priority countries for the Europe module. */
export const EUROPE_PRIORITY_COUNTRIES = [
  "Germany",
  "Netherlands",
  "Ireland",
  "France",
  "Belgium",
  "Sweden",
  "Denmark",
  "Finland",
  "Austria",
  "Portugal",
];

export const JOB_PRIORITY_LABEL: Record<string, string> = {
  P1: "🔥 Apply Now",
  P2: "🟢 Strong Opportunity",
  P3: "🟡 Potential Opportunity",
  P4: "🔴 Low Priority",
};

export const SPONSORSHIP_LABEL: Record<string, string> = {
  EXPLICIT: "🟢 Sponsorship explicitly mentioned",
  POSSIBLE: "🟡 Sponsorship possible / verify",
  NOT_MENTIONED: "🟠 Sponsorship not mentioned",
  UNLIKELY: "🔴 Sponsorship unlikely / not available",
};

export function serializeEuropeJob(j: Record<string, any>): Record<string, any> {
  const applyWithoutIelts = ["NOT_REQUIRED", "ENGLISH_PROFICIENCY_REQUIRED"].includes(j.ieltsStatus);
  return {
    id: j.id,
    source: j.source,
    sourceUrl: j.sourceUrl,
    title: j.title,
    company: j.company,
    companyUrl: j.companyUrl,
    country: j.country,
    city: j.city,
    description: j.description,
    salaryText: j.salaryText,
    employmentType: j.employmentType,
    remoteType: j.remoteType,
    postedDate: j.postedDate,
    closingDate: j.closingDate,
    applicationUrl: j.applicationUrl,
    careerMatchScore: j.careerMatchScore,
    visaScore: j.visaScore,
    ieltsStatus: j.ieltsStatus,
    applyWithoutIelts,
    sponsorshipDetected: j.sponsorshipDetected,
    sponsorshipLabel: SPONSORSHIP_LABEL[j.sponsorshipDetected] ?? j.sponsorshipDetected,
    relocationMentioned: j.relocationMentioned,
    jobPriority: j.jobPriority,
    jobPriorityLabel: JOB_PRIORITY_LABEL[j.jobPriority] ?? j.jobPriority,
    recommendedAction: j.recommendedAction,
    status: j.status,
    sourceLastChecked: j.sourceLastChecked,
  };
}

export function serializeEuropeApplication(a: Record<string, any>): Record<string, any> {
  return {
    id: a.id,
    europeJobId: a.europeJobId,
    title: a.europeJob?.title ?? null,
    company: a.europeJob?.company ?? a.company,
    country: a.europeJob?.country ?? a.country,
    applicationUrl: a.europeJob?.applicationUrl ?? null,
    status: a.status,
    applicationDate: a.applicationDate,
    deadline: a.deadline,
    recruiterName: a.recruiterName,
    recruiterEmail: a.recruiterEmail,
    interviewDate: a.interviewDate,
    nextAction: a.nextAction,
    followUpDate: a.followUpDate,
    notes: a.notes,
    confirmationNumber: a.confirmationNumber,
  };
}

export const EUROPE_APP_STATUS_FLOW: Record<string, string[]> = {
  DISCOVERED: ["SAVED", "APPLICATION_PLANNED"],
  SAVED: ["APPLICATION_PLANNED", "APPLIED"],
  APPLICATION_PLANNED: ["APPLIED", "SAVED"],
  APPLIED: ["HR_SCREENING", "REJECTED", "WITHDRAWN"],
  HR_SCREENING: ["INTERVIEW", "REJECTED"],
  INTERVIEW: ["ASSESSMENT", "FINAL_INTERVIEW", "REJECTED"],
  ASSESSMENT: ["FINAL_INTERVIEW", "REJECTED"],
  FINAL_INTERVIEW: ["OFFER", "REJECTED"],
  OFFER: ["VISA_PROCESSING", "REJECTED"],
  VISA_PROCESSING: ["RELOCATION", "REJECTED"],
  RELOCATION: ["REJECTED"],
  REJECTED: [],
  WITHDRAWN: [],
};

export const AWARD_APP_STATUS_FLOW: Record<string, string[]> = {
  DISCOVERED: ["SHORTLISTED", "EVIDENCE_COLLECTION"],
  SHORTLISTED: ["EVIDENCE_COLLECTION", "NOMINATION_DRAFTED"],
  EVIDENCE_COLLECTION: ["NOMINATION_DRAFTED", "SHORTLISTED"],
  NOMINATION_DRAFTED: ["INTERNAL_REVIEW", "SUBMITTED"],
  INTERNAL_REVIEW: ["SUBMITTED", "NOMINATION_DRAFTED"],
  SUBMITTED: ["FINALIST", "NOT_SELECTED"],
  FINALIST: ["WINNER", "NOT_SELECTED"],
  WINNER: [],
  NOT_SELECTED: [],
};
