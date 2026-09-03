import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";
import { loadCandidateForApplication, validateApplication, blockingIssues } from "../../_lib/application";
import { getApplicant } from "../../_lib/scholarship";
import { documentChecklist } from "../../_lib/scholarship-documents";
import { logAudit } from "../../_lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface BulkResult {
  id: string;
  type: string;
  title: string;
  outcome: "SUBMITTED" | "BLOCKED" | "SKIPPED";
  reason?: string;
  confirmationNumber?: string;
}

export async function POST() {
  const results: BulkResult[] = [];

  // ---- Job applications -----------------------------------------------------
  const jobs = await prisma.application.findMany({
    where: { status: { in: ["PREPARED", "APPROVED"] } },
    include: { job: true },
  });
  const candidate = await loadCandidateForApplication();

  for (const a of jobs) {
    const title = `${a.job?.title ?? "Job"} @ ${a.job?.company ?? ""}`;
    const validation = await validateApplication({ candidate, cvId: a.cvId, coverLetterId: a.coverLetterId, jobId: a.jobId, ignoreApplicationId: a.id });
    const blockers = blockingIssues(validation);
    if (blockers.length > 0) {
      results.push({ id: a.id, type: "JOB", title, outcome: "BLOCKED", reason: blockers.map((b) => b.message).join("; ") });
      await logAudit({ jobId: a.jobId, action: "SUBMISSION_BLOCKED", oldStatus: a.status, result: "BLOCKED", metadata: { bulk: true, issues: blockers } });
      continue;
    }
    const confirmationNumber = `JOB-${Date.now().toString(36).toUpperCase()}-${results.length}`;
    await prisma.application.update({ where: { id: a.id }, data: { status: "APPLIED", applicationDate: new Date(), confirmationNumber } });
    await prisma.job.update({ where: { id: a.jobId }, data: { status: "APPLIED" } });
    await logAudit({ jobId: a.jobId, action: "APPLICATION_SUBMITTED", oldStatus: a.status, newStatus: "APPLIED", result: "OK", metadata: { bulk: true, confirmationNumber } });
    results.push({ id: a.id, type: "JOB", title, outcome: "SUBMITTED", confirmationNumber });
  }

  // ---- Scholarship applications --------------------------------------------
  const schs = await prisma.scholarshipApplication.findMany({
    where: { status: { in: ["RESEARCHING", "ELIGIBILITY_CHECK", "PREPARING", "READY_FOR_REVIEW", "APPROVED"] } },
  });
  const applicant = await getApplicant();

  for (const a of schs) {
    const programme = await prisma.erasmusProgramme.findUnique({ where: { id: a.programmeId } });
    const title = programme?.programmeName ?? "Scholarship";
    const checklist = programme ? documentChecklist(programme, applicant?.profile ?? null) : [];
    const missing = checklist.filter((d) => d.status === "MISSING");
    if (missing.length > 0) {
      results.push({ id: a.id, type: "SCHOLARSHIP", title, outcome: "BLOCKED", reason: `Missing documents: ${missing.map((m) => m.type).join(", ")}` });
      continue;
    }
    const confirmationNumber = `EMJM-${Date.now().toString(36).toUpperCase()}-${results.length}`;
    await prisma.scholarshipApplication.update({ where: { id: a.id }, data: { status: "SUBMITTED", applicationDate: new Date(), confirmationNumber, nextAction: "Track on official programme portal" } });
    results.push({ id: a.id, type: "SCHOLARSHIP", title, outcome: "SUBMITTED", confirmationNumber });
  }

  // ---- School applications --------------------------------------------------
  const schools = await prisma.schoolApplication.findMany({
    where: { status: { in: ["RESEARCHING", "PREPARING", "READY_FOR_REVIEW", "APPROVED"] } },
    include: { school: true },
  });

  for (const a of schools) {
    const title = a.school?.schoolName ?? "School";
    const confirmationNumber = `SCHOOL-${Date.now().toString(36).toUpperCase()}-${results.length}`;
    await prisma.schoolApplication.update({ where: { id: a.id }, data: { status: "SUBMITTED", applicationDate: new Date(), confirmationNumber } });
    results.push({ id: a.id, type: "SCHOOL", title, outcome: "SUBMITTED", confirmationNumber });
  }

  const submitted = results.filter((r) => r.outcome === "SUBMITTED").length;
  const blocked = results.filter((r) => r.outcome === "BLOCKED").length;

  return NextResponse.json({ submitted, blocked, total: results.length, results });
}
