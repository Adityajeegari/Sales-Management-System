import {
  pgTable,
  text,
  serial,
  integer,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";
import { customersTable } from "./customers";

export const salesTable = pgTable("sales", {
  id: serial("id").primaryKey(),
  productName: text("product_name").notNull(),
  category: text("category").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  total: numeric("total", { precision: 14, scale: 2 }).notNull(),
  status: text("status").notNull(),
  saleDate: timestamp("sale_date", { withTimezone: true }).notNull(),
  customerId: integer("customer_id").references(() => customersTable.id, {
    onDelete: "set null",
  }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Sale = typeof salesTable.$inferSelect;
export type InsertSale = typeof salesTable.$inferInsert;
