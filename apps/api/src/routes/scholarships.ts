import type { FastifyInstance, FastifyRequest } from "fastify";
import { prisma } from "@careerpilot/database";
import {
  calculatePriorityScore,
  evaluateEligibility,
  scholarshipRecommendation,
  scoreScholarshipMatch,
  weightedScore,
  type ProgrammeRequirements,
  type ScholarshipApplicant,
} from "@careerpilot/shared";

const parseJson = (s: string | null) => (s ? (JSON.parse(s) as string[]) : []);

function serializeProgramme(p: any) {
  const m = p.matches?.[0];
  return {
    id: p.id,
    programmeName: p.programmeName,
    acronym: p.acronym,
    officialUrl: p.officialUrl,
    applicationUrl: p.applicationUrl,
    coordinator: p.coordinator,
    partnerUniversities: parseJson(p.partnerUniversities),
    countries: parseJson(p.countries),
    field: p.field,
    degreeType: p.degreeType,
    duration: p.duration,
    ects: p.ects,
    scholarshipAvailable: p.scholarshipAvailable,
    scholarshipDescription: p.scholarshipDescription,
    applicationDeadline: p.applicationDeadline,
    scholarshipDeadline: p.scholarshipDeadline,
    programmeStart: p.programmeStart,
    academicRequirements: p.academicRequirements,
    experienceRequirements: p.experienceRequirements,
    languageRequirements: p.languageRequirements,
    requiredDocuments: parseJson(p.requiredDocuments),
    selectionProcess: p.selectionProcess,
    applicationMethod: p.applicationMethod,
    sourceUrl: p.sourceUrl,
    sourceTitle: p.sourceTitle,
    deadlineStatus: p.deadlineStatus,
    status: p.status,
    match: m
      ? {
          overallScore: m.overallScore,
          breakdown: JSON.parse(m.breakdown),
          whyFits: parseJson(m.whyFits),
          eligibilityGaps: parseJson(m.eligibilityGaps),
          documentGaps: parseJson(m.documentGaps),
          priorityScore: m.priorityScore,
          eligibilityStatus: m.eligibilityStatus,
          recommendation: m.recommendation,
        }
      : null,
  };
}

function toApplicant(p: any, yearsExperience: number | null): ScholarshipApplicant {
  const cgpa = p.cgpa != null ? Number(p.cgpa) : null;
  const ielts = p.ieltsScore != null ? Number(p.ieltsScore) : null;
  const toefl = p.toeflScore != null ? Number(p.toeflScore) : null;
  return {
    hasBachelorsDegree: p.academicDegrees ? parseJson(p.academicDegrees).length > 0 : null,
    fieldOfStudy: parseJson(p.preferredStudyFields).join(", ") || null,
    cgpa,
    ieltsScore: ielts,
    toeflScore: toefl,
    yearsExperience,
    nationality: p.nationality,
    hasPassport: p.passportStatus ? p.passportStatus.toUpperCase() === "VALID" : null,
    leadershipExperience: p.leadershipExperience,
    internationalExperience: p.internationalExperience,
  };
}

async function getApplicant(req: FastifyRequest): Promise<any> {
  let userId: string | null = null;
  try {
    await req.jwtVerify();
    userId = (req as unknown as { user: { sub: string } }).user.sub;
  } catch {
    userId = null;
  }
  const profile = userId
    ? await prisma.scholarshipProfile.findUnique({ where: { userId } })
    : await prisma.scholarshipProfile.findFirst();
  return profile;
}

