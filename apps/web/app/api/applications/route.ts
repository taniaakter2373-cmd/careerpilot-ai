import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serializeApplication(a: any) {
  return {
    id: a.id,
    jobId: a.jobId,
    candidateId: a.candidateId,
    cvId: a.cvId,
    coverLetterId: a.coverLetterId,
    applicationDate: a.applicationDate,
    applicationMethod: a.applicationMethod,
    mode: a.mode,
    status: a.status,
    applicationUrl: a.applicationUrl,
    confirmationNumber: a.confirmationNumber,
    notes: a.notes,
    nextFollowUpDate: a.nextFollowUpDate,
    recruiterName: a.recruiterName,
    recruiterEmail: a.recruiterEmail,
    interviewDate: a.interviewDate,
    offerStatus: a.offerStatus,
    createdAt: a.createdAt,
  };
}

export async function GET() {
  const apps = await prisma.application.findMany({ orderBy: { createdAt: "desc" } });
  const enriched = await Promise.all(
    apps.map(async (a) => {
      const job = await prisma.job.findUnique({ where: { id: a.jobId } });
      return { ...serializeApplication(a), jobTitle: job?.title ?? null, company: job?.company ?? null, location: job?.location ?? null };
    }),
  );
  return NextResponse.json(enriched);
}
