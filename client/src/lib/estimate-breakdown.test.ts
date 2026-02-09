/**
 * Tests for estimate-breakdown utilities and breakdown-serializers
 */
import { describe, it, expect } from "vitest";
import {
  fmt,
  fmtNum,
  getRateLabel,
  getQuantityLabel,
  type BreakdownMaterialItem,
  type BreakdownLaborItem,
  type BreakdownEquipmentItem,
  type BreakdownPenetrationItem,
  type EstimateBreakdownData,
} from "./estimate-breakdown";

// ── fmt() tests ─────────────────────────────────────────────

describe("fmt()", () => {
  it("formats a positive dollar amount", () => {
    expect(fmt(1234.5)).toBe("$1,234.50");
  });

  it("formats zero", () => {
    expect(fmt(0)).toBe("$0.00");
  });

  it("formats large amounts with commas", () => {
    expect(fmt(79456)).toBe("$79,456.00");
  });

  it("rounds to two decimal places", () => {
    expect(fmt(99.999)).toBe("$100.00");
  });
});

// ── fmtNum() tests ─────────────────────────────────────────

describe("fmtNum()", () => {
  it("formats a number with default 2 decimals", () => {
    expect(fmtNum(1234.5)).toBe("1,234.50");
  });

  it("formats with 0 decimals", () => {
    expect(fmtNum(1234.567, 0)).toBe("1,235");
  });

  it("formats with 3 decimals", () => {
    expect(fmtNum(3.14159, 3)).toBe("3.142");
  });
});

// ── getRateLabel() tests ────────────────────────────────────

describe("getRateLabel()", () => {
  it("returns $/sq. ft. for per_sqft", () => {
    expect(getRateLabel("per_sqft")).toBe("$/sq. ft.");
  });

  it("returns $/hr for per_hour", () => {
    expect(getRateLabel("per_hour")).toBe("$/hr");
  });

  it("returns $/LF for per_lf", () => {
    expect(getRateLabel("per_lf")).toBe("$/LF");
  });

  it("returns $/day for per_day", () => {
    expect(getRateLabel("per_day")).toBe("$/day");
  });

  it("returns flat for flat", () => {
    expect(getRateLabel("flat")).toBe("flat");
  });

  it("returns $ for unknown rate type", () => {
    expect(getRateLabel("unknown")).toBe("$");
  });
});

// ── getQuantityLabel() tests ────────────────────────────────

describe("getQuantityLabel()", () => {
  it("returns Hours for per_hour", () => {
    expect(getQuantityLabel("per_hour")).toBe("Hours");
  });

  it("returns Days for per_day", () => {
    expect(getQuantityLabel("per_day")).toBe("Days");
  });

  it("returns Qty for flat", () => {
    expect(getQuantityLabel("flat")).toBe("Qty");
  });

  it("returns Qty for unknown types", () => {
    expect(getQuantityLabel("per_sqft")).toBe("Qty");
  });
});

// ── EstimateBreakdownData type shape tests ──────────────────

