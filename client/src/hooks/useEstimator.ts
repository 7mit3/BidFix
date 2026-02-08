import { useState, useMemo, useCallback } from "react";
import {
  KARNAK_PRODUCTS,
  calculateEstimate,
  type EstimateInput,
  type EstimateResult,
} from "@/lib/karnak-data";

export function useEstimator() {
  const [squareFootage, setSquareFootage] = useState<string>("");
  const [verticalSeamsLF, setVerticalSeamsLF] = useState<string>("");
  const [horizontalSeamsLF, setHorizontalSeamsLF] = useState<string>("");

  // Custom prices: keyed by product id
  const [customPrices, setCustomPrices] = useState<Record<string, number>>(() => {
    const defaults: Record<string, number> = {};
    KARNAK_PRODUCTS.forEach((p) => {
      defaults[p.id] = p.defaultPrice;
    });
    return defaults;
  });

  const updatePrice = useCallback((productId: string, price: number) => {
    setCustomPrices((prev) => ({ ...prev, [productId]: price }));
  }, []);

  const resetPrices = useCallback(() => {
    const defaults: Record<string, number> = {};
    KARNAK_PRODUCTS.forEach((p) => {
      defaults[p.id] = p.defaultPrice;
    });
    setCustomPrices(defaults);
  }, []);

  const inputs: EstimateInput = useMemo(
    () => ({
      squareFootage: parseFloat(squareFootage) || 0,
      verticalSeamsLF: parseFloat(verticalSeamsLF) || 0,
      horizontalSeamsLF: parseFloat(horizontalSeamsLF) || 0,
    }),
    [squareFootage, verticalSeamsLF, horizontalSeamsLF]
  );

  const hasInputs = inputs.squareFootage > 0 || inputs.verticalSeamsLF > 0 || inputs.horizontalSeamsLF > 0;

  const estimate: EstimateResult | null = useMemo(() => {
    if (!hasInputs) return null;
    return calculateEstimate(inputs, customPrices);
  }, [inputs, customPrices, hasInputs]);

  const clearAll = useCallback(() => {
    setSquareFootage("");
    setVerticalSeamsLF("");
    setHorizontalSeamsLF("");
  }, []);

  return {
    squareFootage,
    setSquareFootage,
    verticalSeamsLF,
    setVerticalSeamsLF,
    horizontalSeamsLF,
    setHorizontalSeamsLF,
    customPrices,
    updatePrice,
    resetPrices,
    estimate,
    hasInputs,
    clearAll,
  };
}
