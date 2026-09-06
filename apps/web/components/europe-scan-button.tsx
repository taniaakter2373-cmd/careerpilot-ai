"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

export function EuropeScanButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function scan() {
    setLoading(true);
    setError("");
    setResult(null);
    const res = await fetch(`${API_BASE}/api/europe/jobs`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? data.message ?? "Scan failed");
      return;
    }
    setResult(`Scan complete — found ${data.found}, added ${data.added}, skipped ${data.skipped}`);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button onClick={scan} disabled={loading}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
        {loading ? "Scanning…" : "⟳ Scan Europe Jobs"}
      </button>
      {result && <span className="text-xs text-emerald-700">{result}</span>}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
