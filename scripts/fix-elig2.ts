import { PrismaClient } from "@prisma/client";
import { evaluateEligibility, scholarshipRecommendation, scoreScholarshipMatch, weightedScore } from "@careerpilot/shared";
const p = new PrismaClient();
const parseJson = (s: string | null) => (s ? JSON.parse(s) : []);
const REQ: Record<string, any> = {
  WOCC: { requiresBachelors: true, requiredField: "HR", minCgpa: 3.0, minIelts: 6.5, minToefl: null, minYearsExperience: 2 },
  CLIDE: { requiresBachelors: true, requiredField: "Management", minCgpa: 3.0, minIelts: 6.5, minToefl: null, minYearsExperience: 2 },
  MultiDiverse: { requiresBachelors: true, requiredField: "HR", minCgpa: 3.0, minIelts: 6.5, minToefl: null, minYearsExperience: null },
  DEAI: { requiresBachelors: true, requiredField: "Data", minCgpa: 3.0, minIelts: 6.5, minToefl: null, minYearsExperience: null },
  EDISS: { requiresBachelors: true, requiredField: "Data", minCgpa: 3.0, minIelts: 6.5, minToefl: null, minYearsExperience: null },
  EPS: { requiresBachelors: true, requiredField: "Management", minCgpa: 3.0, minIelts: 6.5, minToefl: null, minYearsExperience: null },
  "EMJM STEPS": { requiresBachelors: true, requiredField: "Engineering", minCgpa: 3.0, minIelts: 6.5, minToefl: null, minYearsExperience: null },
  EMMA: { requiresBachelors: true, requiredField: "Media", minCgpa: 3.0, minIelts: 6.5, minToefl: null, minYearsExperience: null },
  NOHA: { requiresBachelors: true, requiredField: "Development", minCgpa: 3.0, minIelts: 6.5, minToefl: null, minYearsExperience: null },
  IMSISS: { requiresBachelors: true, requiredField: "Security", minCgpa: 3.0, minIelts: 6.5, minToefl: null, minYearsExperience: null },
  EMCL: { requiresBachelors: true, requiredField: "Linguistics", minCgpa: 3.0, minIelts: 6.5, minToefl: null, minYearsExperience: null },
  NEURASMUS: { requiresBachelors: true, requiredField: "Science", minCgpa: 3.0, minIelts: 6.5, minToefl: null, minYearsExperience: null },
  Chevening: { requiresBachelors: true, requiredField: "Management", minCgpa: 3.0, minIelts: 6.5, minToefl: null, minYearsExperience: 2 },
  Commonwealth: { requiresBachelors: true, requiredField: "Management", minCgpa: 3.0, minIelts: 6.5, minToefl: null, minYearsExperience: null },
  "DAAD EPOS": { requiresBachelors: true, requiredField: "Management", minCgpa: 3.0, minIelts: 6.0, minToefl: null, minYearsExperience: 2 },
  Fulbright: { requiresBachelors: true, requiredField: "Management", minCgpa: 3.0, minIelts: null, minToefl: 80, minYearsExperience: null },
  "Australia Awards": { requiresBachelors: true, requiredField: "Management", minCgpa: 3.0, minIelts: 6.5, minToefl: null, minYearsExperience: null },
  MEXT: { requiresBachelors: true, requiredField: "Management", minCgpa: 2.3, minIelts: null, minToefl: null, minYearsExperience: null },
  CSC: { requiresBachelors: true, requiredField: "Management", minCgpa: 3.0, minIelts: null, minToefl: null, minYearsExperience: null },
  GKS: { requiresBachelors: true, requiredField: "Management", minCgpa: 3.0, minIelts: null, minToefl: null, minYearsExperience: null },
  SISGP: { requiresBachelors: true, requiredField: "Management", minCgpa: 3.0, minIelts: 6.5, minToefl: null, minYearsExperience: null },
  OKP: { requiresBachelors: true, requiredField: "Management", minCgpa: 3.0, minIelts: 6.0, minToefl: null, minYearsExperience: null },
  "Canada Gov": { requiresBachelors: true, requiredField: "Management", minCgpa: 3.0, minIelts: 6.5, minToefl: null, minYearsExperience: null },
};
async function main(){
  const sp = await p.scholarshipProfile.findFirst();
  const cand = await p.candidateProfile.findFirst();
  console.log("profile loaded", sp?.cgpa);
  const applicant = sp ? {
    hasBachelorsDegree: sp.academicDegrees ? parseJson(sp.academicDegrees).length > 0 : null,
    fieldOfStudy: sp.preferredStudyFields ? parseJson(sp.preferredStudyFields).join(", ") : null,
    cgpa: sp.cgpa, ieltsScore: sp.ieltsScore, toeflScore: sp.toeflScore,
    yearsExperience: cand?.yearsExperience ?? null, nationality: sp.nationality,
    hasPassport: sp.passportStatus ? String(sp.passportStatus).toUpperCase() === "VALID" : null,
    leadershipExperience: sp.leadershipExperience, internationalExperience: sp.internationalExperience,
  } : null;
  const progs = await p.erasmusProgramme.findMany();
  console.log("programmes:", progs.length);
  let n = 0;
  for (const pg of progs) {
    const req = REQ[pg.acronym ?? ""] ?? { requiresBachelors: true, requiredField: pg.field, minCgpa: null, minIelts: null, minToefl: null, minYearsExperience: null };
    await p.erasmusProgramme.update({ where: { id: pg.id }, data: { eligibility: JSON.stringify(req) } });
    if (applicant) {
      const elig = evaluateEligibility(applicant, req);
      const comps = scoreScholarshipMatch(applicant, req, elig);
      const overall = weightedScore(comps);
      await p.scholarshipMatch.upsert({
        where: { programmeId: pg.id },
        update: { overallScore: overall, eligibilityStatus: elig.status, recommendation: scholarshipRecommendation(overall) },
        create: { programmeId: pg.id, overallScore: overall, breakdown: JSON.stringify(comps), weights: JSON.stringify({ academic: 0.2, career: 0.2, subject: 0.2, experience: 0.15, eligibility: 0.1, language: 0.05, leadership: 0.05, mobility: 0.05 }), whyFits: "[]", eligibilityGaps: JSON.stringify(elig.hardFailures), documentGaps: "[]", priorityScore: overall, eligibilityStatus: elig.status, recommendation: scholarshipRecommendation(overall) },
      });
    }
    n++;
    if (n % 5 === 0) console.log("processed", n);
  }
  const matches = await p.scholarshipMatch.findMany();
  const by = {} as Record<string, number>;
  for (const m of matches) by[m.eligibilityStatus] = (by[m.eligibilityStatus] ?? 0) + 1;
  console.log("done", n, "| distribution:", JSON.stringify(by));
  await p.$disconnect();
}
main();
