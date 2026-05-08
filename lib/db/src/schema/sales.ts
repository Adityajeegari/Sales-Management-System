import {
  pgTable,
  text,
  serial,
  integer,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";
import { customersTable } from "./customers";
import { productsTable } from "./products";

export const salesTable = pgTable("sales", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").unique(),
  productId: integer("product_id").references(() => productsTable.id, {
    onDelete: "set null",
  }),
  productName: text("product_name").notNull(),
  category: text("category").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  subtotal: numeric("subtotal", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  discountAmount: numeric("discount_amount", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  gstAmount: numeric("gst_amount", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  total: numeric("total", { precision: 14, scale: 2 }).notNull(),
  paymentMethod: text("payment_method"),
  status: text("status").notNull(),
  saleDate: timestamp("sale_date", { withTimezone: true }).notNull(),
  customerId: integer("customer_id").references(() => customersTable.id, {
    onDelete: "set null",
  }),
  createdBySalesOsId: text("created_by_clerk_id"),
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
