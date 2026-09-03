// Load real jobs (Bdjobs + LinkedIn) into the hosted Postgres.
// Run: DATABASE_URL="<hosted-url>" npx tsx scripts/load-real-jobs.ts
import { PrismaClient } from "@prisma/client";
import { scoreJob, type CandidateForMatching, type JobForMatching } from "@careerpilot/matching";
import { computeDuplicateHash } from "@careerpilot/job-sources";

const prisma = new PrismaClient();

const norm = (s: string | null | undefined) => (s ?? "").toLowerCase().trim();

// ---- Bdjobs raw cards (id, text, url) --------------------------------------
const BDJOBS: { id: string; txt: string; url: string }[] = [
  { id: "1524392", txt: "HR Manager Midasia Group Mirpur Deadline 19 Sep 2026Experience3 to 5 years", url: "https://bdjobs.com/h/details/1524392" },
  { id: "1514748", txt: "Sr. Executive, Group HR Munshi HR Solutions Ltd. GULSHAN 1 Deadline 26 Aug 2026Experience3 to 5 years", url: "https://bdjobs.com/h/details/1514748" },
  { id: "1521829", txt: "HR Manager Aastha International Anywhere in Bangladesh Deadline 22 Aug 2026Experience5 to 7 years", url: "https://bdjobs.com/h/details/1521829" },
  { id: "1513076", txt: "Manager- HR Sentry Security Services Ltd. Dhanmondi Deadline 21 Aug 2026Experience8 to 12 years", url: "https://bdjobs.com/h/details/1513076" },
  { id: "1517263", txt: "HR Manager A Leading Electronics Company GULSHAN 1 Deadline 31 Aug 2026ExperienceAt least 8 years", url: "https://bdjobs.com/h/details/1517263" },
  { id: "1521203", txt: "Manager (HR) AR Malik Seeds Private Limited Aftabnagar Deadline 12 Sep 2026Experience5 to 10 years", url: "https://bdjobs.com/h/details/1521203" },
  { id: "1513543", txt: "HR Manager AZAL GROUP Basundhara RA Deadline 22 Aug 2026ExperienceAt least 3 years", url: "https://bdjobs.com/h/details/1513543" },
  { id: "1513610", txt: "Manager-HR Liberty Knitwear Ltd. Kaliakair Deadline 23 Aug 2026Experience8 to 10 years", url: "https://bdjobs.com/h/details/1513610" },
  { id: "1514185", txt: "General Manager - HR (Corporate HR) Pretty Group GULSHAN 2 Deadline 25 Aug 2026ExperienceAt least 15 years", url: "https://bdjobs.com/h/details/1514185" },
  { id: "1516423", txt: "HR Manager (HR & Operations Integration) Texpro International Savar Deadline 31 Aug 2026ExperienceNA", url: "https://bdjobs.com/h/details/1516423" },
  { id: "1523710", txt: "Manager (HR & Admin) Sinha Knit and Denims Ltd Savar Deadline 26 Aug 2026ExperienceAt least 8 years", url: "https://bdjobs.com/h/details/1523710" },
  { id: "1522894", txt: "Manager HR & Admin Grameen Shakti Dhaka Deadline 31 Aug 2026Experience5 to 8 years", url: "https://bdjobs.com/h/details/1522894" },
  { id: "1522156", txt: "Manager - HR & Admin Goldsands Group Chattogram, Agrabad Deadline 15 Sep 2026ExperienceAt least 8 years", url: "https://bdjobs.com/h/details/1522156" },
  { id: "1515437", txt: "Manager- HR & Operations Aquamarine LTD Dhaka Deadline 28 Aug 2026Experience3 to 5 years", url: "https://bdjobs.com/h/details/1515437" },
  { id: "1512463", txt: "Senior Manager/Manager- HR Ismartu Technology Bd Ltd GULSHAN 1 Deadline 26 Aug 2026ExperienceAt least 8 years", url: "https://bdjobs.com/h/details/1512463" },
  { id: "1520369", txt: "Manager - HR & Admin Team Group Uttara Deadline 31 Aug 2026Experience10 to 12 years", url: "https://bdjobs.com/h/details/1520369" },
  { id: "1519504", txt: "HR Compliance Manager Hamid Tex Anywhere in Bangladesh Deadline 05 Sep 2026ExperienceAt least 5 years", url: "https://bdjobs.com/h/details/1519504" },
  { id: "1522304", txt: "Manager (HR & Admin) Trust Knitwear Industries Ltd DOHS Baridhara Deadline 15 Sep 2026ExperienceAt least 5 years", url: "https://bdjobs.com/h/details/1522304" },
  { id: "1524149", txt: "Manager (Admin & HR) OSAKA AUTO INDUSTRIES Gazaria Deadline 19 Sep 2026Experience7 to 8 years", url: "https://bdjobs.com/h/details/1524149" },
  { id: "1521714", txt: "Manager - HR & Admin Bibaha Bondhon Marriage Media DOHS Mohakhali Deadline 14 Sep 2026Experience3 to 5 years", url: "https://bdjobs.com/h/details/1521714" },
  { id: "1520276", txt: "Manager - HR & Admin X-group Chain Restaurant & Hospitality Dhaka Deadline 31 Aug 2026ExperienceAt least 6 years", url: "https://bdjobs.com/h/details/1520276" },
  { id: "1518073", txt: "HR Manager/Sr. Manager Savar Based Knit Composite Factory Anywhere in Bangladesh Deadline 04 Sep 2026ExperienceAt least 10 years", url: "https://bdjobs.com/h/details/1518073" },
  { id: "1519185", txt: "Manager/ Assistant Manager - HR Operations Croydon Kowloon Design Ltd Savar Deadline 30 Aug 2026Experience5 to 8 years", url: "https://bdjobs.com/h/details/1519185" },
  { id: "1521917", txt: "Manager (HR & Compliance) BD Creation Ishwardi Deadline 14 Sep 2026Experience3 to 5 years", url: "https://bdjobs.com/h/details/1521917" },
  { id: "1522348", txt: "Manager / Senior Manager - HR & Admin LIMRS Construction And Interior Dhaka Deadline 15 Sep 2026Experience15 to 20 years", url: "https://bdjobs.com/h/details/1522348" },
  { id: "1521791", txt: "Manager - HR, Admin & Compliance Envobyte Ltd. Dhaka Deadline 20 Sep 2026Experience5 to 8 years", url: "https://bdjobs.com/h/details/1521791" },
  { id: "1512881", txt: "Manager - HR And Admin A International Trading and Manufacturing Company Dhaka Deadline 21 Aug 2026Experience5 to 7 years", url: "https://bdjobs.com/h/details/1512881" },
  { id: "1513852", txt: "General Manager- HR & Compliance Al - Muslim Group Savar Deadline 24 Aug 2026ExperienceAt least 12 years", url: "https://bdjobs.com/h/details/1513852" },
  { id: "1520961", txt: "Assistant Manager- Corporate HR A Reputed RMG Conglomerate Tejgaon Deadline 11 Sep 2026ExperienceAt least 6 years", url: "https://bdjobs.com/h/details/1520961" },
  { id: "1515229", txt: "Assistant Manager - HR & Admin Beauty Booth Bangladesh Rampura Deadline 27 Aug 2026Experience4 to 6 years", url: "https://bdjobs.com/h/details/1515229" },
  { id: "1522027", txt: "Manager (Admin, HR & Compliance) Regent Fashion Ltd. Chattogram Deadline 31 Aug 2026Experience10 to 15 years", url: "https://bdjobs.com/h/details/1522027" },
  { id: "1519353", txt: "Manager - HR (Compensation & Benefits) MNR Group Sreepur, Gazipur Deadline 20 Aug 2026Experience8 to 12 years", url: "https://bdjobs.com/h/details/1519353" },
  { id: "1523038", txt: "Manager - HR, Admin & Compliance Noman Group Sreepur Deadline 31 Aug 2026Experience8 to 10 years", url: "https://bdjobs.com/h/details/1523038" },
  { id: "1514780", txt: "Deputy / Assistant Manager, HR & Admin Alam Textile & Garments Dhaka Deadline 26 Aug 2026Experience3 to 5 years", url: "https://bdjobs.com/h/details/1514780" },
  { id: "1516439", txt: "Manager (Admin, HR & Compliance) Anowara Group Narayanganj Deadline 31 Aug 2026ExperienceAt least 10 years", url: "https://bdjobs.com/h/details/1516439" },
  { id: "1515558", txt: "Manager- Admin, HR & Compliance Clifton Group Chattogram Deadline 28 Aug 2026Experience10 to 12 years", url: "https://bdjobs.com/h/details/1515558" },
  { id: "1518971", txt: "Assistant Manager / Deputy Manager - HR & Admin Bir Group Holdings Demra Deadline 07 Sep 2026Experience5 to 8 years", url: "https://bdjobs.com/h/details/1518971" },
  { id: "1519750", txt: "Manager, HR & Talent Acquisition International Office Machines Ltd Dhaka Deadline 31 Aug 2026Experience5 to 10 years", url: "https://bdjobs.com/h/details/1519750" },
  { id: "1523628", txt: "Manager, HR & Administration (Factory Division) Excel Telecom (SAMSUNG) Gazipur Deadline 18 Sep 2026ExperienceAt least 10 years", url: "https://bdjobs.com/h/details/1523628" },
  { id: "1523886", txt: "Performance Marketing Specialist Adcomm Holdings Ltd. Dhaka Deadline 18 Sep 2026Experience2 to 4 years", url: "https://bdjobs.com/h/details/1523886" },
  { id: "1524373", txt: "Compliance Manager Midasia Group Mirpur Deadline 19 Sep 2026Experience3 to 5 years", url: "https://bdjobs.com/h/details/1524373" },
  { id: "1524002", txt: "Production Manager Easy Fashion Ltd Rampura Deadline 19 Sep 2026Experience8 to 10 years", url: "https://bdjobs.com/h/details/1524002" },
  { id: "1523934", txt: "Manager - Brand Strategy & Communication Nagad Limited Dhaka Deadline 30 Aug 2026Experience8 to 9 years", url: "https://bdjobs.com/h/details/1523934" },
  { id: "1523721", txt: "Assistant/ Deputy Manager (Treasury and ERP) Rancon Holdings Limited Dhaka Deadline 09 Sep 2026ExperienceAt least 5 years", url: "https://bdjobs.com/h/details/1523721" },
  { id: "1523345", txt: "Sr. Executive/ Assistant Manager - Marketing & Sales Montrims Limited Dhaka, Gazipur Deadline 15 Sep 2026Experience3 to 7 years", url: "https://bdjobs.com/h/details/1523345" },
  { id: "1523067", txt: "Asst. Manager (Civil Engineer) Ducon Construction Chemicals Dhaka Deadline 17 Sep 2026Experience1 to 2 years", url: "https://bdjobs.com/h/details/1523067" },
  { id: "1515776", txt: "Divisional Sales Manager (Renewable Energy & HVAC) Global HR Solution Anywhere in Bangladesh Deadline 29 Aug 2026ExperienceNA", url: "https://bdjobs.com/h/details/1515776" },
  { id: "1516841", txt: "Manager - Sales & Marketing (Land & Resort) HR Holdings Limited Dhaka Deadline 01 Sep 2026Experience5 to 8 years", url: "https://bdjobs.com/h/details/1516841" },
  { id: "1521463", txt: "Tender & E-GP Executive HR Corporation Bijoynagar Deadline 12 Sep 2026ExperienceNA", url: "https://bdjobs.com/h/details/1521463" },
  { id: "1517744", txt: "Senior Technical Officer (Web & Mobile) HR Technology Limited Dhaka Deadline 03 Sep 2026Experience1 to 3 years", url: "https://bdjobs.com/h/details/1517744" },
  { id: "1516853", txt: "Executive - Sales & Marketing (Land & Resort Sales) HR Holdings Ltd. Dhaka Deadline 01 Sep 2026Experience1 to 3 years", url: "https://bdjobs.com/h/details/1516853" },
  { id: "1514228", txt: "Relationship Executive Munshi HR Solutions Ltd. Anywhere in Bangladesh Deadline 25 Aug 2026ExperienceAt least 1 years", url: "https://bdjobs.com/h/details/1514228" },
  { id: "1519213", txt: "Chef / Assistant Chef Munshi HR Solutions Ltd. Dhaka Deadline 08 Sep 2026Experience2 to 6 years", url: "https://bdjobs.com/h/details/1519213" },
  { id: "1520173", txt: "Call Centre Executive Munshi HR Solutions Ltd. Dhaka Deadline 10 Sep 2026Experience1 to 3 years", url: "https://bdjobs.com/h/details/1520173" },
  { id: "1515954", txt: "Sr. Executive, Purchase Munshi HR Solutions Ltd. Tongi Deadline 29 Aug 2026Experience5 to 7 years", url: "https://bdjobs.com/h/details/1515954" },
  { id: "1519865", txt: "Junior Manager (Hr & Communication) RAHMAN'S CHAMBERS Dhaka Deadline 31 Aug 2026ExperienceNA", url: "https://bdjobs.com/h/details/1519865" },
  { id: "1520961", txt: "Assistant Manager- Corporate HR A Reputed RMG Conglomerate Tejgaon Deadline 11 Sep 2026ExperienceAt least 6 years", url: "https://bdjobs.com/h/details/1520961" },
  { id: "1482709", txt: "Accounts Manager (HR & Admin Support) Arafin Media Dhaka Deadline 31 Aug 2026Experience3 to 4 years", url: "https://bdjobs.com/h/details/1482709" },
  { id: "1519499", txt: "Manager-HR & Admin A reputed Textile and RMG based organization Dhaka Deadline 30 Aug 2026Experience8 to 10 years", url: "https://bdjobs.com/h/details/1519499" },
];

