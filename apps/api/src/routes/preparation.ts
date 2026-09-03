import type { FastifyInstance, FastifyRequest } from "fastify";
import { prisma } from "@careerpilot/database";
import type { CandidateProfile } from "@careerpilot/shared";
import { getAIProvider } from "../lib/ai.js";

const parseJson = (s: string | null) => (s ? (JSON.parse(s) as string[]) : []);

async function loadCandidateProfile(req: FastifyRequest): Promise<CandidateProfile | null> {
  let userId: string | null = null;
  try {
    await req.jwtVerify();
    userId = (req as unknown as { user: { sub: string } }).user.sub;
  } catch {
    userId = null;
  }
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

const STANDARD_QUESTIONS = [
  "What is your full name?",
  "What is your email address?",
  "How many years of experience do you have?",
  "What is your current designation?",
  "What is your highest level of education?",
  "What is your notice period?",
  "What is your expected salary?",
];

export default async function preparationRoutes(app: FastifyInstance) {
  app.post("/jobs/:id/cover-letter", async (req, reply) => {
    const { id } = req.params as { id: string };
    const { cvId } = (req.body ?? {}) as { cvId?: string };
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) return reply.code(404).send({ error: "JOB_NOT_FOUND" });
    const profile = await loadCandidateProfile(req);
    if (!profile) return reply.code(400).send({ error: "MISSING_CANDIDATE_DATA" });

    const provider = getAIProvider();
    const content = await provider.generateCoverLetter({
      candidate: {
        name: profile.name,
        currentTitle: profile.currentTitle,
        yearsExperience: profile.yearsExperience,
        summary: profile.summary,
        skills: profile.skills,
      },
      job: { title: job.title, company: job.company, description: job.description, skills: parseJson(job.skills) },
    });

    const saved = await prisma.coverLetter.create({ data: { jobId: id, cvId: cvId ?? null, content } });
    return { id: saved.id, draft: true, content };
  });

  app.post("/jobs/:id/tailor-cv", async (req, reply) => {
    const { id } = req.params as { id: string };
    const { cvId, cvText } = (req.body ?? {}) as { cvId?: string; cvText?: string };
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) return reply.code(404).send({ error: "JOB_NOT_FOUND" });

    let text = cvText ?? "";
    if (!text && cvId) {
      const cv = await prisma.cv.findUnique({ where: { id: cvId } });
      text = cv?.name ?? "";
    }
    if (!text) text = job.title + " " + parseJson(job.skills).join(" ");

    const provider = getAIProvider();
    const analysis = await provider.analyzeJob(job.description);
    const tailored = await provider.tailorCV(text, analysis);
    return tailored;
  });

  app.post("/jobs/:id/answers", async (req, reply) => {
    const { id } = req.params as { id: string };
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) return reply.code(404).send({ error: "JOB_NOT_FOUND" });
    const profile = await loadCandidateProfile(req);
    if (!profile) return reply.code(400).send({ error: "MISSING_CANDIDATE_DATA" });

    const provider = getAIProvider();
    const answers = [];
    for (const q of STANDARD_QUESTIONS) {
      const a = await provider.answerApplicationQuestion(q, profile);
      answers.push({ question: q, answer: a.answer, status: a.status });
    }
    return answers;
  });
}
