import type { FastifyInstance } from "fastify";
import { prisma } from "@careerpilot/database";

export default async function dashboardRoutes(app: FastifyInstance) {
  app.get("/dashboard", async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [jobsToday, strongMatches, pendingApproval, applied, interviews, offers, topMatches] =
      await Promise.all([
        prisma.job.count({ where: { scrapedAt: { gte: todayStart } } }),
        prisma.jobMatch.count({ where: { overallScore: { gte: 90 } } }),
        prisma.application.count({ where: { status: { in: ["PREPARED", "APPROVED"] } } }),
        prisma.application.count({ where: { status: { in: ["APPLIED", "SCREENING", "INTERVIEW", "FINAL_INTERVIEW", "OFFER"] } } }),
        prisma.application.count({ where: { status: { in: ["INTERVIEW", "FINAL_INTERVIEW"] } } }),
        prisma.application.count({ where: { status: "OFFER" } }),
        prisma.job.findMany({
          include: { matches: true },
          orderBy: { scrapedAt: "desc" },
          take: 10,
        }),
      ]);

    const ranked = topMatches
      .filter((j) => j.matches.length > 0)
      .sort((a, b) => b.matches[0].overallScore - a.matches[0].overallScore)
      .slice(0, 5)
      .map((j) => ({
        id: j.id,
        title: j.title,
        company: j.company,
        location: j.location,
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
        salaryCurrency: j.salaryCurrency,
        overallScore: j.matches[0].overallScore,
        recommendation: j.matches[0].recommendation,
      }));

    return {
      jobsToday,
      strongMatches,
      pendingApproval,
      applied,
      interviews,
      offers,
      topMatches: ranked,
    };
  });
}