// ---- LinkedIn structured jobs ----------------------------------------------
const LINKEDIN: { title: string; company: string; location: string; url: string }[] = [
  { title: "Manager, HR Operations", company: "US-Bangla Airlines Ltd.", location: "Dhaka, Bangladesh", url: "https://bd.linkedin.com/jobs/view/manager-hr-operations-at-us-bangla-airlines-ltd-4446765088" },
  { title: "Manufacturing HRBP - Savar", company: "BAT", location: "Dhaka, Bangladesh", url: "https://bd.linkedin.com/jobs/view/manufacturing-hrbp-savar-at-bat-4445176556" },
  { title: "Manager, Talent Acquisition", company: "BRAC International", location: "Dhaka, Bangladesh", url: "https://bd.linkedin.com/jobs/view/manager-talent-acquisition-at-brac-international-4448870127" },
  { title: "Assistant General Manager/Deputy General Manager (HR)", company: "SAJIDA Foundation", location: "Dhaka, Bangladesh", url: "https://bd.linkedin.com/jobs/view/assistant-general-manager-deputy-general-manager-hr-at-sajida-foundation-4450242402" },
  { title: "HR Manager - HRM Onsite (Night Shift)", company: "Care Guide", location: "Gulshan, Dhaka, Bangladesh", url: "https://bd.linkedin.com/jobs/view/hr-manager-hrm-onsite-night-shift-at-care-guide-4447308052" },
  { title: "Deputy Manager/Assistant Manager, HR", company: "StudyNet Pty Ltd", location: "Dhaka, Bangladesh", url: "https://bd.linkedin.com/jobs/view/deputy-manager-assistant-manager-hr-at-studynet-pty-ltd-4444274538" },
  { title: "Assistant Manager Human Resources", company: "Munshi HR Solutions Limited", location: "Dhaka, Bangladesh", url: "https://bd.linkedin.com/jobs/view/assistant-manager-human-resources-at-munshi-hr-solutions-limited-4446583388" },
  { title: "Executive – HR Operations & Analytics", company: "Bengal Meat Processing Industries Ltd.", location: "Dhaka, Bangladesh", url: "https://bd.linkedin.com/jobs/view/executive-%E2%80%93-hr-operations-analytics-at-bengal-meat-processing-industries-ltd-4443792582" },
  { title: "People Generalist (Bangladesh)", company: "Commure", location: "Dhaka, Bangladesh", url: "https://bd.linkedin.com/jobs/view/people-generalist-bangladesh-at-commure-4442739350" },
  { title: "Executive – HR & Administration", company: "Square Textiles Division", location: "Dhaka, Bangladesh", url: "https://bd.linkedin.com/jobs/view/executive-%E2%80%93-hr-administration-at-square-textiles-division-4446752146" },
  { title: "Talent Acquisition Specialist", company: "APM Terminals", location: "Chattogram, Bangladesh", url: "https://bd.linkedin.com/jobs/view/talent-acquisition-specialist-at-apm-terminals-4450148001" },
  { title: "HR Officer Bangladesh Cox's Bazar (Internal)", company: "Norwegian Refugee Council", location: "Cox's Bazar, Bangladesh", url: "https://bd.linkedin.com/jobs/view/hr-officer-bangladesh-cox-s-bazar-internal-at-norwegian-refugee-council-4448148735" },
  { title: "Senior Manager/AGM - Human Resources", company: "nextjobz", location: "Dhaka, Bangladesh", url: "https://bd.linkedin.com/jobs/view/senior-manager-agm-human-resources-at-nextjobz-4450832122" },
  { title: "HR Manager", company: "nextjobz", location: "Gulshan, Dhaka, Bangladesh", url: "https://bd.linkedin.com/jobs/view/hr-manager-at-nextjobz-4449818464" },
  { title: "Manager (HR)", company: "nextjobz", location: "Dhaka, Bangladesh", url: "https://bd.linkedin.com/jobs/view/manager-hr-at-nextjobz-4450484846" },
  { title: "Manager, HR & Talent Acquisition", company: "nextjobz", location: "Dhaka, Bangladesh", url: "https://bd.linkedin.com/jobs/view/manager-hr-talent-acquisition-at-nextjobz-4450829106" },
  { title: "General Manager, HR & Administration", company: "nextjobz", location: "Feni, Chattogram, Bangladesh", url: "https://bd.linkedin.com/jobs/view/general-manager-hr-administration-at-nextjobz-4450840012" },
  { title: "Manager - Human Resources", company: "nextjobz", location: "Gulshan, Dhaka, Bangladesh", url: "https://bd.linkedin.com/jobs/view/manager-human-resources-at-nextjobz-4453446433" },
  { title: "Manager - HR (Compensation & Benefits)", company: "nextjobz", location: "Gazipur, Bangladesh", url: "https://bd.linkedin.com/jobs/view/manager-hr-compensation-benefits-at-nextjobz-4449549021" },
  { title: "Manager-HR & Admin", company: "nextjobz", location: "Chattogram, Bangladesh", url: "https://bd.linkedin.com/jobs/view/manager-hr-admin-at-nextjobz-4449549018" },
  { title: "Manager, HR & Administration (Factory Division)", company: "nextjobz", location: "Gazipur, Bangladesh", url: "https://bd.linkedin.com/jobs/view/manager-hr-administration-factory-division-at-nextjobz-4453857200" },
  { title: "Head of Admin & HR", company: "nextjobz", location: "Dhaka, Bangladesh", url: "https://bd.linkedin.com/jobs/view/head-of-admin-hr-at-nextjobz-4440131954" },
  { title: "Manager (HRD & Admin)", company: "nextjobz", location: "Uttara, Dhaka, Bangladesh", url: "https://bd.linkedin.com/jobs/view/manager-hrd-admin-at-nextjobz-4453457357" },
  { title: "HR Executive", company: "Snapform Limited", location: "Dhaka, Bangladesh", url: "https://bd.linkedin.com/jobs/view/hr-executive-at-snapform-limited-4449484067" },
  { title: "GWO Specialist", company: "Avery Dennison", location: "Dhaka, Bangladesh", url: "https://bd.linkedin.com/jobs/view/gwo-specialist-at-avery-dennison-4454393680" },
  { title: "Executive - HR, Admin & Compliance (Garments factory)", company: "Viyellatexgroup", location: "Gazipur, Dhaka, Bangladesh", url: "https://bd.linkedin.com/jobs/view/executive-hr-admin-compliance-garments-factory-job-id-1513186-at-viyellatexgroup-4443238055" },
  { title: "Assistant Manager, Technical Recruiter", company: "Betopia Group", location: "Dhaka, Bangladesh", url: "https://bd.linkedin.com/jobs/view/assistant-manager-technical-recruiter-at-betopia-group-4448849232" },
  { title: "Senior Manager, Investigations", company: "BRAC International", location: "Dhaka, Bangladesh", url: "https://bd.linkedin.com/jobs/view/senior-manager-investigations-at-brac-international-4453083007" },
  { title: "Planning & Budgeting Manager", company: "JTI", location: "Dhaka, Bangladesh", url: "https://bd.linkedin.com/jobs/view/planning-budgeting-manager-at-jti-4449539488" },
  { title: "HR Officer", company: "Aims Education India", location: "Dhaka, Bangladesh", url: "https://bd.linkedin.com/jobs/view/hr-officer-at-aims-education-india-4442751280" },
  { title: "Manager - HR, Admin & Compliance", company: "nextjobz", location: "Gazipur, Bangladesh", url: "https://bd.linkedin.com/jobs/view/manager-hr-admin-compliance-at-nextjobz-4453437460" },
  { title: "DGM - HR, Admin & Compliance", company: "nextjobz", location: "Mymensingh, Bangladesh", url: "https://bd.linkedin.com/jobs/view/dgm-hr-admin-compliance-at-nextjobz-4449532662" },
  { title: "Manager - HR & Admin", company: "Jobbd247.com", location: "Chattogram, Bangladesh", url: "https://bd.linkedin.com/jobs/view/manager-hr-admin-at-jobbd247-com-4455777492" },
  { title: "Regional HR Coordinator – Field Operations", company: "ifarmer", location: "Dhaka, Bangladesh", url: "https://bd.linkedin.com/jobs/view/regional-hr-coordinator-%E2%80%93-field-operations-at-ifarmer-4456716179" },
  { title: "HR Executive", company: "Premium Thread and Accessories", location: "Dhaka, Bangladesh", url: "https://bd.linkedin.com/jobs/view/hr-executive-at-premium-thread-and-accessories-4455770001" },
  { title: "People Generalist (Bangladesh)", company: "Athelas", location: "Dhaka, Bangladesh", url: "https://bd.linkedin.com/jobs/view/people-generalist-bangladesh-at-athelas-4443082439" },
  { title: "Manager - Employee Wellbeing and Grievance Management", company: "Reputed Knit Garments Group", location: "Gazipur, Dhaka, Bangladesh", url: "https://bd.linkedin.com/jobs/view/manager-employee-wellbeing-and-grievance-management-for-a-large-knit-garments-group-of-company-job-id-1514985-at-bdjobs-com-4445839394" },
  { title: "General Manager - HR (Corporate)", company: "EXPERIENCE GROUP", location: "Dhaka, Bangladesh", url: "https://bd.linkedin.com/jobs/view/general-manager-human-resources-corporate-for-experience-grou-job-id-1515269-at-bdjobs-com-4445585878" },
  { title: "Sr. Manager/ AGM- HR, Admin & Compliance- Knit Garments", company: "Renowned RMG Conglomerate", location: "Gazipur, Dhaka, Bangladesh", url: "https://bd.linkedin.com/jobs/view/sr-manager-agm-hr-admin-compliance-knit-garments-for-a-renowned-rmg-conglomerate-job-id-1514866-at-bdjobs-com-4445841250" },
  { title: "Manager - HR (Compensation & Benefits)", company: "nextjobz", location: "Gazipur, Bangladesh", url: "https://bd.linkedin.com/jobs/view/manager-hr-compensation-benefits-at-nextjobz-4449549021" },
  { title: "Senior Manager - HR & Business Operations (Agro Business)", company: "Growing Agro-based Business", location: "Dhaka, Bangladesh", url: "https://bd.linkedin.com/jobs/view/senior-manager-hr-business-operations-hr-lead-agro-business-for-growing-agro-based-business-organization-job-id-1515371-at-bdjobs-com-4445851135" },
  { title: "Manager, HR & Talent Acquisition", company: "nextjobz", location: "Dhaka, Bangladesh", url: "https://bd.linkedin.com/jobs/view/manager-hr-talent-acquisition-at-nextjobz-4450829106" },
  { title: "Head of HR & Administration", company: "nextjobz", location: "Dhaka, Bangladesh", url: "https://bd.linkedin.com/jobs/view/head-of-hr-administration-at-nextjobz-4440131954" },
  { title: "General Manager/Deputy General Manager (Human Resource)", company: "nextjobz", location: "Rajshahi, Bangladesh", url: "https://bd.linkedin.com/jobs/view/general-manager-deputy-general-manager-human-resource-at-nextjobz-4453456309" },
  { title: "Manager of HR Admin and Compliance", company: "nextjobz", location: "Gazipur, Bangladesh", url: "https://bd.linkedin.com/jobs/view/manager-of-hr-admin-and-compliance-at-nextjobz-4440137840" },
  { title: "Manager / Senior Manager - HR & Admin", company: "nextjobz", location: "Dhaka, Bangladesh", url: "https://bd.linkedin.com/jobs/view/manager-senior-manager-hr-admin-at-nextjobz-4453468806" },
  { title: "Asst. General Manager - Human Resources", company: "nextjobz", location: "Gazipur, Bangladesh", url: "https://bd.linkedin.com/jobs/view/asst-general-manager-human-resources-at-nextjobz-4440148584" },
  { title: "AGM (Admin, HR & Compliance)", company: "nextjobz", location: "Narayanganj, Dhaka, Bangladesh", url: "https://bd.linkedin.com/jobs/view/agm-admin-hr-compliance-at-nextjobz-4453444417" },
  { title: "Manager HR & Admin", company: "nextjobz", location: "Dhaka, Bangladesh", url: "https://bd.linkedin.com/jobs/view/manager-hr-admin-at-nextjobz-4453442468" },
  { title: "Manager - Human Resource - Solar Intercontinental (SOLARIC)", company: "Bdjobs.com", location: "Dhaka, Bangladesh", url: "https://bd.linkedin.com/jobs/view/manager-human-resource-solar-intercontinental-solaric-ltd-job-id-1517024-at-bdjobs-com-4451037733" },
];

