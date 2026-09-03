import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";
import { getAIProvider } from "../../../_lib/ai";
import { loadCandidateProfile } from "../../../_lib/candidate";
import { getUserId } from "../../../_lib/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const parseJson = (s: string | null) => (s ? (JSON.parse(s) as string[]) : []);

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { cvId } = (await req.json().catch(() => ({}))) as { cvId?: string };
  const job = await prisma.job.findUnique({ where: { id: params.id } });
  if (!job) return NextResponse.json({ error: "JOB_NOT_FOUND" }, { status: 404 });

  const userId = await getUserId(req);
  const profile = await loadCandidateProfile(userId ?? undefined);
  if (!profile) return NextResponse.json({ error: "MISSING_CANDIDATE_DATA" }, { status: 400 });

  const provider = getAIProvider();
  const content = await provider.generateCoverLetter({
    candidate: { name: profile.name, currentTitle: profile.currentTitle, yearsExperience: profile.yearsExperience, summary: profile.summary, skills: profile.skills },
    job: { title: job.title, company: job.company, description: job.description, skills: parseJson(job.skills) },
  });

  const saved = await prisma.coverLetter.create({ data: { jobId: params.id, cvId: cvId ?? null, content } });
  return NextResponse.json({ id: saved.id, draft: true, content });
}
