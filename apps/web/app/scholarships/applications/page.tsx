export const dynamic = "force-dynamic";

import Link from "next/link";
import { apiGet } from "@/lib/api";
import { ScholarshipStatusBadge } from "@/components/scholarship-actions";

interface ScholarshipApplicationRow {
  id: string;
  programmeId: string;
  status: string;
  deadline: string | null;
  scholarshipDeadline: string | null;
  nextAction: string | null;
  confirmationNumber: string | null;
  programmeName: string | null;
  acronym: string | null;
}

export default async function ScholarshipApplicationsPage() {
  const apps = await apiGet<ScholarshipApplicationRow[]>("/api/scholarship-applications");

  const counts = ["RESEARCHING", "APPROVED", "SUBMITTED", "SHORTLISTED"].map((s) => ({
    status: s,
    count: apps.filter((a) => a.status === s).length,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Scholarship Application Center</h1>
        <p className="text-sm text-slate-500">Erasmus Mundus — track and manage your applications</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {counts.map((c) => (
          <div key={c.status} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-center shadow-sm">
            <div className="text-xs text-slate-500">{c.status}</div>
            <div className="text-lg font-semibold text-slate-900">{c.count}</div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {apps.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">
            No scholarship applications yet. Open a programme and click "Apply" to prepare your application.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Programme</th>
                <th className="px-4 py-3">Deadline</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Next action</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {apps.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {a.programmeName ?? "—"}
                    {a.acronym ? <span className="ml-2 text-xs text-slate-400">{a.acronym}</span> : null}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {a.deadline ? new Date(a.deadline).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <ScholarshipStatusBadge status={a.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{a.nextAction ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/scholarships/applications/${a.id}`} className="text-sm font-medium text-brand-600 hover:text-brand-700">
                      Review →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
