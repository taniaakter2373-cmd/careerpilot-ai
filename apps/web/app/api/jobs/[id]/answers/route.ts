import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";
import { getAIProvider } from "../../../_lib/ai";
import { loadCandidateProfile } from "../../../_lib/candidate";
import { getUserId } from "../../../_lib/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STANDARD_QUESTIONS = [
  "What is your full name?",
  "What is your email address?",
  "How many years of experience do you have?",
  "What is your current designation?",
  "What is your highest level of education?",
  "What is your notice period?",
  "What is your expected salary?",
];

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const job = await prisma.job.findUnique({ where: { id: params.id } });
  if (!job) return NextResponse.json({ error: "JOB_NOT_FOUND" }, { status: 404 });

  const userId = await getUserId(req);
  const profile = await loadCandidateProfile(userId ?? undefined);
  if (!profile) return NextResponse.json({ error: "MISSING_CANDIDATE_DATA" }, { status: 400 });

  const provider = getAIProvider();
  const answers = [];
  for (const q of STANDARD_QUESTIONS) {
    const a = await provider.answerApplicationQuestion(q, profile);
    answers.push({ question: q, answer: a.answer, status: a.status });
  }
  return NextResponse.json(answers);
}
