import type { FastifyInstance, FastifyRequest } from "fastify";
import { prisma } from "@careerpilot/database";
import {
  computeDuplicateHash,
  DemoJobSource,
  JobSourceRegistry,
  normalizeJob,
  type JobCriteria,
} from "@careerpilot/job-sources";
import { BdjobsSource } from "@careerpilot/job-sources";
import { scoreJob } from "@careerpilot/matching";
import { loadCandidateForMatching } from "../lib/matching.js";

const registry = new JobSourceRegistry();
registry.register(new DemoJobSource());
// Opt-in real sources. Bdjobs.com is JS-rendered, so the HTTP connector is
// best-effort and may return no listings; enable explicitly when its parser is
// validated (or via the Playwright-assisted path). It fails gracefully.
if (process.env.ENABLE_BDJOBS === "true") {
  registry.register(new BdjobsSource());
}

interface SearchBody {
  keywords?: string[];
  roles?: string[];
  locations?: string[];
  countries?: string[];
}

export default async function searchRoutes(app: FastifyInstance) {
  app.post("/jobs/search", async (req: FastifyRequest) => {
    const body = (req.body ?? {}) as SearchBody;

    let userId: string | null = null;
    try {
      await req.jwtVerify();
      userId = (req as unknown as { user: { sub: string } }).user.sub;
    } catch {
      userId = null;
    }

    const candidate = await loadCandidateForMatching(userId ?? undefined);

    const criteria: JobCriteria = {
      keywords: body.keywords ?? [],
      roles: body.roles ?? candidate?.targetRoles ?? [],
      locations: body.locations ?? [],
      countries: body.countries ?? candidate?.preferredLocations ?? [],
    };

    const { jobs: rawJobs, results } = await registry.search(criteria);

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

      if (existingUrls.has(job.url) || existingHashes.has(hash)) {
        duplicates++;
        continue;
      }
      if (seenHashes.has(hash)) {
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

    return {
      found: rawJobs.length,
      added,
      duplicates,
      candidateAvailable: candidate != null,
      sourceResults: results.map((r) => ({ source: r.source, count: r.jobs.length, error: r.error })),
      jobs: scored,
    };
  });

  app.post("/jobs/analyze", async (req) => {
    const { getAIProvider } = await import("../lib/ai.js");
    const provider = getAIProvider();
    const { text } = (req.body ?? {}) as { text?: string };
    if (!text) return { analysis: null };
    return { provider: provider.name, analysis: await provider.analyzeJob(text) };
  });
}
