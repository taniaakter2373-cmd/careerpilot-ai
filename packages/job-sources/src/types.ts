export interface JobCriteria {
  keywords?: string[];
  roles?: string[];
  locations?: string[];
  countries?: string[];
  remoteTypes?: string[];
  employmentTypes?: string[];
}

export interface RawJob {
  source: string;
  sourceJobId: string | null;
  url: string;
  title: string;
  company: string;
  companyUrl?: string | null;
  location?: string | null;
  country?: string | null;
  city?: string | null;
  remoteType?: string;
  employmentType?: string;
  industry?: string | null;
  department?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  description?: string;
  requirements?: string[];
  responsibilities?: string[];
  educationRequirements?: string[];
  experienceRequired?: string | null;
  skills?: string[];
  postedDate?: string | null;
  closingDate?: string | null;
  applicationMethod?: string;
  applicationUrl?: string | null;
}

export type ApplicationResultStatus =
  | "SUBMITTED"
  | "MANUAL_APPLICATION_REQUIRED"
  | "CAPTCHA_REQUIRED"
  | "MFA_REQUIRED"
  | "LOGIN_REQUIRED";

export interface ApplicationResult {
  status: ApplicationResultStatus;
  confirmationNumber?: string;
  error?: string;
  url?: string;
}

/**
 * JobSource — pluggable interface for job discovery and application.
 *
 * Implementors MUST NOT bypass CAPTCHA, MFA, login, anti-bot, rate limits, or a
 * site's Terms of Service. When automation is not permitted, return
 * `MANUAL_APPLICATION_REQUIRED` and provide the job URL for the user.
 */
export interface JobSource {
  readonly name: string;
  searchJobs(criteria: JobCriteria): Promise<RawJob[]>;
  getJobDetails(url: string): Promise<RawJob>;
  supportsApplicationAutomation(): boolean;
  apply(job: RawJob, candidate: { name: string; email: string }): Promise<ApplicationResult>;
}
