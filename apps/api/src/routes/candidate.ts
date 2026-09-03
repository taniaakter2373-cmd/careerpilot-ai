import type { FastifyInstance, FastifyRequest } from "fastify";
import { prisma } from "@careerpilot/database";

const parseJson = (s: string | null) => (s ? (JSON.parse(s) as string[]) : []);

function serializeProfile(p: any) {
  const skills = p.skills?.map((s: any) => s.name) ?? [];
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
    summary: p.summary,
    noticePeriod: p.noticePeriod,
    linkedinUrl: p.linkedinUrl,
    portfolioUrl: p.portfolioUrl,
    salaryMin: p.salaryMin,
    salaryCurrency: p.salaryCurrency,
    remotePreference: p.remotePreference,
    employmentPreference: p.employmentPreference,
    certifications: parseJson(p.certifications),
    targetRoles: parseJson(p.targetRoles),
    preferredLocations: parseJson(p.preferredLocations),
    careerGoals: parseJson(p.careerGoals),
    skills,
  };
}

interface ProfileBody {
  name?: string;
  email?: string;
  phone?: string | null;
  location?: string | null;
  country?: string | null;
  currentTitle?: string | null;
  yearsExperience?: number | null;
  education?: string | null;
  summary?: string | null;
  noticePeriod?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  salaryMin?: number | null;
  salaryCurrency?: string | null;
  remotePreference?: string | null;
  employmentPreference?: string | null;
  certifications?: string[];
  targetRoles?: string[];
  preferredLocations?: string[];
  careerGoals?: string[];
  skills?: string[];
}

export default async function candidateRoutes(app: FastifyInstance) {
  app.get("/candidate", { preHandler: [app.authenticate] }, async (req) => {
    const userId = (req as unknown as { user: { sub: string } }).user.sub;
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId },
      include: { skills: true },
    });
    if (!profile) return null;
    return serializeProfile(profile);
  });

  app.put("/candidate", { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = (req as unknown as { user: { sub: string } }).user.sub;
    const body = (req.body ?? {}) as ProfileBody;

    const profile = await prisma.candidateProfile.findUnique({ where: { userId } });
    if (!profile) return reply.code(404).send({ error: "Profile not found" });

    const updated = await prisma.candidateProfile.update({
      where: { userId },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        location: body.location,
        country: body.country,
        currentTitle: body.currentTitle,
        yearsExperience: body.yearsExperience,
        education: body.education,
        summary: body.summary,
        noticePeriod: body.noticePeriod,
        linkedinUrl: body.linkedinUrl,
        portfolioUrl: body.portfolioUrl,
        salaryMin: body.salaryMin,
        salaryCurrency: body.salaryCurrency,
        remotePreference: body.remotePreference,
        employmentPreference: body.employmentPreference,
        certifications: body.certifications ? JSON.stringify(body.certifications) : undefined,
        targetRoles: body.targetRoles ? JSON.stringify(body.targetRoles) : undefined,
        preferredLocations: body.preferredLocations ? JSON.stringify(body.preferredLocations) : undefined,
        careerGoals: body.careerGoals ? JSON.stringify(body.careerGoals) : undefined,
      },
      include: { skills: true },
    });

    if (body.skills) {
      await prisma.candidateSkill.deleteMany({ where: { profileId: profile.id } });
      await prisma.candidateSkill.createMany({
        data: body.skills.map((name) => ({ profileId: profile.id, name })),
      });
    }

    return serializeProfile({ ...updated, skills: body.skills ? body.skills.map((n) => ({ name: n })) : updated.skills });
  });
}
