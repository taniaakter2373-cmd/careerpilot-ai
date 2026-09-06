export const dynamic = "force-dynamic";

import Link from "next/link";
import { apiGet } from "@/lib/api";
import { MatchBadge } from "@/components/badges";
import { RefreshButton } from "@/components/refresh-button";
import { TakeAllActionsButton } from "@/components/take-all-actions";

interface DashboardData {
  jobsToday: number;
  strongMatches: number;
  pendingApproval: number;
  applied: number;
  interviews: number;
  offers: number;
  topMatches: Array<{ id: string; title: string; company: string; location: string | null; overallScore: number; recommendation: string }>;
}

interface Sch {
  id: string;
  programmeName: string;
  acronym: string | null;
  overallScore?: number;
  match?: { overallScore: number; eligibilityStatus: string } | null;
}

interface FamilyAssessment {
  programmeName: string | null;
  acronym: string | null;
  country: string | null;
  overallScore: number;
  recommendation: string;
  freePathway: boolean;
}

interface DeadlineRow {
  id: string;
  title?: string;
  name?: string;
  deadline: string | null;
  daysRemaining: number | null;
  type: string;
}

interface Deadlines {
  jobs: DeadlineRow[];
  scholarships: DeadlineRow[];
}

interface UmrahRow {
  id: string;
  title: string;
  sponsor: string | null;
  isFullyFree: boolean;
  verified: boolean;
  classification: string;
  childCovered: boolean;
}

interface Cert {
  id: string;
  name: string;
  costClass: string;
  matchScore: number;
}

interface RecruiterContact {
  id: string;
  actionRequired: boolean;
  company: string | null;
  jobTitle: string | null;
  detectedStage: string;
}

interface EuropeOverview {
  totalJobs: number;
  applyNowJobs: number;
  applyWithoutIelts: number;
  countryCards: Array<{ country: string }>;
  englishProfile: { ieltsStatus: string; ieltsOverallBand: number | null; hasEnglishCertificate?: boolean } | null;
}

interface AwardsList {
  id: string;
  name: string;
  awardPriority: string;
  profileFitScore: number;
}

const dayColor = (d: number | null) => (d != null && d <= 7 ? "bg-red-100 text-red-700" : d != null && d <= 30 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700");

function PathCard({
  emoji,
  title,
  count,
  label,
  href,
  accent,
}: {
  emoji: string;
  title: string;
  count: number;
  label: string;
  href: string;
  accent: string;
}) {
  return (
    <Link href={href} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
      <div className="flex items-start justify-between">
        <div>
          <div className="text-3xl">{emoji}</div>
          <div className="mt-2 text-sm font-medium text-slate-500">{title}</div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-slate-900">{count}</div>
          <div className="text-xs text-slate-400">{label}</div>
        </div>
      </div>
      <div className="mt-3 text-sm font-medium text-brand-600 opacity-0 transition group-hover:opacity-100">Open →</div>
    </Link>
  );
}

function AgentPill({ label, state }: { label: string; state: "live" | "ready" }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
      <span className={`h-2 w-2 rounded-full ${state === "live" ? "bg-emerald-500" : "bg-amber-400"}`} />
      {label}
    </div>
  );
}

const toneMap: Record<string, { icon: string; text: string; btn: string }> = {
  emerald: { icon: "bg-emerald-50 text-emerald-600", text: "", btn: "bg-emerald-600 hover:bg-emerald-700" },
  brand: { icon: "bg-brand-50 text-brand-600", text: "", btn: "bg-brand-600 hover:bg-brand-700" },
  slate: { icon: "bg-slate-100 text-slate-500", text: "", btn: "bg-slate-700 hover:bg-slate-800" },
  violet: { icon: "bg-violet-50 text-violet-600", text: "", btn: "bg-violet-600 hover:bg-violet-700" },
  blue: { icon: "bg-blue-50 text-blue-600", text: "", btn: "bg-blue-600 hover:bg-blue-700" },
  amber: { icon: "bg-amber-50 text-amber-600", text: "", btn: "bg-amber-600 hover:bg-amber-700" },
};

function MiniCard({
  emoji,
  title,
  count,
  label,
  href,
  tone,
}: {
  emoji: string;
  title: string;
  count: number;
  label: string;
  href: string;
  tone: keyof typeof toneMap;
}) {
  const t = toneMap[tone] ?? toneMap.slate;
  return (
    <Link href={href} className="group card flex items-center gap-4 p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl ${t.icon}`}>{emoji}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-slate-800">{title}</div>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <span className="text-xl font-bold tracking-tight text-slate-900">{count}</span>
          <span className="truncate text-xs text-slate-400">{label}</span>
        </div>
      </div>
      <span className="text-brand-500 opacity-0 transition group-hover:opacity-100">→</span>
    </Link>
  );
}

