"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

export function PrepareApplicationButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function prepare() {
    setLoading(true);
    setError("");
    const res = await fetch(`${API_BASE}/api/applications/prepare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to prepare application");
      return;
    }
    router.push(`/applications/${data.application.id}`);
  }

  return (
    <div className="space-y-2">
      <button
        onClick={prepare}
        disabled={loading}
        className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? "Preparing…" : "Prepare Application"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
