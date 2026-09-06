export const dynamic = "force-dynamic";

import Link from "next/link";
import { apiGet } from "@/lib/api";
import { EuropeStatusBadge, EuropeAdvanceActions } from "@/components/europe-app-actions";

interface App {
  id: string;
  title: string | null;
  company: string | null;
  country: string | null;
  status: string;
  applicationDate: string | null;
  interviewDate: string | null;
  nextAction: string | null;
  confirmationNumber: string | null;
  applicationUrl: string | null;
}

export default async function EuropeApplicationsPage() {
  const apps = await apiGet<App[]>("/api/europe/applications");
  return (
    <div className="space-y-6">
      <div>
        <Link href="/europe" className="text-sm text-brand-600 hover:text-brand-700">← Back to Europe Overview</Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">🇪🇺 Europe Applications</h1>
        <p className="text-sm text-slate-500">Track your European job pipeline — from discovery to relocation</p>
      </div>

      {apps.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Nothing tracked yet. Open a Europe job and click &quot;Track Application&quot;.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Next action</th>
                <th className="px-4 py-3">Advance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {apps.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{a.title ?? "—"}</div>
                    <div className="text-xs text-slate-500">{a.company ?? ""}</div>
                    {a.applicationUrl && <a className="text-xs text-brand-600" href={a.applicationUrl} target="_blank" rel="noopener noreferrer">Apply ↗</a>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{a.country ?? "—"}</td>
                  <td className="px-4 py-3">
                    <EuropeStatusBadge status={a.status} />
                    {a.confirmationNumber && <div className="mt-1 text-[10px] text-emerald-700">{a.confirmationNumber}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{a.nextAction ?? "—"}</td>
                  <td className="px-4 py-3"><EuropeAdvanceActions id={a.id} status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[11px] text-slate-400">
        Applying to any external portal is never automated — the app tracks stages; final submission always requires you on the employer site.
      </p>
    </div>
  );
}
