import type { ApplicationResult, JobCriteria, JobSource, RawJob } from "./types";

/**
 * Public, no-key JSON job APIs used to power live international discovery.
 * These feeds are returned by the boards themselves (not scraped), so they
 * respect each site's data policy and never bypass CAPTCHA/login/anti-bot.
 */

interface JobFetchOptions {
  minIntervalMs?: number;
}

abstract class JsonJobSource implements JobSource {
  abstract readonly name: string;
  protected minIntervalMs: number;
  private lastRequest = 0;

  constructor(options: JobFetchOptions = {}) {
    this.minIntervalMs = options.minIntervalMs ?? 1500;
  }

  protected async fetchJson(url: string): Promise<unknown> {
    const wait = this.lastRequest + this.minIntervalMs - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    this.lastRequest = Date.now();
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CareerPilot/0.1; +job-search-assistant)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`SOURCE_UNAVAILABLE (HTTP ${res.status})`);
    return res.json();
  }

  abstract searchJobs(criteria: JobCriteria): Promise<RawJob[]>;

  async getJobDetails(url: string): Promise<RawJob> {
    const jobs = await this.searchJobs({});
    const found = jobs.find((j) => j.url === url);
    if (!found) throw new Error("JOB_NOT_FOUND");
    return found;
  }

  supportsApplicationAutomation(): boolean {
    return false;
  }

  async apply(_job: RawJob, _candidate: { name: string; email: string }): Promise<ApplicationResult> {
    return { status: "MANUAL_APPLICATION_REQUIRED", url: _job.url };
  }
}

const norm = (s: string | null | undefined) => (s ?? "").toLowerCase().trim();

