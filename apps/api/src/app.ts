import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import fjwt from "@fastify/jwt";
import { env } from "./config.js";
import healthRoutes from "./routes/health.js";
import authRoutes from "./routes/auth.js";
import candidateRoutes from "./routes/candidate.js";
import jobRoutes from "./routes/jobs.js";
import dashboardRoutes from "./routes/dashboard.js";
import scholarshipRoutes from "./routes/scholarships.js";
import searchRoutes from "./routes/search.js";
import cvRoutes from "./routes/cvs.js";
import preparationRoutes from "./routes/preparation.js";
import applicationRoutes from "./routes/applications.js";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: env.corsOrigins, credentials: true });
  await app.register(fjwt, { secret: env.jwtSecret });

  app.decorate("authenticate", async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify();
    } catch {
      return reply.code(401).send({ error: "Unauthorized" });
    }
  });

  await app.register(healthRoutes, { prefix: "/api" });
  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(candidateRoutes, { prefix: "/api" });
  await app.register(jobRoutes, { prefix: "/api" });
  await app.register(dashboardRoutes, { prefix: "/api" });
  await app.register(scholarshipRoutes, { prefix: "/api" });
  await app.register(searchRoutes, { prefix: "/api" });
  await app.register(cvRoutes, { prefix: "/api" });
  await app.register(preparationRoutes, { prefix: "/api" });
  await app.register(applicationRoutes, { prefix: "/api" });

  return app;
}
