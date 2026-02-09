/**
 * Tests for estimate-state-serializers.ts
 * Verifies roundtrip save/load for all estimator types including penetrations and sheet metal flashing.
 */
import { describe, it, expect } from "vitest";
import {
  serializeKarnakState,
  deserializeKarnakState,
  serializeTPOState,
  deserializeTPOState,
  detectSystem,
  type SavedPenetrationsState,
} from "./estimate-state-serializers";
import { getDefaultSheetMetalState } from "./sheet-metal-flashing-data";

// ─── Helpers ────────────────────────────────────────────────────────────────

const samplePenetrationsState: SavedPenetrationsState = {
  lineItems: {
    "pipe-flashing-small": 12,
    "pitch-pan-small": 4,
    "curb-mount-small": 2,
  },
  sheetMetal: {
    ...getDefaultSheetMetalState(),
    metalType: "galvanized-steel",
    gauge: "24ga",
    lineItems: [
      {
        id: "test-1",
        profileId: "drip-edge",
        profileName: "Drip Edge",
        widthInches: 4,
        linearFeet: 250,
        pricePerLF: 3.5,
        total: 875,
      },
      {
        id: "test-2",
        profileId: "coping-cap",
        profileName: "Coping Cap",
        widthInches: 12,
        linearFeet: 100,
        pricePerLF: 8.0,
        total: 800,
      },
    ],
  },
};

// ─── Karnak Serialization ───────────────────────────────────────────────────

describe("Karnak state serialization", () => {
  it("should roundtrip basic measurements and prices", () => {
    const json = serializeKarnakState({
      squareFootage: "5000",
      verticalSeamsLF: "200",
      horizontalSeamsLF: "150",
      customPrices: { "metal-panel": 12.5 },
      laborEquipment: {
        laborItems: [],
        equipmentItems: [],
      },
    });

    const restored = deserializeKarnakState(json);
    expect(restored).not.toBeNull();
    expect(restored!.system).toBe("karnak-metal-kynar");
    expect(restored!.squareFootage).toBe("5000");
    expect(restored!.verticalSeamsLF).toBe("200");
    expect(restored!.horizontalSeamsLF).toBe("150");
    expect(restored!.customPrices["metal-panel"]).toBe(12.5);
  });

  it("should roundtrip penetrations and sheet metal flashing state", () => {
    const json = serializeKarnakState({
      squareFootage: "10000",
      verticalSeamsLF: "400",
      horizontalSeamsLF: "300",
      customPrices: {},
      laborEquipment: { laborItems: [], equipmentItems: [] },
      penetrationsState: samplePenetrationsState,
    });

    const restored = deserializeKarnakState(json);
    expect(restored).not.toBeNull();
    expect(restored!.penetrationsState).toBeDefined();

    const pState = restored!.penetrationsState!;
    expect(pState.lineItems["pipe-flashing-small"]).toBe(12);
    expect(pState.lineItems["pitch-pan-small"]).toBe(4);
    expect(pState.lineItems["curb-mount-small"]).toBe(2);

    // Sheet metal
    expect(pState.sheetMetal.metalType).toBe("galvanized-steel");
    expect(pState.sheetMetal.gauge).toBe("24ga");
    expect(pState.sheetMetal.lineItems).toHaveLength(2);
    expect(pState.sheetMetal.lineItems[0].profileId).toBe("drip-edge");
    expect(pState.sheetMetal.lineItems[0].linearFeet).toBe(250);
    expect(pState.sheetMetal.lineItems[1].profileId).toBe("coping-cap");
    expect(pState.sheetMetal.lineItems[1].total).toBe(800);
  });

  it("should handle missing penetrationsState gracefully (backward compat)", () => {
    const json = serializeKarnakState({
      squareFootage: "5000",
      verticalSeamsLF: "200",
      horizontalSeamsLF: "150",
      customPrices: {},
      laborEquipment: { laborItems: [], equipmentItems: [] },
    });

    const restored = deserializeKarnakState(json);
    expect(restored).not.toBeNull();
    expect(restored!.penetrationsState).toBeUndefined();
  });

  it("should return null for invalid JSON", () => {
    expect(deserializeKarnakState("not json")).toBeNull();
  });

  it("should return null for wrong system type", () => {
    const json = JSON.stringify({ system: "carlisle-tpo", measurements: {} });
    expect(deserializeKarnakState(json)).toBeNull();
  });
});

