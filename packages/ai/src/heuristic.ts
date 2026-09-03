import type { CandidateProfile } from "@careerpilot/shared";
import type { AIProvider, CoverLetterInput, JobAnalysis, QuestionAnswer, TailoredCv } from "./types";

const HR_SKILLS = [
  "total rewards", "compensation", "benefits", "salary benchmarking", "job evaluation",
  "payroll", "performance management", "kpi", "talent management", "recruitment", "talent acquisition",
  "assessment center", "hr business partner", "hrbp", "hr analytics", "workforce planning",
  "employee engagement", "succession", "organizational development", "hr operations", "compliance",
  "hrms", "erp", "peopledesk", "reward", "compensation & benefits", "people analytics", "hr budgeting",
];

const norm = (s: string | null | undefined) => (s ?? "").toLowerCase().trim();

function extractSalary(text: string): Pick<JobAnalysis, "salaryMin" | "salaryMax" | "salaryCurrency"> {
  const currencies = ["BDT", "USD", "AED", "SAR", "QAR", "GBP", "CAD", "AUD", "SGD", "$", "£", "€", "৳"];
  const curRe = currencies.map((c) => c.replace(/[$£€]/g, "\\$&")).join("|");
  const re = new RegExp(`(${curRe})\\s*([\\d,]+(?:\\.[\\d]+)?)\\s*(?:-|to|–)\\s*([\\d,]+(?:\\.[\\d]+)?)`, "i");
  const m = text.match(re);
  if (m) {
    const toNum = (s: string) => Number(s.replace(/,/g, ""));
    const cur = m[1].toUpperCase().replace(/[$£€৳]/g, (x) => (x === "$" ? "USD" : x === "£" ? "GBP" : x === "€" ? "EUR" : "BDT"));
    return { salaryMin: toNum(m[2]), salaryMax: toNum(m[3]), salaryCurrency: cur };
  }
  return { salaryMin: null, salaryMax: null, salaryCurrency: null };
}

function extractExperience(text: string): string | null {
  const m = text.match(/(\d+(?:\.\d+)?)\s*(?:-|to|–)\s*(\d+(?:\.\d+)?)\s*(?:years|yrs)/i);
  if (m) return `${m[1]}-${m[2]} years`;
  const m2 = text.match(/(\d+(?:\.\d+)?)\s*\+\s*(?:years|yrs)/i);
  if (m2) return `${m2[1]}+ years`;
  const m3 = text.match(/at least\s+(\d+(?:\.\d+)?)\s*(?:years|yrs)/i);
  if (m3) return `${m3[1]}+ years`;
  return null;
}

/**
 * Deterministic, offline AI provider. Produces transparent, reproducible output
 * using only the input text — no external calls, no hallucination. This is the
 * safe default when no LLM API key is configured.
 */
export class HeuristicProvider implements AIProvider {
  readonly name: string = "heuristic";

