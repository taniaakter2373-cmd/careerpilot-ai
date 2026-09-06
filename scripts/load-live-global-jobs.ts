// Live international (EU/UK/USA/global remote) HR job discovery -> hosted Postgres.
// Pulls Arbeitnow + Jobicy + RemoteOK, scores against the candidate, inserts new
// matches (deduped). Run: DATABASE_URL="<hosted-url>" npx tsx scripts/load-live-global-jobs.ts
import { PrismaClient } from "@prisma/client";
import { computeDuplicateHash, JobSourceRegistry, defaultSources, normalizeJob } from "@careerpilot/job-sources";
import { isBlockedCompany, isHrRole, scoreJob, type CandidateForMatching } from "@careerpilot/matching";

const prisma = new PrismaClient();

const parseJson = (s: string | null) => (s ? (JSON.parse(s) as string[]) : []);

async function main() {
  const cand = await prisma.candidateProfile.findFirst({ include: { skills: true } });
  if (!cand) throw new Error("no candidate profile");

  const c: CandidateForMatching = {
    currentTitle: cand.currentTitle,
    yearsExperience: cand.yearsExperience,
    skills: cand.skills.map((s) => s.name),
    targetRoles: parseJson(cand.targetRoles),
    industries: [],
    preferredLocations: parseJson(cand.preferredLocations),
    education: cand.education,
    salaryExpectation: { min: cand.salaryMin, currency: cand.salaryCurrency },
    careerGoals: parseJson(cand.careerGoals),
  };

  const registry = new JobSourceRegistry();
  for (const s of defaultSources({ ENABLE_BDJOBS: process.env.ENABLE_BDJOBS })) registry.register(s);

  const t0 = Date.now();
  const { jobs: rawJobs, results } = await registry.search({
    roles: c.targetRoles,
    countries: c.preferredLocations,
  });
  console.log(`Search took ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  for (const r of results) console.log(`${r.source}: found ${r.jobs.length}${r.error ? ` (${r.error})` : ""}`);

  const existing = await prisma.job.findMany({ select: { url: true, duplicateHash: true } });
  const urls = new Set(existing.map((j) => j.url));
  const hashes = new Set(existing.map((j) => j.duplicateHash).filter(Boolean) as string[]);

  let added = 0, dupes = 0, skipped = 0;
  const seenHashes = new Set<string>();
  for (const raw of rawJobs) {
    const job = normalizeJob(raw);
    if (isBlockedCompany(job.company) || !isHrRole(job.title)) { skipped++; continue; }
    if (urls.has(job.url) || hashes.has(computeDuplicateHash(job)) || seenHashes.has(computeDuplicateHash(job))) { dupes++; continue; }
    seenHashes.add(computeDuplicateHash(job));

    const m = scoreJob(c, job);
    await prisma.job.create({
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
        duplicateHash: computeDuplicateHash(job),
        status: m.hardRequirementFailure ? "NEW" : "MATCHED",
        matches: {
          create: {
            overallScore: m.overallScore,
            breakdown: JSON.stringify(m.breakdown),
            weights: JSON.stringify(m.weights),
            whyMatched: JSON.stringify(m.whyMatched),
            missingRequirements: JSON.stringify(m.missingRequirements),
            riskFlags: JSON.stringify(m.riskFlags),
            recommendation: m.recommendation,
            action: m.action,
            hardRequirementFailure: m.hardRequirementFailure,
            targetCompanyBonus: false,
          },
        },
      },
    });
    added++;
  }

  console.log(`Done. added=${added}, duplicates=${dupes}, skippedNonHr=${skipped}`);
  const byCountry = await prisma.job.groupBy({ by: ["country"], _count: true, orderBy: { _count: { country: "desc" } } });
  console.log("Total jobs by country:", JSON.stringify(byCountry));
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
