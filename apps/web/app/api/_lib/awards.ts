import { prisma } from "@careerpilot/database";
import {
  AWARD_PRIORITY_LABEL,
  COMPETITIVE_LABEL,
  evaluateAward,
  evidenceStrength,
  type AwardCriteria,
  type AwardProfile,
} from "@careerpilot/shared";

const parseJson = <T = unknown[]>(s: string | null | undefined, fb: T): T => {
  if (!s) return fb;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fb;
  }
};

export async function loadAwardProfile(): Promise<AwardProfile | null> {
  const cand = await prisma.candidateProfile.findFirst({ include: { skills: true } });
  if (!cand) return null;
  return {
    currentTitle: cand.currentTitle,
    yearsExperience: cand.yearsExperience,
    skills: cand.skills.map((s) => s.name),
    targetRoles: parseJson<string[]>(cand.targetRoles, []),
    industries: [],
    country: cand.country,
    education: cand.education,
    careerGoals: parseJson<string[]>(cand.careerGoals, []),
  };
}

export function awardCriteriaFromRow(a: {
  name: string;
  region: string | null;
  category: string | null;
  organization?: string | null;
  eligibility?: string | null;
  judgingCriteria?: string | null;
  skillsMatched?: string | null;
  entryFeeUsd?: number | null;
}): AwardCriteria {
  return {
    name: a.name,
    region: a.region,
    category: a.category,
    organization: a.organization ?? null,
    eligibility: a.eligibility ?? null,
    judgingCriteria: a.judgingCriteria ?? null,
    skillsMatched: a.skillsMatched ?? null,
    entryFeeUsd: a.entryFeeUsd ?? null,
  };
}

export interface ScoredAward {
  id: string;
  name: string;
  organization: string | null;
  region: string | null;
  country: string | null;
  category: string | null;
  year: string | null;
  eligibilityScore: number;
  profileFitScore: number;
  evidenceStrength: number;
  competitive: string;
  competitiveLabel: string;
  awardPriority: string;
  awardPriorityLabel: string;
  recommendedAction: string;
  missingEvidence: string[];
  deadline: string | null;
  deadlineStatus: string;
  entryFeeUsd: number | null;
  nominationType: string;
  officialUrl: string | null;
  status: string;
}

export async function scoreAwardsRows(rows: Array<Record<string, any>>, profile: AwardProfile): Promise<ScoredAward[]> {
  return rows.map((a) => {
    const criteria = awardCriteriaFromRow({
      name: a.name,
      region: a.region,
      category: a.category,
      organization: a.organization,
      eligibility: a.eligibility,
      judgingCriteria: a.judgingCriteria,
      skillsMatched: a.skillsMatched,
      entryFeeUsd: a.entryFeeUsd,
    });
    const ev = evaluateAward(criteria, profile);
    const evidence = evidenceStrength(profile);
    return {
      id: a.id,
      name: a.name,
      organization: a.organization ?? null,
      region: a.region ?? null,
      country: a.country ?? null,
      category: a.category ?? null,
      year: a.year ?? null,
      eligibilityScore: ev.eligibilityScore,
      profileFitScore: ev.profileFitScore,
      evidenceStrength: ev.evidenceStrength,
      competitive: ev.competitive,
      competitiveLabel: COMPETITIVE_LABEL[ev.competitive] ?? ev.competitive,
      awardPriority: ev.priority,
      awardPriorityLabel: AWARD_PRIORITY_LABEL[ev.priority] ?? ev.priority,
      recommendedAction: ev.recommendedAction,
      missingEvidence: evidence.missing,
      deadline: a.deadline ? new Date(a.deadline).toISOString() : null,
      deadlineStatus: a.deadlineStatus ?? "UNVERIFIED",
      entryFeeUsd: a.entryFeeUsd ?? null,
      nominationType: a.nominationType ?? "SELF_NOMINATION",
      officialUrl: a.officialUrl ?? a.applicationUrl ?? null,
      status: a.status ?? "ACTIVE",
    };
  });
}
