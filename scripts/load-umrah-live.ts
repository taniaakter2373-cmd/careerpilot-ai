// Load REAL live Umrah packages (umrah.com.bd) as opportunities.
// These are COMMERCIAL PAID packages — NO sponsorship → classified SELF-FUNDED, never "free".
// Run: DATABASE_URL="<hosted-url>" npx tsx scripts/load-umrah-live.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SRC = "https://www.umrah.com.bd/umrah-packages-from-bangladesh";

const PACKAGES = [
  { name: "Economy Umrah Package", price: "BDT 155,000", note: "Economy package from Bangladesh. Commercial paid package — NO sponsorship." },
  { name: "Standard Umrah Package – 14 Days", price: "BDT 175,000", note: "14 days, 3-4★ hotel (400-700m), breakfast included, full ziyarat, direct flight. Commercial paid package — NO sponsorship." },
  { name: "Premium Umrah Package", price: "BDT 190,000 – 325,000", note: "Premium & Ramadan options. Commercial paid package — NO sponsorship." },
  { name: "Standard Umrah Package – 10 Days", price: "BDT 165,000", note: "Shorter standard package. Commercial paid package — NO sponsorship." },
];

async function main() {
  // remove test entries and stale
  await prisma.umrahOpportunity.deleteMany({ where: { title: { contains: "[TEST]" } } });
  console.log("removed test entries");

  let added = 0;
  for (const p of PACKAGES) {
    const existing = await prisma.umrahOpportunity.findFirst({ where: { title: p.name, sponsor: "umrah.com.bd" } });
    if (existing) continue;
    await prisma.umrahOpportunity.create({
      data: {
        title: p.name,
        sponsor: "umrah.com.bd",
        officialUrl: SRC,
        eligibility: "Bangladeshi residents; standard package eligibility",
        // NO sponsorship: all coverage false → SELF-FUNDED (user pays)
        visaCovered: false,
        flightCovered: false,
        makkahHotelCovered: false,
        madinahHotelCovered: false,
        foodCovered: false,
        transportCovered: false,
        insuranceCovered: "NO",
        mandatoryFeesCovered: false,
        childCovered: false,
        confidence: "HIGH", // package details verified from official agency page
        status: "OPEN",
        bangladeshEligible: "YES",
        riskLevel: "LOW", // reputable registered agency
        classification: "SELF_FUNDED",
        isFullyFree: false,
        coveredExpenses: JSON.stringify([]),
        excludedExpenses: JSON.stringify(["Everything (no sponsorship — user pays)"]),
        verificationDate: new Date(),
        notes: `COMMERCIAL PAID PACKAGE — ${p.price}. ${p.note} NOT sponsored. User pays the full amount → NOT free.`,
      },
    });
    added++;
    console.log(`  + ${p.name} (${p.price})`);
  }
  console.log(`Loaded live packages: added=${added}`);
  await prisma.$disconnect();
}
main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
