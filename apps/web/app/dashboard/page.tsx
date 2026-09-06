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

export default async function DashboardPage() {
  const [data, schs, family, deadlines, umrah, certs, recruiter, europe, awards] = await Promise.all([
    apiGet<DashboardData>("/api/dashboard"),
    apiGet<Sch[]>("/api/scholarships"),
    apiGet<FamilyAssessment[]>("/api/family/assessments"),
    apiGet<Deadlines>("/api/deadlines"),
    apiGet<UmrahRow[]>("/api/umrah"),
    apiGet<Cert[]>("/api/certifications"),
    apiGet<{ contacts: RecruiterContact[] }>("/api/recruiter-contacts").then((d) => d.contacts ?? []),
    apiGet<EuropeOverview>("/api/europe").catch(() => ({ totalJobs: 0, applyNowJobs: 0 })),
    apiGet<AwardsList[]>("/api/awards").catch(() => []),
  ]);

  const eligibleScholarships = schs.filter((s) => s.match && ["ELIGIBLE", "LIKELY_ELIGIBLE"].includes(s.match.eligibilityStatus)).length;
  const freePathways = family.filter((f) => f.freePathway).length;
  const topFamily = family.filter((f) => f.freePathway).slice(0, 3);
  const strongAwards = awards.filter((a) => ["APPLY_NOW", "HIGH_PRIORITY"].includes(a.awardPriority)).length;

  const upcoming = [...deadlines.jobs, ...deadlines.scholarships].filter((d) => d.daysRemaining != null && d.daysRemaining >= 0).sort((a, b) => (a.daysRemaining ?? 0) - (b.daysRemaining ?? 0)).slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Good day, Tania</h1>
          <p className="mt-1 text-sm text-slate-500">Your career, study and family-relocation command center</p>
        </div>
        <div className="hidden flex-wrap justify-end gap-2 md:flex">
          <AgentPill label="💼 Job Agent" state="live" />
          <AgentPill label="🎓 Scholarship Agent" state="live" />
          <AgentPill label="👨‍👩‍👦 Family Agent" state="live" />
          <AgentPill label="📅 Deadline Agent" state="live" />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <TakeAllActionsButton />
        <RefreshButton />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <PathCard emoji="💼" title="Jobs" count={data.strongMatches} label="strong matches" href="/jobs" accent="bg-gradient-to-r from-blue-500 to-indigo-500" />
        <PathCard emoji="🎓" title="Scholarships" count={eligibleScholarships} label="you're eligible for" href="/scholarships" accent="bg-gradient-to-r from-emerald-500 to-teal-500" />
        <PathCard emoji="👨‍👩‍👦" title="Study + Family" count={freePathways} label="free pathways" href="/family" accent="bg-gradient-to-r from-amber-500 to-orange-500" />
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl">🕋</div>
            <div className="mt-1 text-sm font-medium text-slate-500">Fully-Funded Umrah</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-slate-900">{umrah.filter((u) => u.verified && u.isFullyFree).length}</div>
            <div className="text-xs text-slate-400">verified fully-free (BDT 0)</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Link href="/umrah" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
            View Umrah Opportunities
          </Link>
          <span className="text-xs text-slate-500">
            Strict zero-cost rule — only verified all-expenses-covered opportunities count as free.
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl">🎓</div>
              <div className="mt-1 text-sm font-medium text-slate-500">Certifications</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-slate-900">{certs.filter((c) => ["FREE", "FULL_SCHOLARSHIP", "LOW_COST"].includes(c.costClass)).length}</div>
              <div className="text-xs text-slate-400">free / funded / low-cost</div>
            </div>
          </div>
          <div className="mt-3">
            <Link href="/certifications" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              Certification Finder
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl">📧</div>
              <div className="mt-1 text-sm font-medium text-slate-500">Recruiter Contacts</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-slate-900">{recruiter.filter((r) => r.actionRequired).length}</div>
              <div className="text-xs text-slate-400">action required</div>
            </div>
          </div>
          <div className="mt-3">
            <Link href="/recruiter" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              Recruiter Tracker
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl">🇪🇺</div>
              <div className="mt-1 text-sm font-medium text-slate-500">Europe Jobs</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-slate-900">{europe.totalJobs}</div>
              <div className="text-xs text-slate-400">{europe.applyNowJobs} apply now</div>
            </div>
          </div>
          <div className="mt-3">
            <Link href="/europe/jobs" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Europe Opportunity Finder
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-violet-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl">🏆</div>
              <div className="mt-1 text-sm font-medium text-slate-500">Global Awards</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-slate-900">{strongAwards}</div>
              <div className="text-xs text-slate-400">apply / high-priority</div>
            </div>
          </div>
          <div className="mt-3">
            <Link href="/awards" className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700">
              Global Award Finder
            </Link>
          </div>
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
          <div key={String(l)} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-medium text-slate-500">{l}</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">{v}</div>
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
