import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STAGES = [
  "CONTACTED", "INITIAL_SCREENING", "HR_INTERVIEW", "TECHNICAL/ROLE_INTERVIEW", "ASSESSMENT",
  "FINAL_INTERVIEW", "SALARY_DISCUSSION", "REFERENCE_CHECK", "BACKGROUND_CHECK",
  "OFFER_RECEIVED", "OFFER_ACCEPTED", "OFFER_REJECTED", "ON_HOLD", "REJECTED", "NO_RESPONSE", "JOINED",
];

async function autoMatchApplication(company: string | null, jobTitle: string | null): Promise<string | null> {
  if (!company && !jobTitle) return null;
  const apps = await prisma.application.findMany({ include: { job: true } });
  for (const a of apps) {
    const jobCompany = (a.job?.company ?? "").toLowerCase();
    const jobTitleLower = (a.job?.title ?? "").toLowerCase();
    if (company && jobCompany.includes(company.toLowerCase())) return a.id;
    if (jobTitle && jobTitleLower.includes(jobTitle.toLowerCase())) return a.id;
    if (company && jobCompany && jobCompany.includes(company.toLowerCase())) return a.id;
  }
  return null;
}

function serialize(r: any) {
  return {
    id: r.id,
    applicationId: r.applicationId,
    recruiterName: r.recruiterName,
    recruiterEmail: r.recruiterEmail,
    company: r.company,
    jobTitle: r.jobTitle,
    emailSubject: r.emailSubject,
    emailSummary: r.emailSummary,
    detectedStage: r.detectedStage,
    nextAction: r.nextAction,
    nextActionDate: r.nextActionDate,
    actionRequired: r.actionRequired,
    status: r.status,
    priority: r.priority,
    lastContactAt: r.lastContactAt,
    lastUserReplyAt: r.lastUserReplyAt,
    receivedDate: r.receivedDate,
    notes: r.notes,
    createdAt: r.createdAt,
  };
}

export async function GET() {
  const contacts = await prisma.recruiterInteraction.findMany({ orderBy: { receivedDate: "desc" } });
  const enriched = await Promise.all(
    contacts.map(async (r) => {
      let appTitle: string | null = null;
      if (r.applicationId) {
        const app = await prisma.application.findUnique({ where: { id: r.applicationId }, include: { job: true } });
        appTitle = app?.job ? `${app.job.title} @ ${app.job.company}` : null;
      }
      return { ...serialize(r), applicationTitle: appTitle };
    }),
  );
  return NextResponse.json({ contacts: enriched, stages: STAGES });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, any>;
  const applicationId = (body.applicationId as string | null) ?? (await autoMatchApplication(body.company ?? null, body.jobTitle ?? null));

  const created = await prisma.recruiterInteraction.create({
    data: {
      applicationId,
      recruiterName: body.recruiterName ?? null,
      recruiterEmail: body.recruiterEmail ?? null,
      company: body.company ?? null,
      jobTitle: body.jobTitle ?? null,
      emailSubject: body.emailSubject ?? null,
      emailSummary: body.emailSummary ?? null,
      detectedStage: body.detectedStage ?? "CONTACTED",
      nextAction: body.nextAction ?? null,
      nextActionDate: body.nextActionDate ? new Date(body.nextActionDate) : null,
      actionRequired: body.actionRequired === true,
      status: "ACTIVE",
      priority: body.priority ?? "MEDIUM",
      lastContactAt: body.lastContactAt ? new Date(body.lastContactAt) : new Date(),
      receivedDate: new Date(),
    },
  });
  return NextResponse.json({ ...serialize(created), autoMatched: applicationId != null });
}
