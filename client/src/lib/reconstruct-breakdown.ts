/**
 * Reconstruct Breakdown Data from Saved Estimate
 *
 * Takes the full saved estimate (stateJson + breakdownState) from the API
 * and reconstructs the EstimateBreakdownData needed by the breakdown page.
 * This allows opening the breakdown directly from the Saved Estimates page
 * without going through the estimator first.
 */

import type { EstimateBreakdownData } from "./estimate-breakdown";
import type { BreakdownSaveState } from "./estimate-breakdown";
import {
  deserializeKarnakState,
  deserializeTPOState,
  detectSystem,
} from "./estimate-state-serializers";
import { calculateEstimate } from "./karnak-data";
import { calculateTPOEstimate, type AssemblyConfig, type TPOMeasurements } from "./tpo-data";
import { calculatePenetrationEstimate, PENETRATION_TYPES, type PenetrationLineItem } from "./penetrations-data";
import { calculateSheetMetalEstimate } from "./sheet-metal-flashing-data";
import { DEFAULT_LABOR_ITEMS, DEFAULT_EQUIPMENT_ITEMS } from "./labor-equipment-data";
import { DEFAULT_TPO_LABOR_ITEMS, DEFAULT_TPO_EQUIPMENT_ITEMS } from "./tpo-labor-equipment-data";
import { serializeKarnakBreakdown, serializeTPOBreakdown } from "./breakdown-serializers";

/** The shape returned by estimates.get */
interface SavedEstimateData {
  id: number;
  name: string;
  system: string;
  systemLabel: string;
  stateJson: string;
  breakdownState: string | null;
  grandTotal: number;
  roofArea: number;
}

/**
 * Reconstruct the EstimateBreakdownData from a saved estimate's stateJson.
 * Returns null if the state cannot be deserialized.
 */
export function reconstructBreakdownFromSaved(
  estimate: SavedEstimateData,
): EstimateBreakdownData | null {
  const system = detectSystem(estimate.stateJson);
  if (!system) return null;

  if (system === "karnak-metal-kynar") {
    return reconstructKarnakBreakdown(estimate);
  } else if (system === "carlisle-tpo" || system === "gaf-tpo") {
    return reconstructTPOBreakdown(estimate);
  }

  return null;
}

function reconstructKarnakBreakdown(
  estimate: SavedEstimateData,
): EstimateBreakdownData | null {
  const state = deserializeKarnakState(estimate.stateJson);
  if (!state) return null;

  const inputs = {
    squareFootage: parseFloat(state.squareFootage) || 0,
    verticalSeamsLF: parseFloat(state.verticalSeamsLF) || 0,
    horizontalSeamsLF: parseFloat(state.horizontalSeamsLF) || 0,
  };

  const estimateResult = calculateEstimate(inputs, state.customPrices);

  // Reconstruct penetration estimate from saved state
  let penetrationEstimate = null;
  if (state.penetrationsState) {
    const lineItems: PenetrationLineItem[] = [];
    for (const [penId, qty] of Object.entries(state.penetrationsState.lineItems)) {
      if (qty <= 0) continue;
      const penType = PENETRATION_TYPES.find((p) => p.id === penId);
      if (penType) {
        lineItems.push({
          penetrationId: penId,
          name: penType.name,
          category: penType.category,
          quantity: qty,
        });
      }
    }
    penetrationEstimate = calculatePenetrationEstimate(lineItems);

    // Add sheet metal items if present
    if (state.penetrationsState.sheetMetal) {
      const smEstimate = calculateSheetMetalEstimate(state.penetrationsState.sheetMetal);
      if (smEstimate.lineItems.length > 0) {
        penetrationEstimate = {
          ...penetrationEstimate,
          sheetMetalItems: smEstimate.lineItems.map((item) => ({
            flashingId: item.flashingId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalCost: item.totalCost,
          })),
          sheetMetalCost: smEstimate.totalMaterialCost,
          sheetMetalLaborMinutes: smEstimate.totalLaborMinutes,
          sheetMetalType: smEstimate.metalType,
          sheetMetalGauge: smEstimate.gauge,
        };
      }
    }
  }

  // Use saved labor/equipment or defaults
  const laborEquipment = state.laborEquipment || {
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
  };

  return serializeKarnakBreakdown(estimateResult, laborEquipment, penetrationEstimate);
}

