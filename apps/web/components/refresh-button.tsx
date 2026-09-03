"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

export function RefreshButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    setError("");
    setResult(null);
    const res = await fetch(`${API_BASE}/api/refresh`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.message ?? "Refresh failed");
      return;
    }
    setResult(`Updated ${new Date().toLocaleTimeString()} — jobs rescored: ${data.jobsRescored}, scholarships: ${data.scholarshipsRescored}, umrah refreshed: ${data.umrahPackagesRefreshed}, new jobs: ${data.jobsAdded}`);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={refresh}
        disabled={loading}
        className="rounded-lg border border-brand-600 bg-white px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 disabled:opacity-50"
      >
        {loading ? "Refreshing…" : "⟳ Refresh Live Data"}
      </button>
      {result && <span className="text-xs text-slate-500">{result}</span>}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
