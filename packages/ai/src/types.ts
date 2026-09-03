import type { CandidateProfile } from "@careerpilot/shared";

export interface JobAnalysis {
  title: string | null;
  company: string | null;
  location: string | null;
  country: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  experienceRequired: string | null;
  educationRequirements: string[];
  skills: string[];
  requirements: string[];
  responsibilities: string[];
  industry: string | null;
  seniority: string | null;
  remoteType: string | null;
  employmentType: string | null;
  applicationDeadline: string | null;
}

export interface CoverLetterInput {
  candidate: {
    name: string;
    currentTitle: string | null;
    yearsExperience: number | null;
    summary: string | null;
    skills: string[];
  };
  job: {
    title: string;
    company: string;
    description: string;
    skills: string[];
  };
}

export interface QuestionAnswer {
  answer: string;
  status: "ANSWERED" | "USER_INPUT_REQUIRED";
}

export interface TailoredCv {
  suggestions: string[];
  note: string;
}

/**
 * AIProvider — provider abstraction for language tasks.
 *
 * Note: job *scoring* is intentionally NOT here. Scoring is a deterministic,
 * transparent function in `@careerpilot/matching` (auditable and explainable).
 * The AI provider handles analysis, generation, and gap detection.
 */
export interface AIProvider {
  readonly name: string;
  analyzeJob(jobText: string): Promise<JobAnalysis>;
  generateCoverLetter(input: CoverLetterInput): Promise<string>;
  answerApplicationQuestion(question: string, profile: CandidateProfile): Promise<QuestionAnswer>;
  analyzeSkillGap(profile: CandidateProfile, marketSkills: string[]): Promise<string[]>;
  tailorCV(cv: string, job: JobAnalysis): Promise<TailoredCv>;
}
