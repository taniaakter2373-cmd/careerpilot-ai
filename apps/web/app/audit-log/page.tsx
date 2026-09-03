export const dynamic = "force-dynamic";

import { apiGet } from "@/lib/api";

interface AuditRow {
  id: string;
  action: string;
  oldStatus: string | null;
  newStatus: string | null;
  applicationMethod: string | null;
  result: string | null;
  job: string | null;
  createdAt: string;
}

function actionColor(a: string): string {
  if (a.includes("SUBMITTED") || a.includes("APPROVED")) return "bg-emerald-100 text-emerald-700";
  if (a.includes("PREPARED")) return "bg-blue-100 text-blue-700";
  if (a.includes("BLOCKED")) return "bg-red-100 text-red-700";
  return "bg-slate-100 text-slate-600";
}

export default async function AuditLogPage() {
  const logs = await apiGet<AuditRow[]>("/api/audit-log");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Audit Log</h1>
        <p className="text-sm text-slate-500">Complete submission trail — every action recorded with timestamp</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {logs.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No audit events yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Opportunity</th>
                <th className="px-4 py-3">Status change</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500">{new Date(l.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${actionColor(l.action)}`}>{l.action}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{l.job ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {l.oldStatus ? `${l.oldStatus} → ` : ""}{l.newStatus ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{l.applicationMethod ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{l.result ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Note: an "APPLIED/SUBMITTED" audit entry records that the application was submitted through the tracker with a
        confirmation number. Confirmation from the employer/school comes separately (portal / email receipt).
      </p>
    </div>
  );
}
