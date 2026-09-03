import type { ApplicationResult, JobCriteria, JobSource, RawJob } from "./types";

/**
 * Demo source returning clearly-fictional jobs so search + matching can be
 * exercised offline (no network, no real employers).
 */
export class DemoJobSource implements JobSource {
  readonly name = "demo";

  async searchJobs(_criteria: JobCriteria): Promise<RawJob[]> {
    return [
      {
        source: "demo",
        sourceJobId: "demo-hr-manager-01",
        url: "https://demo.example/jobs/hr-manager",
        title: "HR Manager",
        company: "Demo Manufacturing Ltd",
        location: "Dhaka, Bangladesh",
        country: "Bangladesh",
        city: "Dhaka",
        remoteType: "ON_SITE",
        employmentType: "FULL_TIME",
        industry: "Manufacturing",
        salaryMin: 120000,
        salaryMax: 180000,
        salaryCurrency: "BDT",
        description:
          "Lead HR operations, compensation & benefits, performance management and HR business partnering for a manufacturing group.",
        requirements: ["MBA in HR", "Strong stakeholder management"],
        responsibilities: ["Own C&B", "Drive performance management", "Partner with business heads"],
        educationRequirements: ["MBA"],
        experienceRequired: "5-8 years",
        skills: ["Compensation & Benefits", "HR Business Partnering", "Performance Management", "HR Operations"],
        applicationMethod: "MANUAL",
      },
      {
        source: "demo",
        sourceJobId: "demo-reward-manager-01",
        url: "https://demo.example/jobs/reward-manager",
        title: "Reward Manager",
        company: "Demo Holdings PLC",
        location: "Dhaka, Bangladesh",
        country: "Bangladesh",
        city: "Dhaka",
        remoteType: "HYBRID",
        employmentType: "FULL_TIME",
        industry: "Conglomerate",
        salaryMin: 150000,
        salaryMax: 220000,
        salaryCurrency: "BDT",
        description:
          "Design and govern total rewards, salary benchmarking, incentive schemes, and HR budgeting across multiple business units.",
        requirements: ["Total rewards experience", "Salary benchmarking"],
        responsibilities: ["Salary benchmarking", "Incentive governance", "HR budgeting"],
        educationRequirements: ["MBA"],
        experienceRequired: "6-10 years",
        skills: ["Total Rewards", "Salary Benchmarking", "Incentive Governance", "HR Budgeting"],
        applicationMethod: "MANUAL",
      },
      {
        source: "demo",
        sourceJobId: "demo-hr-director-01",
        url: "https://demo.example/jobs/head-of-hr",
        title: "Head of HR",
        company: "Demo International Group",
        location: "Dubai, UAE",
        country: "UAE",
        city: "Dubai",
        remoteType: "ON_SITE",
        employmentType: "FULL_TIME",
        industry: "FMCG",
        salaryMin: 25000,
        salaryMax: 35000,
        salaryCurrency: "AED",
        description: "Senior HR leadership role requiring extensive international HR experience and transformation delivery.",
        requirements: ["10+ years HR leadership"],
        responsibilities: ["Lead HR function", "Drive transformation"],
        educationRequirements: ["Master's degree"],
        experienceRequired: "10+ years",
        skills: ["HR Leadership", "Organizational Development", "HR Transformation"],
        applicationMethod: "MANUAL",
      },
      {
        source: "demo",
        sourceJobId: "demo-hr-analytics-01",
        url: "https://demo.example/jobs/hr-analytics-manager",
        title: "HR Analytics Manager",
        company: "Demo People Tech",
        location: "Remote",
        country: "Singapore",
        city: null,
        remoteType: "REMOTE",
        employmentType: "FULL_TIME",
        industry: "Technology",
        salaryMin: 8000,
        salaryMax: 12000,
        salaryCurrency: "SGD",
        description: "Build people analytics dashboards and workforce insights for a global tech company.",
        requirements: ["Power BI", "People analytics"],
        responsibilities: ["Build dashboards", "Workforce analytics"],
        educationRequirements: ["Bachelor's degree"],
        experienceRequired: "4-6 years",
        skills: ["HR Analytics", "Workforce Planning", "Power BI"],
        applicationMethod: "MANUAL",
      },
    ];
  }

  async getJobDetails(url: string): Promise<RawJob> {
    const all = await this.searchJobs({});
    const found = all.find((j) => j.url === url);
    if (!found) throw new Error("JOB_NOT_FOUND");
    return found;
  }

  supportsApplicationAutomation(): boolean {
    return false;
  }

  async apply(job: RawJob, _candidate: { name: string; email: string }): Promise<ApplicationResult> {
    return {
      status: "MANUAL_APPLICATION_REQUIRED",
      url: job.url,
      error: "This demo source does not support automated application. Apply manually via the job URL.",
    };
  }
}
