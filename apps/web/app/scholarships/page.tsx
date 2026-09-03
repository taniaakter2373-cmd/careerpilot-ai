export const dynamic = "force-dynamic";

import Link from "next/link";
import { apiGet } from "@/lib/api";
import { MatchBadge, RecommendationBadge } from "@/components/badges";

interface Programme {
  id: string;
  programmeName: string;
  acronym: string | null;
  field: string | null;
  coordinator: string | null;
  countries: string[];
  degreeType: string | null;
  duration: string | null;
  scholarshipAvailable: boolean;
  applicationDeadline: string | null;
  deadlineStatus: string;
  match: {
    overallScore: number;
    priorityScore: number;
    eligibilityStatus: string;
    recommendation: string;
    documentGaps: string[];
  } | null;
}

function fmtDeadline(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function eligibilityColor(s: string): string {
  switch (s) {
    case "ELIGIBLE":
      return "bg-emerald-100 text-emerald-700";
    case "LIKELY_ELIGIBLE":
      return "bg-teal-100 text-teal-700";
    case "UNCERTAIN":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-red-100 text-red-700";
  }
}

export default async function ScholarshipsPage({
  searchParams,
}: {
  searchParams: { all?: string };
}) {
  const showEligibleOnly = searchParams.all === "1";
  const programmes = await apiGet<Programme[]>(`/api/scholarships${showEligibleOnly ? "?eligible=true" : ""}`);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Scholarships</h1>
          <p className="text-sm text-slate-500">
            {showEligibleOnly ? "Only scholarships where you are eligible" : "All scholarships worldwide — eligibility checked for you"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            {programmes.length} shown
          </span>
          <Link
            href={showEligibleOnly ? "/scholarships" : "/scholarships?all=1"}
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            {showEligibleOnly ? "Show all worldwide" : "Eligible only"}
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {programmes.map((p) => (
          <Link
            key={p.id}
            href={`/scholarships/${p.id}`}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">{p.programmeName}</h2>
                <p className="text-sm text-slate-500">{p.coordinator ?? "—"}</p>
              </div>
              {p.match && <MatchBadge score={p.match.overallScore} />}
            </div>
            <div className="mt-4 space-y-1 text-sm text-slate-600">
              <div>🌍 {p.countries.join(", ")}</div>
              <div>📅 Deadline: {fmtDeadline(p.applicationDeadline)}</div>
              <div>🎓 {p.scholarshipAvailable ? "Scholarship available" : "No scholarship"}</div>
            </div>
            {p.match && (
              <div className="mt-4 flex items-center gap-2">
                <RecommendationBadge recommendation={p.match.recommendation} />
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${eligibilityColor(p.match.eligibilityStatus)}`}>
                  {p.match.eligibilityStatus}
                </span>
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
