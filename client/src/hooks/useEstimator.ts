import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  KARNAK_PRODUCTS,
  calculateEstimate,
  type EstimateInput,
  type EstimateResult,
} from "@/lib/karnak-data";
import {
  DEFAULT_LABOR_ITEMS,
  DEFAULT_EQUIPMENT_ITEMS,
  calculateLaborEquipmentTotals,
  type LaborEquipmentState,
  type LaborEquipmentTotals,
} from "@/lib/labor-equipment-data";
import { usePricingDB } from "@/hooks/usePricingDB";

export function useEstimator() {
  const [squareFootage, setSquareFootage] = useState<string>("");
  const [verticalSeamsLF, setVerticalSeamsLF] = useState<string>("");
  const [horizontalSeamsLF, setHorizontalSeamsLF] = useState<string>("");

  // Pricing DB integration
  const { getPriceMap, isFromDB } = usePricingDB();
  const dbPriceMap = useMemo(() => getPriceMap("karnak"), [getPriceMap, isFromDB]);

  // Custom prices: keyed by product id, initialized from local defaults
  const [customPrices, setCustomPrices] = useState<Record<string, number>>(() => {
    const defaults: Record<string, number> = {};
    KARNAK_PRODUCTS.forEach((p) => {
      defaults[p.id] = p.defaultPrice;
    });
    return defaults;
  });

  // Track whether user has manually edited any price
  const userEditedPrices = useRef<Set<string>>(new Set());

  // Sync DB prices into local state when they arrive (only for non-user-edited prices)
  useEffect(() => {
    if (dbPriceMap.size > 0) {
      setCustomPrices((prev) => {
        const next = { ...prev };
        let changed = false;
        Array.from(dbPriceMap.entries()).forEach(([id, price]) => {
          if (!userEditedPrices.current.has(id) && next[id] !== price) {
            next[id] = price;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }
  }, [dbPriceMap]);

  // Labor & Equipment state
  const [laborEquipment, setLaborEquipment] = useState<LaborEquipmentState>(() => ({
    laborItems: DEFAULT_LABOR_ITEMS.map((item) => ({
      ...item,
      rate: item.defaultRate,
      quantity: item.defaultQuantity,
    })),
    equipmentItems: DEFAULT_EQUIPMENT_ITEMS.map((item) => ({
      ...item,
      rate: item.defaultRate,
      quantity: item.defaultQuantity,
    })),
  }));

  const updateLaborItem = useCallback(
    (id: string, field: "rate" | "quantity" | "enabled", value: number | boolean) => {
      setLaborEquipment((prev) => ({
        ...prev,
        laborItems: prev.laborItems.map((item) =>
          item.id === id ? { ...item, [field]: value } : item
        ),
      }));
    },
    []
  );

  const updateEquipmentItem = useCallback(
    (id: string, field: "rate" | "quantity" | "enabled", value: number | boolean) => {
      setLaborEquipment((prev) => ({
        ...prev,
        equipmentItems: prev.equipmentItems.map((item) =>
          item.id === id ? { ...item, [field]: value } : item
        ),
      }));
    },
    []
  );

  const resetLaborEquipment = useCallback(() => {
    setLaborEquipment({
      laborItems: DEFAULT_LABOR_ITEMS.map((item) => ({
        ...item,
        rate: item.defaultRate,
        quantity: item.defaultQuantity,
      })),
      equipmentItems: DEFAULT_EQUIPMENT_ITEMS.map((item) => ({
        ...item,
        rate: item.defaultRate,
        quantity: item.defaultQuantity,
      })),
    });
  }, []);

  const updatePrice = useCallback((productId: string, price: number) => {
    userEditedPrices.current.add(productId);
    setCustomPrices((prev) => ({ ...prev, [productId]: price }));
  }, []);

  const resetPrices = useCallback(() => {
    userEditedPrices.current.clear();
    const defaults: Record<string, number> = {};
    KARNAK_PRODUCTS.forEach((p) => {
      // Reset to DB price if available, otherwise local default
      defaults[p.id] = dbPriceMap.get(p.id) ?? p.defaultPrice;
    });
    setCustomPrices(defaults);
  }, [dbPriceMap]);

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

  const laborEquipmentTotals: LaborEquipmentTotals | null = useMemo(() => {
    if (!hasInputs) return null;
    return calculateLaborEquipmentTotals(laborEquipment, inputs.squareFootage);
  }, [laborEquipment, inputs.squareFootage, hasInputs]);

  const projectTotal = useMemo(() => {
    if (!estimate || !laborEquipmentTotals) return 0;
    return (
      estimate.totalMaterialCost +
      laborEquipmentTotals.laborTotal +
      laborEquipmentTotals.equipmentTotal
    );
  }, [estimate, laborEquipmentTotals]);

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
    laborEquipment,
    updateLaborItem,
    updateEquipmentItem,
    resetLaborEquipment,
    laborEquipmentTotals,
    projectTotal,
    estimate,
    hasInputs,
    clearAll,
  };
}
