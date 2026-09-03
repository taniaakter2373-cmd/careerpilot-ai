export const dynamic = "force-dynamic";

import Link from "next/link";
import { apiGet } from "@/lib/api";

interface DeadlineRow {
  id: string;
  title?: string;
  name?: string;
  acronym?: string | null;
  company?: string | null;
  deadline: string | null;
  daysRemaining: number | null;
  status?: string | null;
  deadlineStatus?: string | null;
  type: string;
}

interface Deadlines {
  jobs: DeadlineRow[];
  scholarships: DeadlineRow[];
}

function dayColor(d: number | null): string {
  if (d == null) return "bg-slate-100 text-slate-600";
  if (d <= 7) return "bg-red-100 text-red-700";
  if (d <= 30) return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

function DeadlineTable({ rows }: { rows: DeadlineRow[] }) {
  if (rows.length === 0) {
    return <p className="p-4 text-sm text-slate-500">No upcoming deadlines.</p>;
  }
  return (
    <table className="w-full text-left text-sm">
      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
        <tr>
          <th className="px-4 py-3">Opportunity</th>
          <th className="px-4 py-3">Deadline</th>
          <th className="px-4 py-3">Days left</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((r) => (
          <tr key={r.id} className="hover:bg-slate-50">
            <td className="px-4 py-3 font-medium text-slate-900">
              {r.type === "JOB" ? (
                <Link href={`/jobs/${r.id}`} className="text-brand-600 hover:text-brand-700">
                  {r.title}
                </Link>
              ) : (
                <Link href={`/scholarships/${r.id}`} className="text-brand-600 hover:text-brand-700">
                  {r.name}
                </Link>
              )}
              <span className="ml-2 text-xs text-slate-400">
                {r.type === "JOB" ? r.company : r.acronym}
              </span>
            </td>
            <td className="px-4 py-3 text-slate-600">{r.deadline ? new Date(r.deadline).toLocaleDateString() : "—"}</td>
            <td className="px-4 py-3">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${dayColor(r.daysRemaining)}`}>
                {r.daysRemaining != null ? `${r.daysRemaining}d` : "—"}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function DeadlinesPage() {
  const d = await apiGet<Deadlines>("/api/deadlines");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Deadline Agent</h1>
        <p className="text-sm text-slate-500">Track job and scholarship application deadlines</p>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          Job deadlines ({d.jobs.length})
        </div>
        <DeadlineTable rows={d.jobs} />
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          Scholarship deadlines ({d.scholarships.length})
        </div>
        <DeadlineTable rows={d.scholarships} />
      </section>
    </div>
  );
}
