export const JobStatus = {
  NEW: "NEW",
  ANALYZING: "ANALYZING",
  MATCHED: "MATCHED",
  RECOMMENDED: "RECOMMENDED",
  APPROVED: "APPROVED",
  APPLICATION_PREPARED: "APPLICATION_PREPARED",
  APPLYING: "APPLYING",
  APPLIED: "APPLIED",
  MANUAL_APPLICATION_REQUIRED: "MANUAL_APPLICATION_REQUIRED",
  REJECTED: "REJECTED",
  EXPIRED: "EXPIRED",
  DUPLICATE: "DUPLICATE",
} as const;

export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

export const ApplicationStatus = {
  PREPARED: "PREPARED",
  APPROVED: "APPROVED",
  APPLIED: "APPLIED",
  SCREENING: "SCREENING",
  INTERVIEW: "INTERVIEW",
  FINAL_INTERVIEW: "FINAL_INTERVIEW",
  OFFER: "OFFER",
  REJECTED: "REJECTED",
  WITHDRAWN: "WITHDRAWN",
  NO_RESPONSE: "NO_RESPONSE",
} as const;

export type ApplicationStatus = (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

export const Recommendation = {
  STRONG_MATCH: "STRONG_MATCH",
  GOOD_MATCH: "GOOD_MATCH",
  MODERATE_MATCH: "MODERATE_MATCH",
  LOW_MATCH: "LOW_MATCH",
  NOT_RECOMMENDED: "NOT_RECOMMENDED",
} as const;

export type Recommendation = (typeof Recommendation)[keyof typeof Recommendation];

export const RecommendationAction = {
  APPLY: "APPLY",
  REVIEW: "REVIEW",
  SKIP: "SKIP",
} as const;

export type RecommendationAction = (typeof RecommendationAction)[keyof typeof RecommendationAction];

export const ApplicationMethod = {
  MANUAL: "MANUAL",
  ASSISTED: "ASSISTED",
  AUTOMATED: "AUTOMATED",
  MANUAL_APPLICATION_REQUIRED: "MANUAL_APPLICATION_REQUIRED",
} as const;

export type ApplicationMethod = (typeof ApplicationMethod)[keyof typeof ApplicationMethod];

export const RemoteType = {
  ON_SITE: "ON_SITE",
  HYBRID: "HYBRID",
  REMOTE: "REMOTE",
  ANY: "ANY",
} as const;

export type RemoteType = (typeof RemoteType)[keyof typeof RemoteType];

export const EmploymentType = {
  FULL_TIME: "FULL_TIME",
  PERMANENT: "PERMANENT",
  CONTRACT: "CONTRACT",
  ANY: "ANY",
} as const;

export type EmploymentType = (typeof EmploymentType)[keyof typeof EmploymentType];

export const Currency = {
  BDT: "BDT",
  USD: "USD",
  AED: "AED",
  SAR: "SAR",
  QAR: "QAR",
  GBP: "GBP",
  CAD: "CAD",
  AUD: "AUD",
  SGD: "SGD",
} as const;

export type Currency = (typeof Currency)[keyof typeof Currency];

export const NotificationChannel = {
  IN_APP: "IN_APP",
  EMAIL: "EMAIL",
} as const;

export type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel];

export const ApplicationMode = {
  MANUAL: "MANUAL",
  ASSISTED: "ASSISTED",
  APPROVED_AUTOMATION: "APPROVED_AUTOMATION",
} as const;

export type ApplicationMode = (typeof ApplicationMode)[keyof typeof ApplicationMode];
