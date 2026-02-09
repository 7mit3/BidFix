import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  getAllPricing,
  getPricingBySystem,
  searchPricing,
  updateProductPrice,
  bulkUpdatePrices,
  resetPriceToDefault,
  seedDefaultPricing,
  getPriceHistory,
  createQuoteRequest,
  getQuoteRequests,
  updateQuoteStatus,
} from "../pricing-db";

export const pricingRouter = router({
  /** Get all product pricing, optionally filtered by system */
  list: publicProcedure
    .input(
      z
        .object({
          system: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      if (input?.system) {
        return getPricingBySystem(input.system);
      }
      return getAllPricing();
    }),

  /** Search pricing by name, productId, manufacturer, or category */
  search: publicProcedure
    .input(
      z.object({
        query: z.string(),
        system: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      return searchPricing(input.query, input.system);
    }),

  /** Update a single product's price */
  updatePrice: publicProcedure
    .input(
      z.object({
        productId: z.string(),
        newPrice: z.string(),
        source: z.string().default("Manual Edit"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const changedBy = ctx.user?.openId || "anonymous";
      await updateProductPrice(input.productId, input.newPrice, input.source, changedBy);
      return { success: true };
    }),

  /** Bulk update prices (used for CSV import) */
  bulkUpdate: publicProcedure
    .input(
      z.object({
        updates: z.array(
          z.object({
            productId: z.string(),
            newPrice: z.string(),
            source: z.string(),
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const changedBy = ctx.user?.openId || "anonymous";
      const results = await bulkUpdatePrices(input.updates, changedBy);
      return {
        total: results.length,
        succeeded: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success),
      };
    }),

  /** Reset a product's price to its default */
  resetToDefault: publicProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const changedBy = ctx.user?.openId || "anonymous";
      await resetPriceToDefault(input.productId, changedBy);
      return { success: true };
    }),

  /** Seed default pricing from estimator data models */
  seed: publicProcedure
    .input(
      z.object({
        products: z.array(
          z.object({
            productId: z.string(),
            system: z.string(),
            manufacturer: z.string(),
            category: z.string(),
            name: z.string(),
            unit: z.string(),
            unitPrice: z.number(),
          }),
        ),
      }),
    )
    .mutation(async ({ input }) => {
      const count = await seedDefaultPricing(input.products);
      return { seeded: count };
    }),

  /** Get price history for a product */
  history: publicProcedure
    .input(
      z.object({
        productId: z.string(),
        limit: z.number().optional().default(50),
      }),
    )
    .query(async ({ input }) => {
      return getPriceHistory(input.productId, input.limit);
    }),

  /** Create a new quote request */
  createQuote: publicProcedure
    .input(
      z.object({
        name: z.string(),
        system: z.string(),
        distributor: z.string().optional(),
        productCount: z.number().optional(),
        totalValue: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const id = await createQuoteRequest({
        ...input,
        createdBy: ctx.user?.openId || "anonymous",
      });
      return { id };
    }),

  /** List all quote requests */
  quotes: publicProcedure.query(async () => {
    return getQuoteRequests();
  }),

  /** Update quote status */
  updateQuoteStatus: publicProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["draft", "sent", "received", "applied"]),
      }),
    )
    .mutation(async ({ input }) => {
      await updateQuoteStatus(input.id, input.status);
      return { success: true };
    }),
});
