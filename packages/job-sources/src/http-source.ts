import type { ApplicationResult, JobCriteria, JobSource, RawJob } from "./types";

export interface HttpClientConfig {
  /** Minimum interval between requests (rate limiting). */
  minIntervalMs?: number;
  headers?: Record<string, string>;
}

/**
 * Base class for HTTP-based job sources (public pages only).
 *
 * - Rate-limits requests.
 * - Throws on non-2xx/parse failures so the registry reports SOURCE_UNAVAILABLE.
 * - Never supports automated application (override if a source explicitly permits it).
 * - Does NOT bypass CAPTCHA, login, anti-bot, or access controls.
 */
export abstract class HttpJobSource implements JobSource {
  abstract readonly name: string;
  protected minIntervalMs: number;
  private headers: Record<string, string>;
  private lastRequest = 0;

  constructor(config: HttpClientConfig = {}) {
    this.minIntervalMs = config.minIntervalMs ?? 2000;
    this.headers = {
      "User-Agent": "Mozilla/5.0 (compatible; CareerPilot/0.1; +job-search-assistant)",
      Accept: "text/html",
      ...config.headers,
    };
  }

  protected abstract searchUrl(criteria: JobCriteria): string;
  protected abstract parseListings(html: string): RawJob[];

  protected async fetchHtml(url: string): Promise<string> {
    const wait = this.lastRequest + this.minIntervalMs - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    this.lastRequest = Date.now();

    const res = await fetch(url, { headers: this.headers });
    if (!res.ok) throw new Error(`SOURCE_UNAVAILABLE (HTTP ${res.status})`);
    return res.text();
  }

  async searchJobs(criteria: JobCriteria): Promise<RawJob[]> {
    const html = await this.fetchHtml(this.searchUrl(criteria));
    return this.parseListings(html);
  }

  async getJobDetails(url: string): Promise<RawJob> {
    const html = await this.fetchHtml(url);
    const parsed = this.parseListings(html);
    if (parsed.length === 0) throw new Error("JOB_NOT_FOUND");
    return { ...parsed[0], url };
  }

  supportsApplicationAutomation(): boolean {
    return false;
  }

  async apply(job: RawJob, _candidate: { name: string; email: string }): Promise<ApplicationResult> {
    return { status: "MANUAL_APPLICATION_REQUIRED", url: job.url };
  }
}
