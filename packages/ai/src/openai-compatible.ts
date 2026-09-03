import { HeuristicProvider } from "./heuristic";
import type { AIProvider, CoverLetterInput, JobAnalysis } from "./types";

interface OpenAIConfig {
  apiKey: string;
  baseURL: string;
  model: string;
}

/**
 * OpenAI-compatible provider (works with OpenAI, OpenRouter, OmniRoute, Azure,
 * or any /chat/completions endpoint). Falls back to deterministic heuristics on
 * any network/parse error so the system never silently breaks.
 */
export class OpenAICompatibleProvider extends HeuristicProvider implements AIProvider {
  readonly name = "openai-compatible";
  private readonly cfg: OpenAIConfig;

  constructor(cfg: OpenAIConfig) {
    super();
    this.cfg = cfg;
  }

  private async complete(prompt: string): Promise<string> {
    const res = await fetch(`${this.cfg.baseURL.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: this.cfg.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      }),
    });
    if (!res.ok) throw new Error(`LLM request failed: ${res.status}`);
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("LLM returned empty content");
    return content;
  }

  async analyzeJob(text: string): Promise<JobAnalysis> {
    try {
      const prompt = `Extract structured job data as JSON with keys: title, company, location, country, salaryMin, salaryMax, salaryCurrency, experienceRequired, educationRequirements (array), skills (array), requirements (array), responsibilities (array), industry, seniority, remoteType, employmentType, applicationDeadline. Use null for missing values. Only include information present in the text. Job posting:\n\n${text.slice(0, 6000)}`;
      const raw = await this.complete(prompt);
      const json = JSON.parse(raw.replace(/```json|```/g, "").trim());
      return { ...(await super.analyzeJob(text)), ...json };
    } catch {
      return super.analyzeJob(text);
    }
  }

  async generateCoverLetter(input: CoverLetterInput): Promise<string> {
    try {
      const prompt = `Write a concise, professional, factual cover letter (3-4 paragraphs) for the following candidate and job. Do NOT invent any experience, achievements, or certifications not listed. If information is missing, use a neutral phrase.\n\nCandidate: ${JSON.stringify(input.candidate)}\n\nJob: ${JSON.stringify(input.job)}`;
      return await this.complete(prompt);
    } catch {
      return super.generateCoverLetter(input);
    }
  }
}
