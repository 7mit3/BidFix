/**
 * Estimate Breakdown — Unified data model for the full estimate breakdown page.
 *
 * This module defines a common shape that all three estimators (Karnak, Carlisle TPO, GAF TPO)
 * serialize their state into before navigating to the breakdown page.
 * The breakdown page then renders everything in a single editable view.
 */

// ── Line item types ──────────────────────────────────────────

export interface BreakdownMaterialItem {
  id: string;
  name: string;
  description: string;
  category: string; // e.g. "Preparation", "Membrane", "Insulation"
  unit: string; // e.g. "pail", "roll", "each"
  quantityNeeded: number; // raw fractional
  quantity: number; // rounded / order qty
  unitPrice: number;
  totalCost: number;
  enabled: boolean;
}

export interface BreakdownPenetrationItem {
  id: string;
  name: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalCost: number;
  enabled: boolean;
}

export interface BreakdownLaborItem {
  id: string;
  label: string;
  description: string;
  rateType: string; // "per_sqft" | "per_hour" | "per_lf" | "flat"
  rate: number;
  quantity: number; // hours, 1 for flat/per_sqft
  computedCost: number; // pre-calculated cost
  enabled: boolean;
}

export interface BreakdownEquipmentItem {
  id: string;
  label: string;
  description: string;
  rateType: string; // "per_day" | "flat"
  rate: number;
  quantity: number;
  computedCost: number;
  enabled: boolean;
}

// ── Full breakdown payload ───────────────────────────────────

export interface EstimateBreakdownData {
  systemName: string; // e.g. "Karnak Metal Kynar", "Carlisle TPO 60mil"
  systemSlug: string; // e.g. "karnak-metal-kynar", "carlisle-tpo"
  accentColor: string; // tailwind color name: "red", "blue", "emerald"
  measurements: Record<string, string>; // human-readable key-value pairs for header
  materials: BreakdownMaterialItem[];
  penetrations: BreakdownPenetrationItem[];
  labor: BreakdownLaborItem[];
  equipment: BreakdownEquipmentItem[];
}

// ── Serialization helpers ────────────────────────────────────

/**
 * Compress the breakdown data into a base64-encoded URL-safe string.
 * We use sessionStorage as the transport to avoid URL length limits.
 */
const STORAGE_KEY = "estimate-breakdown-data";

export function storeBreakdownData(data: EstimateBreakdownData): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // If sessionStorage is full, try clearing old data first
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}

export function loadBreakdownData(): EstimateBreakdownData | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as EstimateBreakdownData;
  } catch {
    return null;
  }
}

// ── Formatting helpers ───────────────────────────────────────

export function fmt(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function fmtNum(num: number, decimals = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

// ── Rate label helper ────────────────────────────────────────

export function getRateLabel(rateType: string): string {
  switch (rateType) {
    case "per_sqft": return "$/sq. ft.";
    case "per_hour": return "$/hr";
    case "per_lf": return "$/LF";
    case "per_day": return "$/day";
    case "flat": return "flat";
    default: return "$";
  }
}

export function getQuantityLabel(rateType: string): string {
  switch (rateType) {
    case "per_hour": return "Hours";
    case "per_day": return "Days";
    case "flat": return "Qty";
    default: return "Qty";
  }
}
