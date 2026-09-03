export const dynamic = "force-dynamic";

import Link from "next/link";
import { apiGet } from "@/lib/api";
import { SchoolStatusBadge, SchoolApplicationActions } from "@/components/school-app-actions";

interface SchoolApp {
  id: string;
  schoolName: string | null;
  country: string | null;
  city: string | null;
  status: string;
  confirmationNumber: string | null;
  applicationDate: string | null;
}

export default async function SchoolApplicationsPage() {
  const apps = await apiGet<SchoolApp[]>("/api/family/school-applications");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/family/schools" className="text-sm text-brand-600 hover:text-brand-700">
          ← Back to schools
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Child School Applications</h1>
        <p className="text-sm text-slate-500">Track school admission applications</p>
      </div>

      {apps.length === 0 ? (
        <p className="text-sm text-slate-500">No school applications yet. Explore schools and apply.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">School</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {apps.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{a.schoolName ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{a.city ? `${a.city}, ` : ""}{a.country ?? "—"}</td>
                  <td className="px-4 py-3">
                    <SchoolStatusBadge status={a.status} />
                    {a.confirmationNumber && <div className="mt-1 text-xs text-emerald-700">{a.confirmationNumber}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <SchoolApplicationActions id={a.id} status={a.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
