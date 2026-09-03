import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 });

  const enriched = await Promise.all(
    logs.map(async (l) => {
      let title: string | null = null;
      if (l.jobId) {
        const job = await prisma.job.findUnique({ where: { id: l.jobId }, select: { title: true, company: true } });
        title = job ? `${job.title} @ ${job.company}` : null;
      }
      return {
        id: l.id,
        action: l.action,
        oldStatus: l.oldStatus,
        newStatus: l.newStatus,
        applicationMethod: l.applicationMethod,
        result: l.result,
        error: l.error,
        job: title,
        createdAt: l.createdAt,
      };
    }),
  );

  return NextResponse.json(enriched);
}
