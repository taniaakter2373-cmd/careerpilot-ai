import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const [jobs, scholarships, schools, certs] = await Promise.all([
    prisma.application.findMany({ orderBy: { createdAt: "desc" }, include: { job: true } }),
    prisma.scholarshipApplication.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.schoolApplication.findMany({ orderBy: { createdAt: "desc" }, include: { school: true } }),
    prisma.certificationApplication.findMany({ orderBy: { createdAt: "desc" }, include: { certification: true } }),
  ]);

  const programmeIds = scholarships.map((s) => s.programmeId);
  const programmes = await prisma.erasmusProgramme.findMany({ where: { id: { in: programmeIds } }, select: { id: true, programmeName: true, countries: true } });
  const programmeMap = new Map(programmes.map((p) => [p.id, p]));

  const jobRows = jobs.map((a) => ({
    id: a.id,
    type: "JOB",
    title: a.job?.title ?? null,
    org: a.job?.company ?? null,
    location: a.job?.location ?? null,
    status: a.status,
    applicationDate: a.applicationDate,
    deadline: a.job?.closingDate ?? null,
    confirmationNumber: a.confirmationNumber,
    applicationMethod: a.applicationMethod,
    detailUrl: `/applications/${a.id}`,
  }));

  const schRows = scholarships.map((a) => {
    const prog = programmeMap.get(a.programmeId);
    return {
      id: a.id,
      type: "SCHOLARSHIP",
      title: prog?.programmeName ?? null,
      org: prog?.countries ? (JSON.parse(prog.countries) as string[]).join(", ") : null,
      location: null,
      status: a.status,
      applicationDate: a.applicationDate,
      deadline: a.deadline,
      confirmationNumber: a.confirmationNumber,
      applicationMethod: "MANUAL",
      detailUrl: `/scholarships/applications/${a.id}`,
    };
  });

  const schoolRows = schools.map((a) => ({
    id: a.id,
    type: "SCHOOL",
    title: a.school?.schoolName ?? null,
    org: `${a.school?.city ?? ""} ${a.school?.country ?? ""}`.trim() || null,
    location: null,
    status: a.status,
    applicationDate: a.applicationDate,
    deadline: a.deadline,
    confirmationNumber: a.confirmationNumber,
    applicationMethod: "MANUAL",
    detailUrl: `/family/school-applications/${a.id}`,
  }));

  const certRows = certs.map((a) => ({
    id: a.id,
    type: "CERTIFICATION",
    title: a.certification?.name ?? null,
    org: a.certification?.provider ?? null,
    location: null,
    status: a.status,
    applicationDate: a.applicationDate,
    deadline: a.deadline,
    confirmationNumber: a.confirmationNumber,
    applicationMethod: "MANUAL",
    detailUrl: `/certifications/applications`,
  }));

  const all = [...jobRows, ...schRows, ...schoolRows, ...certRows].sort((a, b) => {
    const da = a.applicationDate ?? new Date(0);
    const db = b.applicationDate ?? new Date(0);
    return db.getTime() - da.getTime();
  });

  return NextResponse.json(all);
}
