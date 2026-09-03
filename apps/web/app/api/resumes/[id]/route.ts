import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";
import { getUserId } from "../../_lib/jwt";

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
  };
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { name?: string; targetRole?: string | null; targetCountry?: string | null; skills?: string[]; isDefault?: boolean };
  const existing = await prisma.cv.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "CV_NOT_FOUND" }, { status: 404 });

  if (body.isDefault) await prisma.cv.updateMany({ where: { userId: existing.userId }, data: { isDefault: false } });
  const cv = await prisma.cv.update({
    where: { id: params.id },
    data: {
      name: body.name,
      targetRole: body.targetRole,
      targetCountry: body.targetCountry,
      skills: body.skills ? JSON.stringify(body.skills) : undefined,
      isDefault: body.isDefault,
    },
  });
  return NextResponse.json(serializeCv(cv));
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const existing = await prisma.cv.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "CV_NOT_FOUND" }, { status: 404 });
  await prisma.cv.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true });
}
