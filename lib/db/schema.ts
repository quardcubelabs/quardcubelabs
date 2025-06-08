import { pgTable, uuid, text, numeric, timestamp, jsonb } from "drizzle-orm/pg-core"

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  user_id: uuid("user_id"),
  date: timestamp("date", { withTimezone: true }).notNull(),
  status: text("status").default("pending"),
  items: jsonb("items").notNull(),
  total: text("total").notNull(),
  customerName: text("customerName"),
  customerEmail: text("customerEmail"),
  shippingAddress: text("shippingAddress"),
}) 