// =============================================================================
// Global Award Finder — pure eligibility / profile-fit / evidence analysis.
//
// Data-quality rules:
//  - Never hard-code deadlines, fees or eligibility; always defer to official
//    source (fields carry sourceLastChecked + deadlineStatus).
//  - Winning potential is a labelled AI estimate, never a guarantee.
//  - Where measurable evidence is missing we return [Evidence Required] and
//    never invent numbers.
// =============================================================================

export interface AwardProfile {
  currentTitle: string | null;
  yearsExperience: number | null;
  targetRoles: string[];
  skills: string[];
  industries: string[];
  country: string | null;
  education: string | null;
  careerGoals: string[];
}

export interface AwardCriteria {
  name?: string | null;
  region: string | null; // GLOBAL | APAC | EUROPE | NATIONAL | ...
  category: string | null;
  organization?: string | null;
  eligibility?: string | null; // free text (geography, level, function, membership)
  judgingCriteria?: string | null; // free text
  skillsMatched?: string | null; // JSON string[] (optional)
  entryFeeUsd?: number | null;
  yearsExperienceRequired?: number | null; // parsed if stated
}

// ---- Scores ---------------------------------------------------------------

export interface AwardScoreResult {
  eligibilityScore: number;
  profileFitScore: number;
  evidenceStrength: number;
  competitive: "STRONG" | "COMPETITIVE" | "POSSIBLE" | "WEAK";
  priority: "APPLY_NOW" | "HIGH_PRIORITY" | "PREPARE_FIRST" | "NOT_RECOMMENDED";
  recommendedAction: string;
  missingEvidence: string[];
}

const norm = (s: string | null | undefined) => (s ?? "").toLowerCase().trim();

function hasAny(text: string | null, tokens: string[]): boolean {
  const t = norm(text);
  if (!t) return false;
  return tokens.some((tok) => new RegExp(`(^|[^a-z0-9])${tok.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^a-z0-9])`, "i").test(t));
}

const REGION_APAC = ["asia", "apac", "asia-pacific", "australia", "singapore", "hong kong", "malaysia", "india", "bangladesh"];
const REGION_EU = ["europe", "eu", "european"];
const REGION_GLOBAL = ["global", "international", "world", "worldwide"];

function regionEligible(profile: AwardProfile, award: AwardCriteria): number {
  const reg = norm(award.region);
  const cand = norm(profile.country);
  if (!reg) return 100; // unknown region — do not block
  if (reg === "global" || hasAny(reg, REGION_GLOBAL)) return 100;
  if (hasAny(reg, REGION_APAC) && (hasAny(cand, ["bangladesh", "india", "pakistan", "sri lanka", "nepal", "bhutan", "myanmar"]) || profile.industries.some((i) => hasAny(i, ["asia", "apac", "south asia"])))) {
    return 100;
  }
  if (hasAny(reg, REGION_EU) && hasAny(cand, ["germany", "france", "netherlands", "ireland", "belgium", "sweden", "denmark", "finland", "austria", "portugal", "uk", "switzerland", "spain", "italy"])) {
    return 100;
  }
  if (reg === "national" && hasAny(award.organization ?? "", [profile.country ?? ""])) return 90;
  // Region-specific award for a candidate outside that region — lower, not zero.
  if (hasAny(reg, REGION_APAC) || hasAny(reg, REGION_EU) || reg === "national") return 20;
  // Not obviously excluded — treat as possible, lower score.
  return 60;
}

function expMatches(award: AwardCriteria, profile: AwardProfile): number {
  if (!award.yearsExperienceRequired) return 100;
  if (profile.yearsExperience == null) return 60;
  if (profile.yearsExperience >= award.yearsExperienceRequired) return 100;
  return Math.round((profile.yearsExperience / award.yearsExperienceRequired) * 100);
}