/** Word-boundary aware country/city token test — avoids "us" matching "hausen". */
function hasToken(text: string, token: string): boolean {
  const t = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${t}($|[^a-z0-9])`, "i").test(text);
}

/** Map an arbitrary location string (city or "City, Country") to {country, city}. */
export function inferCountry(locationText: string | null | undefined): { country: string | null; city: string | null } {
  const raw = locationText ?? "";
  if (!raw.trim()) return { country: null, city: null };

  // Exact country name present in the string.
  const countries: [string, string][] = [
    ["united states", "USA"], ["united states of america", "USA"], ["usa", "USA"], ["us", "USA"],
    ["united kingdom", "UK"], ["uk", "UK"], ["england", "UK"], ["scotland", "UK"], ["wales", "UK"], ["britain", "UK"],
    ["germany", "Germany"], ["deutschland", "Germany"], ["france", "France"], ["netherlands", "Netherlands"],
    ["holland", "Netherlands"], ["belgium", "Belgium"], ["switzerland", "Switzerland"], ["austria", "Austria"],
    ["ireland", "Ireland"], ["sweden", "Sweden"], ["denmark", "Denmark"], ["norway", "Norway"], ["finland", "Finland"],
    ["iceland", "Iceland"], ["spain", "Spain"], ["portugal", "Portugal"], ["italy", "Italy"], ["poland", "Poland"],
    ["czech", "Czech Republic"], ["czechia", "Czech Republic"], ["lithuania", "Lithuania"], ["latvia", "Latvia"],
    ["estonia", "Estonia"], ["hungary", "Hungary"], ["romania", "Romania"], ["bulgaria", "Bulgaria"],
    ["greece", "Greece"], ["croatia", "Croatia"], ["luxembourg", "Luxembourg"],
    ["canada", "Canada"], ["australia", "Australia"], ["new zealand", "New Zealand"],
    ["uae", "UAE"], ["united arab emirates", "UAE"], ["dubai", "UAE"], ["abu dhabi", "UAE"], ["sharjah", "UAE"],
    ["saudi arabia", "Saudi Arabia"], ["qatar", "Qatar"], ["kuwait", "Kuwait"], ["oman", "Oman"], ["bahrain", "Bahrain"],
    ["jordan", "Jordan"], ["lebanon", "Lebanon"], ["egypt", "Egypt"], ["turkey", "Turkey"], ["türkiye", "Turkey"],
    ["singapore", "Singapore"], ["malaysia", "Malaysia"], ["india", "India"], ["bangladesh", "Bangladesh"],
    ["pakistan", "Pakistan"], ["sri lanka", "Sri Lanka"], ["thailand", "Thailand"], ["vietnam", "Vietnam"],
    ["indonesia", "Indonesia"], ["philippines", "Philippines"], ["hong kong", "Hong Kong"],
    ["south africa", "South Africa"], ["nigeria", "Nigeria"], ["kenya", "Kenya"], ["brazil", "Brazil"],
    ["mexico", "Mexico"], ["argentina", "Argentina"], ["colombia", "Colombia"], ["chile", "Chile"],
    ["japan", "Japan"], ["south korea", "South Korea"], ["south korea", "South Korea"], ["china", "China"],
    ["latin america", "LATAM"], ["latam", "LATAM"], ["emea", "EMEA"], ["europe", "Europe"], ["european union", "Europe"],
  ];

  const lower = norm(raw);
  let country: string | null = null;
  let city: string | null = null;

  for (const [token, name] of countries) {
    if (hasToken(lower, token)) {
      country = name;
      break;
    }
  }

  const cities: [string, string][] = [
    ["london", "UK"], ["manchester", "UK"], ["birmingham", "UK"], ["edinburgh", "UK"], ["glasgow", "UK"],
    ["leeds", "UK"], ["bristol", "UK"], ["liverpool", "UK"], ["cambridge", "UK"], ["oxford", "UK"],
    ["new york", "USA"], ["san francisco", "USA"], ["los angeles", "USA"], ["chicago", "USA"], ["boston", "USA"],
    ["austin", "USA"], ["seattle", "USA"], ["denver", "USA"], ["miami", "USA"], ["atlanta", "USA"],
    ["dallas", "USA"], ["houston", "USA"], ["philadelphia", "USA"], ["washington", "USA"], ["remote - us", "USA"],
    ["toronto", "Canada"], ["vancouver", "Canada"], ["montreal", "Canada"], ["calgary", "Canada"],
    ["sydney", "Australia"], ["melbourne", "Australia"], ["brisbane", "Australia"], ["perth", "Australia"],
    ["berlin", "Germany"], ["munich", "Germany"], ["hamburg", "Germany"], ["frankfurt", "Germany"],
    ["cologne", "Germany"], ["köln", "Germany"], ["stuttgart", "Germany"], ["düsseldorf", "Germany"],
    ["leipzig", "Germany"], ["dresden", "Germany"], ["hannover", "Germany"], ["nuremberg", "Germany"],
    ["paris", "France"], ["lyon", "France"], ["marseille", "France"], ["toulouse", "France"],
    ["amsterdam", "Netherlands"], ["rotterdam", "Netherlands"], ["the hague", "Netherlands"], ["utrecht", "Netherlands"],
    ["brussels", "Belgium"], ["antwerp", "Belgium"], ["ghent", "Belgium"],
    ["zurich", "Switzerland"], ["geneva", "Switzerland"], ["bern", "Switzerland"], ["basel", "Switzerland"],
    ["vienna", "Austria"], ["dublin", "Ireland"], ["cork", "Ireland"],
    ["stockholm", "Sweden"], ["gothenburg", "Sweden"], ["copenhagen", "Denmark"], ["oslo", "Norway"],
    ["helsinki", "Finland"], ["reykjavik", "Iceland"],
    ["madrid", "Spain"], ["barcelona", "Spain"], ["valencia", "Spain"], ["seville", "Spain"],
    ["lisbon", "Portugal"], ["porto", "Portugal"], ["rome", "Italy"], ["milan", "Italy"], ["turin", "Italy"],
    ["warsaw", "Poland"], ["krakow", "Poland"], ["kraków", "Poland"], ["prague", "Czech Republic"],
    ["budapest", "Hungary"], ["bucharest", "Romania"], ["athens", "Greece"], ["zagreb", "Croatia"],
    ["vilnius", "Lithuania"], ["riga", "Latvia"], ["tallinn", "Estonia"],
    ["singapore", "Singapore"], ["kuala lumpur", "Malaysia"], ["jakarta", "Indonesia"], ["manila", "Philippines"],
    ["bangkok", "Thailand"], ["ho chi minh", "Vietnam"], ["hanoi", "Vietnam"],
    ["dubai", "UAE"], ["abu dhabi", "UAE"], ["riyadh", "Saudi Arabia"], ["jeddah", "Saudi Arabia"],
    ["doha", "Qatar"], ["kuwait city", "Kuwait"], ["muscat", "Oman"], ["amman", "Jordan"], ["beirut", "Lebanon"],
    ["cairo", "Egypt"], ["istanbul", "Turkey"], ["hong kong", "Hong Kong"],
    ["johannesburg", "South Africa"], ["cape town", "South Africa"], ["lagos", "Nigeria"], ["nairobi", "Kenya"],
    ["são paulo", "Brazil"], ["sao paulo", "Brazil"], ["mexico city", "Mexico"],
    ["tokyo", "Japan"], ["seoul", "South Korea"], ["beijing", "China"], ["shanghai", "China"],
    ["new delhi", "India"], ["mumbai", "India"], ["bangalore", "India"], ["chennai", "India"], ["dhaka", "Bangladesh"],
  ];

  if (!country) {
    for (const [c, countryName] of cities) {
      if (hasToken(lower, c)) {
        country = countryName;
        break;
      }
    }
  }

  // City = first meaningful segment (typically before a comma).
  const firstSeg = raw.split(",")[0]?.trim();
  if (firstSeg && firstSeg.length > 1 && firstSeg.length < 60 && !hasToken(firstSeg, "remote")) {
    city = firstSeg;
  }

  return { country, city };
}

const HR_TERMS = [
  "human resource", "human resources", "hrbp", "people ops", "people generalist", "people partner",
  "people operations", "employee", "talent", "recruit", "compensation", "reward", "benefits",
  "payroll", "staffing", "workforce", "organisational development", "organizational development",
  "learning & development", "learning and development", "l&d", "training", "people & culture", "people and culture",
];

function looksHr(title: string | null | undefined): boolean {
  const t = norm(title);
  if (!t) return false;
  if (HR_TERMS.some((k) => t.includes(k))) return true;
  if (/(^|[^a-z])hr([^a-z]|$)/.test(t)) return true;
  return false;
}

/**
 * Arbeitnow — Germany/EU job board with a free JSON API.
 * Feeds English + German listings; we keep only HR-relevant titles, prefer
 * English postings, and cover the EU/UK/AU market that other feeds miss.
 */
export class ArbeitnowSource extends JsonJobSource {
  readonly name = "arbeitnow";

  async searchJobs(_criteria: JobCriteria): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    for (let page = 1; page <= 3; page++) {
      const body = (await this.fetchJson(`https://www.arbeitnow.com/api/job-board-api?page=${page}`)) as {
        data?: Array<Record<string, unknown>>;
      };
      const data = body?.data ?? [];
      if (data.length === 0) break;
      for (const item of data) {
        const title = String(item.title ?? "").trim();
        if (!looksHr(title)) continue;
        const rawLoc = String(item.location ?? "").trim();
        const remote = Boolean(item.remote);
        const { country, city } = inferCountry(remote ? `${rawLoc} remote` : rawLoc);
        const url = String(item.url ?? "");
        const company = String(item.company_name ?? "Unknown").trim();
        const desc = String(item.description ?? "")
          .replace(/<[^>]+>/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/\s+/g, " ")
          .trim();
        const tags = Array.isArray(item.tags) ? (item.tags as unknown[]).map(String) : [];
        const created = item.created_at ? Number(item.created_at) : null;

        jobs.push({
          source: this.name,
          sourceJobId: String(item.slug ?? url).trim() || null,
          url,
          title,
          company,
          companyUrl: null,
          location: rawLoc || city,
          country,
          city,
          remoteType: remote ? "REMOTE" : "ON_SITE",
          employmentType: (Array.isArray(item.job_types) && (item.job_types as unknown[]).length
            ? String((item.job_types as unknown[])[0])
            : "FULL_TIME") || "FULL_TIME",
          industry: tags[0] ?? null,
          description: desc.slice(0, 4000),
          skills: tags.slice(0, 12),
          requirements: [],
          responsibilities: [],
          educationRequirements: [],
          postedDate: created ? new Date(created * 1000).toISOString() : null,
          applicationMethod: "MANUAL",
          applicationUrl: url,
        });
      }
    }
    return jobs;
  }
}

