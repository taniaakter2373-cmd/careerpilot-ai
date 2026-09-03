import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const app = await prisma.scholarshipApplication.findUnique({ where: { id: params.id } });
  if (!app) return NextResponse.json({ error: "SCHOLARSHIP_APPLICATION_NOT_FOUND" }, { status: 404 });

  const from = app.status;
  const allowedFrom = ["RESEARCHING", "ELIGIBILITY_CHECK", "PREPARING", "READY_FOR_REVIEW"];
  if (!allowedFrom.includes(from)) {
    return NextResponse.json({ error: "INVALID_STATE", message: `Cannot approve from ${from}` }, { status: 409 });
  }

  const updated = await prisma.scholarshipApplication.update({
    where: { id: params.id },
    data: { status: "APPROVED", nextAction: "Final review of documents, then submit on the official portal" },
  });
  return NextResponse.json({ id: updated.id, status: updated.status });
}
