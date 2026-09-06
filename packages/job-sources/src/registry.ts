import type { JobCriteria, JobSource, RawJob } from "./types";
import { ArbeitnowSource, JobicySource, RemoteOkSource } from "./global-json";
import { BdjobsSource } from "./bdjobs";

export interface SourceResult {
  source: string;
  jobs: RawJob[];
  error: string | null;
}

/**
 * Live discovery sources registered by default. Bdjobs (Bangladesh local) is
 * opt-in via ENABLE_BDJOBS=true; Arbeitnow (EU/UK/global), Jobicy and RemoteOK
 * (remote international incl. USA/UK) are always on so search covers the full
 * international + Europe market.
 */
export function defaultSources(env: { ENABLE_BDJOBS?: string } = {}): JobSource[] {
  const sources: JobSource[] = [new ArbeitnowSource(), new JobicySource(), new RemoteOkSource()];
  if (env.ENABLE_BDJOBS === "true") sources.push(new BdjobsSource());
  return sources;
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
