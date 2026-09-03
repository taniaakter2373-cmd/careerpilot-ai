import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";
import { loadCandidateForApplication, validateApplication } from "../../_lib/application";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const app = await prisma.application.findUnique({ where: { id: params.id } });
  if (!app) return NextResponse.json({ error: "APPLICATION_NOT_FOUND" }, { status: 404 });

  const [job, coverLetter, answers] = await Promise.all([
    prisma.job.findUnique({ where: { id: app.jobId } }),
    app.coverLetterId ? prisma.coverLetter.findUnique({ where: { id: app.coverLetterId } }) : null,
    prisma.applicationAnswer.findMany({ where: { applicationId: app.id } }),
  ]);

  const candidate = await loadCandidateForApplication();
  const validation = await validateApplication({ candidate, cvId: app.cvId, coverLetterId: app.coverLetterId, jobId: app.jobId, ignoreApplicationId: app.id });

  return NextResponse.json({
    id: app.id,
    jobId: app.jobId,
    cvId: app.cvId,
    coverLetterId: app.coverLetterId,
    status: app.status,
    applicationMethod: app.applicationMethod,
    applicationUrl: app.applicationUrl,
    applicationDate: app.applicationDate,
    job: job ? { id: job.id, title: job.title, company: job.company, location: job.location, url: job.url, applicationUrl: job.applicationUrl } : null,
    coverLetter: coverLetter ? { id: coverLetter.id, content: coverLetter.content } : null,
    answers,
    validation,
  });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const app = await prisma.application.findUnique({ where: { id: params.id } });
  if (!app) return NextResponse.json({ error: "APPLICATION_NOT_FOUND" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const allowed = ["status", "notes", "nextFollowUpDate", "recruiterName", "recruiterEmail", "interviewDate", "offerStatus", "confirmationNumber"];
  const data: Record<string, unknown> = {};
  for (const k of allowed) if (k in body) data[k] = body[k];

  const updated = await prisma.application.update({ where: { id: params.id }, data });
  return NextResponse.json({ id: updated.id, status: updated.status, notes: updated.notes });
}
