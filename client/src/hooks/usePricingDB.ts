/**
 * Hook to fetch pricing from the database and provide a price lookup function.
 * Falls back to local default prices if the database is unavailable.
 *
 * The hook returns a stable `prices` map that updates when DB data arrives.
 * Estimators should use useEffect to sync DB prices into their local state.
 */

import { useMemo } from "react";
import { trpc } from "@/lib/trpc";

export interface PriceLookup {
  /** Get the current price for a product by its database product ID */
  getPrice: (productId: string) => number | undefined;
  /** Get a map of all prices for a given system prefix (strips prefix from keys) */
  getPriceMap: (systemPrefix: string) => Map<string, number>;
  /** Full map of all prices keyed by productId */
  allPrices: Map<string, number>;
  /** Whether pricing data is still loading */
  isLoading: boolean;
  /** Whether pricing data has been loaded from DB */
  isFromDB: boolean;
  /** Refetch pricing data */
  refetch: () => void;
}

export function usePricingDB(): PriceLookup {
  const pricingQuery = trpc.pricing.list.useQuery(undefined, {
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    retry: 1,
  });

  const allPrices = useMemo(() => {
    const map = new Map<string, number>();
    if (pricingQuery.data) {
      for (const p of pricingQuery.data) {
        map.set(p.productId, parseFloat(p.unitPrice));
      }
    }
    return map;
  }, [pricingQuery.data]);

  const getPrice = (productId: string): number | undefined => {
    return allPrices.get(productId);
  };

  const getPriceMap = (systemPrefix: string): Map<string, number> => {
    const filtered = new Map<string, number>();
    Array.from(allPrices.entries()).forEach(([id, price]) => {
      if (id.startsWith(systemPrefix + "-")) {
        // Strip the system prefix to get the local product ID
        const localId = id.slice(systemPrefix.length + 1);
        filtered.set(localId, price);
      }
    });
    return filtered;
  };

  return {
    getPrice,
    getPriceMap,
    allPrices,
    isLoading: pricingQuery.isLoading,
    isFromDB: !!pricingQuery.data && pricingQuery.data.length > 0,
    refetch: () => pricingQuery.refetch(),
  };
}