// ---- Parsing helpers --------------------------------------------------------
function parseBdjobs(card: { id: string; txt: string; url: string }) {
  const t = card.txt;
  const deadlineMatch = t.match(/Deadline\s*(\d{1,2}\s[A-Za-z]{3}\s\d{4})/i);
  const expMatch = t.match(/Experience([A-Za-z0-9 .-]*?)(?:Education|\d{1,2}\s[A-Za-z]{3}\s\d{4}|$)/i);
  // Title = leading segment before first "Deadline"
  const beforeDeadline = t.split(/Deadline/i)[0].trim();
  // Company heuristics: last 2-3 words of beforeDeadline are often the company; location near end
  const title = beforeDeadline;
  const location = (t.match(/Deadline[^]*?(?:Experience)(.*?)(?:Education|$)/i) || [])[1]?.trim() || "";
  const exp = expMatch ? expMatch[1].trim() : "";
  return {
    title,
    location: location.slice(0, 60) || "Bangladesh",
    experience: exp === "NA" ? null : exp || null,
    deadline: deadlineMatch ? deadlineMatch[1] : null,
  };
}

async function main() {
  const candidate = await prisma.candidateProfile.findFirst({ include: { skills: true } });
  if (!candidate) throw new Error("No candidate profile");

  const cand: CandidateForMatching = {
    currentTitle: candidate.currentTitle,
    yearsExperience: candidate.yearsExperience,
    skills: candidate.skills.map((s) => s.name),
    targetRoles: JSON.parse(candidate.targetRoles ?? "[]"),
    industries: [],
    preferredLocations: JSON.parse(candidate.preferredLocations ?? "[]"),
    education: candidate.education,
    salaryExpectation: { min: candidate.salaryMin, currency: candidate.salaryCurrency },
    careerGoals: JSON.parse(candidate.careerGoals ?? "[]"),
  };

  let added = 0;
  let dupes = 0;

  const upsertJob = async (source: string, sourceJobId: string, j: JobForMatching & { url: string; deadline: string | null }) => {
    const existing = await prisma.job.findUnique({ where: { url: j.url } });
    if (existing) {
      dupes++;
      return;
    }
    const hash = computeDuplicateHash(j);
    const match = scoreJob(cand, j);
    await prisma.job.create({
      data: {
        source,
        sourceJobId,
        url: j.url,
        title: j.title,
        company: j.company,
        location: j.location,
        country: "Bangladesh",
        city: null,
        remoteType: "ANY",
        employmentType: "FULL_TIME",
        industry: null,
        department: null,
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: null,
        description: j.description,
        requirements: JSON.stringify(j.requirements),
        responsibilities: JSON.stringify([]),
        educationRequirements: JSON.stringify(j.educationRequirements),
        experienceRequired: j.experienceRequired,
        skills: JSON.stringify(j.skills),
        closingDate: j.deadline ? new Date(j.deadline) : null,
        applicationMethod: "MANUAL",
        applicationUrl: j.url,
        duplicateHash: hash,
        status: "MATCHED",
        matches: {
          create: {
            overallScore: match.overallScore,
            breakdown: JSON.stringify(match.breakdown),
            weights: JSON.stringify(match.weights),
            whyMatched: JSON.stringify(match.whyMatched),
            missingRequirements: JSON.stringify(match.missingRequirements),
            riskFlags: JSON.stringify(match.riskFlags),
            recommendation: match.recommendation,
            action: match.action,
            hardRequirementFailure: match.hardRequirementFailure,
            targetCompanyBonus: false,
          },
        },
      },
    });
    added++;
  };

  // Bdjobs
  for (const card of BDJOBS) {
    const parsed = parseBdjobs(card);
    const company = (() => {
      // derive company as middle segment (best-effort)
      const parts = parsed.title.split(" ");
      return parts.length > 3 ? parts.slice(-2).join(" ") : parsed.title;
    })();
    const hrKeywords = ["hr", "human resource", "human resources", "compensation", "reward", "talent", "hrbp", "compliance"];
    const isHR = hrKeywords.some((k) => norm(parsed.title).includes(k) || norm(parsed.title).includes(k.replace("hr ", "hr")));
    await upsertJob("bdjobs", card.id, {
      title: parsed.title,
      company,
      location: parsed.location,
      country: "Bangladesh",
      industry: null,
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,
      skills: ["HR", "Compensation & Benefits", "HR Operations", "Compliance"].filter(() => true),
      requirements: [],
      educationRequirements: [],
      experienceRequired: parsed.experience,
      description: card.txt,
      url: card.url,
      deadline: parsed.deadline,
    });
  }

  // LinkedIn
  for (const j of LINKEDIN) {
    const title = j.title.split(" - For ")[0].split(" - Job ")[0].split(" - Job ID")[0].trim();
    await upsertJob("linkedin", j.url.split("-")[0], {
      title,
      company: j.company,
      location: j.location.replace(/(Actively Hiring|Be an early applicant|\d+ (day|week|month|hour)s? ago)/gi, "").trim(),
      country: "Bangladesh",
      industry: null,
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,
      skills: ["HR", "Human Resources"],
      requirements: [],
      educationRequirements: [],
      experienceRequired: null,
      description: `${j.title}\n${j.company}\n${j.location}`,
      url: j.url,
      deadline: null,
    });
  }

  console.log(`Loaded: added=${added}, duplicates=${dupes}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
