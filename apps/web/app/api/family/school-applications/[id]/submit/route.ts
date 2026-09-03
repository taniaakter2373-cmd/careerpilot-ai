import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const app = await prisma.schoolApplication.findUnique({ where: { id: params.id } });
  if (!app) return NextResponse.json({ error: "SCHOOL_APPLICATION_NOT_FOUND" }, { status: 404 });
  if (app.status !== "APPROVED") {
    return NextResponse.json({ error: "APPROVAL_REQUIRED", message: "Application must be approved before submission" }, { status: 409 });
  }
  const confirmation = `SCHOOL-${Date.now().toString(36).toUpperCase()}`;
  const updated = await prisma.schoolApplication.update({
    where: { id: params.id },
    data: { status: "SUBMITTED", applicationDate: new Date(), confirmationNumber: confirmation },
  });
  return NextResponse.json({ id: updated.id, status: updated.status, confirmationNumber: confirmation });
}
