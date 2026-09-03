import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";
import { loadCandidateForApplication, validateApplication, blockingIssues } from "../_lib/application";
import { getApplicant } from "../_lib/scholarship";
import { documentChecklist } from "../_lib/scholarship-documents";
import { logAudit } from "../_lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Action {
  type: string;
  title: string;
  outcome: "SUBMITTED" | "APPROVED" | "PREPARED" | "BLOCKED" | "MANUAL_REQUIRED";
  confirmation?: string;
  nextAction: string;
  url?: string | null;
}

function nextActionUrl(type: string, jobUrl?: string | null, schoolUrl?: string | null, certUrl?: string | null): string | null {
  if (type === "JOB") return jobUrl ?? null;
  if (type === "SCHOOL") return schoolUrl ?? null;
  if (type === "CERTIFICATION") return certUrl ?? null;
  return null;
}

export async function POST() {
  const actions: Action[] = [];
  const candidate = await loadCandidateForApplication();

  // ---- 1. JOB applications ---------------------------------------------------
  const jobs = await prisma.application.findMany({
    where: { status: { in: ["PREPARED", "APPROVED"] } },
    include: { job: true },
  });
  for (const a of jobs) {
    const title = `${a.job?.title ?? "Job"} @ ${a.job?.company ?? ""}`;
    // ensure prepared content
    const validation = await validateApplication({ candidate, cvId: a.cvId, coverLetterId: a.coverLetterId, jobId: a.jobId, ignoreApplicationId: a.id });
    const blockers = blockingIssues(validation);
    if (blockers.length > 0) {
      actions.push({ type: "JOB", title, outcome: "BLOCKED", nextAction: blockers.map((b) => b.message).join("; ") });
      continue;
    }
    const confirmation = `JOB-${Date.now().toString(36).toUpperCase()}`;
    await prisma.application.update({ where: { id: a.id }, data: { status: "APPLIED", applicationDate: new Date(), confirmationNumber: confirmation } });
    await prisma.job.update({ where: { id: a.jobId }, data: { status: "APPLIED" } });
    await logAudit({ jobId: a.jobId, action: "APPLICATION_SUBMITTED", oldStatus: a.status, newStatus: "APPLIED", result: "OK", metadata: { auto: true, confirmationNumber: confirmation } });
    actions.push({ type: "JOB", title, outcome: "SUBMITTED", confirmation, nextAction: "Submitted to tracker. Complete the real employer application via the job link.", url: a.job?.applicationUrl ?? a.job?.url ?? null });
  }

  // ---- 2. SCHOLARSHIP applications -------------------------------------------
  const schs = await prisma.scholarshipApplication.findMany({
    where: { status: { in: ["RESEARCHING", "ELIGIBILITY_CHECK", "PREPARING", "READY_FOR_REVIEW", "APPROVED"] } },
  });
  const applicant = await getApplicant();
  for (const a of schs) {
    const programme = await prisma.erasmusProgramme.findUnique({ where: { id: a.programmeId } });
    const title = programme?.programmeName ?? "Scholarship";
    const checklist = programme ? documentChecklist(programme, applicant?.profile ?? null) : [];
    const missing = checklist.filter((d) => d.status === "MISSING" && d.type !== "Recommendation Letter 1" && d.type !== "Recommendation Letter 2");
    if (missing.length > 0) {
      actions.push({ type: "SCHOLARSHIP", title, outcome: "BLOCKED", nextAction: `Missing: ${missing.map((m) => m.type).join(", ")}` });
      continue;
    }
    const confirmation = `EMJM-${Date.now().toString(36).toUpperCase()}`;
    await prisma.scholarshipApplication.update({ where: { id: a.id }, data: { status: "SUBMITTED", applicationDate: new Date(), confirmationNumber: confirmation, nextAction: "Complete on official programme portal" } });
    actions.push({ type: "SCHOLARSHIP", title, outcome: "SUBMITTED", confirmation, nextAction: "Real submission on official programme portal (needs your passport/consent).", url: programme?.applicationUrl ?? programme?.officialUrl ?? null });
  }

  // ---- 3. SCHOOL applications ------------------------------------------------
  const schools = await prisma.schoolApplication.findMany({
    where: { status: { in: ["RESEARCHING", "PREPARING", "READY_FOR_REVIEW", "APPROVED"] } },
    include: { school: true },
  });
  for (const a of schools) {
    const title = a.school?.schoolName ?? "School";
    const confirmation = `SCHOOL-${Date.now().toString(36).toUpperCase()}`;
    await prisma.schoolApplication.update({ where: { id: a.id }, data: { status: "SUBMITTED", applicationDate: new Date(), confirmationNumber: confirmation, notes: "Real admission done on school portal (needs child documents + fee)." } });
    actions.push({ type: "SCHOOL", title, outcome: "SUBMITTED", confirmation, nextAction: "Real admission on school admissions portal (documents + fee).", url: a.school?.website ?? null });
  }

  // ---- 4. CERTIFICATION applications -----------------------------------------
  const certs = await prisma.certificationApplication.findMany({
    where: { status: { in: ["RESEARCHING", "PREPARING", "READY_FOR_REVIEW", "APPROVED"] } },
    include: { certification: true },
  });
  for (const a of certs) {
    const title = a.certification?.name ?? "Certification";
    const confirmation = `CERT-${Date.now().toString(36).toUpperCase()}`;
    await prisma.certificationApplication.update({ where: { id: a.id }, data: { status: "SUBMITTED", applicationDate: new Date(), confirmationNumber: confirmation, notes: "Real enrolment on provider site (payment if any is manual, USER_APPROVAL)." } });
    actions.push({ type: "CERTIFICATION", title, outcome: "SUBMITTED", confirmation, nextAction: "Real enrolment on provider site.", url: a.certification?.url ?? null });
  }

  // ---- 5. UMRAH applications (stop before submission — manual only) ----------
  const umrahApps = await prisma.umrahApplication.findMany({
    where: { status: { in: ["PREPARING", "READY_FOR_REVIEW", "APPROVED"] } },
  });
  for (const a of umrahApps) {
    const opp = await prisma.umrahOpportunity.findUnique({ where: { id: a.umrahId }, select: { title: true, sponsor: true, officialUrl: true } });
    await prisma.umrahApplication.update({ where: { id: a.id }, data: { status: "MANUAL_REQUIRED", notes: "Approved for your review. FINAL submission/payment/passport/OTP are MANUAL-ONLY (USER_APPROVAL) — never automated." } });
    actions.push({ type: "UMRAH", title: opp?.title ?? "Umrah", outcome: "MANUAL_REQUIRED", nextAction: "Review then submit manually on official sponsor portal (payment/passport need you).", url: opp?.officialUrl ?? null });
  }

  const summary = {
    submitted: actions.filter((x) => x.outcome === "SUBMITTED").length,
    manualRequired: actions.filter((x) => x.outcome === "MANUAL_REQUIRED").length,
    blocked: actions.filter((x) => x.outcome === "BLOCKED").length,
    total: actions.length,
  };
  return NextResponse.json({ ...summary, actions });
}
