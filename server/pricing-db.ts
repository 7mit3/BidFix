import { eq, like, and, or, sql, desc } from "drizzle-orm";
import { getDb } from "./db";
import {
  productPricing,
  priceHistory,
  quoteRequests,
  type InsertProductPricing,
  type InsertPriceHistory,
  type InsertQuoteRequest,
} from "../drizzle/schema";

// ─── Product Pricing CRUD ───────────────────────────────────────────

export async function getAllPricing() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(productPricing).orderBy(productPricing.system, productPricing.category, productPricing.name);
}

export async function getPricingBySystem(system: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(productPricing).where(eq(productPricing.system, system)).orderBy(productPricing.category, productPricing.name);
}

export async function getPricingByProductId(productId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(productPricing).where(eq(productPricing.productId, productId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function searchPricing(query: string, system?: string) {
  const db = await getDb();
  if (!db) return [];
  const searchPattern = `%${query}%`;
  const conditions = [
    or(
      like(productPricing.name, searchPattern),
      like(productPricing.productId, searchPattern),
      like(productPricing.manufacturer, searchPattern),
      like(productPricing.category, searchPattern),
    ),
  ];
  if (system) {
    conditions.push(eq(productPricing.system, system));
  }
  return db.select().from(productPricing).where(and(...conditions)).orderBy(productPricing.system, productPricing.category);
}

export async function upsertProductPricing(product: InsertProductPricing) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(productPricing).values(product).onDuplicateKeyUpdate({
    set: {
      name: product.name,
      manufacturer: product.manufacturer,
      category: product.category,
      unit: product.unit,
      unitPrice: product.unitPrice,
      defaultPrice: product.defaultPrice,
      priceSource: product.priceSource,
      notes: product.notes,
      lastPriceUpdate: new Date(),
    },
  });
}

export async function updateProductPrice(
  productId: string,
  newPrice: string,
  source: string,
  changedBy?: string,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get current price for history
  const current = await getPricingByProductId(productId);
  if (!current) throw new Error(`Product ${productId} not found`);

  const oldPrice = current.unitPrice;

  // Update the price
  await db
    .update(productPricing)
    .set({
      unitPrice: newPrice,
      priceSource: source,
      lastPriceUpdate: new Date(),
    })
    .where(eq(productPricing.productId, productId));

  // Log to history
  await db.insert(priceHistory).values({
    productId,
    oldPrice: oldPrice,
    newPrice: newPrice,
    source,
    changedBy: changedBy || "system",
  });
}

export async function bulkUpdatePrices(
  updates: Array<{ productId: string; newPrice: string; source: string }>,
  changedBy?: string,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const results: Array<{ productId: string; success: boolean; error?: string }> = [];

  for (const update of updates) {
    try {
      await updateProductPrice(update.productId, update.newPrice, update.source, changedBy);
      results.push({ productId: update.productId, success: true });
    } catch (err: any) {
      results.push({ productId: update.productId, success: false, error: err.message });
    }
  }

  return results;
}

export async function resetPriceToDefault(productId: string, changedBy?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const current = await getPricingByProductId(productId);
  if (!current) throw new Error(`Product ${productId} not found`);

  await updateProductPrice(productId, current.defaultPrice, "Reset to default", changedBy);
}

// ─── Seed default pricing from estimator data ───────────────────────

export async function seedDefaultPricing(
  products: Array<{
    productId: string;
    system: string;
    manufacturer: string;
    category: string;
    name: string;
    unit: string;
    unitPrice: number;
  }>,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let seeded = 0;
  for (const p of products) {
    const priceStr = p.unitPrice.toFixed(2);
    await db
      .insert(productPricing)
      .values({
        productId: p.productId,
        system: p.system,
        manufacturer: p.manufacturer,
        category: p.category,
        name: p.name,
        unit: p.unit,
        unitPrice: priceStr,
        defaultPrice: priceStr,
        priceSource: "Default",
      })
      .onDuplicateKeyUpdate({
        // Don't overwrite user-set prices, only update metadata
        set: {
          name: p.name,
          manufacturer: p.manufacturer,
          category: p.category,
          unit: p.unit,
          defaultPrice: priceStr,
        },
      });
    seeded++;
  }
  return seeded;
}

// ─── Price History ──────────────────────────────────────────────────

export async function getPriceHistory(productId: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(priceHistory)
    .where(eq(priceHistory.productId, productId))
    .orderBy(desc(priceHistory.createdAt))
    .limit(limit);
}

// ─── Quote Requests ─────────────────────────────────────────────────

export async function createQuoteRequest(quote: InsertQuoteRequest) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(quoteRequests).values(quote);
  return result[0].insertId;
}

export async function getQuoteRequests() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quoteRequests).orderBy(desc(quoteRequests.createdAt));
}

export async function updateQuoteStatus(id: number, status: "draft" | "sent" | "received" | "applied") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(quoteRequests).set({ status }).where(eq(quoteRequests.id, id));
}
