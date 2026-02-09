import { describe, it, expect } from "vitest";
import {
  METAL_TYPES,
  FLASHING_PROFILES,
  getFlashingPricePerLF,
  calculateSheetMetalEstimate,
  getDefaultSheetMetalState,
  getMetalType,
  getGaugesForMetal,
  type SheetMetalFlashingState,
} from "./sheet-metal-flashing-data";

describe("Sheet Metal Flashing Data", () => {
  describe("METAL_TYPES", () => {
    it("has 5 metal types", () => {
      expect(METAL_TYPES).toHaveLength(5);
    });

    it("includes galvanized steel, aluminum, stainless steel, copper, galvalume", () => {
      const ids = METAL_TYPES.map((m) => m.id);
      expect(ids).toContain("galvanized-steel");
      expect(ids).toContain("aluminum");
      expect(ids).toContain("stainless-steel");
      expect(ids).toContain("copper");
      expect(ids).toContain("galvalume");
    });

    it("galvanized steel has gauges from 28ga to 16ga", () => {
      const steel = METAL_TYPES.find((m) => m.id === "galvanized-steel")!;
      expect(steel.gauges).toHaveLength(7);
      expect(steel.gauges[0].label).toBe("28 Gauge");
      expect(steel.gauges[steel.gauges.length - 1].label).toBe("16 Gauge");
    });

    it("aluminum has thickness options", () => {
      const alum = METAL_TYPES.find((m) => m.id === "aluminum")!;
      expect(alum.gauges).toHaveLength(4);
      expect(alum.gauges[0].label).toBe('.032"');
      expect(alum.gauges[alum.gauges.length - 1].label).toBe('.063"');
    });

    it("copper has weight options (oz)", () => {
      const copper = METAL_TYPES.find((m) => m.id === "copper")!;
      expect(copper.gauges).toHaveLength(3);
      expect(copper.gauges[0].label).toBe("16 oz");
      expect(copper.gauges[copper.gauges.length - 1].label).toBe("24 oz");
    });

    it("each metal type has a valid default gauge", () => {
      for (const metal of METAL_TYPES) {
        const defaultGauge = metal.gauges.find((g) => g.id === metal.defaultGaugeId);
        expect(defaultGauge).toBeDefined();
      }
    });

    it("price multipliers increase with thickness", () => {
      for (const metal of METAL_TYPES) {
        for (let i = 1; i < metal.gauges.length; i++) {
          expect(metal.gauges[i].priceMultiplier).toBeGreaterThanOrEqual(
            metal.gauges[i - 1].priceMultiplier
          );
        }
      }
    });
  });

  describe("FLASHING_PROFILES", () => {
    it("has 11 flashing profiles", () => {
      expect(FLASHING_PROFILES).toHaveLength(11);
    });

    it("includes common flashing types", () => {
      const ids = FLASHING_PROFILES.map((p) => p.id);
      expect(ids).toContain("drip-edge");
      expect(ids).toContain("gravel-stop");
      expect(ids).toContain("coping-cap");
      expect(ids).toContain("counter-flashing");
      expect(ids).toContain("edge-metal");
      expect(ids).toContain("custom-flashing");
    });

    it("all profiles have positive labor minutes per LF", () => {
      for (const profile of FLASHING_PROFILES) {
        expect(profile.laborMinutesPerLF).toBeGreaterThan(0);
      }
    });

    it("all profiles have positive developed width", () => {
      for (const profile of FLASHING_PROFILES) {
        expect(profile.defaultDevelopedWidth).toBeGreaterThan(0);
      }
    });
  });

  describe("getFlashingPricePerLF", () => {
    it("returns positive price for valid metal/gauge/profile", () => {
      const profile = FLASHING_PROFILES[0]; // drip edge
      const price = getFlashingPricePerLF("galvanized-steel", "24ga", profile);
      expect(price).toBeGreaterThan(0);
    });

    it("returns 0 for invalid metal type", () => {
      const profile = FLASHING_PROFILES[0];
      const price = getFlashingPricePerLF("nonexistent", "24ga", profile);
      expect(price).toBe(0);
    });

    it("returns 0 for invalid gauge", () => {
      const profile = FLASHING_PROFILES[0];
      const price = getFlashingPricePerLF("galvanized-steel", "nonexistent", profile);
      expect(price).toBe(0);
    });

    it("wider profiles cost more than narrower ones (same metal/gauge)", () => {
      const dripEdge = FLASHING_PROFILES.find((p) => p.id === "drip-edge")!; // 4" width
      const copingCap = FLASHING_PROFILES.find((p) => p.id === "coping-cap")!; // 12" width
      const priceDrip = getFlashingPricePerLF("galvanized-steel", "24ga", dripEdge);
      const priceCoping = getFlashingPricePerLF("galvanized-steel", "24ga", copingCap);
      expect(priceCoping).toBeGreaterThan(priceDrip);
    });

    it("thicker gauges cost more (same metal/profile)", () => {
      const profile = FLASHING_PROFILES[0];
      const price28ga = getFlashingPricePerLF("galvanized-steel", "28ga", profile);
      const price16ga = getFlashingPricePerLF("galvanized-steel", "16ga", profile);
      expect(price16ga).toBeGreaterThan(price28ga);
    });

    it("copper is more expensive than galvanized steel (same profile/default gauge)", () => {
      const profile = FLASHING_PROFILES.find((p) => p.id === "edge-metal")!;
      const steelPrice = getFlashingPricePerLF("galvanized-steel", "24ga", profile);
      const copperPrice = getFlashingPricePerLF("copper", "20oz", profile);
      expect(copperPrice).toBeGreaterThan(steelPrice);
    });
  });

  describe("calculateSheetMetalEstimate", () => {
    it("returns empty estimate for default state", () => {
      const state = getDefaultSheetMetalState();
      const estimate = calculateSheetMetalEstimate(state);
      expect(estimate.lineItems).toHaveLength(0);
      expect(estimate.totalMaterialCost).toBe(0);
      expect(estimate.totalLaborMinutes).toBe(0);
    });

    it("calculates cost for a single flashing item", () => {
      const state: SheetMetalFlashingState = {
        metalTypeId: "galvanized-steel",
        gaugeId: "24ga",
        lineItems: { "drip-edge": 100 },
      };
      const estimate = calculateSheetMetalEstimate(state);
      expect(estimate.lineItems).toHaveLength(1);
      expect(estimate.lineItems[0].name).toBe("Drip Edge");
      expect(estimate.lineItems[0].quantity).toBe(100);
      expect(estimate.totalMaterialCost).toBeGreaterThan(0);
      expect(estimate.totalLaborMinutes).toBeGreaterThan(0);
      expect(estimate.metalType).toBe("Galvanized Steel");
      expect(estimate.gauge).toBe("24 Gauge");
    });

    it("calculates cost for multiple flashing items", () => {
      const state: SheetMetalFlashingState = {
        metalTypeId: "galvanized-steel",
        gaugeId: "24ga",
        lineItems: {
          "drip-edge": 200,
          "coping-cap": 50,
          "counter-flashing": 100,
        },
      };
      const estimate = calculateSheetMetalEstimate(state);
      expect(estimate.lineItems).toHaveLength(3);
      expect(estimate.totalMaterialCost).toBeGreaterThan(0);

      // Total should be sum of individual items
      const sumOfItems = estimate.lineItems.reduce((sum, item) => sum + item.totalCost, 0);
      expect(estimate.totalMaterialCost).toBeCloseTo(sumOfItems, 2);
    });

    it("ignores zero-quantity items", () => {
      const state: SheetMetalFlashingState = {
        metalTypeId: "galvanized-steel",
        gaugeId: "24ga",
        lineItems: { "drip-edge": 0, "coping-cap": 50 },
      };
      const estimate = calculateSheetMetalEstimate(state);
      expect(estimate.lineItems).toHaveLength(1);
      expect(estimate.lineItems[0].name).toBe("Coping Cap");
    });

    it("sorts line items by total cost descending", () => {
      const state: SheetMetalFlashingState = {
        metalTypeId: "galvanized-steel",
        gaugeId: "24ga",
        lineItems: {
          "drip-edge": 10,
          "coping-cap": 100,
          "counter-flashing": 50,
        },
      };
      const estimate = calculateSheetMetalEstimate(state);
      for (let i = 1; i < estimate.lineItems.length; i++) {
        expect(estimate.lineItems[i].totalCost).toBeLessThanOrEqual(
          estimate.lineItems[i - 1].totalCost
        );
      }
    });
  });

  describe("getDefaultSheetMetalState", () => {
    it("returns galvanized steel 24ga with empty line items", () => {
      const state = getDefaultSheetMetalState();
      expect(state.metalTypeId).toBe("galvanized-steel");
      expect(state.gaugeId).toBe("24ga");
      expect(Object.keys(state.lineItems)).toHaveLength(0);
    });
  });

  describe("getMetalType", () => {
    it("returns metal type by id", () => {
      const metal = getMetalType("copper");
      expect(metal).toBeDefined();
      expect(metal!.name).toBe("Copper");
    });

    it("returns undefined for invalid id", () => {
      expect(getMetalType("nonexistent")).toBeUndefined();
    });
  });

  describe("getGaugesForMetal", () => {
    it("returns gauges for valid metal type", () => {
      const gauges = getGaugesForMetal("galvanized-steel");
      expect(gauges.length).toBe(7);
    });

    it("returns empty array for invalid metal type", () => {
      const gauges = getGaugesForMetal("nonexistent");
      expect(gauges).toHaveLength(0);
    });
  });
});
