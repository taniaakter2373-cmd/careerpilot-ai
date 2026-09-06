export const dynamic = "force-dynamic";

import Link from "next/link";
import { apiGet } from "@/lib/api";
import { PageHeader, StatTile, Chip, Disclaimer } from "@/components/ui";

interface Overview {
  totalJobs: number;
  applyNowJobs: number;
  jobPriorityBreakdown: Record<string, number>;
  countryCards: Array<{
    country: string;
    jobCount: number;
    workPermitRoutes: Array<{ route: string; euBlueCard?: boolean; needsSponsor?: boolean }>;
    englishRequirement: { status?: string; note?: string } | null;
    notes: string | null;
  }>;
  recommended: {
    id: string;
    title: string;
    company: string | null;
    country: string;
    careerMatchScore: number;
    visaScore: number;
    jobPriority: string;
    recommendedAction: string;
  } | null;
  englishProfile: { ieltsStatus: string; ieltsOverallBand: number | null; englishProficiency: string } | null;
  disclaimer: string;
}

const IELTS_LABEL: Record<string, string> = {
  NOT_AVAILABLE: "Not Available",
  AVAILABLE: "Available",
  SCHEDULED: "Scheduled",
  EXEMPT: "Exempt",
};

export default async function EuropeOverviewPage() {
  const d = await apiGet<Overview>("/api/europe");
  const p1 = d.jobPriorityBreakdown?.P1 ?? 0;
  const p2 = d.jobPriorityBreakdown?.P2 ?? 0;

  return (
    <div className="page">
      <PageHeader
        title="🇪🇺 Europe Career Intelligence"
        subtitle="EU jobs + visa + IELTS analysis for Mid-Leadership HR targets"
      >
        <Link href="/europe/ielts" className="btn-secondary">
          🗣️ IELTS / English
        </Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon="💼" label="Europe jobs" value={d.totalJobs} sub="live + analysed" href="/europe/jobs" />
        <StatTile icon="🔥" label="Apply now (P1)" value={d.applyNowJobs} sub="best opportunities" href="/europe/jobs?priority=P1" />
        <StatTile icon="🟢" label="Strong (P1+P2)" value={p1 + p2} sub="career + visa aligned" href="/europe/jobs" />
        <StatTile icon="🗺️" label="Target countries" value={d.countryCards.length} sub="routes mapped" href="/europe/countries" />
      </div>

      {d.recommended && (
        <Link
          href={`/europe/jobs/${d.recommended.id}`}
          className="card card-hover flex flex-wrap items-center justify-between gap-4 border-brand-200 bg-gradient-to-br from-brand-50/70 to-white p-5"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-600">⭐ Recommended today</div>
            <div className="mt-1 truncate text-lg font-bold text-slate-900">{d.recommended.title}</div>
            <div className="text-sm text-slate-500">
              {d.recommended.company ?? "—"} · {d.recommended.country}
            </div>
            <p className="mt-1 max-w-xl text-xs text-slate-500">{d.recommended.recommendedAction}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Chip tone="brand">Career {d.recommended.careerMatchScore}%</Chip>
            <Chip tone="blue">Visa {d.recommended.visaScore}%</Chip>
          </div>
        </Link>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Countries</h2>
          <Link href="/europe/countries" className="link-brand">Full visa detail →</Link>
        </div>
        <div className="card-grid">
          {d.countryCards.map((c) => (
            <div key={c.country} className="card p-5 transition hover:border-brand-200 hover:shadow-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{c.country === "Germany" ? "🇩🇪" : c.country === "France" ? "🇫🇷" : c.country === "Netherlands" ? "🇳🇱" : c.country === "Ireland" ? "🇮🇪" : c.country === "Belgium" ? "🇧🇪" : c.country === "Sweden" ? "🇸🇪" : c.country === "Denmark" ? "🇩🇰" : c.country === "Finland" ? "🇫🇮" : c.country === "Austria" ? "🇦🇹" : "🇵🇹"}</span>
                  <span className="font-semibold text-slate-900">{c.country}</span>
                </div>
                <Chip tone={c.jobCount > 0 ? "emerald" : "slate"}>{c.jobCount} jobs</Chip>
              </div>
              <div className="mt-3 space-y-1 text-xs text-slate-500">
                {(c.workPermitRoutes ?? []).slice(0, 2).map((r) => (
                  <div key={r.route} className="truncate">
                    {r.euBlueCard ? "💙 " : ""}
                    {r.route}
                  </div>
                ))}
                {(c.workPermitRoutes ?? []).length > 2 && <div className="text-slate-400">+{c.workPermitRoutes.length - 2} more routes</div>}
              </div>
              {c.englishRequirement?.note && <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{c.englishRequirement.note}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-800">Your English profile</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            {d.englishProfile ? (
              <>
                IELTS: <b>{d.englishProfile.ieltsOverallBand ?? IELTS_LABEL[d.englishProfile.ieltsStatus] ?? d.englishProfile.ieltsStatus}</b> ·{" "}
                {d.englishProfile.englishProficiency.replace(/_/g, " ")}
              </>
            ) : (
              "Not set — treated as Not Available, which never makes you ineligible."
            )}
          </p>
        </div>
        <Link href="/europe/ielts" className="btn-primary">
          Update IELTS / English
        </Link>
      </section>

      <Disclaimer>{d.disclaimer}</Disclaimer>
    </div>
  );
}
