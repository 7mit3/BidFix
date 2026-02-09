import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, bigint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Product pricing database.
 * Stores unit prices for all materials across all estimators.
 * Each product is identified by a unique productId that matches the estimator data models.
 */
export const productPricing = mysqlTable("product_pricing", {
  id: int("id").autoincrement().primaryKey(),
  /** Unique product identifier matching estimator data (e.g., 'carlisle-tpo-60mil-10x100') */
  productId: varchar("productId", { length: 128 }).notNull().unique(),
  /** Which estimator system this belongs to */
  system: varchar("system", { length: 64 }).notNull(),
  /** Manufacturer name */
  manufacturer: varchar("manufacturer", { length: 128 }).notNull(),
  /** Product category (e.g., 'Membrane', 'Insulation', 'Fasteners & Plates') */
  category: varchar("category", { length: 128 }).notNull(),
  /** Human-readable product name */
  name: varchar("name", { length: 256 }).notNull(),
  /** Unit of measure (e.g., 'per roll', 'per gallon', 'per bag') */
  unit: varchar("unit", { length: 64 }).notNull(),
  /** Current unit price in dollars */
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  /** Default/baseline price from spec sheet or initial research */
  defaultPrice: decimal("defaultPrice", { precision: 10, scale: 2 }).notNull(),
  /** Source of the current price (e.g., 'Default', 'QXO Quote', 'ABC Supply Quote') */
  priceSource: varchar("priceSource", { length: 256 }).default("Default"),
  /** Optional notes about the product or pricing */
  notes: text("notes"),
  /** When the price was last updated */
  lastPriceUpdate: timestamp("lastPriceUpdate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductPricing = typeof productPricing.$inferSelect;
export type InsertProductPricing = typeof productPricing.$inferInsert;

/**
 * Price history log.
 * Tracks every price change for audit trail and trend analysis.
 */
export const priceHistory = mysqlTable("price_history", {
  id: int("id").autoincrement().primaryKey(),
  /** References productPricing.productId */
  productId: varchar("productId", { length: 128 }).notNull(),
  /** The old price before the change */
  oldPrice: decimal("oldPrice", { precision: 10, scale: 2 }).notNull(),
  /** The new price after the change */
  newPrice: decimal("newPrice", { precision: 10, scale: 2 }).notNull(),
  /** Source of the new price */
  source: varchar("source", { length: 256 }),
  /** Who made the change (user openId or 'system' for imports) */
  changedBy: varchar("changedBy", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PriceHistory = typeof priceHistory.$inferSelect;
export type InsertPriceHistory = typeof priceHistory.$inferInsert;

/**
 * Quote requests.
 * Tracks quote requests sent to distributors.
 */
export const quoteRequests = mysqlTable("quote_requests", {
  id: int("id").autoincrement().primaryKey(),
  /** Name/label for this quote request */
  name: varchar("name", { length: 256 }).notNull(),
  /** Which estimator system (e.g., 'carlisle-tpo', 'gaf-tpo', 'karnak-metal-kynar') */
  system: varchar("system", { length: 64 }).notNull(),
  /** Distributor name */
  distributor: varchar("distributor", { length: 256 }),
  /** Status of the quote */
  status: mysqlEnum("status", ["draft", "sent", "received", "applied"]).default("draft").notNull(),
  /** Number of products in the quote */
  productCount: int("productCount").default(0),
  /** Total estimated value */
  totalValue: decimal("totalValue", { precision: 12, scale: 2 }),
  /** User who created the quote */
  createdBy: varchar("createdBy", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QuoteRequest = typeof quoteRequests.$inferSelect;
export type InsertQuoteRequest = typeof quoteRequests.$inferInsert;
