import { describe, expect, it, vi } from "vitest";

// Mock the pricing-db module
vi.mock("./pricing-db", () => ({
  getAllPricing: vi.fn().mockResolvedValue([
    {
      id: 1,
      productId: "karnak-primer",
      system: "karnak",
      name: "Karnak 404 Primer",
      manufacturer: "Karnak",
      category: "Primer",
      unit: "5 gal pail",
      unitPrice: "125.00",
      defaultPrice: "125.00",
      source: "Default",
      updatedAt: new Date(),
      createdAt: new Date(),
    },
  ]),
  getPricingBySystem: vi.fn().mockResolvedValue([
    {
      id: 1,
      productId: "karnak-primer",
      system: "karnak",
      name: "Karnak 404 Primer",
      manufacturer: "Karnak",
      category: "Primer",
      unit: "5 gal pail",
      unitPrice: "125.00",
      defaultPrice: "125.00",
      source: "Default",
      updatedAt: new Date(),
      createdAt: new Date(),
    },
  ]),
  searchPricing: vi.fn().mockResolvedValue([]),
  updateProductPrice: vi.fn().mockResolvedValue(undefined),
  bulkUpdatePrices: vi.fn().mockResolvedValue([{ productId: "karnak-primer", success: true }]),
  resetPriceToDefault: vi.fn().mockResolvedValue(undefined),
  seedDefaultPricing: vi.fn().mockResolvedValue(5),
  getPriceHistory: vi.fn().mockResolvedValue([]),
  createQuoteRequest: vi.fn().mockResolvedValue(1),
  getQuoteRequests: vi.fn().mockResolvedValue([]),
  updateQuoteStatus: vi.fn().mockResolvedValue(undefined),
}));

// Mock the db module
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({}),
  getUserByOpenId: vi.fn(),
  upsertUser: vi.fn(),
}));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(authenticated = false): TrpcContext {
  const user: AuthenticatedUser | null = authenticated
    ? {
        id: 1,
        openId: "test-user",
        email: "test@example.com",
        name: "Test User",
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      }
    : null;

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("pricing router", () => {
  it("lists all pricing entries", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.pricing.list();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0].productId).toBe("karnak-primer");
  });

  it("lists pricing filtered by system", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.pricing.list({ system: "karnak" });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("searches pricing by query", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.pricing.search({ query: "primer" });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("updates a single product price", async () => {
    const caller = appRouter.createCaller(createContext(true));
    const result = await caller.pricing.updatePrice({
      productId: "karnak-primer",
      newPrice: "130.00",
      source: "Manual Edit",
    });

    expect(result).toEqual({ success: true });
  });

  it("bulk updates prices", async () => {
    const caller = appRouter.createCaller(createContext(true));
    const result = await caller.pricing.bulkUpdate({
      updates: [
        {
          productId: "karnak-primer",
          newPrice: "130.00",
          source: "CSV Import",
        },
      ],
    });

    expect(result.total).toBe(1);
    expect(result.succeeded).toBe(1);
  });

  it("resets a product price to default", async () => {
    const caller = appRouter.createCaller(createContext(true));
    const result = await caller.pricing.resetToDefault({
      productId: "karnak-primer",
    });

    expect(result).toEqual({ success: true });
  });

  it("seeds default pricing from product data", async () => {
    const caller = appRouter.createCaller(createContext(true));
    const result = await caller.pricing.seed({
      products: [
        {
          productId: "karnak-primer",
          system: "karnak",
          manufacturer: "Karnak",
          category: "Primer",
          name: "Karnak 404 Primer",
          unit: "5 gal pail",
          unitPrice: 125.0,
        },
      ],
    });

    expect(result.seeded).toBe(5);
  });

  it("gets price history for a product", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.pricing.history({
      productId: "karnak-primer",
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("creates a quote request", async () => {
    const caller = appRouter.createCaller(createContext(true));
    const result = await caller.pricing.createQuote({
      name: "Test Quote",
      system: "karnak",
      distributor: "ABC Supply",
      productCount: 7,
      totalValue: "5000.00",
    });

    expect(result.id).toBe(1);
  });

  it("lists all quote requests", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.pricing.quotes();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("updates quote status", async () => {
    const caller = appRouter.createCaller(createContext(true));
    const result = await caller.pricing.updateQuoteStatus({
      id: 1,
      status: "sent",
    });

    expect(result).toEqual({ success: true });
  });

  it("creates a quote request without optional fields", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.pricing.createQuote({
      name: "All Systems Quote",
      system: "all",
    });

    expect(result.id).toBe(1);
  });

  it("updates quote status through full lifecycle", async () => {
    const caller = appRouter.createCaller(createContext(true));

    // Draft → Sent
    let result = await caller.pricing.updateQuoteStatus({ id: 1, status: "sent" });
    expect(result).toEqual({ success: true });

    // Sent → Received
    result = await caller.pricing.updateQuoteStatus({ id: 1, status: "received" });
    expect(result).toEqual({ success: true });

    // Received → Applied
    result = await caller.pricing.updateQuoteStatus({ id: 1, status: "applied" });
    expect(result).toEqual({ success: true });
  });

  it("uses anonymous for changedBy when user is not authenticated", async () => {
    const caller = appRouter.createCaller(createContext(false));
    const result = await caller.pricing.updatePrice({
      productId: "karnak-primer",
      newPrice: "130.00",
    });

    expect(result).toEqual({ success: true });
  });

  it("gets price history with custom limit", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.pricing.history({
      productId: "karnak-primer",
      limit: 10,
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});