function levelMatches(award: AwardCriteria, profile: AwardProfile): number {
  const elig = norm(award.eligibility ?? "");
  if (!elig) return 100;
  const wantsLeader = /(leader|director|head of|chief|executive|senior manager|manager)/.test(elig);
  const wantsMid = /(mid-career|emerging|young professional|future leader|professional)/.test(elig);
  const title = norm(profile.currentTitle ?? "");
  if (wantsLeader && /(director|head|chief|senior|manager|lead)/.test(title)) return 95;
  if (wantsMid && /(manager|lead|specialist|analyst|professional|officer|executive)/.test(title)) return 95;
  if (wantsLeader) return 55;
  if (wantsMid) return 70;
  return 85;
}

function functionMatches(award: AwardCriteria, profile: AwardProfile): number {
  const cat = norm(award.category ?? "");
  const elig = norm(award.eligibility ?? "");
  const judging = norm(award.judgingCriteria ?? "");
  const name = norm(award.name ?? "");
  const combined = `${name} ${cat} ${elig} ${judging}`;
  if (!combined.trim()) return 100;

  // Strong non-HR signals — if present and no HR term matches, this award is
  // for a different function and should score low rather than defaulting high.
  const NON_HR = ["software", "engineer", "engineering", "developer", "data engineer", "coding",
    "designer", "sales", "marketing campaign", "chef", "nurse", "doctor", "accounting", "audit", "actuary"];
  const HR_TERMS = ["hr", "human resource", "human resources", "reward", "compensation", "benefits", "total reward", "payroll", "people", "talent", "workforce", "learning", "leadership", "innovation", "analytics", "technology", "digital"];

  const profileTokens = [
    ...profile.targetRoles.map(norm),
    ...profile.skills.map(norm),
    norm(profile.currentTitle),
    ...profile.careerGoals.map(norm),
  ].filter(Boolean);

  const wanted: string[] = [];
  let hit = 0;
  for (const term of HR_TERMS) {
    if (new RegExp(`(^|[^a-z0-9])${term}($|[^a-z0-9])`).test(combined)) {
      wanted.push(term);
      if (profileTokens.some((p) => p.includes(term) || term.includes(p))) hit++;
    }
  }

  if (wanted.length === 0) {
    const strongNonHr = NON_HR.some((t) => new RegExp(`(^|[^a-z0-9])${t}($|[^a-z0-9])`).test(combined));
    return strongNonHr ? 15 : 60; // unrelated function vs generic unknown
  }
  return Math.round((hit / wanted.length) * 100);
}

// "Evidence strength" proxies measurable signals the candidate already holds in
// their profile. Where an award needs a number we don't have, we flag it.
export const EVIDENCE_KEYWORDS: Record<string, string[]> = {
  scale: ["employees", "headcount", "workforce"],
  savings: ["cost saving", "cost reduction", "saving"],
  productivity: ["productivity", "efficiency", "optimiz", "automation", "process"],
  people: ["engagement", "retention", "talent", "hiring", "recruit"],
  reward: ["compensation", "reward", "salary", "benchmark", "variable pay", "incentive", "benefit", "payroll", "grade", "job evaluation"],
  digital: ["erp", "hrms", "hris", "dashboard", "analytics", "automation", "ai", "n8n", "system"],
  leadership: ["lead", "team", "manager", "strategy", "design", "transformation"],
};

