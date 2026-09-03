import type { FastifyInstance, FastifyRequest } from "fastify";
import { prisma } from "@careerpilot/database";

const parseJson = (s: string | null) => (s ? (JSON.parse(s) as string[]) : []);

function serializeCv(c: any) {
  return {
    id: c.id,
    name: c.name,
    filePath: c.filePath,
    version: c.version,
    targetRole: c.targetRole,
    targetCountry: c.targetCountry,
    skills: parseJson(c.skills),
    isDefault: c.isDefault,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

function userIdOf(req: FastifyRequest): string {
  return (req as unknown as { user: { sub: string } }).user.sub;
}

interface CvBody {
  name?: string;
  targetRole?: string | null;
  targetCountry?: string | null;
  skills?: string[];
  isDefault?: boolean;
}

export default async function cvRoutes(app: FastifyInstance) {
  app.get("/cvs", async () => {
    const cvs = await prisma.cv.findMany({ orderBy: { isDefault: "desc" } });
    return cvs.map(serializeCv);
  });

  app.post("/cvs", { preHandler: [app.authenticate] }, async (req, reply) => {
    const body = (req.body ?? {}) as CvBody;
    if (!body.name) return reply.code(400).send({ error: "name is required" });

    if (body.isDefault) {
      await prisma.cv.updateMany({ where: { userId: userIdOf(req) }, data: { isDefault: false } });
    }
    const cv = await prisma.cv.create({
      data: {
        userId: userIdOf(req),
        name: body.name,
        targetRole: body.targetRole ?? null,
        targetCountry: body.targetCountry ?? null,
        skills: body.skills ? JSON.stringify(body.skills) : null,
        isDefault: body.isDefault ?? false,
      },
    });
    return serializeCv(cv);
  });

  app.put("/cvs/:id", { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = (req.body ?? {}) as CvBody;
    const existing = await prisma.cv.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "CV_NOT_FOUND" });

    if (body.isDefault) {
      await prisma.cv.updateMany({ where: { userId: existing.userId }, data: { isDefault: false } });
    }
    const cv = await prisma.cv.update({
      where: { id },
      data: {
        name: body.name,
        targetRole: body.targetRole,
        targetCountry: body.targetCountry,
        skills: body.skills ? JSON.stringify(body.skills) : undefined,
        isDefault: body.isDefault,
      },
    });
    return serializeCv(cv);
  });

  app.delete("/cvs/:id", { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.cv.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "CV_NOT_FOUND" });
    await prisma.cv.delete({ where: { id } });
    return { deleted: true };
  });
}
