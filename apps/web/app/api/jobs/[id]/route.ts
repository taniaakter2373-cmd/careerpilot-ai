import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const parseJson = (s: string | null) => (s ? (JSON.parse(s) as string[]) : []);

function serializeJob(j: any) {
  const match = j.matches?.[0];
  return {
    id: j.id,
    source: j.source,
    url: j.url,
    title: j.title,
    company: j.company,
    companyUrl: j.companyUrl,
    location: j.location,
    country: j.country,
    city: j.city,
    remoteType: j.remoteType,
    employmentType: j.employmentType,
    industry: j.industry,
    department: j.department,
    salaryMin: j.salaryMin,
    salaryMax: j.salaryMax,
    salaryCurrency: j.salaryCurrency,
    description: j.description,
    requirements: parseJson(j.requirements),
    responsibilities: parseJson(j.responsibilities),
    educationRequirements: parseJson(j.educationRequirements),
    experienceRequired: j.experienceRequired,
    skills: parseJson(j.skills),
    postedDate: j.postedDate,
    closingDate: j.closingDate,
    status: j.status,
    applicationMethod: j.applicationMethod,
    match: match
      ? {
          overallScore: match.overallScore,
          breakdown: JSON.parse(match.breakdown),
          recommendation: match.recommendation,
          action: match.action,
          whyMatched: parseJson(match.whyMatched),
          missingRequirements: parseJson(match.missingRequirements),
          riskFlags: parseJson(match.riskFlags),
          hardRequirementFailure: match.hardRequirementFailure,
          targetCompanyBonus: match.targetCompanyBonus,
        }
      : null,
  };
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const job = await prisma.job.findUnique({ where: { id: params.id }, include: { matches: true } });
  if (!job) return NextResponse.json({ error: "JOB_NOT_FOUND" }, { status: 404 });
  return NextResponse.json(serializeJob(job));
}
