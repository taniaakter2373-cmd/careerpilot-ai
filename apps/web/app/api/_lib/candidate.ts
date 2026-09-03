import { prisma } from "@careerpilot/database";
import type { CandidateProfile } from "@careerpilot/shared";

const parseJson = (s: string | null) => (s ? (JSON.parse(s) as string[]) : []);

export async function loadCandidateProfile(userId?: string): Promise<CandidateProfile | null> {
  const p = userId
    ? await prisma.candidateProfile.findUnique({ where: { userId }, include: { skills: true } })
    : await prisma.candidateProfile.findFirst({ include: { skills: true } });
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    email: p.email,
    phone: p.phone,
    location: p.location,
    country: p.country,
    currentTitle: p.currentTitle,
    yearsExperience: p.yearsExperience,
    education: p.education,
    skills: p.skills.map((s) => s.name),
    certifications: parseJson(p.certifications),
    industries: [],
    targetRoles: parseJson(p.targetRoles),
    targetCompanies: [],
    preferredLocations: parseJson(p.preferredLocations),
    workPreferences: { remote: "ANY", employment: "ANY" },
    salaryExpectation: { min: p.salaryMin, currency: (p.salaryCurrency as never) ?? "BDT" },
    noticePeriod: p.noticePeriod,
    linkedinUrl: p.linkedinUrl,
    portfolioUrl: p.portfolioUrl,
    summary: p.summary,
    careerGoals: parseJson(p.careerGoals),
  };
}
