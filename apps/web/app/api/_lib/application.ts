import { prisma } from "@careerpilot/database";

export interface ValidationIssue {
  field: string;
  severity: "BLOCKING" | "WARNING";
  message: string;
}

export interface CandidateForApplication {
  name: string;
  email: string;
  phone: string | null;
  yearsExperience: number | null;
  education: string | null;
  noticePeriod: string | null;
  salaryMin: number | null;
  salaryCurrency: string | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function validateApplication(opts: {
  candidate: CandidateForApplication | null;
  cvId: string | null;
  coverLetterId: string | null;
  jobId: string;
  ignoreApplicationId?: string;
}): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  if (!opts.candidate) {
    issues.push({ field: "candidate", severity: "BLOCKING", message: "Candidate profile not found" });
    return issues;
  }

  if (!opts.candidate.name) issues.push({ field: "name", severity: "BLOCKING", message: "Candidate name is missing" });
  if (!opts.candidate.email || !EMAIL_RE.test(opts.candidate.email))
    issues.push({ field: "email", severity: "BLOCKING", message: "Candidate email is missing or invalid" });
  if (!opts.candidate.phone) issues.push({ field: "phone", severity: "WARNING", message: "Phone number is missing" });
  if (!opts.cvId) issues.push({ field: "cv", severity: "BLOCKING", message: "No CV selected" });
  if (!opts.coverLetterId) issues.push({ field: "coverLetter", severity: "BLOCKING", message: "No cover letter prepared" });
  if (opts.candidate.yearsExperience == null)
    issues.push({ field: "experience", severity: "WARNING", message: "Years of experience not set" });
  if (!opts.candidate.education) issues.push({ field: "education", severity: "WARNING", message: "Education not set" });
  if (!opts.candidate.noticePeriod) issues.push({ field: "noticePeriod", severity: "WARNING", message: "Notice period not set" });
  if (opts.candidate.salaryMin == null)
    issues.push({ field: "salary", severity: "WARNING", message: "Salary expectation not set" });

  const duplicate = await prisma.application.findFirst({
    where: {
      jobId: opts.jobId,
      status: { in: ["PREPARED", "APPROVED", "APPLIED", "SCREENING", "INTERVIEW", "FINAL_INTERVIEW", "OFFER"] },
      ...(opts.ignoreApplicationId ? { id: { not: opts.ignoreApplicationId } } : {}),
    },
  });
  if (duplicate) issues.push({ field: "duplicate", severity: "BLOCKING", message: "An application already exists for this job" });

  return issues;
}

export function blockingIssues(issues: ValidationIssue[]): ValidationIssue[] {
  return issues.filter((i) => i.severity === "BLOCKING");
}

export async function loadCandidateForApplication(userId?: string): Promise<CandidateForApplication | null> {
  const profile = userId
    ? await prisma.candidateProfile.findUnique({ where: { userId } })
    : await prisma.candidateProfile.findFirst();
  if (!profile) return null;
  return {
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    yearsExperience: profile.yearsExperience,
    education: profile.education,
    noticePeriod: profile.noticePeriod,
    salaryMin: profile.salaryMin,
    salaryCurrency: profile.salaryCurrency,
  };
}
