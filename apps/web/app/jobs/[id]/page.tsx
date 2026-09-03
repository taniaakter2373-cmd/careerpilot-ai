export const dynamic = "force-dynamic";

import Link from "next/link";
import { apiGet } from "@/lib/api";
import { RecommendationBadge } from "@/components/badges";
import { PrepareApplicationButton } from "@/components/job-actions";

interface JobDetail {
  id: string;
  title: string;
  company: string;
  companyUrl: string | null;
  url: string;
  location: string | null;
  country: string | null;
  city: string | null;
  employmentType: string;
  remoteType: string;
  industry: string | null;
  department: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  description: string;
  requirements: string[];
  responsibilities: string[];
  educationRequirements: string[];
  experienceRequired: string | null;
  skills: string[];
  postedDate: string | null;
  closingDate: string | null;
  status: string;
  applicationMethod: string;
  match: {
    overallScore: number;
    breakdown: Record<string, number>;
    recommendation: string;
    action: string;
    whyMatched: string[];
    missingRequirements: string[];
    riskFlags: string[];
    hardRequirementFailure: boolean;
    targetCompanyBonus: boolean;
  } | null;
}

function barFill(value: number): string {
  if (value >= 90) return "bg-emerald-500";
  if (value >= 80) return "bg-teal-500";
  if (value >= 70) return "bg-amber-500";
  if (value >= 60) return "bg-orange-500";
  return "bg-red-500";
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-sm text-slate-600">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${barFill(value)}`} style={{ width: `${value}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right text-sm font-medium text-slate-900">{value}%</span>
    </div>
  );
}

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const job = await apiGet<JobDetail>(`/api/jobs/${params.id}`);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/jobs" className="text-sm text-brand-600 hover:text-brand-700">
            ← Back to jobs
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">{job.title}</h1>
          <p className="text-slate-600">
            {job.company}
            {job.location ? ` · ${job.location}` : ""}
          </p>
        </div>
        {job.match && (
          <div className="text-right">
            <div className="text-sm text-slate-500">Overall Match</div>
            <div className="text-3xl font-bold text-slate-900">{job.match.overallScore}%</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Description</h2>
            <p className="whitespace-pre-wrap text-sm text-slate-600">{job.description}</p>

            {job.responsibilities.length > 0 && (
              <>
                <h3 className="mt-5 mb-2 font-medium text-slate-900">Responsibilities</h3>
                <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
                  {job.responsibilities.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </>
            )}

            {job.requirements.length > 0 && (
              <>
                <h3 className="mt-5 mb-2 font-medium text-slate-900">Requirements</h3>
                <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
                  {job.requirements.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </>
            )}

            {job.skills.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {job.skills.map((s, i) => (
                  <span key={i} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Job Details</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Employment</dt>
                <dd className="text-slate-900">{job.employmentType.replace("_", " ")}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Work mode</dt>
                <dd className="text-slate-900">{job.remoteType.replace("_", " ")}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Experience</dt>
                <dd className="text-slate-900">{job.experienceRequired ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Salary</dt>
                <dd className="text-slate-900">
                  {job.salaryMin != null ? `${job.salaryCurrency ?? ""} ${job.salaryMin.toLocaleString()}` : "Not disclosed"}
                  {job.salaryMax != null ? ` – ${job.salaryMax.toLocaleString()}` : ""}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Application</dt>
                <dd className="text-slate-900">{job.applicationMethod}</dd>
              </div>
            </dl>
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Open Job ↗
            </a>
            <div className="mt-3">
              <PrepareApplicationButton jobId={job.id} />
            </div>
          </section>

          {job.match && (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Match Breakdown</h2>
              <div className="space-y-3">
                {Object.entries(job.match.breakdown).map(([k, v]) => (
                  <Bar key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} value={v} />
                ))}
              </div>
              <div className="mt-4">
                <RecommendationBadge recommendation={job.match.recommendation} />
              </div>

              {job.match.whyMatched.length > 0 && (
                <>
                  <h3 className="mt-5 mb-2 text-sm font-semibold text-emerald-700">Why this job matches</h3>
                  <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
                    {job.match.whyMatched.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </>
              )}

              {job.match.missingRequirements.length > 0 && (
                <>
                  <h3 className="mt-5 mb-2 text-sm font-semibold text-amber-700">Missing requirements</h3>
                  <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
                    {job.match.missingRequirements.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </>
              )}

              {job.match.riskFlags.length > 0 && (
                <>
                  <h3 className="mt-5 mb-2 text-sm font-semibold text-red-700">Risk flags</h3>
                  <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
                    {job.match.riskFlags.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
