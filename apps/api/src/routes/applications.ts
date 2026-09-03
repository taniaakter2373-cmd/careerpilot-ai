import type { FastifyInstance, FastifyRequest } from "fastify";
import { prisma } from "@careerpilot/database";
import type { CandidateProfile } from "@careerpilot/shared";
import { getAIProvider } from "../lib/ai.js";
import { loadCandidateForApplication, validateApplication, blockingIssues } from "../lib/application.js";
import { listCvs, selectBestCv } from "../lib/cv.js";
import { logAudit } from "../lib/audit.js";

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

async function authUserId(req: FastifyRequest): Promise<string | null> {
  try {
    await req.jwtVerify();
    return (req as unknown as { user: { sub: string } }).user.sub;
  } catch {
    return null;
  }
}

async function loadProfile(req: FastifyRequest): Promise<CandidateProfile | null> {
  const userId = await authUserId(req);
  const p = userId
    ? await prisma.candidateProfile.findUnique({ where: { userId }, include: { skills: true } })
    : await prisma.candidateProfile.findFirst({ include: { skills: true } });
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    email: p.email,
    phone: p.phone,
    location: p.location,
    country: p.country,
    currentTitle: p.currentTitle,
    yearsExperience: p.yearsExperience,
    education: p.education,
    skills: p.skills.map((s) => s.name),
    certifications: parseJson(p.certifications),
    industries: [],
    targetRoles: parseJson(p.targetRoles),
    targetCompanies: [],
    preferredLocations: parseJson(p.preferredLocations),
    workPreferences: { remote: "ANY", employment: "ANY" },
    salaryExpectation: { min: p.salaryMin, currency: (p.salaryCurrency as never) ?? "BDT" },
    noticePeriod: p.noticePeriod,
    linkedinUrl: p.linkedinUrl,
    portfolioUrl: p.portfolioUrl,
    summary: p.summary,
    careerGoals: parseJson(p.careerGoals),
  };
}

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