  async analyzeJob(text: string): Promise<JobAnalysis> {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const title = lines[0]?.replace(/^#+\s*/, "") ?? null;
    const company = lines[1] ?? null;

    const salary = extractSalary(text);
    const experienceRequired = extractExperience(text);

    const lower = text.toLowerCase();
    const educationRequirements: string[] = [];
    if (/master|mba|postgrad/.test(lower)) educationRequirements.push("Master's / MBA");
    if (/bachelor|undergrad|bsc|bba/.test(lower)) educationRequirements.push("Bachelor's degree");

    const skills = HR_SKILLS.filter((s) => lower.includes(s));

    const requirements = lines
      .filter((l) => /^(requirements?|must have|qualifications?)[:.\-]/i.test(l) || /^[-•*]\s+/.test(l))
      .map((l) => l.replace(/^[-•*]\s+/, "").replace(/^(requirements?|must have|qualifications?)[:.\-]\s*/i, ""))
      .slice(0, 20);

    const responsibilities = lines
      .filter((l) => /^(responsibilities?|duties|key accountabilities?)[:.\-]/i.test(l) || /^[-•*]\s+/.test(l))
      .map((l) => l.replace(/^[-•*]\s+/, "").replace(/^(responsibilities?|duties|key accountabilities?)[:.\-]\s*/i, ""))
      .slice(0, 20);

    const seniority = /senior|lead|head|director|vp|chief/.test(lower)
      ? "Senior"
      : /junior|associate|assistant/.test(lower)
        ? "Junior"
        : null;

    const remoteType = /remote|work from home/.test(lower) ? "REMOTE" : /hybrid/.test(lower) ? "HYBRID" : null;

    return {
      title,
      company,
      location: text.match(/location[:\s]+([^\n]+)/i)?.[1]?.trim() ?? null,
      country: null,
      ...salary,
      experienceRequired,
      educationRequirements,
      skills,
      requirements,
      responsibilities,
      industry: null,
      seniority,
      remoteType,
      employmentType: /full[- ]?time/.test(lower) ? "FULL_TIME" : /contract/.test(lower) ? "CONTRACT" : null,
      applicationDeadline: null,
    };
  }

  async generateCoverLetter(input: CoverLetterInput): Promise<string> {
    const c = input.candidate;
    const j = input.job;
    const years = c.yearsExperience != null ? `${c.yearsExperience} years` : "[experience — USER_INPUT_REQUIRED]";
    const title = c.currentTitle ?? "[current title — USER_INPUT_REQUIRED]";
    const skills = c.skills.slice(0, 5).join(", ");

    return `[DRAFT — review before use]

Dear Hiring Manager,

I am writing to apply for the ${j.title} position at ${j.company}. As ${title} with ${years} of experience in HR, I bring a strong background in ${skills || "HR and people operations"}.

${c.summary ? c.summary + "\n" : "[Add a short, factual summary of your most relevant experience — USER_INPUT_REQUIRED]\n"}

I am particularly drawn to this opportunity because it aligns with my experience in reward, compensation, and HR business partnering, and with my goal of growing into a broader HR leadership role.

Thank you for considering my application. I would welcome the opportunity to discuss how my background can contribute to ${j.company}.

Sincerely,
${c.name}`;
  }

  async answerApplicationQuestion(question: string, profile: CandidateProfile): Promise<QuestionAnswer> {
    const q = norm(question);
    if (/years of experience|experience.*years|total experience/.test(q)) {
      if (profile.yearsExperience != null) {
        return { answer: String(profile.yearsExperience), status: "ANSWERED" };
      }
      return { answer: "", status: "USER_INPUT_REQUIRED" };
    }
    if (/current designation|job title|current role|position/.test(q)) {
      return profile.currentTitle
        ? { answer: profile.currentTitle, status: "ANSWERED" }
        : { answer: "", status: "USER_INPUT_REQUIRED" };
    }
    if (/education|degree|qualification/.test(q)) {
      return profile.education
        ? { answer: profile.education, status: "ANSWERED" }
        : { answer: "", status: "USER_INPUT_REQUIRED" };
    }
    if (/notice period/.test(q)) {
      return profile.noticePeriod
        ? { answer: profile.noticePeriod, status: "ANSWERED" }
        : { answer: "", status: "USER_INPUT_REQUIRED" };
    }
    if (/salary expectation|expected salary|current salary|ctc/.test(q)) {
      return profile.salaryExpectation.min != null
        ? { answer: `${profile.salaryExpectation.currency ?? ""} ${profile.salaryExpectation.min}`, status: "ANSWERED" }
        : { answer: "", status: "USER_INPUT_REQUIRED" };
    }
    if (/name/.test(q)) {
      return profile.name ? { answer: profile.name, status: "ANSWERED" } : { answer: "", status: "USER_INPUT_REQUIRED" };
    }
    if (/email/.test(q)) {
      return profile.email ? { answer: profile.email, status: "ANSWERED" } : { answer: "", status: "USER_INPUT_REQUIRED" };
    }
    if (/visa|work authorization|work permit/.test(q)) {
      return { answer: "", status: "USER_INPUT_REQUIRED" };
    }
    return { answer: "", status: "USER_INPUT_REQUIRED" };
  }

  async analyzeSkillGap(profile: CandidateProfile, marketSkills: string[]): Promise<string[]> {
    const have = profile.skills.map(norm).filter(Boolean);
    return marketSkills.filter((s) => {
      const t = norm(s);
      return !have.some((h) => h.includes(t) || t.includes(h));
    });
  }

  async tailorCV(cv: string, job: JobAnalysis): Promise<TailoredCv> {
    const jobSkills = (job.skills ?? []).map(norm).filter(Boolean);
    const cvLower = norm(cv);
    const missing = jobSkills.filter((s) => !cvLower.includes(s));
    return {
      suggestions: missing.map((s) => `Add/emphasise keyword: ${s}`),
      note: "Suggestions are keyword-based only. No experience or facts were invented.",
    };
  }
}
