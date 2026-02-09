import { describe, it, expect } from "vitest";
import {
  DEFAULT_TPO_LABOR_ITEMS,
  DEFAULT_TPO_EQUIPMENT_ITEMS,
  calculateTPOLaborEquipmentTotals,
  type TPOLaborEquipmentState,
} from "./tpo-labor-equipment-data";

function makeState(
  overrides?: Partial<{
    laborOverrides: Record<string, Partial<{ rate: number; quantity: number; enabled: boolean }>>;
    equipmentOverrides: Record<string, Partial<{ rate: number; quantity: number; enabled: boolean }>>;
  }>
): TPOLaborEquipmentState {
  return {
    laborItems: DEFAULT_TPO_LABOR_ITEMS.map((item) => ({
      ...item,
      rate: item.defaultRate,
      quantity: item.defaultQuantity,
      ...(overrides?.laborOverrides?.[item.id] ?? {}),
    })),
    equipmentItems: DEFAULT_TPO_EQUIPMENT_ITEMS.map((item) => ({
      ...item,
      rate: item.defaultRate,
      quantity: item.defaultQuantity,
      ...(overrides?.equipmentOverrides?.[item.id] ?? {}),
    })),
  };
}

describe("TPO Labor & Equipment Data", () => {
  describe("DEFAULT_TPO_LABOR_ITEMS", () => {
    it("should have unique IDs", () => {
      const ids = DEFAULT_TPO_LABOR_ITEMS.map((i) => i.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("should have valid rate types", () => {
      const validTypes = ["per_sqft", "per_hour", "per_lf", "flat"];
      for (const item of DEFAULT_TPO_LABOR_ITEMS) {
        expect(validTypes).toContain(item.rateType);
      }
    });

    it("should have positive default rates", () => {
      for (const item of DEFAULT_TPO_LABOR_ITEMS) {
        expect(item.defaultRate).toBeGreaterThan(0);
      }
    });
  });

  describe("DEFAULT_TPO_EQUIPMENT_ITEMS", () => {
    it("should have unique IDs", () => {
      const ids = DEFAULT_TPO_EQUIPMENT_ITEMS.map((i) => i.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("should have valid rate types", () => {
      const validTypes = ["per_day", "flat"];
      for (const item of DEFAULT_TPO_EQUIPMENT_ITEMS) {
        expect(validTypes).toContain(item.rateType);
      }
    });
  });

  describe("calculateTPOLaborEquipmentTotals", () => {
    it("should calculate per_sqft labor correctly", () => {
      const state = makeState({
        laborOverrides: {
          "tpo-labor-membrane": { rate: 1.25, enabled: true },
          "tpo-labor-insulation": { enabled: false },
          "tpo-labor-foreman": { enabled: false },
          "tpo-labor-tearoff": { enabled: false },
          "tpo-labor-flashing": { enabled: false },
          "tpo-labor-cleanup": { enabled: false },
        },
        equipmentOverrides: {
          "tpo-equip-welder": { enabled: false },
          "tpo-equip-hand-welder": { enabled: false },
          "tpo-equip-screw-gun": { enabled: false },
          "tpo-equip-crane": { enabled: false },
          "tpo-equip-lift": { enabled: false },
          "tpo-equip-safety": { enabled: false },
          "tpo-equip-misc": { enabled: false },
        },
      });

      const result = calculateTPOLaborEquipmentTotals(state, 10000, 0);
      expect(result.laborTotal).toBe(12500); // 10000 * 1.25
      expect(result.equipmentTotal).toBe(0);
      expect(result.laborBreakdown).toHaveLength(1);
      expect(result.laborBreakdown[0].label).toBe("Membrane Installation Crew");
    });

    it("should calculate per_hour labor correctly", () => {
      const state = makeState({
        laborOverrides: {
          "tpo-labor-membrane": { enabled: false },
          "tpo-labor-insulation": { enabled: false },
          "tpo-labor-foreman": { rate: 75, quantity: 24, enabled: true },
          "tpo-labor-tearoff": { enabled: false },
          "tpo-labor-flashing": { enabled: false },
          "tpo-labor-cleanup": { enabled: false },
        },
        equipmentOverrides: {
          "tpo-equip-welder": { enabled: false },
          "tpo-equip-hand-welder": { enabled: false },
          "tpo-equip-screw-gun": { enabled: false },
          "tpo-equip-crane": { enabled: false },
          "tpo-equip-lift": { enabled: false },
          "tpo-equip-safety": { enabled: false },
          "tpo-equip-misc": { enabled: false },
        },
      });

      const result = calculateTPOLaborEquipmentTotals(state, 10000, 0);
      expect(result.laborTotal).toBe(1800); // 75 * 24
    });

    it("should calculate per_lf labor correctly using flashingLF", () => {
      const state = makeState({
        laborOverrides: {
          "tpo-labor-membrane": { enabled: false },
          "tpo-labor-insulation": { enabled: false },
          "tpo-labor-foreman": { enabled: false },
          "tpo-labor-tearoff": { enabled: false },
          "tpo-labor-flashing": { rate: 12, enabled: true },
          "tpo-labor-cleanup": { enabled: false },
        },
        equipmentOverrides: {
          "tpo-equip-welder": { enabled: false },
          "tpo-equip-hand-welder": { enabled: false },
          "tpo-equip-screw-gun": { enabled: false },
          "tpo-equip-crane": { enabled: false },
          "tpo-equip-lift": { enabled: false },
          "tpo-equip-safety": { enabled: false },
          "tpo-equip-misc": { enabled: false },
        },
      });

      const result = calculateTPOLaborEquipmentTotals(state, 10000, 500);
      expect(result.laborTotal).toBe(6000); // 500 * 12
    });

    it("should calculate per_day equipment correctly", () => {
      const state = makeState({
        laborOverrides: {
          "tpo-labor-membrane": { enabled: false },
          "tpo-labor-insulation": { enabled: false },
          "tpo-labor-foreman": { enabled: false },
          "tpo-labor-tearoff": { enabled: false },
          "tpo-labor-flashing": { enabled: false },
          "tpo-labor-cleanup": { enabled: false },
        },
        equipmentOverrides: {
          "tpo-equip-welder": { rate: 200, quantity: 3, enabled: true },
          "tpo-equip-hand-welder": { enabled: false },
          "tpo-equip-screw-gun": { enabled: false },
          "tpo-equip-crane": { enabled: false },
          "tpo-equip-lift": { enabled: false },
          "tpo-equip-safety": { enabled: false },
          "tpo-equip-misc": { enabled: false },
        },
      });

      const result = calculateTPOLaborEquipmentTotals(state, 10000, 0);
      expect(result.equipmentTotal).toBe(600); // 200 * 3
      expect(result.equipmentBreakdown).toHaveLength(1);
    });

    it("should calculate flat rate items correctly", () => {
      const state = makeState({
        laborOverrides: {
          "tpo-labor-membrane": { enabled: false },
          "tpo-labor-insulation": { enabled: false },
          "tpo-labor-foreman": { enabled: false },
          "tpo-labor-tearoff": { enabled: false },
          "tpo-labor-flashing": { enabled: false },
          "tpo-labor-cleanup": { rate: 1500, enabled: true },
        },
        equipmentOverrides: {
          "tpo-equip-welder": { enabled: false },
          "tpo-equip-hand-welder": { enabled: false },
          "tpo-equip-screw-gun": { enabled: false },
          "tpo-equip-crane": { enabled: false },
          "tpo-equip-lift": { enabled: false },
          "tpo-equip-safety": { rate: 750, enabled: true },
          "tpo-equip-misc": { enabled: false },
        },
      });

      const result = calculateTPOLaborEquipmentTotals(state, 10000, 0);
      expect(result.laborTotal).toBe(1500);
      expect(result.equipmentTotal).toBe(750);
    });

    it("should exclude disabled items from totals", () => {
      const state = makeState(); // uses defaults
      const allDisabled = makeState({
        laborOverrides: Object.fromEntries(
          DEFAULT_TPO_LABOR_ITEMS.map((i) => [i.id, { enabled: false }])
        ),
        equipmentOverrides: Object.fromEntries(
          DEFAULT_TPO_EQUIPMENT_ITEMS.map((i) => [i.id, { enabled: false }])
        ),
      });

      const result = calculateTPOLaborEquipmentTotals(allDisabled, 10000, 500);
      expect(result.laborTotal).toBe(0);
      expect(result.equipmentTotal).toBe(0);
      expect(result.laborBreakdown).toHaveLength(0);
      expect(result.equipmentBreakdown).toHaveLength(0);
    });

    it("should calculate full default state for a 10,000 sqft project", () => {
      const state = makeState();
      const result = calculateTPOLaborEquipmentTotals(state, 10000, 200);

      // Verify labor total is positive and includes enabled items
      expect(result.laborTotal).toBeGreaterThan(0);
      expect(result.equipmentTotal).toBeGreaterThan(0);

      // Default enabled labor items: membrane, insulation, foreman, flashing
      const enabledLaborCount = DEFAULT_TPO_LABOR_ITEMS.filter((i) => i.enabled).length;
      expect(result.laborBreakdown).toHaveLength(enabledLaborCount);

      // Default enabled equipment items: welder, hand-welder, screw-gun, safety, misc
      const enabledEquipCount = DEFAULT_TPO_EQUIPMENT_ITEMS.filter((i) => i.enabled).length;
      expect(result.equipmentBreakdown).toHaveLength(enabledEquipCount);
    });

    it("should provide detail strings for each breakdown item", () => {
      const state = makeState();
      const result = calculateTPOLaborEquipmentTotals(state, 10000, 200);

      for (const item of result.laborBreakdown) {
        expect(item.detail).toBeTruthy();
        expect(item.label).toBeTruthy();
        expect(item.cost).toBeGreaterThanOrEqual(0);
      }

      for (const item of result.equipmentBreakdown) {
        expect(item.detail).toBeTruthy();
        expect(item.label).toBeTruthy();
        expect(item.cost).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
