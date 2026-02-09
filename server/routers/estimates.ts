import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  listEstimates,
  getEstimate,
  createEstimate,
  updateEstimate,
  deleteEstimate,
} from "../estimates-db";

export const estimatesRouter = router({
  /** List all saved estimates (summary only, no full data blob). */
  list: publicProcedure
    .input(
      z
        .object({
          system: z.string().optional(),
          search: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      return listEstimates(input ?? undefined);
    }),

  /** Load a single saved estimate by ID (includes full data JSON). */
  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const estimate = await getEstimate(input.id);
      if (!estimate) {
        throw new Error("Estimate not found");
      }
      return estimate;
    }),

  /** Save a new estimate. */
  save: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        system: z.string(),
        systemLabel: z.string(),
        notes: z.string().optional(),
        data: z.string(), // JSON string of full estimator state
        grandTotal: z.string().optional(),
        roofArea: z.string().optional(),
        breakdownState: z.string().optional(), // JSON string of breakdown edits
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const result = await createEstimate({
        name: input.name,
        system: input.system,
        systemLabel: input.systemLabel,
        notes: input.notes ?? null,
        data: input.data,
        grandTotal: input.grandTotal ?? null,
        roofArea: input.roofArea ?? null,
        breakdownState: input.breakdownState ?? null,
        createdBy: ctx.user?.openId || "anonymous",
      });
      return result;
    }),

  /** Update an existing saved estimate (overwrite / re-save). */
  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        notes: z.string().optional(),
        data: z.string().optional(),
        grandTotal: z.string().optional(),
        roofArea: z.string().optional(),
        breakdownState: z.string().optional(), // JSON string of breakdown edits
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      return updateEstimate(id, updates);
    }),

  /** Rename a saved estimate. */
  rename: publicProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1, "Name is required"),
      }),
    )
    .mutation(async ({ input }) => {
      return updateEstimate(input.id, { name: input.name });
    }),

  /** Delete a saved estimate. */
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return deleteEstimate(input.id);
    }),
});
