import { prisma } from "@careerpilot/database";

export interface AuditEvent {
  userId?: string | null;
  jobId?: string | null;
  action: string;
  oldStatus?: string | null;
  newStatus?: string | null;
  applicationMethod?: string | null;
  result?: string | null;
  error?: string | null;
  browserSessionId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function logAudit(event: AuditEvent): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: event.userId ?? null,
      jobId: event.jobId ?? null,
      action: event.action,
      oldStatus: event.oldStatus ?? null,
      newStatus: event.newStatus ?? null,
      applicationMethod: event.applicationMethod ?? null,
      result: event.result ?? null,
      error: event.error ?? null,
      browserSessionId: event.browserSessionId ?? null,
      metadata: event.metadata ? JSON.stringify(event.metadata) : null,
    },
  });
}
