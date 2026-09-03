"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

export function SchoolApplyButton({ schoolId }: { schoolId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function apply() {
    setLoading(true);
    setError("");
    const res = await fetch(`${API_BASE}/api/family/school-applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schoolId }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to start application");
      return;
    }
    router.push("/family/school-applications");
  }

  return (
    <div className="space-y-1">
      <button
        onClick={apply}
        disabled={loading}
        className="w-full rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? "Starting…" : "Apply for Admission"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
