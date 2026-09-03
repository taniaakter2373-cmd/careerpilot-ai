export const dynamic = "force-dynamic";

import Link from "next/link";
import { apiGet } from "@/lib/api";
import { MatchBadge, RecommendationBadge } from "@/components/badges";
import { RunSearchButton } from "@/components/search-button";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string | null;
  country: string | null;
  employmentType: string;
  remoteType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  status: string;
  match: {
    overallScore: number;
    recommendation: string;
    action: string;
  } | null;
}

function fmtSalary(j: Job): string {
  if (j.salaryMin == null && j.salaryMax == null) return "Not disclosed";
  const cur = j.salaryCurrency ?? "";
  if (j.salaryMin != null && j.salaryMax != null) return `${cur} ${j.salaryMin.toLocaleString()} – ${j.salaryMax.toLocaleString()}`;
  if (j.salaryMin != null) return `${cur} ${j.salaryMin.toLocaleString()}+`;
  return `${cur} up to ${j.salaryMax!.toLocaleString()}`;
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; country?: string; scope?: string };
}) {
  const scope = searchParams.scope ?? "all";
  const params = new URLSearchParams();
  if (searchParams.q) params.set("q", searchParams.q);
  if (searchParams.status) params.set("status", searchParams.status);
  if (searchParams.country) params.set("country", searchParams.country);
  if (scope !== "all") params.set("scope", scope);

  const jobs = await apiGet<Job[]>(`/api/jobs?${params.toString()}`);

  const tabs = [
    { key: "all", label: "All" },
    { key: "international", label: "🌍 International" },
    { key: "local", label: "🇧🇩 Bangladesh" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Jobs</h1>
          <p className="text-sm text-slate-500">{jobs.length} HR opportunities</p>
        </div>
        <RunSearchButton />
      </div>

      <div className="flex gap-2">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/jobs?${new URLSearchParams({ ...(searchParams.q ? { q: searchParams.q } : {}), scope: t.key }).toString()}`}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              scope === t.key ? "bg-brand-600 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <form className="flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={searchParams.q ?? ""}
          placeholder="Search role or company…"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none"
        />
        <select
          name="status"
          defaultValue={searchParams.status ?? ""}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
        >
          <option value="">All statuses</option>
          <option value="NEW">New</option>
          <option value="MATCHED">Matched</option>
          <option value="RECOMMENDED">Recommended</option>
          <option value="APPLIED">Applied</option>
        </select>
        <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          Filter
        </button>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {jobs.map((j) => (
          <Link
            key={j.id}
            href={`/jobs/${j.id}`}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">{j.title}</h2>
                <p className="text-sm text-slate-500">{j.company}</p>
              </div>
              {j.match && <MatchBadge score={j.match.overallScore} />}
            </div>
            <div className="mt-4 space-y-1 text-sm text-slate-600">
              <div>📍 {j.location ?? "—"}</div>
              <div>💵 {fmtSalary(j)}</div>
              <div>
                {j.employmentType.replace("_", " ")} · {j.remoteType.replace("_", " ")}
              </div>
            </div>
            {j.match && (
              <div className="mt-4">
                <RecommendationBadge recommendation={j.match.recommendation} />
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
