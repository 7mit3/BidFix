/**
 * Estimate State Serializers
 *
 * Functions to serialize/deserialize the full estimator state for save/load.
 * Each estimator has its own shape, so we store a discriminated union keyed by `system`.
 *
 * Includes: measurements, custom prices, labor/equipment, penetrations, and sheet metal flashing.
 */

import type { LaborEquipmentState } from "@/lib/labor-equipment-data";
import type { TPOLaborEquipmentState } from "@/lib/tpo-labor-equipment-data";
import type { SheetMetalFlashingState } from "@/lib/sheet-metal-flashing-data";

// ─── Shared Penetration/Additions State ─────────────────────────────────────

export interface SavedPenetrationsState {
  /** penetrationId -> quantity */
  lineItems: Record<string, number>;
  /** Sheet metal flashing state */
  sheetMetal: SheetMetalFlashingState;
}

// ─── Karnak ──────────────────────────────────────────────────────────────────

export interface KarnakSaveState {
  system: "karnak-metal-kynar";
  squareFootage: string;
  verticalSeamsLF: string;
  horizontalSeamsLF: string;
  customPrices: Record<string, number>;
  laborEquipment: LaborEquipmentState;
  /** Penetrations & sheet metal flashing (added v2) */
  penetrationsState?: SavedPenetrationsState;
}

export function serializeKarnakState(state: {
  squareFootage: string;
  verticalSeamsLF: string;
  horizontalSeamsLF: string;
  customPrices: Record<string, number>;
  laborEquipment: LaborEquipmentState;
  penetrationsState?: SavedPenetrationsState;
}): string {
  const payload: KarnakSaveState = {
    system: "karnak-metal-kynar",
    ...state,
  };
  return JSON.stringify(payload);
}

export function deserializeKarnakState(json: string): KarnakSaveState | null {
  try {
    const parsed = JSON.parse(json);
    if (parsed.system !== "karnak-metal-kynar") return null;
    return parsed as KarnakSaveState;
  } catch {
    return null;
  }
}

// ─── Carlisle TPO / GAF TPO ────────────────────────────────────────────────

export interface TPOSaveState {
  system: "carlisle-tpo" | "gaf-tpo";
  measurements: {
    totalRoofArea: string;
    baseFlashing: string;
    /** Wall linear ft (added v2) */
    wallLinearFt?: string;
    /** Wall height (added v2) */
    wallHeight?: string;
  };
  customPrices: Record<string, number>;
  laborEquipment: TPOLaborEquipmentState;
  /** Penetrations & sheet metal flashing (added v2) */
  penetrationsState?: SavedPenetrationsState;
  /** @deprecated — old format, kept for backward compat */
  penetrations?: Record<string, { count: number; avgSize: string }>;
  /** @deprecated — old format */
  roofAdditions?: Record<string, boolean | number | string>;
}

export function serializeTPOState(
  system: "carlisle-tpo" | "gaf-tpo",
  state: {
    measurements: {
      totalRoofArea: string;
      baseFlashing: string;
      wallLinearFt?: string;
      wallHeight?: string;
    };
    customPrices: Record<string, number>;
    laborEquipment: TPOLaborEquipmentState;
    penetrationsState?: SavedPenetrationsState;
  },
): string {
  const payload: TPOSaveState = {
    system,
    ...state,
  };
  return JSON.stringify(payload);
}

export function deserializeTPOState(json: string): TPOSaveState | null {
  try {
    const parsed = JSON.parse(json);
    if (parsed.system !== "carlisle-tpo" && parsed.system !== "gaf-tpo") return null;
    return parsed as TPOSaveState;
  } catch {
    return null;
  }
}

// ─── Generic ─────────────────────────────────────────────────────────────────

export type SavedEstimateState = KarnakSaveState | TPOSaveState;

export function detectSystem(json: string): string | null {
  try {
    const parsed = JSON.parse(json);
    return parsed.system ?? null;
  } catch {
    return null;
  }
}
