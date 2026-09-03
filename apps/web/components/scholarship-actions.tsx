"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

function color(status: string): string {
  switch (status) {
    case "SUBMITTED":
    case "SELECTED":
    case "SHORTLISTED":
      return "bg-emerald-100 text-emerald-700";
    case "APPROVED":
    case "INTERVIEW":
      return "bg-teal-100 text-teal-700";
    case "PREPARING":
    case "READY_FOR_REVIEW":
    case "RESEARCHING":
    case "ELIGIBILITY_CHECK":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export function ScholarshipStatusBadge({ status }: { status: string }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${color(status)}`}>{status}</span>;
}

export function ScholarshipApplicationActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  async function act(path: string, body?: Record<string, unknown>) {
    setLoading(true);
    setError("");
    const res = await fetch(`${API_BASE}/api/scholarship-applications/${id}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
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
        {["RESEARCHING", "ELIGIBILITY_CHECK", "PREPARING", "READY_FOR_REVIEW"].includes(status) && (
          <button
            onClick={() => act("/approve")}
            disabled={loading}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            Approve Application
          </button>
        )}
        {status === "APPROVED" &&
          (confirming ? (
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2">
              <span className="text-xs text-slate-600">I have reviewed this application and authorize submission.</span>
              <button onClick={() => act("/submit")} disabled={loading} className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">
                {loading ? "Submitting…" : "Confirm Submit"}
              </button>
              <button onClick={() => setConfirming(false)} className="rounded bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700">
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              disabled={loading}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Submit Application
            </button>
          ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
