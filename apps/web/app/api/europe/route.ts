import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";
import { EUROPE_PRIORITY_COUNTRIES } from "../_lib/europe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const parseJson = <T = unknown>(s: string | null, fb: T): T => (s ? (JSON.parse(s) as T) : fb);

export async function GET() {
  const [totalJobs, countries, byCountry, recommended, applyNow, jobsByPriority, english, ieltsCounts] = await Promise.all([
    prisma.europeJob.count(),
    prisma.europeCountryIntelligence.findMany(),
    prisma.europeJob.groupBy({ by: ["country"], _count: true }),
    prisma.europeJob.findFirst({ where: { jobPriority: { in: ["P1", "P2"] } }, orderBy: { careerMatchScore: "desc" } }),
    prisma.europeJob.count({ where: { jobPriority: "P1" } }),
    prisma.europeJob.groupBy({ by: ["jobPriority"], _count: true }),
    prisma.englishProfile.findFirst(),
    prisma.europeJob.groupBy({ by: ["ieltsStatus"], _count: true }),
  ]);

  const countMap: Record<string, number> = {};
  for (const c of byCountry) countMap[c.country] = c._count;

  const ieltsBucket: Record<string, number> = {};
  for (const i of ieltsCounts) ieltsBucket[i.ieltsStatus] = i._count;

  // Candidate English-readiness: apply-without-test bucket = Case1 + Case2.
  const applyWithoutIelts = (ieltsBucket.NOT_REQUIRED ?? 0) + (ieltsBucket.ENGLISH_PROFICIENCY_REQUIRED ?? 0);
  const needsEnglishTest = (ieltsBucket.REQUIRED_BY_EMPLOYER ?? 0) + (ieltsBucket.REQUIRED_FOR_VISA ?? 0);
  const ieltsUnknown = ieltsBucket.UNKNOWN ?? 0;

  const hasEnglishCertificate =
    english?.ieltsStatus === "AVAILABLE" || Boolean(english?.ieltsOverallBand) || Boolean(english?.toeflScore) || Boolean(english?.pteScore) || Boolean(english?.duolingoScore);

  const countryCards = countries.map((c) => ({
    country: c.country,
    jobCount: countMap[c.country] ?? 0,
    workPermitRoutes: parseJson<Array<{ route: string; euBlueCard?: boolean; needsSponsor?: boolean; source?: string }>>(c.workPermitRoutes, []),
    salaryThresholds: parseJson<Array<{ route?: string; threshold?: string; note?: string }>>(c.salaryThresholds, []),
    englishRequirement: parseJson<{ status?: string; note?: string } | null>(c.englishRequirement, null),
    sponsorshipLikelihood: c.sponsorshipLikelihood,
    notes: c.notes,
  }));

  return NextResponse.json({
    priorityCountries: EUROPE_PRIORITY_COUNTRIES,
    totalJobs,
    applyNowJobs: applyNow,
    jobPriorityBreakdown: Object.fromEntries(jobsByPriority.map((j: { jobPriority: string; _count: number }) => [j.jobPriority, j._count])),
    countryCards,
    recommended: recommended
      ? {
          id: recommended.id,
          title: recommended.title,
          company: recommended.company,
          country: recommended.country,
          city: recommended.city,
          careerMatchScore: recommended.careerMatchScore,
          visaScore: recommended.visaScore,
          jobPriority: recommended.jobPriority,
          recommendedAction: recommended.recommendedAction,
        }
      : null,
    englishProfile: english
      ? {
          ieltsStatus: english.ieltsStatus,
          ieltsOverallBand: english.ieltsOverallBand,
          englishProficiency: english.englishProficiency,
          hasEnglishCertificate,
        }
      : { ieltsStatus: "NOT_AVAILABLE", ieltsOverallBand: null, englishProficiency: "UNKNOWN", hasEnglishCertificate: false },
    applyWithoutIelts,
    needsEnglishTest,
    ieltsUnknown,
    disclaimer: "AI-based preliminary assessment — not legal or immigration advice. Final eligibility, work authorisation and visa approval depend on the relevant country's current rules, the employer, and competent authorities. Always verify against official sources.",
  });
}
