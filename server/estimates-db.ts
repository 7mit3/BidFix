/**
 * Saved Estimates — Database helpers
 *
 * CRUD operations for the saved_estimates table.
 */
import { eq, desc, like, and } from "drizzle-orm";
import { getDb } from "./db";
import { savedEstimates, type InsertSavedEstimate } from "../drizzle/schema";

/** List all saved estimates, newest first. Optional filter by system. */
export async function listEstimates(opts?: { system?: string; search?: string }) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (opts?.system) {
    conditions.push(eq(savedEstimates.system, opts.system));
  }
  if (opts?.search) {
    conditions.push(like(savedEstimates.name, `%${opts.search}%`));
  }

  return db
    .select({
      id: savedEstimates.id,
      name: savedEstimates.name,
      system: savedEstimates.system,
      systemLabel: savedEstimates.systemLabel,
      notes: savedEstimates.notes,
      grandTotal: savedEstimates.grandTotal,
      roofArea: savedEstimates.roofArea,
      createdBy: savedEstimates.createdBy,
      createdAt: savedEstimates.createdAt,
      updatedAt: savedEstimates.updatedAt,
    })
    .from(savedEstimates)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(savedEstimates.updatedAt));
}

/** Get a single saved estimate by ID (includes full data JSON). */
export async function getEstimate(id: number) {
  const db = await getDb();
  if (!db) return null;

  const rows = await db
    .select()
    .from(savedEstimates)
    .where(eq(savedEstimates.id, id))
    .limit(1);

  return rows[0] ?? null;
}

/** Create a new saved estimate. Returns the inserted ID. */
export async function createEstimate(input: InsertSavedEstimate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(savedEstimates).values(input);
  return { id: Number(result[0].insertId) };
}

/** Update an existing saved estimate (name, notes, data, grandTotal, roofArea). */
export async function updateEstimate(
  id: number,
  updates: Partial<Pick<InsertSavedEstimate, "name" | "notes" | "data" | "grandTotal" | "roofArea">>,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(savedEstimates).set(updates).where(eq(savedEstimates.id, id));
  return { success: true };
}

/** Delete a saved estimate by ID. */
export async function deleteEstimate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(savedEstimates).where(eq(savedEstimates.id, id));
  return { success: true };
}
