export const dynamic = "force-dynamic";

import Link from "next/link";
import { apiGet } from "@/lib/api";
import { AwardTrackButton } from "@/components/award-track-button";
import { ReanalyzeAwardsButton } from "@/components/award-reanalyze-button";

interface Award {
  id: string;
  name: string;
  organization: string | null;
  region: string | null;
  country: string | null;
  category: string | null;
  eligibilityScore: number;
  profileFitScore: number;
  evidenceStrength: number;
  competitive: string;
  competitiveLabel: string;
  awardPriority: string;
  awardPriorityLabel: string;
  deadline: string | null;
  deadlineStatus: string;
  entryFeeUsd: number | null;
  officialUrl: string | null;
}

function scorePill(n: number): string {
  if (n >= 85) return "bg-emerald-100 text-emerald-700";
  if (n >= 70) return "bg-teal-100 text-teal-700";
  if (n >= 55) return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

export default async function AwardsPage({ searchParams }: { searchParams: { region?: string; priority?: string } }) {
  const params = new URLSearchParams();
  if (searchParams.region) params.set("region", searchParams.region);
  if (searchParams.priority) params.set("priority", searchParams.priority);
  const awards = await apiGet<Award[]>(`/api/awards?${params.toString()}`);

  const regions = [
    { key: "", label: "All regions" },
    { key: "GLOBAL", label: "Global" },
    { key: "APAC", label: "Asia-Pacific" },
    { key: "EUROPE", label: "Europe" },
    { key: "NATIONAL", label: "National" },
  ];
  const prios = [
    { key: "", label: "All" },
    { key: "APPLY_NOW", label: "🔥 Apply Now" },
    { key: "HIGH_PRIORITY", label: "🟢 High" },
    { key: "PREPARE_FIRST", label: "🟡 Prepare" },
    { key: "NOT_RECOMMENDED", label: "🔴 No" },
  ];

  const make = (k: "region" | "priority", v: string) => {
    const p = new URLSearchParams();
    if (k === "region") { if (v) p.set("region", v); if (searchParams.priority) p.set("priority", searchParams.priority); }
    else { if (v) p.set("priority", v); if (searchParams.region) p.set("region", searchParams.region); }
    return `/awards?${p.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">🏆 Global Award Finder</h1>
          <p className="text-sm text-slate-500">Professional awards matched to your real profile — eligibility, fit, evidence & competition</p>
        </div>
        <ReanalyzeAwardsButton />
      </div>

      <div className="flex flex-wrap gap-2">
        {regions.map((r) => (
          <Link key={r.key} href={make("region", r.key === (searchParams.region ?? "") ? "" : r.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              (searchParams.region ?? "") === r.key ? "bg-brand-600 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}>
            {r.label}
          </Link>
        ))}
        <span className="mx-1 border-l border-slate-200" />
        {prios.map((p) => (
          <Link key={p.key} href={make("priority", p.key === (searchParams.priority ?? "") ? "" : p.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              (searchParams.priority ?? "") === p.key ? "bg-brand-600 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}>
            {p.label}
          </Link>
        ))}
      </div>

      {awards.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No awards catalogued yet. Run the award seed step to load the catalog, then analysis runs against your profile.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {awards.map((a) => (
            <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-slate-900">{a.name}</h3>
                <span className="shrink-0 text-xs font-semibold text-slate-700">{a.awardPriorityLabel}</span>
              </div>
              <p className="text-sm text-slate-500">{a.organization ?? "—"} · {[a.region, a.category].filter(Boolean).join(" · ") || ""}</p>

              <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                <span className={`rounded-full px-2 py-0.5 font-semibold ${scorePill(a.profileFitScore)}`}>Fit {a.profileFitScore}%</span>
                <span className={`rounded-full px-2 py-0.5 font-semibold ${scorePill(a.eligibilityScore)}`}>Eligibility {a.eligibilityScore}%</span>
                <span className={`rounded-full px-2 py-0.5 font-semibold ${scorePill(a.evidenceStrength)}`}>Evidence {a.evidenceStrength}%</span>
              </div>
              <div className="mt-2 text-xs text-slate-600">{a.competitiveLabel}</div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                {a.deadline ? <span>📅 {new Date(a.deadline).toLocaleDateString()}</span> : <span>📅 Deadline: verify</span>}
                <span className={a.deadlineStatus === "UNVERIFIED" ? "text-amber-600" : ""}>{a.deadlineStatus === "UNVERIFIED" ? "· unverified — check official" : ""}</span>
                <span>· 💰 {a.entryFeeUsd != null ? `$${a.entryFeeUsd}` : "fee: verify"}</span>
              </div>

              <div className="mt-3 flex gap-2">
                <Link href={`/awards/${a.id}`} className="flex-1 rounded-lg bg-brand-600 px-3 py-1.5 text-center text-sm font-medium text-white hover:bg-brand-700">View / Analyze</Link>
                <AwardTrackButton awardId={a.id} />
              </div>
              {a.officialUrl && (
                <a href={a.officialUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block text-center rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">
                  Official Source ↗
                </a>
              )}
            </div>
          ))}
        </div>
      )}
      <p className="rounded-lg bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500">
        Award fit and competitive position are AI-generated assessments based on available criteria and documented achievements. They do not guarantee nomination, finalist status or winning. Always verify eligibility, fee and deadline on the official source.
      </p>
    </div>
  );
}
