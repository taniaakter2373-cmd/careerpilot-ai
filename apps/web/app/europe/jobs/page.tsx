export const dynamic = "force-dynamic";

import Link from "next/link";
import { apiGet } from "@/lib/api";
import { PageHeader, Chip, EmptyState, Disclaimer } from "@/components/ui";
import { EuropeScanButton } from "@/components/europe-scan-button";

interface EuropeJob {
  id: string;
  title: string;
  company: string | null;
  country: string;
  city: string | null;
  careerMatchScore: number;
  visaScore: number;
  ieltsStatus: string;
  jobPriority: string;
  jobPriorityLabel: string;
  sponsorshipLabel: string;
  applicationUrl: string | null;
}

const PRIORITY_TONE: Record<string, "emerald" | "blue" | "amber" | "red"> = { P1: "emerald", P2: "blue", P3: "amber", P4: "red" };

export default async function EuropeJobsPage({ searchParams }: { searchParams: { country?: string; priority?: string; ielts?: string } }) {
  const params = new URLSearchParams();
  if (searchParams.country) params.set("country", searchParams.country);
  if (searchParams.priority) params.set("priority", searchParams.priority);
  if (searchParams.ielts) params.set("ielts", searchParams.ielts);

  const jobs = await apiGet<EuropeJob[]>(`/api/europe/jobs?${params.toString()}`);

  const countries = ["Germany", "Netherlands", "Ireland", "France", "Belgium", "Sweden", "Denmark", "Finland", "Austria", "Portugal"];
  const flag = (c: string) => (c === "Germany" ? "🇩🇪" : c === "France" ? "🇫🇷" : c === "Netherlands" ? "🇳🇱" : c === "Ireland" ? "🇮🇪" : c === "Belgium" ? "🇧🇪" : c === "Sweden" ? "🇸🇪" : c === "Denmark" ? "🇩🇰" : c === "Finland" ? "🇫🇮" : c === "Austria" ? "🇦🇹" : "🇵🇹");

  const make = (patch: Record<string, string>) => {
    const p = new URLSearchParams();
    const next = { country: searchParams.country ?? "", priority: searchParams.priority ?? "", ielts: searchParams.ielts ?? "", ...patch };
    if (next.country) p.set("country", next.country);
    if (next.priority) p.set("priority", next.priority);
    if (next.ielts) p.set("ielts", next.ielts);
    return `/europe/jobs?${p.toString()}`;
  };

  const pill = (active: boolean) => (active ? "rounded-xl bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm" : "rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50");

  return (
    <div className="page">
      <PageHeader title="🌍 Europe Jobs" subtitle="Mid-Leadership HR roles across the EU — each with career, visa, IELTS and sponsorship analysis">
        <EuropeScanButton />
      </PageHeader>

      {/* Filters */}
      <div className="card space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Country</span>
          <Link href={make({ country: "" })} className={pill(!searchParams.country)}>All</Link>
          {countries.map((c) => (
            <Link key={c} href={make({ country: searchParams.country === c ? "" : c })} className={pill(searchParams.country === c)}>
              {flag(c)} {c}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <span className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Fit</span>
          <Link href={make({ priority: "" })} className={pill(!searchParams.priority)}>All priorities</Link>
          {[["P1", "🔥 Apply Now"], ["P2", "🟢 Strong"], ["P3", "🟡 Potential"], ["P4", "🔴 Low"]].map(([k, l]) => (
            <Link key={k} href={make({ priority: searchParams.priority === k ? "" : k })} className={pill(searchParams.priority === k)}>
              {l}
            </Link>
          ))}
          <span className="mx-1 h-4 w-px bg-slate-200" />
          <span className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">IELTS</span>
          <Link href={make({ ielts: "" })} className={pill(!searchParams.ielts)}>Any</Link>
          <Link href={make({ ielts: "not_required" })} className={pill(searchParams.ielts === "not_required")}>✓ Apply without IELTS</Link>
          <Link href={make({ ielts: "required" })} className={pill(searchParams.ielts === "required")}>IELTS required</Link>
          <Link href={make({ ielts: "unknown" })} className={pill(searchParams.ielts === "unknown")}>Verify</Link>
        </div>
      </div>

      {jobs.length === 0 ? (
        <EmptyState icon="🔍" title="No European jobs match this filter yet" hint="Click “Scan Europe Jobs” to pull live opportunities and run the visa + IELTS analysis, or widen your filters." />
      ) : (
        <div className="card-grid">
          {jobs.map((j) => (
            <Link key={j.id} href={`/europe/jobs/${j.id}`} className="card card-hover flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold leading-snug text-slate-900">{j.title}</h3>
                  <p className="mt-0.5 truncate text-sm text-slate-500">
                    {j.company ?? "—"} · {flag(j.country)} {j.country}
                    {j.city ? `, ${j.city}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <Chip tone="brand">Career {j.careerMatchScore}%</Chip>
                <Chip tone="blue">Visa {j.visaScore}%</Chip>
                <Chip tone={j.ieltsStatus === "NOT_REQUIRED" ? "emerald" : j.ieltsStatus === "ENGLISH_PROFICIENCY_REQUIRED" ? "teal" : j.ieltsStatus.includes("REQUIRED") ? "amber" : "slate"}>
                  {j.ieltsStatus.replace(/_/g, " ")}
                </Chip>
              </div>

              <div className="mt-auto space-y-1.5">
                <Chip tone={PRIORITY_TONE[j.jobPriority] ?? "slate"}>{j.jobPriorityLabel}</Chip>
                <p className="text-[11px] leading-relaxed text-slate-400">{j.sponsorshipLabel}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Disclaimer>
        Visa eligibility, sponsorship and IELTS requirements are AI-based preliminary assessments — not legal or immigration advice. Final eligibility
        depends on the country&apos;s current rules, the employer and competent authorities. Always verify against official sources. Not having IELTS never
        blocks a job by itself.
      </Disclaimer>
    </div>
  );
}
