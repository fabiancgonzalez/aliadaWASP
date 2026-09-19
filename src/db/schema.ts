import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const orderStatus = pgEnum("order_status", [
  "pending_payment",
  "paid",
  "preparing",
  "ready",
  "completed",
  "cancelled",
  "refunded",
  "charged_back",
]);

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: varchar("title", { length: 160 }).notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    imageUrl: text("image_url").notNull(),
    priceInCents: integer("price_in_cents").notNull(),
    stock: integer("stock").default(0).notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    titleUnique: uniqueIndex("products_title_unique").on(table.title),
  })
);

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  customerEmail: text("customer_email").notNull(),
  status: orderStatus("status").default("pending_payment").notNull(),
  totalInCents: integer("total_in_cents").notNull(),
  mercadoPagoPreferenceId: text("mercado_pago_preference_id").unique(),
  mercadoPagoPaymentId: text("mercado_pago_payment_id").unique(),
  paymentStatusDetail: text("payment_status_detail"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  productTitle: varchar("product_title", { length: 160 }).notNull(),
  unitPriceInCents: integer("unit_price_in_cents").notNull(),
  quantity: integer("quantity").notNull(),
});