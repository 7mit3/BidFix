import { describe, it, expect } from "vitest";
import {
  serializeKarnakState,
  deserializeKarnakState,
  serializeTPOState,
  deserializeTPOState,
  detectSystem,
} from "../client/src/lib/estimate-state-serializers";

describe("Estimate State Serializers", () => {
  describe("Karnak serializer", () => {
    const sampleState = {
      squareFootage: "5000",
      verticalSeamsLF: "200",
      horizontalSeamsLF: "150",
      customPrices: { "karnak-501": 45.5, "karnak-502": 32.0 },
      laborEquipment: {
        laborItems: [
          {
            id: "coating-crew",
            name: "Coating Crew",
            unit: "sq ft" as const,
            defaultRate: 0.75,
            defaultQuantity: 1,
            rate: 0.85,
            quantity: 2,
            enabled: true,
          },
        ],
        equipmentItems: [
          {
            id: "spray-rig",
            name: "Spray Rig",
            unit: "day" as const,
            defaultRate: 350,
            defaultQuantity: 5,
            rate: 400,
            quantity: 3,
            enabled: true,
          },
        ],
      },
    };

    it("serializes and deserializes Karnak state correctly", () => {
      const json = serializeKarnakState(sampleState);
      const parsed = deserializeKarnakState(json);
      expect(parsed).not.toBeNull();
      expect(parsed!.system).toBe("karnak-metal-kynar");
      expect(parsed!.squareFootage).toBe("5000");
      expect(parsed!.verticalSeamsLF).toBe("200");
      expect(parsed!.horizontalSeamsLF).toBe("150");
      expect(parsed!.customPrices["karnak-501"]).toBe(45.5);
      expect(parsed!.laborEquipment.laborItems).toHaveLength(1);
      expect(parsed!.laborEquipment.laborItems[0].rate).toBe(0.85);
    });

    it("returns null for non-Karnak JSON", () => {
      const json = JSON.stringify({ system: "carlisle-tpo", data: {} });
      expect(deserializeKarnakState(json)).toBeNull();
    });

    it("returns null for invalid JSON", () => {
      expect(deserializeKarnakState("not json")).toBeNull();
    });
  });

  describe("TPO serializer", () => {
    const sampleState = {
      measurements: { totalRoofArea: "10000", baseFlashing: "500" },
      customPrices: { "tpo-membrane-60": 1.25 },
      laborEquipment: {
        laborItems: [
          {
            id: "membrane-crew",
            name: "Membrane Crew",
            unit: "sq ft" as const,
            defaultRate: 1.5,
            defaultQuantity: 1,
            rate: 1.75,
            quantity: 1,
            enabled: true,
          },
        ],
        equipmentItems: [],
      },
    };

    it("serializes Carlisle TPO state correctly", () => {
      const json = serializeTPOState("carlisle-tpo", sampleState);
      const parsed = deserializeTPOState(json);
      expect(parsed).not.toBeNull();
      expect(parsed!.system).toBe("carlisle-tpo");
      expect(parsed!.measurements.totalRoofArea).toBe("10000");
    });

    it("serializes GAF TPO state correctly", () => {
      const json = serializeTPOState("gaf-tpo", sampleState);
      const parsed = deserializeTPOState(json);
      expect(parsed).not.toBeNull();
      expect(parsed!.system).toBe("gaf-tpo");
    });

    it("returns null for non-TPO JSON", () => {
      const json = JSON.stringify({ system: "karnak-metal-kynar" });
      expect(deserializeTPOState(json)).toBeNull();
    });

    it("returns null for invalid JSON", () => {
      expect(deserializeTPOState("{broken")).toBeNull();
    });
  });

  describe("detectSystem", () => {
    it("detects karnak system", () => {
      const json = serializeKarnakState({
        squareFootage: "100",
        verticalSeamsLF: "",
        horizontalSeamsLF: "",
        customPrices: {},
        laborEquipment: { laborItems: [], equipmentItems: [] },
      });
      expect(detectSystem(json)).toBe("karnak-metal-kynar");
    });

    it("detects carlisle-tpo system", () => {
      const json = serializeTPOState("carlisle-tpo", {
        measurements: { totalRoofArea: "100", baseFlashing: "0" },
        customPrices: {},
        laborEquipment: { laborItems: [], equipmentItems: [] },
      });
      expect(detectSystem(json)).toBe("carlisle-tpo");
    });

    it("detects gaf-tpo system", () => {
      const json = serializeTPOState("gaf-tpo", {
        measurements: { totalRoofArea: "100", baseFlashing: "0" },
        customPrices: {},
        laborEquipment: { laborItems: [], equipmentItems: [] },
      });
      expect(detectSystem(json)).toBe("gaf-tpo");
    });

    it("returns null for invalid JSON", () => {
      expect(detectSystem("not json")).toBeNull();
    });

    it("returns null for JSON without system field", () => {
      expect(detectSystem(JSON.stringify({ foo: "bar" }))).toBeNull();
    });
  });
});
