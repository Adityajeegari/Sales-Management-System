import {
  pgTable,
  text,
  serial,
  integer,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const activityLogsTable = pgTable(
  "activity_logs",
  {
    id: serial("id").primaryKey(),
    clerkUserId: text("clerk_user_id"),
    actorName: text("actor_name"),
    actorEmail: text("actor_email"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: integer("entity_id"),
    summary: text("summary").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    createdAtIdx: index("activity_logs_created_at_idx").on(t.createdAt),
  }),
);

export type ActivityLog = typeof activityLogsTable.$inferSelect;
export type InsertActivityLog = typeof activityLogsTable.$inferInsert;
