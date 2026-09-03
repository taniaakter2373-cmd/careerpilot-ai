import { prisma } from "@careerpilot/database";

const parseJson = (s: string | null) => (s ? (JSON.parse(s) as string[]) : []);
const norm = (s: string | null | undefined) => (s ?? "").toLowerCase().trim();

export interface CvWithSkills {
  id: string;
  name: string;
  targetRole: string | null;
  targetCountry: string | null;
  skills: string[];
  isDefault: boolean;
}

export async function listCvs(): Promise<CvWithSkills[]> {
  const cvs = await prisma.cv.findMany({ orderBy: { isDefault: "desc" } });
  return cvs.map((c) => ({
    id: c.id,
    name: c.name,
    targetRole: c.targetRole,
    targetCountry: c.targetCountry,
    skills: parseJson(c.skills),
    isDefault: c.isDefault,
  }));
}

export function selectBestCv(job: { title: string; skills: string[] }, cvs: CvWithSkills[]): CvWithSkills | null {
  if (cvs.length === 0) return null;
  const jobTitle = norm(job.title);
  const jobSkills = job.skills.map(norm).filter(Boolean);

  let best: CvWithSkills | null = null;
  let bestScore = -1;

  for (const cv of cvs) {
    let score = 0;
    const role = norm(cv.targetRole);
    if (role && (jobTitle.includes(role) || role.includes(jobTitle))) score += 40;
    else if (role && role.split(/\s+/).some((t) => t.length > 1 && jobTitle.includes(t))) score += 25;

    if (jobSkills.length > 0) {
      const cvSkills = cv.skills.map(norm).filter(Boolean);
      const matched = jobSkills.filter((s) => cvSkills.some((c) => c.includes(s) || s.includes(c))).length;
      score += Math.round((matched / jobSkills.length) * 60);
    }
    if (cv.isDefault) score += 5;
    if (score > bestScore) {
      bestScore = score;
      best = cv;
    }
  }
  return best;
}
