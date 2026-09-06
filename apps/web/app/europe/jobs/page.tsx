export const dynamic = "force-dynamic";

import Link from "next/link";
import { apiGet } from "@/lib/api";
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

function scoreColor(n: number): string {
  if (n >= 85) return "bg-emerald-100 text-emerald-700";
  if (n >= 70) return "bg-teal-100 text-teal-700";
  if (n >= 55) return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

function ieltsColor(s: string): string {
  switch (s) {
    case "NOT_REQUIRED": return "bg-emerald-100 text-emerald-700";
    case "ENGLISH_PROFICIENCY_REQUIRED": return "bg-teal-100 text-teal-700";
    case "REQUIRED_BY_EMPLOYER":
    case "REQUIRED_FOR_VISA": return "bg-orange-100 text-orange-700";
    default: return "bg-slate-100 text-slate-600";
  }
}

export default async function EuropeJobsPage({ searchParams }: { searchParams: { country?: string; priority?: string; ielts?: string } }) {
  const params = new URLSearchParams();
  if (searchParams.country) params.set("country", searchParams.country);
  if (searchParams.priority) params.set("priority", searchParams.priority);
  if (searchParams.ielts) params.set("ielts", searchParams.ielts);

  const jobs = await apiGet<EuropeJob[]>(`/api/europe/jobs?${params.toString()}`);

  const countries = ["Germany", "Netherlands", "Ireland", "France", "Belgium", "Sweden", "Denmark", "Finland", "Austria", "Portugal"];
  const priorityFilters = [
    { key: "", label: "All priorities" },
    { key: "P1", label: "🔥 Apply Now" },
    { key: "P2", label: "🟢 Strong" },
    { key: "P3", label: "🟡 Potential" },
    { key: "P4", label: "🔴 Low" },
  ];
  const ieltsFilters = [
    { key: "", label: "All IELTS" },
    { key: "not_required", label: "Apply without IELTS" },
    { key: "required", label: "IELTS required" },
    { key: "unknown", label: "Unknown" },
  ];

  const make = (country: string, priority: string, ielts: string) => {
    const p = new URLSearchParams();
    if (country) p.set("country", country);
    if (priority) p.set("priority", priority);
    if (ielts) p.set("ielts", ielts);
    return `/europe/jobs?${p.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">🌍 Europe Jobs</h1>
          <p className="text-sm text-slate-500">Mid-Leadership HR opportunities across the EU with visa + IELTS analysis</p>
        </div>
        <EuropeScanButton />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-1 text-xs font-medium text-slate-400">Country:</span>
          {["", ...countries].map((c) => (
            <Link key={c || "all"} href={make(c === searchParams.country ? "" : c, searchParams.priority ?? "", searchParams.ielts ?? "")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                (searchParams.country ?? "") === c ? "bg-brand-600 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}>
              {c || "All"}
            </Link>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2 border-t border-slate-100 pt-2">
          {priorityFilters.map((f) => (
            <Link key={f.key} href={make(searchParams.country ?? "", f.key === (searchParams.priority ?? "") ? "" : f.key, searchParams.ielts ?? "")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                (searchParams.priority ?? "") === f.key ? "bg-brand-600 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}>
              {f.label}
            </Link>
          ))}
          <span className="mx-1 border-l border-slate-200" />
          {ieltsFilters.map((f) => (
            <Link key={f.key} href={make(searchParams.country ?? "", searchParams.priority ?? "", f.key === (searchParams.ielts ?? "") ? "" : f.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                (searchParams.ielts ?? "") === f.key ? "bg-brand-600 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}>
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      {jobs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No European jobs yet. Click <b>Scan Europe Jobs</b> to pull live opportunities (Arbeitnow / Jobicy / RemoteOK) and run the visa + IELTS analysis.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((j) => (
            <Link key={j.id} href={`/europe/jobs/${j.id}`}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-900">{j.title}</h3>
                <span className={`shrink-0 rounded-lg px-2 py-1 text-xs font-bold ${scoreColor(j.careerMatchScore)}`}>{j.careerMatchScore}%</span>
              </div>
              <p className="text-sm text-slate-500">{j.company ?? "—"} · {j.country}{j.city ? `, ${j.city}` : ""}</p>
              <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">Career {j.careerMatchScore}%</span>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-700">Visa {j.visaScore}%</span>
                <span className={`rounded-full px-2 py-0.5 font-medium ${ieltsColor(j.ieltsStatus)}`}>{j.ieltsStatus.replace(/_/g, " ")}</span>
              </div>
              <div className="mt-2 text-xs font-semibold text-slate-800">{j.jobPriorityLabel}</div>
              <p className="mt-1 line-clamp-2 text-xs text-slate-500">{j.sponsorshipLabel}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
