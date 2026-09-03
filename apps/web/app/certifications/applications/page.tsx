export const dynamic = "force-dynamic";

import Link from "next/link";
import { apiGet } from "@/lib/api";
import { CertAppActions, CertStatusBadge } from "@/components/cert-app-actions";

interface CertApp {
  id: string;
  certificationName: string | null;
  provider: string | null;
  category: string | null;
  status: string;
  confirmationNumber: string | null;
  applicationDate: string | null;
}

export default async function CertApplicationsPage() {
  const apps = await apiGet<CertApp[]>("/api/certification-applications");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/certifications" className="text-sm text-brand-600 hover:text-brand-700">
          ← Back to certifications
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Certification Applications</h1>
        <p className="text-sm text-slate-500">Track certification enrolment applications</p>
      </div>

      {apps.length === 0 ? (
        <p className="text-sm text-slate-500">No certification applications yet. Open a certification and click "Apply / Prepare Application".</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Certification</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {apps.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{a.certificationName ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{a.provider ?? "—"}</td>
                  <td className="px-4 py-3">
                    <CertStatusBadge status={a.status} />
                    {a.confirmationNumber && <div className="mt-1 text-[10px] text-emerald-700">{a.confirmationNumber}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <CertAppActions id={a.id} status={a.status} />
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
