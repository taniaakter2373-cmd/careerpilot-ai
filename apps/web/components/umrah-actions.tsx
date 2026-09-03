"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

export function UmrahApplyButton({ umrahId }: { umrahId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function apply() {
    setLoading(true);
    setError("");
    const res = await fetch(`${API_BASE}/api/umrah/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ umrahId }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed");
      return;
    }
    setResult(data.status === "APPROVED" ? "Approved" : "Preparing");
    router.refresh();
  }

  return (
    <div>
      <button onClick={apply} disabled={loading} className="w-full rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
        {loading ? "Preparing…" : "Prepare Application"}
      </button>
      {result && <p className="mt-1 text-xs font-medium text-emerald-700">Application {result}. Final submission is manual-only (USER_APPROVAL).</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
