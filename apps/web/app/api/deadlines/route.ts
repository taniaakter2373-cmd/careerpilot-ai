import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function daysRemaining(d: Date | null): number | null {
  if (!d) return null;
  const diff = d.getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export async function GET() {
  const [jobs, schols] = await Promise.all([
    prisma.job.findMany({ where: { closingDate: { not: null } }, select: { id: true, title: true, company: true, closingDate: true, status: true } }),
    prisma.erasmusProgramme.findMany({ select: { id: true, programmeName: true, acronym: true, applicationDeadline: true, scholarshipDeadline: true, deadlineStatus: true, officialUrl: true } }),
  ]);

  const jobDeadlines = jobs
    .map((j) => ({ id: j.id, title: j.title, company: j.company, deadline: j.closingDate, daysRemaining: daysRemaining(j.closingDate), status: j.status, type: "JOB" }))
    .filter((d) => d.daysRemaining != null && d.daysRemaining >= 0)
    .sort((a, b) => (a.daysRemaining ?? 0) - (b.daysRemaining ?? 0))
    .slice(0, 15);

  const scholarshipDeadlines = schols
    .map((p) => ({
      id: p.id,
      name: p.programmeName,
      acronym: p.acronym,
      deadline: p.applicationDeadline,
      scholarshipDeadline: p.scholarshipDeadline,
      daysRemaining: daysRemaining(p.applicationDeadline),
      deadlineStatus: p.deadlineStatus,
      officialUrl: p.officialUrl,
      type: "SCHOLARSHIP",
    }))
    .filter((d) => d.daysRemaining != null && d.daysRemaining >= 0)
    .sort((a, b) => (a.daysRemaining ?? 0) - (b.daysRemaining ?? 0));

  return NextResponse.json({ jobs: jobDeadlines, scholarships: scholarshipDeadlines });
}
