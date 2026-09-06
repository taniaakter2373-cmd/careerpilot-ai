export const dynamic = "force-dynamic";

import Link from "next/link";
import { apiGet } from "@/lib/api";
import { AwardStatusBadge, AwardAdvanceActions } from "@/components/award-app-actions";

interface AwardApp {
  id: string;
  awardName: string | null;
  organization: string | null;
  category: string | null;
  status: string;
  deadline: string | null;
  submissionDate: string | null;
  result: string | null;
  confirmationNumber: string | null;
  officialUrl: string | null;
}

export default async function AwardApplicationsPage() {
  const apps = await apiGet<AwardApp[]>("/api/award-applications");
  return (
    <div className="space-y-6">
      <div>
        <Link href="/awards" className="text-sm text-brand-600 hover:text-brand-700">← Back to awards</Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">🏆 Award Tracker</h1>
        <p className="text-sm text-slate-500">Track nominations from shortlist to submission to result</p>
      </div>

      {apps.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No awards tracked. Open an award and click &quot;Track&quot;.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Award</th>
                <th className="px-4 py-3">Deadline</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Advance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {apps.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{a.awardName ?? "—"}</div>
                    <div className="text-xs text-slate-500">{a.organization ?? ""}{a.result ? ` · Result: ${a.result}` : ""}</div>
                    {a.confirmationNumber && <div className="text-[10px] text-emerald-700">{a.confirmationNumber}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{a.deadline ? new Date(a.deadline).toLocaleDateString() : "Verify"}</td>
                  <td className="px-4 py-3"><AwardStatusBadge status={a.status} /></td>
                  <td className="px-4 py-3"><AwardAdvanceActions id={a.id} status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
