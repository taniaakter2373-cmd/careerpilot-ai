import type { FastifyInstance } from "fastify";
import { prisma } from "@careerpilot/database";

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

export default async function jobRoutes(app: FastifyInstance) {
  app.get("/jobs", async (req) => {
    const q = (req.query ?? {}) as Record<string, string | undefined>;
    const where: Record<string, unknown> = {};

    if (q.status) where.status = q.status;
    if (q.country) where.country = q.country;
    if (q.company) where.company = { contains: q.company };
    if (q.remoteType) where.remoteType = q.remoteType;
    if (q.employmentType) where.employmentType = q.employmentType;
    if (q.q) {
      where.OR = [
        { title: { contains: q.q } },
        { company: { contains: q.q } },
        { description: { contains: q.q } },
      ];
    }

    const limit = Math.min(Number(q.limit ?? 100), 500);
    const jobs = await prisma.job.findMany({
      where,
      include: { matches: true },
      orderBy: { scrapedAt: "desc" },
      take: limit,
    });
    return jobs.map(serializeJob);
  });

  app.get("/jobs/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const job = await prisma.job.findUnique({ where: { id }, include: { matches: true } });
    if (!job) return reply.code(404).send({ error: "JOB_NOT_FOUND" });
    return serializeJob(job);
  });
}
