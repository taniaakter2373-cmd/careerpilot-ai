import type { RawJob } from "./types";

export interface NormalizedJob {
  source: string;
  sourceJobId: string | null;
  url: string;
  title: string;
  company: string;
  companyUrl: string | null;
  location: string | null;
  country: string | null;
  city: string | null;
  remoteType: string;
  employmentType: string;
  industry: string | null;
  department: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  description: string;
  requirements: string[];
  responsibilities: string[];
  educationRequirements: string[];
  experienceRequired: string | null;
  skills: string[];
  postedDate: Date | null;
  closingDate: Date | null;
  applicationMethod: string;
  applicationUrl: string | null;
}

const str = (s: string | null | undefined) => (s ?? "").trim();

/** Normalize a raw source job into the canonical stored shape. */
export function normalizeJob(raw: RawJob): NormalizedJob {
  const toDate = (s: string | null | undefined): Date | null => {
    if (!s) return null;
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  return {
    source: str(raw.source) || "unknown",
    sourceJobId: raw.sourceJobId ?? null,
    url: str(raw.url),
    title: str(raw.title),
    company: str(raw.company),
    companyUrl: raw.companyUrl ?? null,
    location: raw.location ?? null,
    country: raw.country ?? null,
    city: raw.city ?? null,
    remoteType: raw.remoteType ?? "ANY",
    employmentType: raw.employmentType ?? "ANY",
    industry: raw.industry ?? null,
    department: raw.department ?? null,
    salaryMin: raw.salaryMin ?? null,
    salaryMax: raw.salaryMax ?? null,
    salaryCurrency: raw.salaryCurrency ?? null,
    description: str(raw.description),
    requirements: raw.requirements ?? [],
    responsibilities: raw.responsibilities ?? [],
    educationRequirements: raw.educationRequirements ?? [],
    experienceRequired: raw.experienceRequired ?? null,
    skills: raw.skills ?? [],
    postedDate: toDate(raw.postedDate),
    closingDate: toDate(raw.closingDate),
    applicationMethod: raw.applicationMethod ?? "MANUAL",
    applicationUrl: raw.applicationUrl ?? null,
  };
}
