import {
  pgTable,
  text,
  serial,
  integer,
  numeric,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const salesTargetsTable = pgTable(
  "sales_targets",
  {
    id: serial("id").primaryKey(),
    clerkUserId: text("clerk_user_id"),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    targetAmount: numeric("target_amount", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    uniqUserPeriod: unique("sales_targets_user_period_unique").on(
      t.clerkUserId,
      t.year,
      t.month,
    ),
  }),
);

export type SalesTarget = typeof salesTargetsTable.$inferSelect;
export type InsertSalesTarget = typeof salesTargetsTable.$inferInsert;