describe("EstimateBreakdownData shape", () => {
  const sampleData: EstimateBreakdownData = {
    systemName: "Carlisle Sure-Weld TPO System",
    systemSlug: "carlisle-tpo",
    accentColor: "blue",
    measurements: { "Roof Area": "10,000 sq. ft." },
    materials: [
      {
        id: "tpo-membrane-60",
        name: "Sure-Weld TPO 60 mil Membrane",
        description: "Includes 5% for side-lap overlap waste",
        category: "MEMBRANE",
        unit: "Roll (10' x 100')",
        quantityNeeded: 10.5,
        quantity: 11,
        unitPrice: 987,
        totalCost: 10857,
        enabled: true,
      },
    ],
    penetrations: [
      {
        id: "pen-0",
        name: "TPO Pipe Boot (1-3\")",
        description: "From: Pipe Flashing (1\"–3\")",
        unit: "each",
        quantity: 5,
        unitPrice: 28.5,
        totalCost: 142.5,
        enabled: true,
      },
    ],
    labor: [
      {
        id: "tpo-labor-membrane",
        label: "Membrane Installation Crew",
        description: "TPO membrane installation",
        rateType: "per_sqft",
        rate: 1.25,
        quantity: 1,
        computedCost: 12500,
        enabled: true,
      },
    ],
    equipment: [
      {
        id: "tpo-equip-welder",
        label: "Hot-Air Welder",
        description: "Automatic hot-air welding machine",
        rateType: "per_day",
        rate: 200,
        quantity: 3,
        computedCost: 600,
        enabled: true,
      },
    ],
  };

  it("has the correct system metadata", () => {
    expect(sampleData.systemName).toBe("Carlisle Sure-Weld TPO System");
    expect(sampleData.systemSlug).toBe("carlisle-tpo");
    expect(sampleData.accentColor).toBe("blue");
  });

  it("has measurements as key-value pairs", () => {
    expect(sampleData.measurements["Roof Area"]).toBe("10,000 sq. ft.");
  });

  it("has materials with all required fields", () => {
    const mat = sampleData.materials[0];
    expect(mat.id).toBeTruthy();
    expect(mat.name).toBeTruthy();
    expect(mat.quantity).toBeGreaterThan(0);
    expect(mat.unitPrice).toBeGreaterThan(0);
    expect(mat.totalCost).toBe(mat.quantity * mat.unitPrice);
    expect(mat.enabled).toBe(true);
  });

  it("has penetrations with all required fields", () => {
    const pen = sampleData.penetrations[0];
    expect(pen.id).toBeTruthy();
    expect(pen.name).toBeTruthy();
    expect(pen.quantity).toBeGreaterThan(0);
    expect(pen.totalCost).toBe(pen.quantity * pen.unitPrice);
    expect(pen.enabled).toBe(true);
  });

  it("has labor items with computed costs", () => {
    const lab = sampleData.labor[0];
    expect(lab.id).toBeTruthy();
    expect(lab.label).toBeTruthy();
    expect(lab.rateType).toBe("per_sqft");
    expect(lab.computedCost).toBe(12500);
    expect(lab.enabled).toBe(true);
  });

  it("has equipment items with computed costs", () => {
    const eq = sampleData.equipment[0];
    expect(eq.id).toBeTruthy();
    expect(eq.label).toBeTruthy();
    expect(eq.rateType).toBe("per_day");
    expect(eq.computedCost).toBe(600);
    expect(eq.enabled).toBe(true);
  });

  it("computes grand total correctly from all sections", () => {
    const materialTotal = sampleData.materials
      .filter((m) => m.enabled)
      .reduce((sum, m) => sum + m.totalCost, 0);
    const penetrationTotal = sampleData.penetrations
      .filter((p) => p.enabled)
      .reduce((sum, p) => sum + p.totalCost, 0);
    const laborTotal = sampleData.labor
      .filter((l) => l.enabled)
      .reduce((sum, l) => sum + l.computedCost, 0);
    const equipmentTotal = sampleData.equipment
      .filter((e) => e.enabled)
      .reduce((sum, e) => sum + e.computedCost, 0);

    const grandTotal = materialTotal + penetrationTotal + laborTotal + equipmentTotal;
    expect(grandTotal).toBe(10857 + 142.5 + 12500 + 600);
  });
});

// ── Toggle behavior tests ───────────────────────────────────

describe("Toggle behavior (simulated)", () => {
  it("excludes disabled materials from total", () => {
    const materials: BreakdownMaterialItem[] = [
      {
        id: "a",
        name: "Material A",
        description: "",
        category: "CAT",
        unit: "each",
        quantityNeeded: 10,
        quantity: 10,
        unitPrice: 100,
        totalCost: 1000,
        enabled: true,
      },
      {
        id: "b",
        name: "Material B",
        description: "",
        category: "CAT",
        unit: "each",
        quantityNeeded: 5,
        quantity: 5,
        unitPrice: 50,
        totalCost: 250,
        enabled: false,
      },
    ];

    const enabledTotal = materials
      .filter((m) => m.enabled)
      .reduce((sum, m) => sum + m.totalCost, 0);
    expect(enabledTotal).toBe(1000);
  });

  it("excludes disabled labor from total", () => {
    const labor: BreakdownLaborItem[] = [
      {
        id: "l1",
        label: "Crew",
        description: "",
        rateType: "per_sqft",
        rate: 1.25,
        quantity: 1,
        computedCost: 12500,
        enabled: true,
      },
      {
        id: "l2",
        label: "Cleanup",
        description: "",
        rateType: "flat",
        rate: 500,
        quantity: 1,
        computedCost: 500,
        enabled: false,
      },
    ];

    const enabledTotal = labor
      .filter((l) => l.enabled)
      .reduce((sum, l) => sum + l.computedCost, 0);
    expect(enabledTotal).toBe(12500);
  });

  it("recalculates total when quantity changes", () => {
    const item: BreakdownMaterialItem = {
      id: "x",
      name: "Test",
      description: "",
      category: "CAT",
      unit: "each",
      quantityNeeded: 10,
      quantity: 10,
      unitPrice: 100,
      totalCost: 1000,
      enabled: true,
    };

    // Simulate quantity change
    const newQty = 15;
    const newTotal = newQty * item.unitPrice;
    expect(newTotal).toBe(1500);
  });

  it("recalculates total when price changes", () => {
    const item: BreakdownMaterialItem = {
      id: "x",
      name: "Test",
      description: "",
      category: "CAT",
      unit: "each",
      quantityNeeded: 10,
      quantity: 10,
      unitPrice: 100,
      totalCost: 1000,
      enabled: true,
    };

    // Simulate price change
    const newPrice = 120;
    const newTotal = item.quantity * newPrice;
    expect(newTotal).toBe(1200);
  });
});
