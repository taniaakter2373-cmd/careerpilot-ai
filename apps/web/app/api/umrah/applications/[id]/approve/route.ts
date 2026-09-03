import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Approve the prepared Umrah application (still manual-only for final steps).
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const app = await prisma.umrahApplication.findUnique({ where: { id: params.id } });
  if (!app) return NextResponse.json({ error: "UMRAH_APPLICATION_NOT_FOUND" }, { status: 404 });
  if (!["PREPARING", "READY_FOR_REVIEW"].includes(app.status)) {
    return NextResponse.json({ error: "INVALID_STATE", message: `Cannot approve from ${app.status}` }, { status: 409 });
  }
  const updated = await prisma.umrahApplication.update({
    where: { id: params.id },
    data: {
      status: "APPROVED",
      notes: "APPROVED. Final submission on the official sponsor portal is MANUAL-ONLY (payment / passport / OTP / identity verification require the user).",
    },
  });
  return NextResponse.json({ id: updated.id, status: updated.status });
}