// ─── TPO Serialization ─────────────────────────────────────────────────────

describe("TPO state serialization", () => {
  it("should roundtrip Carlisle TPO with all data", () => {
    const json = serializeTPOState("carlisle-tpo", {
      measurements: {
        totalRoofArea: "80000",
        baseFlashing: "2500",
        wallLinearFt: "500",
        wallHeight: "4",
      },
      customPrices: { "tpo-membrane": 9.87 },
      laborEquipment: {
        laborItems: [],
        equipmentItems: [],
      },
      penetrationsState: samplePenetrationsState,
    });

    const restored = deserializeTPOState(json);
    expect(restored).not.toBeNull();
    expect(restored!.system).toBe("carlisle-tpo");
    expect(restored!.measurements.totalRoofArea).toBe("80000");
    expect(restored!.measurements.baseFlashing).toBe("2500");
    expect(restored!.measurements.wallLinearFt).toBe("500");
    expect(restored!.measurements.wallHeight).toBe("4");
    expect(restored!.customPrices["tpo-membrane"]).toBe(9.87);

    // Penetrations
    expect(restored!.penetrationsState).toBeDefined();
    expect(restored!.penetrationsState!.lineItems["pipe-flashing-small"]).toBe(12);
    expect(restored!.penetrationsState!.sheetMetal.metalType).toBe("galvanized-steel");
    expect(restored!.penetrationsState!.sheetMetal.lineItems).toHaveLength(2);
  });

  it("should roundtrip GAF TPO with all data", () => {
    const json = serializeTPOState("gaf-tpo", {
      measurements: {
        totalRoofArea: "50000",
        baseFlashing: "1200",
      },
      customPrices: {},
      laborEquipment: { laborItems: [], equipmentItems: [] },
      penetrationsState: samplePenetrationsState,
    });

    const restored = deserializeTPOState(json);
    expect(restored).not.toBeNull();
    expect(restored!.system).toBe("gaf-tpo");
    expect(restored!.penetrationsState).toBeDefined();
    expect(restored!.penetrationsState!.sheetMetal.lineItems).toHaveLength(2);
  });

  it("should handle missing penetrationsState (backward compat)", () => {
    const json = serializeTPOState("carlisle-tpo", {
      measurements: { totalRoofArea: "10000", baseFlashing: "500" },
      customPrices: {},
      laborEquipment: { laborItems: [], equipmentItems: [] },
    });

    const restored = deserializeTPOState(json);
    expect(restored).not.toBeNull();
    expect(restored!.penetrationsState).toBeUndefined();
  });

  it("should return null for invalid JSON", () => {
    expect(deserializeTPOState("garbage")).toBeNull();
  });

  it("should return null for wrong system type", () => {
    const json = JSON.stringify({ system: "karnak-metal-kynar" });
    expect(deserializeTPOState(json)).toBeNull();
  });
});

// ─── detectSystem ───────────────────────────────────────────────────────────

describe("detectSystem", () => {
  it("should detect karnak system", () => {
    const json = serializeKarnakState({
      squareFootage: "1000",
      verticalSeamsLF: "100",
      horizontalSeamsLF: "50",
      customPrices: {},
      laborEquipment: { laborItems: [], equipmentItems: [] },
    });
    expect(detectSystem(json)).toBe("karnak-metal-kynar");
  });

  it("should detect carlisle-tpo system", () => {
    const json = serializeTPOState("carlisle-tpo", {
      measurements: { totalRoofArea: "1000", baseFlashing: "100" },
      customPrices: {},
      laborEquipment: { laborItems: [], equipmentItems: [] },
    });
    expect(detectSystem(json)).toBe("carlisle-tpo");
  });

  it("should detect gaf-tpo system", () => {
    const json = serializeTPOState("gaf-tpo", {
      measurements: { totalRoofArea: "1000", baseFlashing: "100" },
      customPrices: {},
      laborEquipment: { laborItems: [], equipmentItems: [] },
    });
    expect(detectSystem(json)).toBe("gaf-tpo");
  });

  it("should return null for invalid JSON", () => {
    expect(detectSystem("not json")).toBeNull();
  });
});
