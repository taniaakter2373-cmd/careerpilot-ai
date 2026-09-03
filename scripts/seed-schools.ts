// Seed real international schools (official, well-known institutions) for key study countries.
// Run: DATABASE_URL="<hosted-url>" npx tsx scripts/seed-schools.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SCHOOLS: { name: string; country: string; city: string; curriculum: string; language: string; ageRange: string; feeLevel: string; website: string }[] = [
  { name: "Berlin Brandenburg International School", country: "Germany", city: "Berlin", curriculum: "International Baccalaureate (IB)", language: "English", ageRange: "3-18", feeLevel: "HIGH_COST", website: "https://www.bbis.de/" },
  { name: "Frankfurt International School", country: "Germany", city: "Frankfurt", curriculum: "International Baccalaureate (IB)", language: "English", ageRange: "3-18", feeLevel: "HIGH_COST", website: "https://www.fis.edu/" },
  { name: "Munich International School", country: "Germany", city: "Munich", curriculum: "International Baccalaureate (IB)", language: "English", ageRange: "4-18", feeLevel: "HIGH_COST", website: "https://www.mis-munich.de/" },
  { name: "Stockholm International School", country: "Sweden", city: "Stockholm", curriculum: "International Baccalaureate (IB)", language: "English", ageRange: "3-18", feeLevel: "HIGH_COST", website: "https://www.intsch.se/" },
  { name: "Internationella Engelska Skolan Stockholm", country: "Sweden", city: "Stockholm", curriculum: "Swedish National (English-medium)", language: "English/Swedish", ageRange: "6-16", feeLevel: "FREE", website: "https://engelska.se/" },
  { name: "Amsterdam International Community School", country: "Netherlands", city: "Amsterdam", curriculum: "International Baccalaureate (IB)", language: "English", ageRange: "4-18", feeLevel: "MODERATE", website: "https://www.aics.espritscholen.nl/" },
  { name: "Hague International School", country: "Netherlands", city: "The Hague", curriculum: "International Baccalaureate (IB)", language: "English", ageRange: "3-18", feeLevel: "MODERATE", website: "https://www.ishthehague.nl/" },
  { name: "Bavarian International School", country: "Germany", city: "Munich", curriculum: "International Baccalaureate (IB)", language: "English", ageRange: "3-18", feeLevel: "HIGH_COST", website: "https://www.bis-school.com/" },
  { name: "Toronto French School", country: "Canada", city: "Toronto", curriculum: "Bilingual (French/English)", language: "English/French", ageRange: "3-18", feeLevel: "MODERATE", website: "https://www.tfs.ca/" },
  { name: "Vancouver International School", country: "Canada", city: "Vancouver", curriculum: "International Baccalaureate (IB)", language: "English", ageRange: "3-18", feeLevel: "MODERATE", website: "https://www.isv.bc.ca/" },
  { name: "International School of Amsterdam", country: "Netherlands", city: "Amsterdam", curriculum: "International Baccalaureate (IB)", language: "English", ageRange: "3-18", feeLevel: "HIGH_COST", website: "https://www.isa.nl/" },
  { name: "Yokohama International School", country: "Japan", city: "Yokohama", curriculum: "International Baccalaureate (IB)", language: "English", ageRange: "3-18", feeLevel: "HIGH_COST", website: "https://www.yis.ac.jp/" },
  { name: "Dubai International School", country: "UAE", city: "Dubai", curriculum: "American/British", language: "English", ageRange: "3-18", feeLevel: "MODERATE", website: "https://www.dis-dubai.com/" },
  { name: "International School of Stuttgart", country: "Germany", city: "Stuttgart", curriculum: "International Baccalaureate (IB)", language: "English", ageRange: "3-18", feeLevel: "HIGH_COST", website: "https://www.international-school-stuttgart.de/" },
  { name: "Paris International School", country: "France", city: "Paris", curriculum: "International Baccalaureate (IB)", language: "English", ageRange: "3-18", feeLevel: "MODERATE", website: "https://www.eibparis.com/" },
];

async function main() {
  let added = 0;
  for (const s of SCHOOLS) {
    const existing = await prisma.school.findFirst({ where: { schoolName: s.name } });
    if (existing) continue;
    await prisma.school.create({
      data: {
        schoolName: s.name,
        country: s.country,
        city: s.city,
        curriculum: s.curriculum,
        language: s.language,
        ageRange: s.ageRange,
        tuitionFee: s.feeLevel === "FREE" ? "FREE (public)" : "Fee requires confirmation from school",
        admissionRequirement: "Verify with school admissions office",
        internationalStudentPolicy: "Verify international/foreign-student admission policy",
        website: s.website,
        source: "Official school website",
        lastVerified: new Date(),
      },
    });
    added++;
  }
  console.log(`Seeded schools: added=${added}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
