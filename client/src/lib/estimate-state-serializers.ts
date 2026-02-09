/**
 * Estimate State Serializers
 *
 * Functions to serialize/deserialize the full estimator state for save/load.
 * Each estimator has its own shape, so we store a discriminated union keyed by `system`.
 */

import type { LaborEquipmentState } from "@/lib/labor-equipment-data";
import type { TPOLaborEquipmentState } from "@/lib/tpo-labor-equipment-data";

// ─── Karnak ──────────────────────────────────────────────────────────────────

export interface KarnakSaveState {
  system: "karnak-metal-kynar";
  squareFootage: string;
  verticalSeamsLF: string;
  horizontalSeamsLF: string;
  customPrices: Record<string, number>;
  laborEquipment: LaborEquipmentState;
}

export function serializeKarnakState(state: {
  squareFootage: string;
  verticalSeamsLF: string;
  horizontalSeamsLF: string;
  customPrices: Record<string, number>;
  laborEquipment: LaborEquipmentState;
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

// ─── Carlisle TPO ────────────────────────────────────────────────────────────

export interface TPOSaveState {
  system: "carlisle-tpo" | "gaf-tpo";
  measurements: {
    totalRoofArea: string;
    baseFlashing: string;
  };
  customPrices: Record<string, number>;
  laborEquipment: TPOLaborEquipmentState;
  /** Penetration config if any */
  penetrations?: Record<string, { count: number; avgSize: string }>;
  /** Roof additions if any */
  roofAdditions?: Record<string, boolean | number | string>;
}

export function serializeTPOState(
  system: "carlisle-tpo" | "gaf-tpo",
  state: {
    measurements: { totalRoofArea: string; baseFlashing: string };
    customPrices: Record<string, number>;
    laborEquipment: TPOLaborEquipmentState;
    penetrations?: Record<string, { count: number; avgSize: string }>;
    roofAdditions?: Record<string, boolean | number | string>;
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
