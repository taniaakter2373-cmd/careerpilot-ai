import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";
import { getUserId } from "../_lib/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function GET() {
  const cvs = await prisma.cv.findMany({ orderBy: { isDefault: "desc" } });
  return NextResponse.json(cvs.map(serializeCv));
}

export async function POST(req: Request) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { name?: string; targetRole?: string | null; targetCountry?: string | null; skills?: string[]; isDefault?: boolean };
  if (!body.name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  if (body.isDefault) await prisma.cv.updateMany({ where: { userId }, data: { isDefault: false } });
  const cv = await prisma.cv.create({
    data: {
      userId,
      name: body.name,
      targetRole: body.targetRole ?? null,
      targetCountry: body.targetCountry ?? null,
      skills: body.skills ? JSON.stringify(body.skills) : null,
      isDefault: body.isDefault ?? false,
    },
  });
  return NextResponse.json(serializeCv(cv));
}
