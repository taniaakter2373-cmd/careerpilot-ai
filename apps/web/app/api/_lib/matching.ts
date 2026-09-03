import { prisma } from "@careerpilot/database";
import type { CandidateForMatching } from "@careerpilot/matching";

const parseJson = (s: string | null) => (s ? (JSON.parse(s) as string[]) : []);

export async function loadCandidateForMatching(userId?: string): Promise<CandidateForMatching | null> {
  const profile = userId
    ? await prisma.candidateProfile.findUnique({ where: { userId }, include: { skills: true } })
    : await prisma.candidateProfile.findFirst({ include: { skills: true } });
  if (!profile) return null;
  return {
    currentTitle: profile.currentTitle,
    yearsExperience: profile.yearsExperience,
    skills: profile.skills.map((s) => s.name),
    targetRoles: parseJson(profile.targetRoles),
    industries: [],
    preferredLocations: parseJson(profile.preferredLocations),
    education: profile.education,
    salaryExpectation: { min: profile.salaryMin, currency: profile.salaryCurrency },
    careerGoals: parseJson(profile.careerGoals),
  };
}
