/**
 * Breakdown Serializers
 *
 * Convert each estimator's internal state into the common EstimateBreakdownData format
 * for the unified Estimate Breakdown page.
 */

import type {
  EstimateBreakdownData,
  BreakdownMaterialItem,
  BreakdownLaborItem,
  BreakdownEquipmentItem,
  BreakdownPenetrationItem,
} from "./estimate-breakdown";
import type { EstimateResult } from "./karnak-data";
import type { LaborEquipmentState } from "./labor-equipment-data";
import { calculateLaborEquipmentTotals } from "./labor-equipment-data";
import type { TPOEstimate } from "./tpo-data";
import type { TPOLaborEquipmentState } from "./tpo-labor-equipment-data";
import { calculateTPOLaborEquipmentTotals } from "./tpo-labor-equipment-data";
import type { PenetrationEstimate } from "./penetrations-data";

// ── Karnak serializer ────────────────────────────────────────

export function serializeKarnakBreakdown(
  estimate: EstimateResult,
  laborEquipment: LaborEquipmentState,
): EstimateBreakdownData {
  const sqft = estimate.inputs.squareFootage;
  const totals = calculateLaborEquipmentTotals(laborEquipment, sqft);

  const materials: BreakdownMaterialItem[] = estimate.lineItems.map((item) => ({
    id: item.product.id,
    name: item.product.name,
    description: item.product.description,
    category: item.product.step,
    unit: item.product.unitSize,
    quantityNeeded: item.quantityNeeded,
    quantity: item.quantityToOrder,
    unitPrice: item.unitPrice,
    totalCost: item.totalCost,
    enabled: item.quantityToOrder > 0,
  }));

  const labor: BreakdownLaborItem[] = laborEquipment.laborItems.map((item) => {
    const breakdown = totals.laborBreakdown.find((b) => b.label === item.label);
    return {
      id: item.id,
      label: item.label,
      description: item.description,
      rateType: item.rateType,
      rate: item.rate,
      quantity: item.quantity,
      computedCost: breakdown?.cost ?? 0,
      enabled: item.enabled,
    };
  });

  const equipment: BreakdownEquipmentItem[] = laborEquipment.equipmentItems.map((item) => {
    const breakdown = totals.equipmentBreakdown.find((b) => b.label === item.label);
    return {
      id: item.id,
      label: item.label,
      description: item.description,
      rateType: item.rateType,
      rate: item.rate,
      quantity: item.quantity,
      computedCost: breakdown?.cost ?? 0,
      enabled: item.enabled,
    };
  });

  return {
    systemName: "Karnak Metal Kynar Coating System",
    systemSlug: "karnak-metal-kynar",
    accentColor: "red",
    measurements: {
      "Roof Area": `${sqft.toLocaleString()} sq. ft.`,
      "Vertical Seams": `${estimate.inputs.verticalSeamsLF.toLocaleString()} lin. ft.`,
      "Horizontal Seams": `${estimate.inputs.horizontalSeamsLF.toLocaleString()} lin. ft.`,
    },
    materials,
    penetrations: [],
    labor,
    equipment,
  };
}

// ── TPO serializer (shared for Carlisle & GAF) ──────────────

export function serializeTPOBreakdown(
  estimate: TPOEstimate,
  laborEquipment: TPOLaborEquipmentState,
  penetrationEstimate: PenetrationEstimate | null,
  systemName: string,
  systemSlug: string,
  accentColor: string,
): EstimateBreakdownData {
  const roofArea = estimate.measurements.roofArea;
  const flashingLF =
    (estimate.measurements.baseFlashingLF ?? 0) +
    (estimate.measurements.wallLinearFt ?? 0);

  const totals = calculateTPOLaborEquipmentTotals(laborEquipment, roofArea, flashingLF);

  const materials: BreakdownMaterialItem[] = estimate.lineItems.map((item) => ({
    id: item.product.id,
    name: item.product.name,
    description: item.product.description || "",
    category: item.product.category,
    unit: item.product.unit,
    quantityNeeded: item.quantityNeeded,
    quantity: item.unitsToOrder,
    unitPrice: item.unitPrice,
    totalCost: item.totalCost,
    enabled: item.unitsToOrder > 0,
  }));

  const penetrations: BreakdownPenetrationItem[] = (penetrationEstimate?.materials ?? []).map(
    (mat, idx) => ({
      id: `pen-${idx}`,
      name: mat.materialName,
      description: `From: ${mat.fromPenetration}`,
      unit: mat.unit,
      quantity: mat.quantity,
      unitPrice: mat.unitPrice,
      totalCost: mat.totalPrice,
      enabled: true,
    })
  );

  const labor: BreakdownLaborItem[] = laborEquipment.laborItems.map((item) => {
    const breakdown = totals.laborBreakdown.find((b) => b.label === item.label);
    return {
      id: item.id,
      label: item.label,
      description: item.description,
      rateType: item.rateType,
      rate: item.rate,
      quantity: item.quantity,
      computedCost: breakdown?.cost ?? 0,
      enabled: item.enabled,
    };
  });

  const equipment: BreakdownEquipmentItem[] = laborEquipment.equipmentItems.map((item) => {
    const breakdown = totals.equipmentBreakdown.find((b) => b.label === item.label);
    return {
      id: item.id,
      label: item.label,
      description: item.description,
      rateType: item.rateType,
      rate: item.rate,
      quantity: item.quantity,
      computedCost: breakdown?.cost ?? 0,
      enabled: item.enabled,
    };
  });

  const measurements: Record<string, string> = {
    "Roof Area": `${roofArea.toLocaleString()} sq. ft.`,
  };
  if (estimate.measurements.baseFlashingLF) {
    measurements["Base Flashing"] = `${estimate.measurements.baseFlashingLF.toLocaleString()} lin. ft.`;
  }
  if (estimate.measurements.wallLinearFt) {
    measurements["Wall Flashing"] = `${estimate.measurements.wallLinearFt.toLocaleString()} lin. ft.`;
  }
  if (estimate.measurements.wallHeight) {
    measurements["Wall Height"] = `${estimate.measurements.wallHeight} ft.`;
  }

  return {
    systemName,
    systemSlug,
    accentColor,
    measurements,
    materials,
    penetrations,
    labor,
    equipment,
  };
}
