import type { JobCriteria, JobSource, RawJob } from "./types";

export interface SourceResult {
  source: string;
  jobs: RawJob[];
  error: string | null;
}

export class JobSourceRegistry {
  private sources: JobSource[] = [];

  register(source: JobSource): void {
    if (!this.sources.some((s) => s.name === source.name)) {
      this.sources.push(source);
    }
  }

  list(): JobSource[] {
    return [...this.sources];
  }

  /** Search all sources. A single source failure does not fail the whole run. */
  async search(criteria: JobCriteria): Promise<{ jobs: RawJob[]; results: SourceResult[] }> {
    const results: SourceResult[] = [];
    const jobs: RawJob[] = [];

    for (const source of this.sources) {
      try {
        const found = await source.searchJobs(criteria);
        results.push({ source: source.name, jobs: found, error: null });
        jobs.push(...found);
      } catch (err) {
        results.push({
          source: source.name,
          jobs: [],
          error: err instanceof Error ? err.message : "SOURCE_UNAVAILABLE",
        });
      }
    }

    return { jobs, results };
  }
}