export default async function DashboardPage() {
  const [data, schs, family, deadlines, umrah, certs, recruiter, europe, awards] = await Promise.all([
    apiGet<DashboardData>("/api/dashboard"),
    apiGet<Sch[]>("/api/scholarships"),
    apiGet<FamilyAssessment[]>("/api/family/assessments"),
    apiGet<Deadlines>("/api/deadlines"),
    apiGet<UmrahRow[]>("/api/umrah"),
    apiGet<Cert[]>("/api/certifications"),
    apiGet<{ contacts: RecruiterContact[] }>("/api/recruiter-contacts").then((d) => d.contacts ?? []),
    apiGet<EuropeOverview>("/api/europe").catch(() => ({ totalJobs: 0, applyNowJobs: 0, applyWithoutIelts: 0, countryCards: [], englishProfile: null })),
    apiGet<AwardsList[]>("/api/awards").catch(() => []),
  ]);

  const eligibleScholarships = schs.filter((s) => s.match && ["ELIGIBLE", "LIKELY_ELIGIBLE"].includes(s.match.eligibilityStatus)).length;
  const freePathways = family.filter((f) => f.freePathway).length;
  const topFamily = family.filter((f) => f.freePathway).slice(0, 3);
  const strongAwards = awards.filter((a) => ["APPLY_NOW", "HIGH_PRIORITY"].includes(a.awardPriority)).length;

  const upcoming = [...deadlines.jobs, ...deadlines.scholarships].filter((d) => d.daysRemaining != null && d.daysRemaining >= 0).sort((a, b) => (a.daysRemaining ?? 0) - (b.daysRemaining ?? 0)).slice(0, 5);

  return (
    <div className="page">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-violet-600 p-7 text-white shadow-lg shadow-brand-600/20 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 right-32 h-48 w-48 rounded-full bg-violet-300/20 blur-2xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Good day, Tania ✨</h1>
            <p className="mt-1.5 max-w-xl text-sm text-brand-100">
              Your command center for European jobs, awards, study and family relocation — with live visa & IELTS intelligence.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Job Agent
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Europe Agent
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Award Agent
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/jobs" className="btn-primary !bg-white/15 !text-white backdrop-blur hover:!bg-white/25">Run Job Search</Link>
            <Link href="/europe/jobs" className="btn-primary !bg-white/15 !text-white backdrop-blur hover:!bg-white/25">Scan Europe</Link>
          </div>
        </div>
      </div>

      {/* Big path cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <PathCard emoji="💼" title="Job Search" count={data.strongMatches} label="strong matches" href="/jobs" accent="bg-gradient-to-r from-sky-500 to-indigo-500" />
        <PathCard emoji="🎓" title="Scholarships" count={eligibleScholarships} label="you're eligible for" href="/scholarships" accent="bg-gradient-to-r from-emerald-500 to-teal-500" />
        <PathCard emoji="👨‍👩‍👦" title="Study + Family" count={freePathways} label="free pathways" href="/family" accent="bg-gradient-to-r from-amber-500 to-orange-500" />
        <PathCard emoji="🇪🇺" title="Europe Jobs" count={europe.totalJobs} label="opportunities" href="/europe/jobs" accent="bg-gradient-to-r from-blue-500 to-indigo-500" />
      </div>

      {/* Secondary module row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MiniCard emoji="🕋" title="Fully-Funded Umrah" count={umrah.filter((u) => u.verified && u.isFullyFree).length} label="verified fully-free" href="/umrah" tone="emerald" />
        <MiniCard emoji="🎓" title="Certifications" count={certs.filter((c) => ["FREE", "FULL_SCHOLARSHIP", "LOW_COST"].includes(c.costClass)).length} label="free / funded / low-cost" href="/certifications" tone="brand" />
        <MiniCard emoji="📧" title="Recruiter Contacts" count={recruiter.filter((r) => r.actionRequired).length} label="action required" href="/recruiter" tone="slate" />
        <MiniCard emoji="🏆" title="Global Awards" count={strongAwards} label="apply / high-priority" href="/awards" tone="violet" />
        <MiniCard emoji="🗺️" title="Europe Visa & Countries" count={europe.countryCards?.length ?? 0} label="target countries" href="/europe/countries" tone="blue" />
        <MiniCard emoji="✅" title="Apply without IELTS" count={europe.applyWithoutIelts} label="EU jobs · no English test needed" href="/europe/jobs?ielts=not_required" tone="emerald" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Pipeline snapshot</h2>
          <p className="text-sm text-slate-500">Live counts across your active tracks</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <TakeAllActionsButton />
          <RefreshButton />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
        {[
          ["Jobs today", data.jobsToday],
          ["Pending approval", data.pendingApproval],
          ["Applied", data.applied],
          ["Interviews", data.interviews],
          ["Offers", data.offers],
          ["Scholarships", schs.length],
        ].map(([l, v]) => (
          <div key={String(l)} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft">
            <div className="text-xs font-medium text-slate-500">{l}</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{v}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Top Job Matches</h2>
            <Link href="/jobs" className="text-sm font-medium text-brand-600 hover:text-brand-700">View all →</Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-slate-100">
                {data.topMatches.slice(0, 6).map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{j.title}</div>
                      <div className="text-xs text-slate-500">{j.company} · {j.location ?? "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <MatchBadge score={j.overallScore} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Free Family Pathways</h2>
            <Link href="/family/decision" className="text-sm font-medium text-brand-600 hover:text-brand-700">Report →</Link>
          </div>
          <div className="space-y-3">
            {topFamily.length === 0 ? (
              <p className="text-sm text-slate-500">No free pathways yet.</p>
            ) : (
              topFamily.map((f, i) => (
                <div key={i} className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{f.country}</span>
                    <span className="text-sm font-semibold text-emerald-700">{f.overallScore}%</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {f.acronym ?? f.programmeName}
                    <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">FREE</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Upcoming Deadlines</h2>
              <Link href="/deadlines" className="text-sm font-medium text-brand-600 hover:text-brand-700">All →</Link>
            </div>
            <div className="space-y-2">
              {upcoming.map((d, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                  <span className="truncate text-slate-700">{d.title ?? d.name}</span>
                  <span className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${dayColor(d.daysRemaining)}`}>
                    {d.daysRemaining != null ? `${d.daysRemaining}d` : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
