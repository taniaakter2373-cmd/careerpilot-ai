export const dynamic = "force-dynamic";

import Link from "next/link";
import { apiGet } from "@/lib/api";
import { BulkSubmitButton } from "@/components/bulk-submit";

interface AppRow {
  id: string;
  type: "JOB" | "SCHOLARSHIP" | "SCHOOL";
  title: string | null;
  org: string | null;
  location: string | null;
  status: string;
  applicationDate: string | null;
  deadline: string | null;
  confirmationNumber: string | null;
  detailUrl: string;
}

const typeMeta: Record<string, { label: string; cls: string; emoji: string }> = {
  JOB: { label: "Job", cls: "bg-blue-100 text-blue-700", emoji: "💼" },
  SCHOLARSHIP: { label: "Scholarship", cls: "bg-emerald-100 text-emerald-700", emoji: "🎓" },
  SCHOOL: { label: "School", cls: "bg-amber-100 text-amber-700", emoji: "🏫" },
};

function statusColor(s: string): string {
  const submitted = ["APPLIED", "SUBMITTED", "ACCEPTED", "OFFER", "SELECTED", "SHORTLISTED"];
  const active = ["APPROVED", "SCREENING", "INTERVIEW", "FINAL_INTERVIEW", "UNDER_REVIEW"];
  const preparing = ["PREPARED", "RESEARCHING", "ELIGIBILITY_CHECK", "PREPARING", "READY_FOR_REVIEW"];
  if (submitted.includes(s)) return "bg-emerald-100 text-emerald-700";
  if (active.includes(s)) return "bg-teal-100 text-teal-700";
  if (preparing.includes(s)) return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

export default async function ApplicationsHubPage() {
  const apps = await apiGet<AppRow[]>("/api/all-applications");

  const counts = {
    JOB: apps.filter((a) => a.type === "JOB").length,
    SCHOLARSHIP: apps.filter((a) => a.type === "SCHOLARSHIP").length,
    SCHOOL: apps.filter((a) => a.type === "SCHOOL").length,
    SUBMITTED: apps.filter((a) => ["APPLIED", "SUBMITTED", "ACCEPTED", "OFFER"].includes(a.status)).length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">All Applications</h1>
        <p className="text-sm text-slate-500">One hub for your job, scholarship and child-school applications</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            ["💼 Jobs", counts.JOB],
            ["🎓 Scholarships", counts.SCHOLARSHIP],
            ["🏫 Child Schools", counts.SCHOOL],
            ["✅ Submitted", counts.SUBMITTED],
          ].map(([l, v]) => (
            <div key={String(l)} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm text-slate-500">{l}</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">{v}</div>
            </div>
          ))}
        </div>
        <BulkSubmitButton pendingCount={apps.filter((a) => !["APPLIED", "SUBMITTED", "ACCEPTED", "OFFER"].includes(a.status)).length} />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {apps.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No applications yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Opportunity</th>
                <th className="px-4 py-3">Organization / Country</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Deadline</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {apps.map((a) => {
                const tm = typeMeta[a.type];
                return (
                  <tr key={a.type + a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tm.cls}`}>
                        {tm.emoji} {tm.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{a.title ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{a.org ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor(a.status)}`}>{a.status}</span>
                      {a.confirmationNumber && <div className="mt-1 text-[10px] text-emerald-700">{a.confirmationNumber}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{a.deadline ? new Date(a.deadline).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={a.detailUrl} className="text-sm font-medium text-brand-600 hover:text-brand-700">
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
