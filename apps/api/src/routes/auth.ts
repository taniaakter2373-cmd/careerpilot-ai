import type { FastifyInstance } from "fastify";
import { prisma } from "@careerpilot/database";
import bcrypt from "bcryptjs";

interface LoginBody {
  email?: string;
  password?: string;
}

export default async function authRoutes(app: FastifyInstance) {
  app.post("/login", async (req, reply) => {
    const { email, password } = (req.body ?? {}) as LoginBody;
    if (!email || !password) {
      return reply.code(400).send({ error: "email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return reply.code(401).send({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return reply.code(401).send({ error: "Invalid credentials" });

    const token = app.jwt.sign({ sub: user.id, email: user.email, role: user.role });
    return {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  });
}
