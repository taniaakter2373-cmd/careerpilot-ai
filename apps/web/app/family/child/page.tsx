export const dynamic = "force-dynamic";

import Link from "next/link";
import { apiGet } from "@/lib/api";

interface ChildProfile {
  id: string;
  fullName: string;
  dateOfBirth: string | null;
  age: number | null;
  nationality: string | null;
  passportStatus: string | null;
  currentSchool: string | null;
  currentGrade: string | null;
  language: string | null;
  specialSchoolingRequirements: string | null;
  preferredSchoolingLanguage: string | null;
  preferredCurriculum: string | null;
  preferredCountry: string | null;
  preferredCity: string | null;
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="text-sm text-slate-500">{label}</div>
      <div className="font-medium text-slate-900">{value ?? "—"}</div>
    </div>
  );
}

export default async function FamilyChildPage() {
  const child = await apiGet<ChildProfile | null>("/api/family/child-profile");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/family" className="text-sm text-brand-600 hover:text-brand-700">
          ← Back to Study + Family
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Child Profile</h1>
      </div>

      {!child ? (
        <p className="text-sm text-slate-500">No child profile yet.</p>
      ) : (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">{child.fullName}</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Date of birth" value={child.dateOfBirth ? new Date(child.dateOfBirth).toLocaleDateString() : null} />
            <Field label="Age" value={child.age != null ? `${child.age} years` : null} />
            <Field label="Nationality" value={child.nationality} />
            <Field label="Passport" value={child.passportStatus} />
            <Field label="Current grade" value={child.currentGrade} />
            <Field label="Current school" value={child.currentSchool} />
            <Field label="Language" value={child.language} />
            <Field label="Preferred schooling language" value={child.preferredSchoolingLanguage} />
            <div className="col-span-2">
              <div className="text-sm text-slate-500">Preferred curriculum</div>
              <div className="font-medium text-slate-900">{child.preferredCurriculum ?? "—"}</div>
            </div>
            <Field label="Preferred country" value={child.preferredCountry} />
            <Field label="Preferred city" value={child.preferredCity} />
          </div>
        </section>
      )}

      <p className="text-xs text-slate-500">
        Profile is stored securely. All visa/school claims in family assessments must be verified with official authorities.
      </p>
    </div>
  );
}
