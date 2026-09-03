import {
  DEFAULT_MATCH_WEIGHTS,
  actionFromRecommendation,
  recommendationFromScore,
  type MatchBreakdown,
  type MatchResult,
  type MatchWeights,
} from "@careerpilot/shared";

export interface JobForMatching {
  title: string;
  company: string;
  location: string | null;
  country: string | null;
  industry: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  skills: string[];
  requirements: string[];
  educationRequirements: string[];
  experienceRequired: string | null;
}

export interface CandidateForMatching {
  currentTitle: string | null;
  yearsExperience: number | null;
  skills: string[];
  targetRoles: string[];
  industries: string[];
  preferredLocations: string[];
  education: string | null;
  salaryExpectation: { min: number | null; currency: string | null };
  careerGoals: string[];
}

export interface ParsedExperience {
  min: number | null;
  max: number | null;
}

const norm = (s: string | null | undefined) => (s ?? "").toLowerCase().trim();

/** Companies that should always be skipped (e.g. bulk recruiting agencies). */
export const BLOCKED_COMPANIES = ["nextjobz", "nextjobs", "next jobz"];

export function isBlockedCompany(company: string | null | undefined): boolean {
  const c = norm(company);
  return BLOCKED_COMPANIES.some((b) => c.includes(b));
}

/** Returns true when a job title is an HR-related role (the user only wants HR jobs). */
export function isHrRole(title: string | null | undefined): boolean {
  const t = norm(title);
  if (!t) return false;
  const hrTerms = [
    "human resource", "human resources", "hrbp", "people ops", "people generalist",
    "people partner", "employee", "talent", "recruit", "compensation", "reward", "benefits",
    "payroll", "staffing", "workforce", "organisational development", "organizational development",
    "learning & development", "learning and development", "learning &amp; development", "l&d",
    "training and development", "training & development",
  ];
  if (hrTerms.some((k) => t.includes(k))) return true;
  // "hr" as a whole word (HR Manager, Manager HR, HR & Admin, Group HR, etc.)
  if (/(^|[^a-z])hr([^a-z]|$)/.test(t)) return true;
  // HR & Admin / Admin, HR & Compliance style titles
  if (/hr.{0,4}(&|and).{0,4}(admin|compliance)/.test(t)) return true;
  if (/(admin|compliance).{0,4}(&|and).{0,4}hr/.test(t)) return true;
  return false;
}

/**
 * Parse an experience requirement string into a numeric range.
 * Handles "5-8 years", "10+ years", "6 years", "at least 5 years", "2 to 4 years".
 */
export function parseExperienceYears(s: string | null | undefined): ParsedExperience {
  if (!s) return { min: null, max: null };
  const text = norm(s);
  const nums = text.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  if (nums.length === 0) return { min: null, max: null };
  if (text.includes("+") || text.includes("at least") || text.includes("minimum") || text.includes("min")) {
    return { min: nums[0], max: null };
  }
  if (nums.length >= 2) return { min: Math.min(nums[0], nums[1]), max: Math.max(nums[0], nums[1]) };
  return { min: nums[0], max: nums[0] };
}

/** Detect hard (mandatory) requirement failures — these override any score. */
export function hardRequirementFailures(candidate: CandidateForMatching, job: JobForMatching): string[] {
  const failures: string[] = [];
  const exp = parseExperienceYears(job.experienceRequired);
  if (exp.min != null && candidate.yearsExperience != null && candidate.yearsExperience < exp.min) {
    failures.push(`Requires ${exp.min} years experience (candidate has ${candidate.yearsExperience})`);
  }
  // Degree-level requirement: if the job demands a level the candidate does not state.
  const eduReq = job.educationRequirements.join(" ").toLowerCase();
  const candEdu = norm(candidate.education);
  const demandsMasters = /master|mba|postgrad/.test(eduReq);
  if (demandsMasters && candEdu && !/master|mba|postgrad/.test(candEdu)) {
    failures.push("Requires a Master's/MBA (not evidenced in candidate education)");
  }
  return failures;
}

function overlapScore(candidateTokens: string[], target: string): number {
  const t = norm(target);
  if (!t) return 0;
  const tTokens = t.split(/\s+/).filter((x) => x.length > 1);
  const hits = tTokens.filter((tok) => candidateTokens.includes(tok) || candidateTokens.some((c) => c.includes(tok) || tok.includes(c))).length;
  return tTokens.length === 0 ? 0 : hits / tTokens.length;
}

function roleScore(candidate: CandidateForMatching, job: JobForMatching): number {
  const title = norm(job.title);
  const roles = candidate.targetRoles.map(norm);
  const current = norm(candidate.currentTitle);

  // Exact match against a target role
  if (roles.some((r) => r && (title === r || r.includes(title) || title.includes(r)))) return 100;

  // Token overlap against target roles + current title
  const tokens = [...roles, current].join(" ").split(/\s+/).filter((x) => x.length > 1);
  const roleOverlap = overlapScore(tokens, title);
  if (roleOverlap >= 0.6) return 90;
  if (roleOverlap >= 0.3) return 70;
  return 40;
}

function experienceScore(candidate: CandidateForMatching, job: JobForMatching): number {
  const exp = parseExperienceYears(job.experienceRequired);
  if (exp.min == null) return 70;
  if (candidate.yearsExperience == null) return 50;
  if (candidate.yearsExperience < exp.min) return 20;
  if (exp.max != null && candidate.yearsExperience >= exp.max) return 100;
  return 85;
}

