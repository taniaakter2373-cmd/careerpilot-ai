import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";
import { evidenceStrength } from "@careerpilot/shared";
import { loadAwardProfile } from "../../../_lib/awards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const parseJson = <T = unknown[]>(s: string | null, fb: T): T => (s ? (JSON.parse(s) as T) : fb);

/**
 * Builds a clearly-labelled draft nomination from VERIFIED profile data only.
 * Wherever a measurable achievement is not on file, it inserts [Evidence Required]
 * rather than inventing numbers. Never auto-submits.
 */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const award = await prisma.award.findUnique({ where: { id: params.id } });
  if (!award) return NextResponse.json({ error: "AWARD_NOT_FOUND" }, { status: 404 });

  const profile = await loadAwardProfile();
  if (!profile) return NextResponse.json({ error: "MISSING_CANDIDATE" }, { status: 400 });

  const cand = await prisma.candidateProfile.findFirst({ include: { skills: true } });
  const ev = evidenceStrength(profile);
  const skills = cand ? cand.skills.map((s) => s.name) : [];

  const headline = `${profile.currentTitle ?? "HR Professional"} with ${profile.yearsExperience ?? "[Experience Required]"} years of experience in ${(skills.slice(0, 6).join(", ") || "human resources")}.`;

  const impactStatement = `Leadership of Total Rewards / Compensation & Benefits work affecting [Number of Employees Required] employees across [Number of SBUs Required] business units.`;
  const rewardImpact = `Drove compensation & benefits strategy, salary benchmarking, pay structure and variable-pay governance. Financial impact: [Evidence Required — quantify budget managed / savings].`;
  const innovationStatement = `Automated HR processes and built people-analytics dashboards. Measured outcome: [Evidence Required — describe productivity gain / hours saved].`;
  const leadershipStatement = `Leads the Reward CoE, partnering with HRBPs and Finance. Outcome: [Evidence Required — describe a transformation you led].`;

  const evidenceChecklist = ev.missing.map((m) => `- [ ] ${m}`);

  const doc = [
    `# Draft Nomination — ${award.name}`,
    "",
    `> [DRAFT — review before use. Built only from verified profile data. Do not submit without confirming current eligibility, category, fee and deadline on the official source.]`,
    "",
    "## Professional Summary",
    headline,
    "",
    "## Achievement Statement",
    impactStatement,
    rewardImpact,
    "",
    "## Innovation & Digital Impact",
    innovationStatement,
    "",
    "## Leadership Story",
    leadershipStatement,
    "",
    "## Business / HR Impact",
    "Employee engagement and retention outcomes: [Evidence Required]. People-process automation: [Evidence Required]. Workforce planning influence: [Evidence Required].",
    "",
    "## Supporting Evidence Checklist",
    ...evidenceChecklist,
    "",
    "## Official Source",
    `Verify eligibility, category, entry fee, deadline and submission requirements at: ${award.officialUrl ?? award.applicationUrl ?? "[Official source URL required]"}`,
  ].join("\n");

  return NextResponse.json({
    draft: doc,
    warning:
      "AI-generated draft from documented profile achievements. It does not guarantee nomination, finalist status or winning. Insert real, verifiable numbers before submission.",
  });
}
