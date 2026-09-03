import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";
import { getAIProvider } from "../../_lib/ai";
import { loadCandidateProfile } from "../../_lib/candidate";
import { loadCandidateForApplication, validateApplication, blockingIssues } from "../../_lib/application";
import { listCvs, selectBestCv } from "../../_lib/cv";
import { logAudit } from "../../_lib/audit";
import { getUserId } from "../../_lib/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const parseJson = (s: string | null) => (s ? (JSON.parse(s) as string[]) : []);

const STANDARD_QUESTIONS = [
  "What is your full name?",
  "What is your email address?",
  "How many years of experience do you have?",
  "What is your current designation?",
  "What is your highest level of education?",
  "What is your notice period?",
  "What is your expected salary?",
];

export async function POST(req: Request) {
  const { jobId, cvId } = (await req.json().catch(() => ({}))) as { jobId?: string; cvId?: string };
  if (!jobId) return NextResponse.json({ error: "jobId is required" }, { status: 400 });

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) return NextResponse.json({ error: "JOB_NOT_FOUND" }, { status: 404 });

  const userId = await getUserId(req);
  const profile = await loadCandidateProfile(userId ?? undefined);
  if (!profile) return NextResponse.json({ error: "MISSING_CANDIDATE_DATA" }, { status: 400 });

  let selectedCvId = cvId ?? null;
  const cvReason = cvId ? "explicit" : "auto";
  if (!selectedCvId) {
    const cvs = await listCvs();
    selectedCvId = selectBestCv({ title: job.title, skills: parseJson(job.skills) }, cvs)?.id ?? null;
  }

  const provider = getAIProvider();
  const letterContent = await provider.generateCoverLetter({
    candidate: { name: profile.name, currentTitle: profile.currentTitle, yearsExperience: profile.yearsExperience, summary: profile.summary, skills: profile.skills },
    job: { title: job.title, company: job.company, description: job.description, skills: parseJson(job.skills) },
  });
  const letter = await prisma.coverLetter.create({ data: { jobId, cvId: selectedCvId, content: letterContent } });

  const answers: { question: string; answer: string; status: string; source: string }[] = [];
  for (const q of STANDARD_QUESTIONS) {
    const a = await provider.answerApplicationQuestion(q, profile);
    answers.push({ question: q, answer: a.answer, status: a.status, source: "VERIFIED" });
  }

  // Idempotent prepare: if an active application already exists for this job,
  // reuse it (regenerate content) instead of creating a duplicate.
  const existing = await prisma.application.findFirst({
    where: {
      jobId,
      status: { in: ["PREPARED", "APPROVED"] },
    },
  });

  let reusedExisting = Boolean(existing);
  let applicationId: string;
  let applicationDate: Date | null = null;

  if (existing) {
    applicationId = existing.id;
    await prisma.application.update({
      where: { id: existing.id },
      data: { cvId: selectedCvId, coverLetterId: letter.id, status: "PREPARED", applicationUrl: job.applicationUrl ?? job.url },
    });
    await prisma.applicationAnswer.deleteMany({ where: { applicationId: existing.id } });
    await prisma.applicationAnswer.createMany({
      data: answers.map((a) => ({ applicationId: existing.id, question: a.question, answer: a.answer, status: a.status, source: a.source })),
    });
  } else {
    const created = await prisma.application.create({
      data: {
        jobId,
        candidateId: profile.id,
        cvId: selectedCvId,
        coverLetterId: letter.id,
        applicationMethod: job.applicationMethod,
        mode: "MANUAL",
        status: "PREPARED",
        applicationUrl: job.applicationUrl ?? job.url,
      },
    });
    applicationId = created.id;
    applicationDate = created.createdAt;
    await prisma.applicationAnswer.createMany({
      data: answers.map((a) => ({ applicationId: created.id, question: a.question, answer: a.answer, status: a.status, source: a.source })),
    });
  }

  await prisma.job.update({ where: { id: jobId }, data: { status: "APPLICATION_PREPARED" } });

  const candidate = await loadCandidateForApplication(userId ?? undefined);
  const validation = await validateApplication({ candidate, cvId: selectedCvId, coverLetterId: letter.id, jobId, ignoreApplicationId: applicationId });

  await logAudit({
    jobId,
    action: "APPLICATION_PREPARED",
    newStatus: "PREPARED",
    applicationMethod: job.applicationMethod,
    result: "OK",
    metadata: { cvSelection: cvReason, reusedExisting, blockingIssues: blockingIssues(validation).length },
  });

  return NextResponse.json({
    application: {
      id: applicationId,
      jobId,
      cvId: selectedCvId,
      coverLetterId: letter.id,
      status: "PREPARED",
      applicationMethod: job.applicationMethod,
      applicationUrl: job.applicationUrl ?? job.url,
      createdAt: applicationDate,
    },
    cvId: selectedCvId,
    cvSelection: cvReason,
    reusedExisting,
    coverLetter: { id: letter.id, content: letterContent },
    answers,
    validation,
  });
}