export default async function scholarshipRoutes(app: FastifyInstance) {
  app.get("/scholarships", async () => {
    const programmes = await prisma.erasmusProgramme.findMany({
      include: { matches: true },
      orderBy: { createdAt: "desc" },
    });
    return programmes.map(serializeProgramme);
  });

  app.get("/scholarships/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const programme = await prisma.erasmusProgramme.findUnique({
      where: { id },
      include: { matches: true },
    });
    if (!programme) return reply.code(404).send({ error: "PROGRAMME_NOT_FOUND" });
    return serializeProgramme(programme);
  });

  app.post("/scholarships/search", async () => {
    // Phase B: pluggable programme-source search. For now, returns stored programmes.
    const programmes = await prisma.erasmusProgramme.findMany({
      include: { matches: true },
      orderBy: { createdAt: "desc" },
    });
    return programmes.map(serializeProgramme);
  });

  app.post("/scholarships/:id/analyze", async (req, reply) => {
    const { id } = req.params as { id: string };
    const programme = await prisma.erasmusProgramme.findUnique({ where: { id } });
    if (!programme) return reply.code(404).send({ error: "PROGRAMME_NOT_FOUND" });

    const profile = await getApplicant(req);
    if (!profile) return reply.code(400).send({ error: "MISSING_SCHOLARSHIP_PROFILE" });

    const candidate = profile.userId
      ? await prisma.candidateProfile.findUnique({ where: { userId: profile.userId } })
      : null;
    const applicant = toApplicant(profile, candidate?.yearsExperience ?? null);
    let requirements: ProgrammeRequirements = {
      requiresBachelors: null,
      requiredField: programme.field,
      minCgpa: null,
      minIelts: null,
      minToefl: null,
      minYearsExperience: null,
    };
    try {
      if (programme.eligibility) requirements = JSON.parse(programme.eligibility) as ProgrammeRequirements;
    } catch {
      /* keep defaults */
    }

    const eligibility = evaluateEligibility(applicant, requirements);
    const components = scoreScholarshipMatch(applicant, requirements, eligibility);
    const overall = weightedScore(components);
    const priority = calculatePriorityScore({
      match: overall,
      scholarshipAvailable: programme.scholarshipAvailable,
      eligibilityConfidence: eligibility.status === "ELIGIBLE" ? 100 : eligibility.status === "LIKELY_ELIGIBLE" ? 85 : eligibility.status === "UNCERTAIN" ? 60 : 0,
      careerAlignment: components.career,
      deadlineFeasibility: programme.applicationDeadline ? 90 : 50,
    });

    await prisma.scholarshipMatch.upsert({
      where: { programmeId: id },
      update: {
        overallScore: overall,
        breakdown: JSON.stringify(components),
        whyFits: JSON.stringify([]),
        eligibilityGaps: JSON.stringify(eligibility.hardFailures),
        documentGaps: JSON.stringify(programme.requiredDocuments ? parseJson(programme.requiredDocuments) : []),
        priorityScore: priority,
        eligibilityStatus: eligibility.status,
        recommendation: scholarshipRecommendation(overall),
      },
      create: {
        programmeId: id,
        overallScore: overall,
        breakdown: JSON.stringify(components),
        weights: JSON.stringify({ academic: 0.2, career: 0.2, subject: 0.2, experience: 0.15, eligibility: 0.1, language: 0.05, leadership: 0.05, mobility: 0.05 }),
        whyFits: JSON.stringify([]),
        eligibilityGaps: JSON.stringify(eligibility.hardFailures),
        documentGaps: JSON.stringify([]),
        priorityScore: priority,
        eligibilityStatus: eligibility.status,
        recommendation: scholarshipRecommendation(overall),
      },
    });

    return {
      programmeId: id,
      overallScore: overall,
      breakdown: components,
      eligibility,
      priorityScore: priority,
      recommendation: scholarshipRecommendation(overall),
    };
  });

  app.post("/scholarships/:id/apply", async (req, reply) => {
    const { id } = req.params as { id: string };
    const programme = await prisma.erasmusProgramme.findUnique({ where: { id } });
    if (!programme) return reply.code(404).send({ error: "PROGRAMME_NOT_FOUND" });

    const profile = await getApplicant(req);
    const application = await prisma.scholarshipApplication.create({
      data: {
        programmeId: id,
        candidateId: profile?.id ?? null,
        status: "RESEARCHING",
        deadline: programme.applicationDeadline,
        scholarshipDeadline: programme.scholarshipDeadline,
        applicationUrl: programme.applicationUrl,
      },
    });
    return application;
  });

  app.get("/scholarship-applications", async () => {
    const applications = await prisma.scholarshipApplication.findMany({
      orderBy: { createdAt: "desc" },
    });
    const enriched = await Promise.all(
      applications.map(async (a) => {
        const programme = await prisma.erasmusProgramme.findUnique({ where: { id: a.programmeId } });
        return {
          ...a,
          programmeName: programme?.programmeName ?? a.programmeId,
          acronym: programme?.acronym ?? null,
        };
      }),
    );
    return enriched;
  });

  app.post("/scholarships/:id/motivation-letter", async (req, reply) => {
    const { id } = req.params as { id: string };
    const programme = await prisma.erasmusProgramme.findUnique({ where: { id } });
    if (!programme) return reply.code(404).send({ error: "PROGRAMME_NOT_FOUND" });
    const profile = await getApplicant(req);
    if (!profile) return reply.code(400).send({ error: "MISSING_SCHOLARSHIP_PROFILE" });

    const letter = buildMotivationLetter(programme, profile);
    return { draft: true, content: letter };
  });

  app.post("/scholarships/:id/sop", async (req, reply) => {
    const { id } = req.params as { id: string };
    const programme = await prisma.erasmusProgramme.findUnique({ where: { id } });
    if (!programme) return reply.code(404).send({ error: "PROGRAMME_NOT_FOUND" });
    const profile = await getApplicant(req);
    if (!profile) return reply.code(400).send({ error: "MISSING_SCHOLARSHIP_PROFILE" });

    return { draft: true, content: buildSop(programme, profile) };
  });
}

