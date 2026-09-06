import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";
import { serializeEuropeJob, SPONSORSHIP_LABEL } from "../../../_lib/europe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const job = await prisma.europeJob.findUnique({ where: { id: params.id }, include: { applications: true } });
  if (!job) return NextResponse.json({ error: "EUROPE_JOB_NOT_FOUND" }, { status: 404 });

  const country = job.country;
  const countryInfo = await prisma.europeCountryIntelligence.findUnique({ where: { country } }).catch(() => null);

  const parseJson = <T = unknown[]>(s: string | null, fb: T): T => (s ? (JSON.parse(s) as T) : fb);

  return NextResponse.json({
    ...serializeEuropeJob(job),
    description: job.description,
    skills: parseJson<string[]>(job.skills, []),
    requirements: parseJson<string[]>(job.requirements, []),
    visaEligibility: job.visaEligibility,
    ieltsLabel: ieltsLabel(job.ieltsStatus),
    relocationLabel: relocationLabel(job.relocationMentioned),
    sponsorshipNote: SPONSORSHIP_LABEL[job.sponsorshipDetected] ?? job.sponsorshipDetected,
    countryInfo: countryInfo
      ? {
          country: countryInfo.country,
          workPermitRoutes: parseJson<Array<Record<string, unknown>>>(countryInfo.workPermitRoutes, []),
          salaryThresholds: parseJson<Array<Record<string, unknown>>>(countryInfo.salaryThresholds, []),
          englishRequirement: parseJson<Record<string, unknown> | null>(countryInfo.englishRequirement, null),
          notes: countryInfo.notes,
        }
      : null,
    applications: job.applications.map((a) => ({
      id: a.id,
      status: a.status,
      applicationDate: a.applicationDate,
      nextAction: a.nextAction,
      confirmationNumber: a.confirmationNumber,
    })),
  });
}

function ieltsLabel(status: string): string {
  const map: Record<string, string> = {
    NOT_REQUIRED: "IELTS Not Required",
    ENGLISH_PROFICIENCY_REQUIRED: "English Proficiency Required",
    REQUIRED_BY_EMPLOYER: "IELTS Required by Employer",
    REQUIRED_FOR_VISA: "English Test Required for Visa",
    UNKNOWN: "Unknown / Requires Verification",
  };
  return map[status] ?? status;
}

function relocationLabel(s: string): string {
  if (s === "YES") return "Yes";
  if (s === "NO") return "No";
  return "Unknown / Not mentioned";
}