function skillsScore(candidate: CandidateForMatching, job: JobForMatching): number {
  if (job.skills.length === 0) return 70;
  const cand = candidate.skills.map(norm).filter(Boolean);
  const matched = job.skills.filter((s) => {
    const t = norm(s);
    return cand.some((c) => c.includes(t) || t.includes(c) || c.split(/\s+/).every((w) => t.includes(w)));
  }).length;
  return Math.round((matched / job.skills.length) * 100);
}

function industryScore(candidate: CandidateForMatching, job: JobForMatching): number {
  if (!job.industry) return 70;
  if (candidate.industries.length === 0) return 60;
  const matched = candidate.industries.some((i) => {
    const a = norm(i);
    const b = norm(job.industry);
    return a && b && (a.includes(b) || b.includes(a));
  });
  return matched ? 100 : 40;
}

function locationScore(candidate: CandidateForMatching, job: JobForMatching): number {
  const loc = norm(job.location);
  const country = norm(job.country);

  // International (outside Bangladesh) → preferred
  if (country && country !== "bangladesh") return 100;
  // Local: Dhaka preferred
  if (loc && loc.includes("dhaka")) return 100;
  // Other Bangladesh cities still acceptable
  if (loc) return 60;
  if (country) return 60;
  return 70;
}

function educationScore(candidate: CandidateForMatching, job: JobForMatching): number {
  if (job.educationRequirements.length === 0) return 80;
  const candEdu = norm(candidate.education);
  if (!candEdu) return 50;
  const req = job.educationRequirements.join(" ").toLowerCase();
  const hasLevel = (re: RegExp) => re.test(candEdu);
  if (/master|mba|postgrad/.test(req) && hasLevel(/master|mba/)) return 100;
  if (/bachelor|bsc|bba|undergrad/.test(req) && hasLevel(/bachelor|bba|bsc|undergrad/)) return 100;
  if (hasLevel(/master|mba/)) return 90;
  return 55;
}

function salaryScore(candidate: CandidateForMatching, job: JobForMatching): number {
  if (job.salaryMin == null && job.salaryMax == null) return 60;
  const want = candidate.salaryExpectation.min;
  if (want == null) return 60;
  const jobMin = job.salaryMin ?? 0;
  if (jobMin >= want) return 100;
  const jobMax = job.salaryMax;
  if (jobMax != null && jobMax >= want) return 80;
  return 30;
}

function growthScore(candidate: CandidateForMatching, job: JobForMatching): number {
  const title = norm(job.title);
  const current = norm(candidate.currentTitle);
  const seniority = ["head", "chief", "director", "senior manager", "vp", "general manager"];
  const isSenior = seniority.some((s) => title.includes(s));
  const isCurrentJunior = /deputy|assistant|officer|executive/.test(current);
  if (isSenior && isCurrentJunior) return 95;
  if (isSenior) return 85;
  if (/manager/.test(title) && /deputy manager/.test(current)) return 90;
  return 70;
}

export function scoreJob(
  candidate: CandidateForMatching,
  job: JobForMatching,
  weights: MatchWeights = DEFAULT_MATCH_WEIGHTS,
  targetCompanyBonus = false,
): MatchResult {
  const breakdown: MatchBreakdown = {
    role: roleScore(candidate, job),
    experience: experienceScore(candidate, job),
    skills: skillsScore(candidate, job),
    industry: industryScore(candidate, job),
    location: locationScore(candidate, job),
    education: educationScore(candidate, job),
    salary: salaryScore(candidate, job),
    growth: growthScore(candidate, job),
  };

  let overall = 0;
  for (const [k, w] of Object.entries(weights)) {
    overall += (breakdown[k as keyof MatchBreakdown] ?? 0) * w;
  }
  overall = Math.round(overall);
  if (targetCompanyBonus) overall = Math.min(100, overall + 5);

  const failures = hardRequirementFailures(candidate, job);
  if (isBlockedCompany(job.company)) failures.push(`Blocked company (${job.company}) — always skipped`);
  const recommendation = recommendationFromScore(overall);
  const action = actionFromRecommendation(recommendation, failures.length > 0);

  const whyMatched: string[] = [];
  if (breakdown.role >= 80) whyMatched.push("Role closely matches target roles");
  if (breakdown.skills >= 80) whyMatched.push("Strong skills overlap");
  if (breakdown.experience >= 85) whyMatched.push("Experience matches requirement");
  if (breakdown.location >= 100) whyMatched.push("Preferred location");

  const missingRequirements: string[] = [];
  const exp = parseExperienceYears(job.experienceRequired);
  if (exp.max != null && candidate.yearsExperience != null && candidate.yearsExperience < exp.max) {
    missingRequirements.push(`Up to ${exp.max} years experience preferred`);
  }
  const missingSkills = job.skills.filter((s) => !candidate.skills.map(norm).some((c) => c.includes(norm(s)) || norm(s).includes(c)));
  if (missingSkills.length > 0 && job.skills.length > 0) missingRequirements.push(`Skills not evidenced: ${missingSkills.join(", ")}`);

  const riskFlags: string[] = [];
  if (job.salaryMin == null && job.salaryMax == null) riskFlags.push("Salary not disclosed");

  return {
    jobId: "",
    overallScore: overall,
    breakdown,
    weights,
    whyMatched,
    missingRequirements,
    riskFlags,
    recommendation,
    action,
    hardRequirementFailure: failures.length > 0,
    targetCompanyBonus,
    createdAt: new Date().toISOString(),
  };
}