/**
 * Jobicy — global remote job feed with a free JSON API. Covers USA/UK/Canada/Europe
 * remote roles and includes salary data.
 */
export class JobicySource extends JsonJobSource {
  readonly name = "jobicy";

  async searchJobs(_criteria: JobCriteria): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const body = (await this.fetchJson("https://jobicy.com/api/v2/remote-jobs?count=100")) as {
      jobs?: Array<Record<string, unknown>>;
    };
    const data = body?.jobs ?? [];
    for (const item of data) {
      const title = String(item.jobTitle ?? "").trim();
      if (!looksHr(title)) continue;
      const geo = String(item.jobGeo ?? "").trim();
      const { country, city } = inferCountry(geo);
      const url = String(item.url ?? item.jobUrl ?? "");
      const company = String(item.companyName ?? "Unknown").trim();
      const currency = String(item.salaryCurrency ?? "").trim() || "USD";
      const salaryMin = Number(item.salaryMin) || null;
      const salaryMax = Number(item.salaryMax) || null;

      jobs.push({
        source: this.name,
        sourceJobId: String(item.jobSlug ?? item.id ?? url) || null,
        url,
        title,
        company,
        companyUrl: null,
        location: geo || city,
        country: country ?? (geo.includes("Remote") || geo.toLowerCase().includes("remote") ? null : null),
        city,
        remoteType: "REMOTE",
        employmentType: String(item.jobType ?? "FULL_TIME") || "FULL_TIME",
        industry: String(item.jobIndustry ?? null) || null,
        department: null,
        salaryMin,
        salaryMax,
        salaryCurrency: currency,
        description: String(item.jobDescription ?? item.jobExcerpt ?? "").replace(/\s+/g, " ").trim().slice(0, 4000),
        skills: [],
        requirements: [],
        responsibilities: [],
        educationRequirements: [],
        postedDate: String(item.pubDate ?? "").trim() || null,
        applicationMethod: "MANUAL",
        applicationUrl: url,
      });
    }
    return jobs;
  }
}

