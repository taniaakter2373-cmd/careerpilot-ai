import type {
  ApplicationMethod,
  ApplicationMode,
  ApplicationStatus,
  Currency,
  EmploymentType,
  JobStatus,
  Recommendation,
  RecommendationAction,
  RemoteType,
} from "./enums";

export interface CandidateProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  location: string | null;
  country: string | null;
  currentTitle: string | null;
  yearsExperience: number | null;
  education: string | null;
  skills: string[];
  certifications: string[];
  industries: string[];
  targetRoles: string[];
  targetCompanies: string[];
  preferredLocations: string[];
  workPreferences: { remote: RemoteType; employment: EmploymentType };
  salaryExpectation: { min: number | null; currency: Currency };
  noticePeriod: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  summary: string | null;
  careerGoals: string[];
}

export interface Job {
  id: string;
  source: string;
  sourceJobId: string | null;
  url: string;
  title: string;
  company: string;
  companyUrl: string | null;
  location: string | null;
  country: string | null;
  city: string | null;
  remoteType: RemoteType;
  employmentType: EmploymentType;
  industry: string | null;
  department: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: Currency | null;
  description: string;
  requirements: string[];
  responsibilities: string[];
  educationRequirements: string[];
  experienceRequired: string | null;
  skills: string[];
  postedDate: string | null;
  closingDate: string | null;
  scrapedAt: string;
  applicationMethod: ApplicationMethod;
  applicationUrl: string | null;
  duplicateHash: string | null;
  status: JobStatus;
}

export interface MatchBreakdown {
  role: number;
  experience: number;
  skills: number;
  industry: number;
  location: number;
  education: number;
  salary: number;
  growth: number;
}

export interface MatchWeights {
  role: number;
  experience: number;
  skills: number;
  industry: number;
  location: number;
  education: number;
  salary: number;
  growth: number;
}

export interface MatchResult {
  jobId: string;
  overallScore: number;
  breakdown: MatchBreakdown;
  weights: MatchWeights;
  whyMatched: string[];
  missingRequirements: string[];
  riskFlags: string[];
  recommendation: Recommendation;
  action: RecommendationAction;
  hardRequirementFailure: boolean;
  targetCompanyBonus: boolean;
  createdAt: string;
}

export interface Cv {
  id: string;
  name: string;
  filePath: string | null;
  version: number;
  targetRole: string | null;
  targetCountry: string | null;
  skills: string[];
  createdAt: string;
  updatedAt: string;
  isDefault: boolean;
}

export interface Application {
  id: string;
  jobId: string;
  candidateId: string | null;
  cvId: string | null;
  coverLetterId: string | null;
  applicationDate: string | null;
  applicationMethod: ApplicationMethod;
  mode: ApplicationMode;
  status: ApplicationStatus;
  applicationUrl: string | null;
  confirmationNumber: string | null;
  notes: string | null;
  nextFollowUpDate: string | null;
  recruiterName: string | null;
  recruiterEmail: string | null;
  interviewDate: string | null;
  offerStatus: string | null;
}

export const DEFAULT_MATCH_WEIGHTS: MatchWeights = {
  role: 0.25,
  experience: 0.2,
  skills: 0.2,
  industry: 0.1,
  location: 0.1,
  education: 0.05,
  salary: 0.05,
  growth: 0.05,
};

export function recommendationFromScore(score: number): Recommendation {
  if (score >= 90) return "STRONG_MATCH";
  if (score >= 80) return "GOOD_MATCH";
  if (score >= 70) return "MODERATE_MATCH";
  if (score >= 60) return "LOW_MATCH";
  return "NOT_RECOMMENDED";
}

export function actionFromRecommendation(
  recommendation: Recommendation,
  hardRequirementFailure: boolean,
): RecommendationAction {
  if (hardRequirementFailure) return "SKIP";
  if (recommendation === "STRONG_MATCH" || recommendation === "GOOD_MATCH") return "APPLY";
  if (recommendation === "MODERATE_MATCH") return "REVIEW";
  return "SKIP";
}
