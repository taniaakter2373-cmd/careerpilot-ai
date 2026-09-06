"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

interface English {
  ieltsStatus: string;
  ieltsOverallBand: number | null;
  listeningBand: number | null;
  readingBand: number | null;
  writingBand: number | null;
  speakingBand: number | null;
  ieltsModule: string | null;
  otherEnglishTest: string | null;
  toeflScore: number | null;
  pteScore: number | null;
  duolingoScore: number | null;
  englishProficiency: string;
}

export default function IeltsPage() {
  const router = useRouter();
  const [f, setF] = useState<English | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/api/english-profile`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setF(d));
  }, []);

  if (!f) return <p className="text-sm text-slate-500">Loading…</p>;

  const set = (k: string, v: unknown) => setF((p) => (p ? { ...p, [k]: v } : p));

  async function save() {
    setError("");
    const res = await fetch(`${API_BASE}/api/english-profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    if (!res.ok) { setError("Save failed"); return; }
    setSaved(true);
    router.refresh();
  }

  const num = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value === "" ? null : Number(e.target.value);
    set(k, v);
  };

  const field = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">🗣️ IELTS / English Profile</h1>
        <p className="text-sm text-slate-500">Used to assess each Europe job. <b>Not having IELTS never makes you ineligible</b> — it is evaluated per job and per visa route.</p>
      </div>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <label className="text-sm text-slate-600">IELTS Status
            <select value={f.ieltsStatus} onChange={(e) => set("ieltsStatus", e.target.value)} className={`mt-1 block w-full ${field}`}>
              <option value="NOT_AVAILABLE">Not Available</option>
              <option value="AVAILABLE">Available</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="EXEMPT">Exempt (English-medium)</option>
            </select>
          </label>
          <label className="text-sm text-slate-600">English Proficiency
            <select value={f.englishProficiency} onChange={(e) => set("englishProficiency", e.target.value)} className={`mt-1 block w-full ${field}`}>
              <option value="UNKNOWN">Unknown</option>
              <option value="BASIC">Basic</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="UPPER_INTERMEDIATE">Upper Intermediate</option>
              <option value="ADVANCED">Advanced</option>
              <option value="NATIVE">Native</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {(["ieltsOverallBand", "listeningBand", "readingBand", "writingBand", "speakingBand"] as const).map((k) => (
            <label key={k} className="text-sm text-slate-600 capitalize">{k.replace("ielts", "IELTS ").replace("Band", "Band")}
              <input type="number" step="0.5" min="0" max="9" value={f[k] ?? ""} onChange={num(k)} className={`mt-1 block w-full ${field}`} />
            </label>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="text-sm text-slate-600">Other English Test
            <select value={f.otherEnglishTest ?? "NONE"} onChange={(e) => set("otherEnglishTest", e.target.value)} className={`mt-1 block w-full ${field}`}>
              <option value="NONE">None</option>
              <option value="TOEFL">TOEFL</option>
              <option value="PTE">PTE</option>
              <option value="DUOLINGO">Duolingo</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
          <label className="text-sm text-slate-600">TOEFL Score
            <input type="number" value={f.toeflScore ?? ""} onChange={num("toeflScore")} className={`mt-1 block w-full ${field}`} />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <label className="text-sm text-slate-600">PTE Score
            <input type="number" value={f.pteScore ?? ""} onChange={num("pteScore")} className={`mt-1 block w-full ${field}`} />
          </label>
          <label className="text-sm text-slate-600">Duolingo Score
            <input type="number" value={f.duolingoScore ?? ""} onChange={num("duolingoScore")} className={`mt-1 block w-full ${field}`} />
          </label>
        </div>
      </section>

      {saved && <p className="text-sm font-medium text-emerald-700">Saved ✓</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button onClick={save} className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700">Save English Profile</button>

      <p className="rounded-lg bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500">
        Where an employer or visa route genuinely requires IELTS, the app will flag a Gap and check whether TOEFL / PTE / Duolingo / English-medium education is accepted. It never self-rejects a job purely because IELTS is absent.
      </p>
    </div>
  );
}
