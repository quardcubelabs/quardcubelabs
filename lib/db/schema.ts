import { pgTable, serial, text, decimal, timestamp } from "drizzle-orm/pg-core"

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  items: text("items").notNull(), // JSON string of order items
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  shippingAddress: text("shipping_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}) 