function reconstructTPOBreakdown(
  estimate: SavedEstimateData,
): EstimateBreakdownData | null {
  const state = deserializeTPOState(estimate.stateJson);
  if (!state) return null;

  const measurements: TPOMeasurements = {
    roofArea: parseFloat(state.measurements.totalRoofArea) || 0,
    wallLinearFt: parseFloat(state.measurements.wallLinearFt ?? "0") || 0,
    wallHeight: parseFloat(state.measurements.wallHeight ?? "0") || 0,
    baseFlashingLF: parseFloat(state.measurements.baseFlashing) || 0,
  };

  // Use saved assembly config or defaults
  const assembly: AssemblyConfig = state.assemblyConfig || {
    deckType: "steel-22ga",
    vaporBarrier: "none",
    insulationEnabled: true,
    insulationLayers: [
      { thickness: "2.0", enabled: true },
      { thickness: "none", enabled: false },
      { thickness: "none", enabled: false },
      { thickness: "none", enabled: false },
    ],
    coverBoard: "densdeck-prime-half",
    membraneThickness: "60mil",
    attachmentMethod: "fully-adhered",
    fastenerType: state.system === "gaf-tpo" ? "gaf-drilltec-14" : "sfs-dekfast",
    fastenerLength: "auto",
    membraneFastenerLength: "auto",
    plateType: "3in-round",
    membranePlateType: "barbed",
  };

  const tpoEstimate = calculateTPOEstimate(assembly, measurements, state.customPrices);

  // Reconstruct penetration estimate from saved state
  let penetrationEstimate = null;
  if (state.penetrationsState) {
    const lineItems: PenetrationLineItem[] = [];
    for (const [penId, qty] of Object.entries(state.penetrationsState.lineItems)) {
      if (qty <= 0) continue;
      const penType = PENETRATION_TYPES.find((p) => p.id === penId);
      if (penType) {
        lineItems.push({
          penetrationId: penId,
          name: penType.name,
          category: penType.category,
          quantity: qty,
        });
      }
    }
    penetrationEstimate = calculatePenetrationEstimate(lineItems);

    // Add sheet metal items if present
    if (state.penetrationsState.sheetMetal) {
      const smEstimate = calculateSheetMetalEstimate(state.penetrationsState.sheetMetal);
      if (smEstimate.lineItems.length > 0) {
        penetrationEstimate = {
          ...penetrationEstimate,
          sheetMetalItems: smEstimate.lineItems.map((item) => ({
            flashingId: item.flashingId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalCost: item.totalCost,
          })),
          sheetMetalCost: smEstimate.totalMaterialCost,
          sheetMetalLaborMinutes: smEstimate.totalLaborMinutes,
          sheetMetalType: smEstimate.metalType,
          sheetMetalGauge: smEstimate.gauge,
        };
      }
    }
  }

  // Use saved labor/equipment or defaults
  const laborEquipment = state.laborEquipment || {
    laborItems: DEFAULT_TPO_LABOR_ITEMS.map((item) => ({
      ...item,
      rate: item.defaultRate,
      quantity: item.defaultQuantity,
    })),
    equipmentItems: DEFAULT_TPO_EQUIPMENT_ITEMS.map((item) => ({
      ...item,
      rate: item.defaultRate,
      quantity: item.defaultQuantity,
    })),
  };

  // Determine system name and accent color
  const systemName =
    state.system === "gaf-tpo"
      ? "GAF EverGuard TPO"
      : "Carlisle SynTec TPO";
  const accentColor = state.system === "gaf-tpo" ? "emerald" : "blue";

  return serializeTPOBreakdown(
    tpoEstimate,
    laborEquipment,
    penetrationEstimate,
    systemName,
    state.system,
    accentColor,
  );
}
