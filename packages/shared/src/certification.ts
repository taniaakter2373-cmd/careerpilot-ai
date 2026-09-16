// Module 5 — Professional Certification Finder (pure, testable).
// Searches globally, matches against the user's HR profile, classifies cost honestly.

export interface CertificationMatchInput {
  profileMatch: number; // 0-100 (education/experience/skills fit)
  careerGoalMatch: number;
  targetJobValue: number; // value for target HR roles
  internationalValue: number;
  industryRecognition: number;
  costAdvantage: number; // higher = more affordable for user
}

export const CERT_WEIGHTS = {
  profile: 0.3,
  careerGoal: 0.2,
  targetJob: 0.15,
  international: 0.15,
  recognition: 0.1,
  cost: 0.1,
} as const;

export type CertComponent = keyof typeof CERT_WEIGHTS;

export function certMatchScore(input: CertificationMatchInput): number {
  let total = 0;
  const map: Record<CertComponent, number> = {
    profile: input.profileMatch,
    careerGoal: input.careerGoalMatch,
    targetJob: input.targetJobValue,
    international: input.internationalValue,
    recognition: input.industryRecognition,
    cost: input.costAdvantage,
  };
  for (const [k, w] of Object.entries(CERT_WEIGHTS)) {
    total += (map[k as CertComponent] ?? 0) * w;
  }
  return Math.round(total);
}

export type CertCostClass =
  | "FREE"
  | "FULL_SCHOLARSHIP"
  | "LOW_COST"
  | "DISCOUNTED"
  | "EXPENSIVE"
  | "VERIFY";

export const CERT_COST_LABEL: Record<CertCostClass, string> = {
  FREE: "FREE",
  FULL_SCHOLARSHIP: "FULL SCHOLARSHIP",
  LOW_COST: "LOW COST",
  DISCOUNTED: "DISCOUNTED",
  EXPENSIVE: "EXPENSIVE",
  VERIFY: "FEE — VERIFY WITH PROVIDER",
};

export const CERT_COST_EMOJI: Record<CertCostClass, string> = {
  FREE: "🟢",
  FULL_SCHOLARSHIP: "🟡",
  LOW_COST: "🔵",
  DISCOUNTED: "🟠",
  EXPENSIVE: "🔴",
  VERIFY: "⚪",
};

export type CertMode = "ONLINE" | "OFFLINE" | "HYBRID";

export interface CertCost {
  originalUsd: number;
  scholarshipPct: number; // 0-1
  finalUsd: number;
  classification: CertCostClass;
}

export function certCost(originalUsd: number, scholarshipPct = 0): CertCost {
  const finalUsd = Math.round(originalUsd * (1 - scholarshipPct));
  let classification: CertCostClass;
  if (finalUsd <= 0) classification = "FREE";
  else if (scholarshipPct >= 0.8) classification = "FULL_SCHOLARSHIP";
  else if (finalUsd < 100) classification = "LOW_COST";
  else if (scholarshipPct > 0) classification = "DISCOUNTED";
  else classification = "EXPENSIVE";
  return { originalUsd, scholarshipPct, finalUsd, classification };
}

export type RoadmapBucket = "NOW" | "NEXT" | "LATER";

export function roadmapBucket(matchScore: number, isFreeOrFunded: boolean): RoadmapBucket {
  if (matchScore >= 80 && isFreeOrFunded) return "NOW";
  if (matchScore >= 70) return "NEXT";
  return "LATER";
}

/** Simple profile-fit heuristic from career area keywords vs an HR skill list. */
export function profileFitFromSkills(certSkills: string[], profileSkills: string[]): number {
  if (certSkills.length === 0) return 50;
  const p = profileSkills.map((s) => s.toLowerCase());
  const hits = certSkills.filter((s) => {
    const k = s.toLowerCase();
    return p.some((x) => x.includes(k) || k.includes(x) || k.split(" ").every((w) => x.includes(w)));
  }).length;
  return Math.round((hits / certSkills.length) * 100);
}