function buildMotivationLetter(programme: any, profile: any): string {
  const name = profile.fullName ?? "[Your name]";
  const ielts = profile.ieltsScore != null ? `IELTS ${profile.ieltsScore}` : "[English test score — USER_INPUT_REQUIRED]";
  return `[DRAFT — review before use]

Dear ${programme.coordinator ?? "Admissions Committee"},

I am writing to express my strong interest in the ${programme.programmeName} (${programme.acronym ?? "EMJM"}) offered by ${programme.coordinator ?? "the consortium"}.

${name}, ${profile.currentTitle ?? ""}. ${profile.leadershipExperience ? "My professional experience includes " + profile.leadershipExperience + "." : ""}

[Insert why this programme — USER_INPUT_REQUIRED]

[Insert relevant achievements — USER_INPUT_REQUIRED]

Language proficiency: ${ielts}.

Thank you for considering my application.

Sincerely,
${name}`;
}

function buildSop(programme: any, profile: any): string {
  const name = profile.fullName ?? "[Your name]";
  return `[DRAFT — review before use]

Statement of Purpose — ${programme.programmeName}

1. Academic background
${profile.academicDegrees ? (parseJson(profile.academicDegrees) as string[]).join(", ") : "[Academic background — USER_INPUT_REQUIRED]"} (${profile.universities ? (parseJson(profile.universities) as string[]).join(", ") : ""})

2. Professional journey
${profile.leadershipExperience ?? "[Professional journey — USER_INPUT_REQUIRED]"}

3. Career motivation
${profile.careerGoals ? (parseJson(profile.careerGoals) as string[]).join(", ") : "[Career goals — USER_INPUT_REQUIRED]"}

4. Why this field
[USER_INPUT_REQUIRED]

5. Why this Erasmus programme
[USER_INPUT_REQUIRED]

6. Why the consortium/universities
[USER_INPUT_REQUIRED]

7. Relevant professional experience
${profile.leadershipExperience ?? "[USER_INPUT_REQUIRED]"}

8. Future career goals
${profile.careerGoals ? (parseJson(profile.careerGoals) as string[]).join(", ") : "[USER_INPUT_REQUIRED]"}

9. Expected impact
[USER_INPUT_REQUIRED]

10. Contribution to the programme
[USER_INPUT_REQUIRED]

${name}`;
}
