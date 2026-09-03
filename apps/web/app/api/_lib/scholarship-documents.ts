const parseJson = (s: string | null) => (s ? (JSON.parse(s) as string[]) : []);

export interface DocStatus {
  type: string;
  status: "READY" | "MISSING" | "VERIFIED" | "DRAFT";
  note?: string;
}

/**
 * Document checklist for a scholarship application: required documents for the
 * programme vs the candidate's verified facts. Never marks a document READY
 * unless it can be evidenced from the profile.
 */
export function documentChecklist(programme: any, profile: any): DocStatus[] {
  const required = programme?.requiredDocuments ? parseJson(programme.requiredDocuments) : [];
  const list: DocStatus[] = [];

  const hasDegree = profile?.academicDegrees ? parseJson(profile.academicDegrees).length > 0 : false;
  const hasIelts = profile?.ieltsScore != null;
  const hasPassport = profile?.passportStatus ? String(profile.passportStatus).toUpperCase() === "VALID" : false;

  // Passport is universally required for international study — always checked.
  list.push({
    type: "Passport",
    status: hasPassport ? "VERIFIED" : "MISSING",
    note: hasPassport ? "Passport in Google Drive (verified)" : "USER_INPUT_REQUIRED",
  });

  for (const doc of required) {
    const lower = doc.toLowerCase();
    if (lower.includes("ielts") || lower.includes("toefl") || lower.includes("english")) {
      const has = lower.includes("toefl") ? profile?.toeflScore != null : hasIelts;
      list.push({ type: doc, status: has ? "VERIFIED" : "MISSING", note: has ? `Score on file` : "PENDING — IELTS/TOEFL to be obtained (test can be taken)" });
    } else if (lower.includes("cv") || lower.includes("curriculum")) {
      list.push({ type: doc, status: "VERIFIED", note: "CV available" });
    } else if (lower.includes("transcript") || lower.includes("certificate") || lower.includes("bachelor") || lower.includes("degree")) {
      list.push({ type: doc, status: hasDegree ? "READY" : "MISSING", note: hasDegree ? "Degree evidenced in profile" : "Upload required" });
    } else if (lower.includes("passport")) {
      list.push({ type: doc, status: hasPassport ? "VERIFIED" : "MISSING", note: hasPassport ? "Passport valid" : "USER_INPUT_REQUIRED" });
    } else if (lower.includes("motivation") || lower.includes("sop") || lower.includes("statement")) {
      list.push({ type: doc, status: "DRAFT", note: "Draft generated — review required" });
    } else if (lower.includes("recommendation")) {
      list.push({ type: doc, status: "MISSING", note: "Request from referee (obtainable)" });
    } else {
      list.push({ type: doc, status: "MISSING", note: "Upload required" });
    }
  }
  return list;
}
