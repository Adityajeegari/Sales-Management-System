import { db, activityLogsTable, notificationsTable } from "@workspace/db";

export interface LogActivityArgs {
  clerkUserId?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: number | null;
  summary: string;
  metadata?: Record<string, unknown> | null;
}

export async function logActivity(args: LogActivityArgs): Promise<void> {
  try {
    await db.insert(activityLogsTable).values({
      clerkUserId: args.clerkUserId ?? null,
      actorName: args.actorName ?? null,
      actorEmail: args.actorEmail ?? null,
      action: args.action,
      entityType: args.entityType,
      entityId: args.entityId ?? null,
      summary: args.summary,
      metadata: (args.metadata ?? null) as never,
    });
  } catch (err) {
    console.error("Failed to log activity", err);
  }
}

export interface NotifyArgs {
  type: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown> | null;
  clerkUserId?: string | null;
}

export async function broadcastNotification(args: NotifyArgs): Promise<void> {
  try {
    await db.insert(notificationsTable).values({
      clerkUserId: args.clerkUserId ?? null,
      type: args.type,
      title: args.title,
      body: args.body,
      metadata: (args.metadata ?? null) as never,
    });
  } catch (err) {
    console.error("Failed to create notification", err);
  }
}

export function generateInvoiceNumber(saleId: number, when: Date): string {
  const yr = when.getFullYear();
  return `INV-${yr}-${String(saleId).padStart(5, "0")}`;
}
