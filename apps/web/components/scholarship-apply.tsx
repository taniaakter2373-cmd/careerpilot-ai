"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

export function ScholarshipApplyButton({ programmeId }: { programmeId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function apply() {
    setLoading(true);
    setError("");
    const res = await fetch(`${API_BASE}/api/scholarships/${programmeId}/apply`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to start application");
      return;
    }
    router.push(`/scholarships/applications/${data.id}`);
  }

  return (
    <div className="space-y-2">
      <button
        onClick={apply}
        disabled={loading}
        className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? "Preparing…" : "Apply / Prepare Application"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