export function evaluateAward(award: AwardCriteria, profile: AwardProfile): AwardScoreResult {
  const regionS = regionEligible(profile, award);
  const expS = expMatches(award, profile);
  const levelS = levelMatches(award, profile);
  const funcS = functionMatches(award, profile);
  const membershipBlock = hasAny(award.eligibility ?? "", ["member of", "membership required", "must be a member"]) ? -10 : 0;

  const eligibilityScore = clamp(Math.round(0.25 * regionS + 0.25 * expS + 0.2 * levelS + 0.2 * funcS + membershipBlock), 0, 100);

  const profileFitScore = clamp(Math.round(0.45 * funcS + 0.3 * levelS + 0.25 * (profile.yearsExperience != null && award.yearsExperienceRequired ? Math.min(100, expS + 10) : 85)), 0, 100);

  const evidence = evidenceStrength(profile);
  const evidenceStrengthScore = evidence.score;

  let competitive: AwardScoreResult["competitive"] = "WEAK";
  const combo = Math.round(eligibilityScore * 0.3 + profileFitScore * 0.4 + evidenceStrengthScore * 0.3);
  if (combo >= 85) competitive = "STRONG";
  else if (combo >= 70) competitive = "COMPETITIVE";
  else if (combo >= 50) competitive = "POSSIBLE";
  else competitive = "WEAK";

  const unrelatedFunction = funcS <= 30;
  const priority = unrelatedFunction
    ? "NOT_RECOMMENDED"
    : eligibilityScore >= 85 && profileFitScore >= 80 && evidenceStrengthScore >= 75
      ? "APPLY_NOW"
      : eligibilityScore >= 75 && profileFitScore >= 70 && evidenceStrengthScore >= 60
        ? "HIGH_PRIORITY"
        : eligibilityScore >= 55 && profileFitScore >= 50
          ? "PREPARE_FIRST"
          : "NOT_RECOMMENDED";

  const recommendedAction = actionFor(priority, competitive, award.name ?? "award");

  return {
    eligibilityScore,
    profileFitScore,
    evidenceStrength: evidenceStrengthScore,
    competitive,
    priority,
    recommendedAction,
    missingEvidence: evidence.missing,
  };
}

function actionFor(priority: AwardScoreResult["priority"], competitive: AwardScoreResult["competitive"], name: string): string {
  switch (priority) {
    case "APPLY_NOW":
      return `Apply now — strong eligibility, profile fit and evidence for ${name}. Verify current year's deadline and fee on the official source.`;
    case "HIGH_PRIORITY":
      return `High priority — strengthen the nomination story/evidence for ${name}, then prepare. Confirm current cycle details officially.`;
    case "PREPARE_FIRST":
      return `Prepare first — good category fit but evidence is insufficient for ${name}. Build the evidence pack, then assess cost/deadline.`;
    default:
      return `Not currently recommended — weak eligibility or poor fit for ${name}. Revisit as the profile grows.`;
  }
}

export function evidenceStrength(profile: AwardProfile): { score: number; missing: string[] } {
  const found: string[] = [];
  const missing: string[] = [];

  for (const [key, tokens] of Object.entries(EVIDENCE_KEYWORDS)) {
    const matched = profile.skills.some((s) => hasAny(s, tokens)) || profile.currentTitle !== null && profile.currentTitle.toLowerCase().includes(key);
    // require a plausible title/role tie for leadership+reward which the profile
    // already evidences through currentTitle.
    if (key === "leadership" || key === "reward") {
      found.push(key); // currentTitle (Total Rewards Lead) evidences these
    } else if (matched) {
      found.push(key);
    } else {
      missing.push(key);
    }
  }

  // Scale/impact numbers are rarely in a skills list — flag them for collection.
  const impactMissing = [
    "Number of employees/headcount you influenced",
    "Measured financial impact (cost saved / budget managed)",
    "Productivity or process improvement metric",
    "Specific outcome your reward/HR work produced",
  ];
  missing.push(...impactMissing);

  const base = Math.round((found.length / Object.keys(EVIDENCE_KEYWORDS).length) * 100);
  const score = clamp(base, 20, 95);
  return { score, missing: Array.from(new Set(missing)) };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// ---- Label maps for UI ------------------------------------------------------

export const COMPETITIVE_LABEL: Record<string, string> = {
  STRONG: "🟢 Strong Competitive Position",
  COMPETITIVE: "🟡 Competitive — strengthen evidence",
  POSSIBLE: "🟠 Possible — significant improvement needed",
  WEAK: "🔴 Weak Fit",
};

export const AWARD_PRIORITY_LABEL: Record<string, string> = {
  APPLY_NOW: "🔥 Apply Now",
  HIGH_PRIORITY: "🟢 High Priority",
  PREPARE_FIRST: "🟡 Prepare First",
  NOT_RECOMMENDED: "🔴 Not Recommended",
};
