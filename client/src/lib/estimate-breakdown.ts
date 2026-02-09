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
  roofArea: number; // total roof area in sq. ft. for $/sqft calculation
  materials: BreakdownMaterialItem[];
  penetrations: BreakdownPenetrationItem[];
  labor: BreakdownLaborItem[];
  equipment: BreakdownEquipmentItem[];
}

// ── Estimate context (for save/back navigation from breakdown) ──

export interface EstimateContext {
  /** Saved estimate ID (null if not yet saved) */
  estimateId: number | null;
  /** Saved estimate name */
  estimateName: string;
  /** System slug, e.g. "gaf-tpo" */
  system: string;
  /** Human-readable system label */
  systemLabel: string;
  /** Serialized estimator state JSON (for saving back to DB) */
  estimatorStateJson: string;
  /** Grand total at time of navigation */
  grandTotal: number;
  /** Roof area at time of navigation */
  roofArea: number;
}

// ── Serialization helpers ────────────────────────────────────

/**
 * Compress the breakdown data into a base64-encoded URL-safe string.
 * We use sessionStorage as the transport to avoid URL length limits.
 */
const STORAGE_KEY = "estimate-breakdown-data";
const CONTEXT_KEY = "estimate-breakdown-context";
const BREAKDOWN_STATE_KEY = "estimate-breakdown-saved-state";

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

export function storeEstimateContext(ctx: EstimateContext): void {
  try {
    sessionStorage.setItem(CONTEXT_KEY, JSON.stringify(ctx));
  } catch {
    sessionStorage.removeItem(CONTEXT_KEY);
    sessionStorage.setItem(CONTEXT_KEY, JSON.stringify(ctx));
  }
}

export function loadEstimateContext(): EstimateContext | null {
  try {
    const raw = sessionStorage.getItem(CONTEXT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as EstimateContext;
  } catch {
    return null;
  }
}

/** Store a saved breakdown state in sessionStorage (for restoring on the breakdown page). */
export function storeBreakdownSaveState(state: BreakdownSaveState): void {
  try {
    sessionStorage.setItem(BREAKDOWN_STATE_KEY, JSON.stringify(state));
  } catch {
    sessionStorage.removeItem(BREAKDOWN_STATE_KEY);
    sessionStorage.setItem(BREAKDOWN_STATE_KEY, JSON.stringify(state));
  }
}

/** Load a saved breakdown state from sessionStorage. */
export function loadBreakdownSaveState(): BreakdownSaveState | null {
  try {
    const raw = sessionStorage.getItem(BREAKDOWN_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BreakdownSaveState;
  } catch {
    return null;
  }
}

/** Clear the saved breakdown state from sessionStorage. */
export function clearBreakdownSaveState(): void {
  sessionStorage.removeItem(BREAKDOWN_STATE_KEY);
}

// ── Breakdown save state (persisted to DB) ─────────────────

export interface TaxProfitState {
  taxEnabled: boolean;
  taxPercent: number;
  profitEnabled: boolean;
  profitPercent: number;
}

/**
 * The full breakdown editing state that gets persisted to the database.
 * Captures all user edits: toggled items, edited quantities/prices,
 * tax/profit settings per section, and custom items.
 */
export interface BreakdownSaveState {
  materials: BreakdownMaterialItem[];
  penetrations: BreakdownPenetrationItem[];
  labor: BreakdownLaborItem[];
  equipment: BreakdownEquipmentItem[];
  materialsTaxProfit: TaxProfitState;
  penetrationsTaxProfit: TaxProfitState;
  laborTaxProfit: TaxProfitState;
  equipmentTaxProfit: TaxProfitState;
}

/** Serialize breakdown state to a JSON string for DB storage. */
export function serializeBreakdownState(state: BreakdownSaveState): string {
  return JSON.stringify(state);
}

/** Deserialize breakdown state from a JSON string (from DB). */
export function deserializeBreakdownState(json: string): BreakdownSaveState | null {
  try {
    const parsed = JSON.parse(json);
    // Basic validation: check required arrays exist
    if (!parsed.materials || !parsed.labor) return null;
    return parsed as BreakdownSaveState;
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
