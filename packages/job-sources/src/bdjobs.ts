import { HttpJobSource } from "./http-source";
import type { JobCriteria, RawJob } from "./types";

const stripTags = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

/**
 * Bdjobs.com connector (public job listings only).
 *
 * NOTE: Bdjobs.com renders listings via JavaScript, so a plain HTTP fetch may
 * return little or no parseable content. This source is best-effort and fails
 * gracefully (SOURCE_UNAVAILABLE / empty list) rather than bypassing any
 * rendering or anti-bot control. The Playwright-assisted fetch path (Phase 6)
 * is the correct way to read JS-rendered listings. Field mapping below is
 * indicative and should be validated against the live DOM before relying on it.
 */
export class BdjobsSource extends HttpJobSource {
  readonly name = "bdjobs";

  protected searchUrl(criteria: JobCriteria): string {
    const kw = (criteria.keywords ?? []).concat(criteria.roles ?? []).join(" ");
    const base = "https://www.bdjobs.com/";
    return kw ? `${base}jobsearch.asp?q=${encodeURIComponent(kw)}` : `${base}jobsearch.asp`;
  }

  protected parseListings(html: string): RawJob[] {
    const jobs: RawJob[] = [];
    // Anchor with a plausible job-title class or href, and non-trivial text.
    const anchorRe = /<a[^>]+href="([^"]+)"[^>]*class="[^"]*(?:job-title|jobtitle|job_title)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
    let m: RegExpExecArray | null;
    while ((m = anchorRe.exec(html)) !== null) {
      const href = m[1];
      const title = stripTags(m[2]).slice(0, 150);
      if (!title || title.length < 4) continue;

      // Best-effort company name: text near the title inside a company container.
      const company = this.findCompany(html, m.index);

      jobs.push({
        source: this.name,
        sourceJobId: href,
        url: href.startsWith("http") ? href : `https://www.bdjobs.com/${href.replace(/^\//, "")}`,
        title,
        company: company ?? "Unknown",
        location: null,
        country: "Bangladesh",
        city: null,
        remoteType: "ON_SITE",
        employmentType: "FULL_TIME",
        description: "",
        skills: [],
        requirements: [],
        responsibilities: [],
        educationRequirements: [],
        applicationMethod: "MANUAL",
      });
    }
    return jobs;
  }

  private findCompany(html: string, index: number): string | null {
    const window = html.slice(index, index + 400);
    const re = /class="[^"]*(?:company|company-name|org|organization)[^"]*"[^>]*>([\s\S]*?)<\/[a-z]+>/i;
    const m = window.match(re);
    if (!m) return null;
    const name = stripTags(m[1]).slice(0, 100);
    return name || null;
  }
}
