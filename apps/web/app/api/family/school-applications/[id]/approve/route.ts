import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const app = await prisma.schoolApplication.findUnique({ where: { id: params.id } });
  if (!app) return NextResponse.json({ error: "SCHOOL_APPLICATION_NOT_FOUND" }, { status: 404 });
  if (!["RESEARCHING", "PREPARING", "READY_FOR_REVIEW"].includes(app.status)) {
    return NextResponse.json({ error: "INVALID_STATE", message: `Cannot approve from ${app.status}` }, { status: 409 });
  }
  const updated = await prisma.schoolApplication.update({
    where: { id: params.id },
    data: { status: "APPROVED", notes: "Documents ready — proceed to submit on school portal" },
  });
  return NextResponse.json({ id: updated.id, status: updated.status });
}
