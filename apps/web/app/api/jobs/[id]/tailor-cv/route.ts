import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";
import { getAIProvider } from "../../../_lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const parseJson = (s: string | null) => (s ? (JSON.parse(s) as string[]) : []);

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { cvId, cvText } = (await req.json().catch(() => ({}))) as { cvId?: string; cvText?: string };
  const job = await prisma.job.findUnique({ where: { id: params.id } });
  if (!job) return NextResponse.json({ error: "JOB_NOT_FOUND" }, { status: 404 });

  let text = cvText ?? "";
  if (!text && cvId) {
    const cv = await prisma.cv.findUnique({ where: { id: cvId } });
    text = cv?.name ?? "";
  }
  if (!text) text = job.title + " " + parseJson(job.skills).join(" ");

  const provider = getAIProvider();
  const analysis = await provider.analyzeJob(job.description);
  return NextResponse.json(await provider.tailorCV(text, analysis));
}
