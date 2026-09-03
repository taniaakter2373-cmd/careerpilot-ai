-- CreateTable
CREATE TABLE "ErasmusProgramme" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "programmeName" TEXT NOT NULL,
    "acronym" TEXT,
    "officialUrl" TEXT,
    "applicationUrl" TEXT,
    "coordinator" TEXT,
    "partnerUniversities" TEXT,
    "countries" TEXT,
    "field" TEXT,
    "degreeType" TEXT,
    "duration" TEXT,
    "ects" INTEGER,
    "scholarshipAvailable" BOOLEAN NOT NULL DEFAULT true,
    "scholarshipDescription" TEXT,
    "applicationDeadline" DATETIME,
    "scholarshipDeadline" DATETIME,
    "programmeStart" DATETIME,
    "eligibility" TEXT,
    "academicRequirements" TEXT,
    "experienceRequirements" TEXT,
    "languageRequirements" TEXT,
    "requiredDocuments" TEXT,
    "selectionProcess" TEXT,
    "applicationMethod" TEXT NOT NULL DEFAULT 'MANUAL',
    "sourceUrl" TEXT,
    "sourceTitle" TEXT,
    "sourceLastVerified" DATETIME,
    "deadlineStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ScholarshipMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "programmeId" TEXT NOT NULL,
    "overallScore" REAL NOT NULL,
    "breakdown" TEXT NOT NULL,
    "weights" TEXT NOT NULL,
    "whyFits" TEXT,
    "eligibilityGaps" TEXT,
    "documentGaps" TEXT,
    "priorityScore" REAL NOT NULL,
    "eligibilityStatus" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScholarshipMatch_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "ErasmusProgramme" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScholarshipProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" DATETIME,
    "nationality" TEXT,
    "countryOfResidence" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "passportStatus" TEXT,
    "passportExpiry" DATETIME,
    "academicDegrees" TEXT,
    "cgpa" REAL,
    "gradingScale" TEXT,
    "universities" TEXT,
    "graduationDates" TEXT,
    "workExperience" TEXT,
    "jobTitles" TEXT,
    "employers" TEXT,
    "professionalSkills" TEXT,
    "researchExperience" TEXT,
    "leadershipExperience" TEXT,
    "volunteerExperience" TEXT,
    "internationalExperience" TEXT,
    "certifications" TEXT,
    "languageSkills" TEXT,
    "englishTest" TEXT,
    "ieltsScore" REAL,
    "toeflScore" REAL,
    "otherLanguageTests" TEXT,
    "publications" TEXT,
    "projects" TEXT,
    "awards" TEXT,
    "professionalMemberships" TEXT,
    "careerGoals" TEXT,
    "preferredStudyFields" TEXT,
    "preferredCountries" TEXT,
    "preferredProgrammes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ScholarshipDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateId" TEXT NOT NULL,
    "programmeId" TEXT,
    "documentType" TEXT NOT NULL,
    "filePath" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'MISSING',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ScholarshipApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "programmeId" TEXT NOT NULL,
    "candidateId" TEXT,
    "applicationDate" DATETIME,
    "deadline" DATETIME,
    "scholarshipDeadline" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'RESEARCHING',
    "applicationUrl" TEXT,
    "confirmationNumber" TEXT,
    "documentsSubmitted" TEXT,
    "motivationLetterId" TEXT,
    "sopId" TEXT,
    "cvId" TEXT,
    "notes" TEXT,
    "nextAction" TEXT,
    "nextActionDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "ErasmusProgramme_field_idx" ON "ErasmusProgramme"("field");

-- CreateIndex
CREATE INDEX "ErasmusProgramme_status_idx" ON "ErasmusProgramme"("status");

-- CreateIndex
CREATE INDEX "ErasmusProgramme_applicationDeadline_idx" ON "ErasmusProgramme"("applicationDeadline");

-- CreateIndex
CREATE INDEX "ScholarshipMatch_overallScore_idx" ON "ScholarshipMatch"("overallScore");

-- CreateIndex
CREATE UNIQUE INDEX "ScholarshipMatch_programmeId_key" ON "ScholarshipMatch"("programmeId");

-- CreateIndex
CREATE UNIQUE INDEX "ScholarshipProfile_userId_key" ON "ScholarshipProfile"("userId");

-- CreateIndex
CREATE INDEX "ScholarshipDocument_candidateId_idx" ON "ScholarshipDocument"("candidateId");

-- CreateIndex
CREATE INDEX "ScholarshipDocument_documentType_idx" ON "ScholarshipDocument"("documentType");

-- CreateIndex
CREATE INDEX "ScholarshipApplication_status_idx" ON "ScholarshipApplication"("status");

-- CreateIndex
CREATE INDEX "ScholarshipApplication_programmeId_idx" ON "ScholarshipApplication"("programmeId");

-- CreateIndex
CREATE INDEX "ScholarshipApplication_deadline_idx" ON "ScholarshipApplication"("deadline");
