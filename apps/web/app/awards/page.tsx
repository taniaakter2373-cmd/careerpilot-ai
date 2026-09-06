export const dynamic = "force-dynamic";

import Link from "next/link";
import { apiGet } from "@/lib/api";
import { PageHeader, Chip, EmptyState, Disclaimer } from "@/components/ui";
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

const TONE: Record<string, "brand" | "emerald" | "amber" | "slate"> = {
  APPLY_NOW: "emerald",
  HIGH_PRIORITY: "brand",
  PREPARE_FIRST: "amber",
  NOT_RECOMMENDED: "slate",
};

const COMPETITIVE_TONE: Record<string, "emerald" | "amber" | "orange" | "red"> = {
  STRONG: "emerald",
  COMPETITIVE: "amber",
  POSSIBLE: "orange",
  WEAK: "red",
};

export default async function AwardsPage({ searchParams }: { searchParams: { region?: string; priority?: string } }) {
  const params = new URLSearchParams();
  if (searchParams.region) params.set("region", searchParams.region);
  if (searchParams.priority) params.set("priority", searchParams.priority);
  const awards = await apiGet<Award[]>(`/api/awards?${params.toString()}`);

  const regions = [
    { key: "", label: "All regions" },
    { key: "GLOBAL", label: "🌐 Global" },
    { key: "APAC", label: "🌏 Asia-Pacific" },
    { key: "EUROPE", label: "🇪🇺 Europe" },
    { key: "NATIONAL", label: "🗺️ National" },
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
    if (k === "region") {
      if (v) p.set("region", v);
      if (searchParams.priority) p.set("priority", searchParams.priority);
    } else {
      if (v) p.set("priority", v);
      if (searchParams.region) p.set("region", searchParams.region);
    }
    return `/awards?${p.toString()}`;
  };
  const pill = (active: boolean) => (active ? "rounded-xl bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm" : "rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50");

  return (
    <div className="page">
      <PageHeader title="🏆 Global Award Finder" subtitle="Professional awards matched to your real profile — eligibility, fit, evidence & competition">
        <ReanalyzeAwardsButton />
      </PageHeader>

      <div className="card flex flex-wrap items-center gap-2 p-4">
        {regions.map((r) => (
          <Link key={r.key} href={make("region", r.key === (searchParams.region ?? "") ? "" : r.key)} className={pill((searchParams.region ?? "") === r.key)}>
            {r.label}
          </Link>
        ))}
        <span className="mx-1 h-4 w-px bg-slate-200" />
        {prios.map((p) => (
          <Link key={p.key} href={make("priority", p.key === (searchParams.priority ?? "") ? "" : p.key)} className={pill((searchParams.priority ?? "") === p.key)}>
            {p.label}
          </Link>
        ))}
      </div>

      {awards.length === 0 ? (
        <EmptyState icon="🏆" title="No awards match this filter" hint="Run the award seed + analysis step to load the catalog, or clear filters." />
      ) : (
        <div className="card-grid">
          {awards.map((a) => (
            <div key={a.id} className="card card-hover flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold leading-snug text-slate-900">{a.name}</h3>
                  <p className="mt-0.5 truncate text-sm text-slate-500">
                    {a.organization ?? "—"} · {[a.region, a.category].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <Chip tone={TONE[a.awardPriority] ?? "slate"}>{a.awardPriorityLabel}</Chip>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <Chip tone="brand">Fit {a.profileFitScore}%</Chip>
                <Chip tone="blue">Eligibility {a.eligibilityScore}%</Chip>
                <Chip tone="violet">Evidence {a.evidenceStrength}%</Chip>
              </div>

              <div className="mt-2 text-xs text-slate-500">
                <Chip tone={COMPETITIVE_TONE[a.competitive] ?? "slate"}>{a.competitiveLabel}</Chip>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                <span>📅 {a.deadline ? new Date(a.deadline).toLocaleDateString() : "Deadline: verify"}</span>
                {a.deadlineStatus === "UNVERIFIED" && <span className="text-amber-600">· check official</span>}
                <span>· 💰 {a.entryFeeUsd != null ? `$${a.entryFeeUsd}` : "fee: verify"}</span>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Link href={`/awards/${a.id}`} className="btn-primary flex-1">
                  View & analyze
                </Link>
                <AwardTrackButton awardId={a.id} />
              </div>
              {a.officialUrl && (
                <a href={a.officialUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm mt-2 w-full">
                  Official source ↗
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <Disclaimer>
        Award fit and competitive position are AI-generated assessments based on available criteria and your documented achievements. They do not
        guarantee nomination, finalist status or winning. Verify current eligibility, category, entry fee and deadline on the official source.
      </Disclaimer>
    </div>
  );
}
