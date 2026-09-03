"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

function statusColor(s: string): string {
  switch (s) {
    case "APPLIED":
    case "OFFER":
      return "bg-emerald-100 text-emerald-700";
    case "APPROVED":
    case "INTERVIEW":
    case "FINAL_INTERVIEW":
    case "SCREENING":
      return "bg-teal-100 text-teal-700";
    case "PREPARED":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export function ApplicationStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor(status)}`}>
      {status}
    </span>
  );
}

export function ApplicationActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function act(path: string) {
    setLoading(true);
    setError("");
    const res = await fetch(`${API_BASE}/api/applications/${id}${path}`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.message ?? data.error ?? "Action failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {status === "PREPARED" && (
          <button
            onClick={() => act("/approve")}
            disabled={loading}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            Approve & Prepare
          </button>
        )}
        {status === "APPROVED" && (
          <button
            onClick={() => act("/apply")}
            disabled={loading}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Submit Application
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
