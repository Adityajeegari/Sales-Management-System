import { pgTable, text, serial, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "manager", "staff"]);

export const userRolesTable = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  salesOsUserId: text("clerk_user_id").notNull().unique(),
  email: text("email"),
  name: text("name"),
  role: userRoleEnum("role").notNull().default("staff"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type UserRole = typeof userRolesTable.$inferSelect;
export type InsertUserRole = typeof userRolesTable.$inferInsert;
export type RoleName = "admin" | "manager" | "staff";
