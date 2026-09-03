import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const app = await prisma.certificationApplication.findUnique({ where: { id: params.id } });
  if (!app) return NextResponse.json({ error: "CERT_APPLICATION_NOT_FOUND" }, { status: 404 });
  if (app.status !== "APPROVED") {
    return NextResponse.json({ error: "APPROVAL_REQUIRED", message: "Application must be approved before enrolment" }, { status: 409 });
  }
  const confirmation = `CERT-${Date.now().toString(36).toUpperCase()}`;
  const updated = await prisma.certificationApplication.update({
    where: { id: params.id },
    data: { status: "SUBMITTED", applicationDate: new Date(), confirmationNumber: confirmation },
  });
  return NextResponse.json({ id: updated.id, status: updated.status, confirmationNumber: confirmation });
}
