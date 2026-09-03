"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

function color(s: string): string {
  if (["SUBMITTED", "ACCEPTED"].includes(s)) return "bg-emerald-100 text-emerald-700";
  if (s === "APPROVED") return "bg-teal-100 text-teal-700";
  if (["RESEARCHING", "PREPARING", "READY_FOR_REVIEW"].includes(s)) return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

export function CertStatusBadge({ status }: { status: string }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${color(status)}`}>{status}</span>;
}

export function CertAppActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  async function act(path: string) {
    setLoading(true);
    setError("");
    const res = await fetch(`${API_BASE}/api/certification-applications/${id}${path}`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.message ?? data.error ?? "Action failed");
      return;
    }
    setConfirming(false);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {["RESEARCHING", "PREPARING", "READY_FOR_REVIEW"].includes(status) && (
          <button onClick={() => act("/approve")} disabled={loading} className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
            Approve
          </button>
        )}
        {status === "APPROVED" &&
          (confirming ? (
            <span className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-600">
              I reviewed and authorize enrolment.
              <button onClick={() => act("/submit")} disabled={loading} className="rounded bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white">
                Confirm
              </button>
              <button onClick={() => setConfirming(false)} className="rounded bg-slate-200 px-2.5 py-1 text-xs text-slate-700">
                Cancel
              </button>
            </span>
          ) : (
            <button onClick={() => setConfirming(true)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">
              Enrol / Submit
            </button>
          ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
