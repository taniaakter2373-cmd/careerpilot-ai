import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const apps = await prisma.umrahApplication.findMany({ orderBy: { createdAt: "desc" } });
  const enriched = await Promise.all(
    apps.map(async (a) => {
      const o = await prisma.umrahOpportunity.findUnique({ where: { id: a.umrahId }, select: { title: true, sponsor: true } });
      return { id: a.id, umrahId: a.umrahId, title: o?.title ?? null, sponsor: o?.sponsor ?? null, status: a.status, applicationDate: a.applicationDate, confirmationNumber: a.confirmationNumber, notes: a.notes };
    }),
  );
  return NextResponse.json(enriched);
}

// Prepare an Umrah application for an opportunity (no auto-submission).
export async function POST(req: Request) {
  const { umrahId } = (await req.json().catch(() => ({}))) as { umrahId?: string };
  if (!umrahId) return NextResponse.json({ error: "umrahId is required" }, { status: 400 });

  const opportunity = await prisma.umrahOpportunity.findUnique({ where: { id: umrahId } });
  if (!opportunity) return NextResponse.json({ error: "OPPORTUNITY_NOT_FOUND" }, { status: 404 });

  const existing = await prisma.umrahApplication.findFirst({ where: { umrahId, status: { in: ["PREPARING", "READY_FOR_REVIEW", "APPROVED"] } } });
  if (existing) return NextResponse.json({ id: existing.id, status: existing.status, reused: true });

  const app = await prisma.umrahApplication.create({
    data: {
      umrahId,
      status: "PREPARING",
      notes: "Application prepared. FINAL SUBMISSION, PAYMENT, PASSPORT SUBMISSION and OTP/MFA/CAPTCHA are MANUAL-ONLY and require USER_APPROVAL — never automated.",
    },
  });
  return NextResponse.json({ id: app.id, status: app.status, reused: false });
}
