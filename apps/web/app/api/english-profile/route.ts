import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const parse = (s: string | null) => (s ? JSON.parse(s) : []);

export async function GET() {
  const cand = await prisma.candidateProfile.findFirst({ select: { id: true } });
  if (!cand) return NextResponse.json({ error: "MISSING_CANDIDATE" }, { status: 400 });

  const p = await prisma.englishProfile.findUnique({ where: { candidateId: cand.id } });
  if (!p) {
    // Return defaults with status NOT_AVAILABLE — never treated as ineligible.
    return NextResponse.json({
      ieltsStatus: "NOT_AVAILABLE",
      ieltsOverallBand: null,
      listeningBand: null,
      readingBand: null,
      writingBand: null,
      speakingBand: null,
      ieltsTestDate: null,
      ieltsValidity: null,
      ieltsModule: null,
      otherEnglishTest: "NONE",
      toeflScore: null,
      pteScore: null,
      duolingoScore: null,
      englishProficiency: "UNKNOWN",
      note: "IELTS Status = Not Available. This does NOT make you ineligible for European jobs.",
    });
  }
  return NextResponse.json({
    ieltsStatus: p.ieltsStatus,
    ieltsOverallBand: p.ieltsOverallBand,
    listeningBand: p.listeningBand,
    readingBand: p.readingBand,
    writingBand: p.writingBand,
    speakingBand: p.speakingBand,
    ieltsTestDate: p.ieltsTestDate,
    ieltsValidity: p.ieltsValidity,
    ieltsModule: p.ieltsModule,
    otherEnglishTest: p.otherEnglishTest,
    toeflScore: p.toeflScore,
    pteScore: p.pteScore,
    duolingoScore: p.duolingoScore,
    englishProficiency: p.englishProficiency,
  });
}

export async function PUT(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const cand = await prisma.candidateProfile.findFirst({ select: { id: true } });
  if (!cand) return NextResponse.json({ error: "MISSING_CANDIDATE" }, { status: 400 });

  const num = (v: unknown) => (typeof v === "number" ? v : v != null ? Number(v) : null);
  const cleanNum = (v: unknown): number | null => {
    const n = num(v);
    return n != null && Number.isNaN(n) ? null : n;
  };

  const data = {
    ieltsStatus: (body.ieltsStatus as string) ?? "NOT_AVAILABLE",
    ieltsOverallBand: cleanNum(body.ieltsOverallBand),
    listeningBand: cleanNum(body.listeningBand),
    readingBand: cleanNum(body.readingBand),
    writingBand: cleanNum(body.writingBand),
    speakingBand: cleanNum(body.speakingBand),
    ieltsTestDate: body.ieltsTestDate ? new Date(body.ieltsTestDate as string) : null,
    ieltsValidity: body.ieltsValidity ? new Date(body.ieltsValidity as string) : null,
    ieltsModule: (body.ieltsModule as string) ?? null,
    otherEnglishTest: (body.otherEnglishTest as string) ?? "NONE",
    toeflScore: cleanNum(body.toeflScore),
    pteScore: cleanNum(body.pteScore),
    duolingoScore: cleanNum(body.duolingoScore),
    englishProficiency: (body.englishProficiency as string) ?? "UNKNOWN",
  };

  const upsert = await prisma.englishProfile.upsert({ where: { candidateId: cand.id }, update: data, create: { candidateId: cand.id, ...data } });
  return NextResponse.json({ ok: true, id: upsert.id });
}
