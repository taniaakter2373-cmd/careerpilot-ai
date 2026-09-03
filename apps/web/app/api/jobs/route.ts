import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";
import {
  computeDuplicateHash,
  JobSourceRegistry,
  normalizeJob,
  type JobCriteria,
} from "@careerpilot/job-sources";
import { BdjobsSource } from "@careerpilot/job-sources";
import { scoreJob, isBlockedCompany, isHrRole } from "@careerpilot/matching";
import { loadCandidateForMatching } from "../_lib/matching";
import { getUserId } from "../_lib/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const parseJson = (s: string | null) => (s ? (JSON.parse(s) as string[]) : []);

function serializeJob(j: any) {
  const match = j.matches?.[0];
  return {
    id: j.id,
    source: j.source,
    sourceJobId: j.sourceJobId,
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
    scrapedAt: j.scrapedAt,
    applicationMethod: j.applicationMethod,
    applicationUrl: j.applicationUrl,
    status: j.status,
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

let registry: JobSourceRegistry | null = null;
function getRegistry() {
  if (!registry) {
    registry = new JobSourceRegistry();
    // Real sources only (no demo data). Bdjobs is opt-in; LinkedIn/Bayt are browser-driven.
    if (process.env.ENABLE_BDJOBS === "true") registry.register(new BdjobsSource());
  }
  return registry;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const where: Record<string, unknown> = {};
  const status = url.searchParams.get("status");
  const country = url.searchParams.get("country");
  const company = url.searchParams.get("company");
  const q = url.searchParams.get("q");
  const remoteType = url.searchParams.get("remoteType");
  const employmentType = url.searchParams.get("employmentType");

  if (status) {
    where.status = status;
  } else {
    // default: hide rejected/duplicate/expired unless explicitly filtered
    where.status = { notIn: ["REJECTED", "DUPLICATE", "EXPIRED"] };
  }
  if (country) where.country = country;
  if (company) where.company = { contains: company };
  if (remoteType) where.remoteType = remoteType;
  if (employmentType) where.employmentType = employmentType;
  if (q) {
    where.OR = [{ title: { contains: q } }, { company: { contains: q } }, { description: { contains: q } }];
  }

  const requestedLimit = Math.min(Number(url.searchParams.get("limit") ?? 100), 500);
  const scope = url.searchParams.get("scope"); // international | local | all
  const minScore = Number(url.searchParams.get("minScore") ?? 70);
  // Fetch a wide window, then filter to HR roles so all matching HR jobs are found.
  const jobs = await prisma.job.findMany({ where, include: { matches: true }, orderBy: { scrapedAt: "desc" }, take: 500 });
  let hrJobs = jobs.filter((j) => isHrRole(j.title));
  if (scope === "international") hrJobs = hrJobs.filter((j) => (j.country ?? "").toLowerCase() !== "bangladesh");
  if (scope === "local") hrJobs = hrJobs.filter((j) => (j.country ?? "").toLowerCase() === "bangladesh" || !j.country);
  // Only profile-matching opportunities (>= 70%)
  hrJobs = hrJobs.filter((j) => (j.matches?.[0]?.overallScore ?? 0) >= minScore);
  return NextResponse.json(hrJobs.slice(0, requestedLimit).map(serializeJob));
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    keywords?: string[];
    roles?: string[];
    locations?: string[];
    countries?: string[];
  };

  const userId = await getUserId(req);
  const candidate = await loadCandidateForMatching(userId ?? undefined);

  const criteria: JobCriteria = {
    keywords: body.keywords ?? [],
    roles: body.roles ?? candidate?.targetRoles ?? [],
    locations: body.locations ?? [],
    countries: body.countries ?? candidate?.preferredLocations ?? [],
  };

  const { jobs: rawJobs, results } = await getRegistry().search(criteria);

  const existing = await prisma.job.findMany({ select: { url: true, duplicateHash: true } });
  const existingUrls = new Set(existing.map((j) => j.url));
  const existingHashes = new Set(existing.map((j) => j.duplicateHash).filter(Boolean) as string[]);

  let added = 0;
  let duplicates = 0;
  const scored: unknown[] = [];
  const seenHashes = new Set<string>();

  for (const raw of rawJobs) {
    const job = normalizeJob(raw);
    const hash = computeDuplicateHash(job);
    if (isBlockedCompany(job.company) || !isHrRole(job.title)) {
      duplicates++;
      continue;
    }
    if (existingUrls.has(job.url) || existingHashes.has(hash) || seenHashes.has(hash)) {
      duplicates++;
      continue;
    }
    seenHashes.add(hash);

    const match = candidate ? scoreJob(candidate, job) : null;
    const created = await prisma.job.create({
      data: {
        source: job.source,
        sourceJobId: job.sourceJobId,
        url: job.url,
        title: job.title,
        company: job.company,
        companyUrl: job.companyUrl,
        location: job.location,
        country: job.country,
        city: job.city,
        remoteType: job.remoteType,
        employmentType: job.employmentType,
        industry: job.industry,
        department: job.department,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        salaryCurrency: job.salaryCurrency,
        description: job.description,
        requirements: JSON.stringify(job.requirements),
        responsibilities: JSON.stringify(job.responsibilities),
        educationRequirements: JSON.stringify(job.educationRequirements),
        experienceRequired: job.experienceRequired,
        skills: JSON.stringify(job.skills),
        postedDate: job.postedDate,
        closingDate: job.closingDate,
        applicationMethod: job.applicationMethod,
        applicationUrl: job.applicationUrl,
        duplicateHash: hash,
        status: match ? "MATCHED" : "NEW",
        ...(match
          ? {
              matches: {
                create: {
                  overallScore: match.overallScore,
                  breakdown: JSON.stringify(match.breakdown),
                  weights: JSON.stringify(match.weights),
                  whyMatched: JSON.stringify(match.whyMatched),
                  missingRequirements: JSON.stringify(match.missingRequirements),
                  riskFlags: JSON.stringify(match.riskFlags),
                  recommendation: match.recommendation,
                  action: match.action,
                  hardRequirementFailure: match.hardRequirementFailure,
                  targetCompanyBonus: match.targetCompanyBonus,
                },
              },
            }
          : {}),
      },
      include: { matches: true },
    });

    added++;
    scored.push({
      id: created.id,
      title: created.title,
      company: created.company,
      location: created.location,
      salaryMin: created.salaryMin,
      salaryMax: created.salaryMax,
      salaryCurrency: created.salaryCurrency,
      overallScore: created.matches[0]?.overallScore ?? null,
      recommendation: created.matches[0]?.recommendation ?? null,
      action: created.matches[0]?.action ?? null,
      hardRequirementFailure: created.matches[0]?.hardRequirementFailure ?? false,
    });
  }

  return NextResponse.json({
    found: rawJobs.length,
    added,
    duplicates,
    candidateAvailable: candidate != null,
    sourceResults: results.map((r) => ({ source: r.source, count: r.jobs.length, error: r.error })),
    jobs: scored,
  });
}
