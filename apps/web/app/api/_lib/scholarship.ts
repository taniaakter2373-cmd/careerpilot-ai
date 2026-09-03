import { prisma } from "@careerpilot/database";
import type { ScholarshipApplicant } from "@careerpilot/shared";

const parseJson = (s: string | null) => (s ? (JSON.parse(s) as string[]) : []);

export function serializeProgramme(p: any) {
  const m = p.matches?.[0];
  return {
    id: p.id,
    programmeName: p.programmeName,
    acronym: p.acronym,
    officialUrl: p.officialUrl,
    applicationUrl: p.applicationUrl,
    coordinator: p.coordinator,
    partnerUniversities: parseJson(p.partnerUniversities),
    countries: parseJson(p.countries),
    field: p.field,
    degreeType: p.degreeType,
    duration: p.duration,
    ects: p.ects,
    scholarshipAvailable: p.scholarshipAvailable,
    scholarshipDescription: p.scholarshipDescription,
    applicationDeadline: p.applicationDeadline,
    scholarshipDeadline: p.scholarshipDeadline,
    programmeStart: p.programmeStart,
    languageRequirements: p.languageRequirements,
    requiredDocuments: parseJson(p.requiredDocuments),
    applicationMethod: p.applicationMethod,
    sourceUrl: p.sourceUrl,
    sourceTitle: p.sourceTitle,
    deadlineStatus: p.deadlineStatus,
    status: p.status,
    match: m
      ? {
          overallScore: m.overallScore,
          breakdown: JSON.parse(m.breakdown),
          whyFits: parseJson(m.whyFits),
          eligibilityGaps: parseJson(m.eligibilityGaps),
          documentGaps: parseJson(m.documentGaps),
          priorityScore: m.priorityScore,
          eligibilityStatus: m.eligibilityStatus,
          recommendation: m.recommendation,
        }
      : null,
  };
}

export function toApplicant(p: any, yearsExperience: number | null): ScholarshipApplicant {
  return {
    hasBachelorsDegree: p.academicDegrees ? parseJson(p.academicDegrees).length > 0 : null,
    fieldOfStudy: parseJson(p.preferredStudyFields).join(", ") || null,
    cgpa: p.cgpa != null ? Number(p.cgpa) : null,
    ieltsScore: p.ieltsScore != null ? Number(p.ieltsScore) : null,
    toeflScore: p.toeflScore != null ? Number(p.toeflScore) : null,
    yearsExperience,
    nationality: p.nationality,
    hasPassport: p.passportStatus ? String(p.passportStatus).toUpperCase() === "VALID" : null,
    leadershipExperience: p.leadershipExperience,
    internationalExperience: p.internationalExperience,
  };
}

export async function getApplicant(userId?: string): Promise<{ profile: any; applicant: ScholarshipApplicant } | null> {
  const profile = userId
    ? await prisma.scholarshipProfile.findUnique({ where: { userId } })
    : await prisma.scholarshipProfile.findFirst();
  if (!profile) return null;
  const candidate = profile.userId ? await prisma.candidateProfile.findUnique({ where: { userId: profile.userId } }) : null;
  return { profile, applicant: toApplicant(profile, candidate?.yearsExperience ?? null) };
}

export function buildMotivationLetter(programme: any, profile: any): string {
  const name = profile.fullName ?? "[Your name]";
  const ielts = profile.ieltsScore != null ? `IELTS ${profile.ieltsScore}` : "[English test score — USER_INPUT_REQUIRED]";
  return `[DRAFT — review before use]\n\nDear ${programme.coordinator ?? "Admissions Committee"},\n\nI am writing to express my strong interest in the ${programme.programmeName} (${programme.acronym ?? "EMJM"}) offered by ${programme.coordinator ?? "the consortium"}.\n\n${name}. ${profile.leadershipExperience ? "My professional experience includes " + profile.leadershipExperience + "." : ""}\n\n[Insert why this programme — USER_INPUT_REQUIRED]\n\n[Insert relevant achievements — USER_INPUT_REQUIRED]\n\nLanguage proficiency: ${ielts}.\n\nThank you for considering my application.\n\nSincerely,\n${name}`;
}

export function buildSop(programme: any, profile: any): string {
  const name = profile.fullName ?? "[Your name]";
  return `[DRAFT — review before use]\n\nStatement of Purpose — ${programme.programmeName}\n\n1. Academic background\n${profile.academicDegrees ? parseJson(profile.academicDegrees).join(", ") : "[USER_INPUT_REQUIRED]"} (${profile.universities ? parseJson(profile.universities).join(", ") : ""})\n\n2. Professional journey\n${profile.leadershipExperience ?? "[USER_INPUT_REQUIRED]"}\n\n3. Career motivation\n${profile.careerGoals ? parseJson(profile.careerGoals).join(", ") : "[USER_INPUT_REQUIRED]"}\n\n4. Why this field\n[USER_INPUT_REQUIRED]\n\n5. Why this Erasmus programme\n[USER_INPUT_REQUIRED]\n\n6. Why the consortium/universities\n[USER_INPUT_REQUIRED]\n\n7. Relevant professional experience\n${profile.leadershipExperience ?? "[USER_INPUT_REQUIRED]"}\n\n8. Future career goals\n${profile.careerGoals ? parseJson(profile.careerGoals).join(", ") : "[USER_INPUT_REQUIRED]"}\n\n9. Expected impact\n[USER_INPUT_REQUIRED]\n\n10. Contribution to the programme\n[USER_INPUT_REQUIRED]\n\n${name}`;
}
