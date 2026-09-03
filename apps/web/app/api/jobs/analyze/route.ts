import { NextResponse } from "next/server";
import { getAIProvider } from "../../_lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { text } = (await req.json().catch(() => ({}))) as { text?: string };
  if (!text) return NextResponse.json({ analysis: null });
  const provider = getAIProvider();
  return NextResponse.json({ provider: provider.name, analysis: await provider.analyzeJob(text) });
}
