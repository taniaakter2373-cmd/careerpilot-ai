"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";
import { PageHeader, Chip, Disclaimer } from "@/components/ui";

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

const FIELD =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10";

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

  if (!f) return <p className="page text-sm text-slate-500">Loading…</p>;

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
    setTimeout(() => setSaved(false), 2500);
    router.refresh();
  }

  const num = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, e.target.value === "" ? null : Number(e.target.value));

  return (
    <div className="page">
      <PageHeader title="🗣️ IELTS / English Profile" subtitle="Evaluated per job and per visa route — having no IELTS never makes you ineligible" />

      <div className="card-section space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">IELTS Status</label>
            <select value={f.ieltsStatus} onChange={(e) => set("ieltsStatus", e.target.value)} className={FIELD}>
              <option value="NOT_AVAILABLE">Not Available</option>
              <option value="AVAILABLE">Available</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="EXEMPT">Exempt (English-medium education)</option>
            </select>
          </div>
          <div>
            <label className="label">English Proficiency</label>
            <select value={f.englishProficiency} onChange={(e) => set("englishProficiency", e.target.value)} className={FIELD}>
              <option value="UNKNOWN">Unknown</option>
              <option value="BASIC">Basic</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="UPPER_INTERMEDIATE">Upper Intermediate</option>
              <option value="ADVANCED">Advanced</option>
              <option value="NATIVE">Native</option>
            </select>
          </div>
        </div>

        <div>
          <div className="label">IELTS band scores (if taken)</div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {(["ieltsOverallBand", "listeningBand", "readingBand", "writingBand", "speakingBand"] as const).map((k) => (
              <div key={k}>
                <label className="text-xs font-medium text-slate-500 capitalize">
                  {k === "ieltsOverallBand" ? "Overall band" : k.replace("Band", "")}
                </label>
                <input type="number" step="0.5" min="0" max="9" value={f[k] ?? ""} onChange={num(k)} className={`mt-1 ${FIELD}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Other accepted English test</label>
            <select value={f.otherEnglishTest ?? "NONE"} onChange={(e) => set("otherEnglishTest", e.target.value)} className={FIELD}>
              <option value="NONE">None</option>
              <option value="TOEFL">TOEFL</option>
              <option value="PTE">PTE</option>
              <option value="DUOLINGO">Duolingo</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="label">TOEFL Score</label>
            <input type="number" value={f.toeflScore ?? ""} onChange={num("toeflScore")} className={FIELD} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">PTE</label>
              <input type="number" value={f.pteScore ?? ""} onChange={num("pteScore")} className={FIELD} />
            </div>
            <div>
              <label className="label">Duolingo</label>
              <input type="number" value={f.duolingoScore ?? ""} onChange={num("duolingoScore")} className={FIELD} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} className="btn-primary">Save English Profile</button>
        {saved && <Chip tone="emerald">Saved ✓</Chip>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <Chip tone="emerald">🟢 IELTS Not Required → apply now</Chip>
        <Chip tone="teal">🟡 English proficiency only → apply now</Chip>
        <Chip tone="amber">🟠 Employer or visa requires a test → verify alternatives</Chip>
      </div>

      <Disclaimer>
        Where an employer or visa route genuinely requires IELTS, the app flags a Gap and checks whether TOEFL / PTE / Duolingo / English-medium
        education is accepted. It never self-rejects a job purely because IELTS is absent.
      </Disclaimer>
    </div>
  );
}