export default async function applicationRoutes(app: FastifyInstance) {
  // ---- Prepare application (CV selection + cover letter + answers) ---------
  app.post("/applications/prepare", async (req, reply) => {
    const { jobId, cvId } = (req.body ?? {}) as { jobId?: string; cvId?: string };
    if (!jobId) return reply.code(400).send({ error: "jobId is required" });

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return reply.code(404).send({ error: "JOB_NOT_FOUND" });

    const profile = await loadProfile(req);
    if (!profile) return reply.code(400).send({ error: "MISSING_CANDIDATE_DATA" });

    // CV selection: explicit or auto-selected to match the job
    let selectedCvId = cvId ?? null;
    let cvReason = cvId ? "explicit" : "auto";
    if (!selectedCvId) {
      const cvs = await listCvs();
      const best = selectBestCv({ title: job.title, skills: parseJson(job.skills) }, cvs);
      selectedCvId = best?.id ?? null;
    }

    const provider = getAIProvider();

    // Cover letter tailored to this job
    const letterContent = await provider.generateCoverLetter({
      candidate: {
        name: profile.name,
        currentTitle: profile.currentTitle,
        yearsExperience: profile.yearsExperience,
        summary: profile.summary,
        skills: profile.skills,
      },
      job: { title: job.title, company: job.company, description: job.description, skills: parseJson(job.skills) },
    });
    const letter = await prisma.coverLetter.create({ data: { jobId, cvId: selectedCvId, content: letterContent } });

    // Application answers from verified candidate data
    const answers: { question: string; answer: string; status: string; source: string }[] = [];
    for (const q of STANDARD_QUESTIONS) {
      const a = await provider.answerApplicationQuestion(q, profile);
      answers.push({ question: q, answer: a.answer, status: a.status, source: "VERIFIED" });
    }

    const application = await prisma.application.create({
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

    await prisma.applicationAnswer.createMany({
      data: answers.map((a) => ({
        applicationId: application.id,
        question: a.question,
        answer: a.answer,
        status: a.status,
        source: a.source,
      })),
    });

    await prisma.job.update({ where: { id: jobId }, data: { status: "APPLICATION_PREPARED" } });

    const candidate = await loadCandidateForApplication();
    const validation = await validateApplication({
      candidate,
      cvId: selectedCvId,
      coverLetterId: letter.id,
      jobId,
      ignoreApplicationId: application.id,
    });

    await logAudit({
      jobId,
      action: "APPLICATION_PREPARED",
      newStatus: "PREPARED",
      applicationMethod: job.applicationMethod,
      result: "OK",
      metadata: { cvSelection: cvReason, blockingIssues: blockingIssues(validation).length },
    });

    return {
      application: serializeApplication(application),
      cvId: selectedCvId,
      cvSelection: cvReason,
      coverLetter: { id: letter.id, content: letterContent },
      answers,
      validation,
    };
  });

  app.get("/applications", async () => {
    const apps = await prisma.application.findMany({ orderBy: { createdAt: "desc" } });
    const enriched = await Promise.all(
      apps.map(async (a) => {
        const job = await prisma.job.findUnique({ where: { id: a.jobId } });
        return { ...serializeApplication(a), jobTitle: job?.title ?? null, company: job?.company ?? null, location: job?.location ?? null };
      }),
    );
    return enriched;
  });

  app.get("/applications/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const app = await prisma.application.findUnique({ where: { id } });
    if (!app) return reply.code(404).send({ error: "APPLICATION_NOT_FOUND" });
    const [job, coverLetter, answers] = await Promise.all([
      prisma.job.findUnique({ where: { id: app.jobId } }),
      app.coverLetterId ? prisma.coverLetter.findUnique({ where: { id: app.coverLetterId } }) : null,
      prisma.applicationAnswer.findMany({ where: { applicationId: app.id } }),
    ]);
    const candidate = await loadCandidateForApplication();
    const validation = await validateApplication({
      candidate,
      cvId: app.cvId,
      coverLetterId: app.coverLetterId,
      jobId: app.jobId,
      ignoreApplicationId: app.id,
    });
    return {
      ...serializeApplication(app),
      job: job ? { id: job.id, title: job.title, company: job.company, location: job.location, url: job.url, applicationUrl: job.applicationUrl } : null,
      coverLetter: coverLetter ? { id: coverLetter.id, content: coverLetter.content } : null,
      answers,
      validation,
    };
  });

  // ---- Approval center ------------------------------------------------------
  app.post("/applications/:id/approve", async (req, reply) => {
    const { id } = req.params as { id: string };
    const app = await prisma.application.findUnique({ where: { id } });
    if (!app) return reply.code(404).send({ error: "APPLICATION_NOT_FOUND" });
    if (app.status !== "PREPARED") return reply.code(409).send({ error: "INVALID_STATE", message: `Cannot approve from ${app.status}` });

    const updated = await prisma.application.update({ where: { id }, data: { status: "APPROVED" } });
    await logAudit({ jobId: app.jobId, action: "USER_APPROVED", oldStatus: "PREPARED", newStatus: "APPROVED", result: "OK" });
    return serializeApplication(updated);
  });

  // ---- Apply (manual submission record — human submits via the job URL) -----
  app.post("/applications/:id/apply", async (req, reply) => {
    const { id } = req.params as { id: string };
    const app = await prisma.application.findUnique({ where: { id } });
    if (!app) return reply.code(404).send({ error: "APPLICATION_NOT_FOUND" });
    if (app.status !== "APPROVED") return reply.code(409).send({ error: "APPROVAL_REQUIRED", message: "Application must be approved before submitting" });

    const candidate = await loadCandidateForApplication();
    const validation = await validateApplication({
      candidate,
      cvId: app.cvId,
      coverLetterId: app.coverLetterId,
      jobId: app.jobId,
      ignoreApplicationId: app.id,
    });
    const blockers = blockingIssues(validation);
    if (blockers.length > 0) {
      await logAudit({ jobId: app.jobId, action: "SUBMISSION_BLOCKED", oldStatus: app.status, result: "BLOCKED", metadata: { issues: blockers } });
      return reply.code(409).send({
        error: "SUBMISSION_BLOCKED",
        message: "Application cannot be submitted until the following issues are resolved.",
        issues: validation,
      });
    }

    const updated = await prisma.application.update({
      where: { id },
      data: { status: "APPLIED", applicationDate: new Date(), applicationMethod: app.applicationMethod || "MANUAL" },
    });
    await prisma.job.update({ where: { id: app.jobId }, data: { status: "APPLIED" } });
    await logAudit({
      jobId: app.jobId,
      action: "APPLICATION_SUBMITTED",
      oldStatus: app.status,
      newStatus: "APPLIED",
      applicationMethod: updated.applicationMethod,
      result: "OK",
    });
    return serializeApplication(updated);
  });

  // ---- Update status / notes ------------------------------------------------
  app.put("/applications/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const app = await prisma.application.findUnique({ where: { id } });
    if (!app) return reply.code(404).send({ error: "APPLICATION_NOT_FOUND" });

    const body = (req.body ?? {}) as Record<string, unknown>;
    const allowed = ["status", "notes", "nextFollowUpDate", "recruiterName", "recruiterEmail", "interviewDate", "offerStatus", "confirmationNumber"];
    const data: Record<string, unknown> = {};
    for (const k of allowed) if (k in body) data[k] = body[k];

    const updated = await prisma.application.update({ where: { id }, data });
    await logAudit({ jobId: app.jobId, action: "APPLICATION_UPDATED", oldStatus: app.status, newStatus: (body.status as string) ?? app.status, result: "OK" });
    return serializeApplication(updated);
  });
}