/**
 * RemoteOK — global remote feed (no-key JSON). Light on HR but catches
 * USA/UK "People Ops / Talent / HR" remote roles and includes salary + apply URL.
 */
export class RemoteOkSource extends JsonJobSource {
  readonly name = "remoteok";

  async searchJobs(_criteria: JobCriteria): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const body = (await this.fetchJson("https://remoteok.com/api")) as unknown[];
    const data = Array.isArray(body) ? body.slice(1) : [];
    for (const item of data) {
      const row = item as Record<string, unknown>;
      const title = String(row.position ?? "").trim();
      if (!looksHr(title)) continue;
      const rawLoc = String(row.location ?? "").trim();
      const { country, city } = inferCountry(`${rawLoc} remote`);
      const url = String(row.url ?? row.apply_url ?? "").trim();
      const company = String(row.company ?? "Unknown").trim();
      const tags = Array.isArray(row.tags) ? (row.tags as unknown[]).map(String) : [];
      const salaryMin = Number(row.salary_min) || null;
      const salaryMax = Number(row.salary_max) || null;

      jobs.push({
        source: this.name,
        sourceJobId: String(row.id ?? row.slug ?? url) || null,
        url: url.startsWith("http") ? url : `https://remoteok.com${url}`,
        title,
        company,
        companyUrl: String(row.company_url ?? "") || null,
        location: rawLoc || city || "Remote",
        country: country ?? null,
        city,
        remoteType: "REMOTE",
        employmentType: "FULL_TIME",
        industry: tags[0] ?? null,
        description: String(row.description ?? "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 4000),
        skills: tags.slice(0, 12),
        requirements: [],
        responsibilities: [],
        educationRequirements: [],
        postedDate: String(row.date ?? "") || null,
        salaryMin,
        salaryMax,
        salaryCurrency: "USD",
        applicationMethod: "MANUAL",
        applicationUrl: url.startsWith("http") ? url : `https://remoteok.com${url}`,
      });
    }
    return jobs;
  }
}
