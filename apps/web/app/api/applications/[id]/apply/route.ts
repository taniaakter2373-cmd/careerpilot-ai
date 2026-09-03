import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";
import { loadCandidateForApplication, validateApplication, blockingIssues } from "../../../_lib/application";
import { logAudit } from "../../../_lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const app = await prisma.application.findUnique({ where: { id: params.id } });
  if (!app) return NextResponse.json({ error: "APPLICATION_NOT_FOUND" }, { status: 404 });
  if (app.status !== "APPROVED") return NextResponse.json({ error: "APPROVAL_REQUIRED", message: "Application must be approved before submitting" }, { status: 409 });

  const candidate = await loadCandidateForApplication();
  const validation = await validateApplication({ candidate, cvId: app.cvId, coverLetterId: app.coverLetterId, jobId: app.jobId, ignoreApplicationId: app.id });
  const blockers = blockingIssues(validation);
  if (blockers.length > 0) {
    await logAudit({ jobId: app.jobId, action: "SUBMISSION_BLOCKED", oldStatus: app.status, result: "BLOCKED", metadata: { issues: blockers } });
    return NextResponse.json({ error: "SUBMISSION_BLOCKED", message: "Application cannot be submitted until the following issues are resolved.", issues: validation }, { status: 409 });
  }

  const confirmationNumber = `JOB-${Date.now().toString(36).toUpperCase()}`;
  const updated = await prisma.application.update({
    where: { id: params.id },
    data: { status: "APPLIED", applicationDate: new Date(), applicationMethod: app.applicationMethod || "MANUAL", confirmationNumber },
  });
  await prisma.job.update({ where: { id: app.jobId }, data: { status: "APPLIED" } });
  await logAudit({ jobId: app.jobId, action: "APPLICATION_SUBMITTED", oldStatus: app.status, newStatus: "APPLIED", applicationMethod: updated.applicationMethod, result: "OK", metadata: { confirmationNumber } });
  return NextResponse.json({ id: updated.id, status: updated.status, confirmationNumber });
}
