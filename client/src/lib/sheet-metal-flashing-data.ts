/**
 * Sheet Metal Flashing — Data model for the Sheet Metal Flashing section
 * within Penetrations & Additions.
 *
 * Supports multiple metal types with appropriate gauge/thickness options,
 * and common flashing profiles measured in linear feet.
 *
 * Metal Types:
 *   - Galvanized Steel (28ga – 16ga)
 *   - Prefinished Steel (28ga – 16ga)
 *   - Aluminum (.032" – .063")
 *   - Stainless Steel (26ga – 20ga)
 *   - Copper (16 oz – 24 oz)
 *   - Galvalume (26ga – 22ga)
 *
 * Flashing Items (priced per linear foot):
 *   - Drip Edge
 *   - Gravel Stop
 *   - Coping Cap
 *   - Counter Flashing (Receiver)
 *   - Edge Metal / Fascia
 *   - Reglet Flashing
 *   - Through-Wall Flashing
 *   - Parapet Cap
 *   - Valley Flashing
 *   - Step Flashing
 *   - Custom Flashing
 */

// ── Types ──────────────────────────────────────────────────

export interface MetalGauge {
  id: string;
  label: string; // e.g. "24 Gauge", ".040\""
  value: string; // raw gauge/thickness value
  priceMultiplier: number; // multiplier vs base price (thicker = more expensive)
}

export interface MetalType {
  id: string;
  name: string;
  gauges: MetalGauge[];
  defaultGaugeId: string;
  basePricePerLF: number; // base price per linear foot at default gauge
}

export interface FlashingProfile {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide icon name
  unit: string; // "LF" for linear feet
  defaultDevelopedWidth: number; // inches — typical girth/width of the profile
  laborMinutesPerLF: number; // labor time per linear foot
}

export interface FlashingLineItem {
  flashingId: string;
  name: string;
  quantity: number; // linear feet
  metalTypeId: string;
  gaugeId: string;
  unitPrice: number; // price per LF (computed from metal + gauge + profile)
  totalCost: number;
}

export interface SheetMetalFlashingState {
  metalTypeId: string;
  gaugeId: string;
  lineItems: Record<string, number>; // flashingId -> linear feet
}

export interface SheetMetalFlashingEstimate {
  lineItems: FlashingLineItem[];
  totalMaterialCost: number;
  totalLaborMinutes: number;
  metalType: string;
  gauge: string;
}

// ── Metal Types & Gauges ──────────────────────────────────

export const METAL_TYPES: MetalType[] = [
  {
    id: "galvanized-steel",
    name: "Galvanized Steel",
    basePricePerLF: 3.50,
    defaultGaugeId: "24ga",
    gauges: [
      { id: "28ga", label: "28 Gauge", value: "28", priceMultiplier: 0.70 },
      { id: "26ga", label: "26 Gauge", value: "26", priceMultiplier: 0.80 },
      { id: "24ga", label: "24 Gauge", value: "24", priceMultiplier: 1.00 },
      { id: "22ga", label: "22 Gauge", value: "22", priceMultiplier: 1.25 },
      { id: "20ga", label: "20 Gauge", value: "20", priceMultiplier: 1.55 },
      { id: "18ga", label: "18 Gauge", value: "18", priceMultiplier: 2.00 },
      { id: "16ga", label: "16 Gauge", value: "16", priceMultiplier: 2.60 },
    ],
  },
  {
    id: "prefinished-steel",
    name: "Prefinished Steel",
    basePricePerLF: 4.25,
    defaultGaugeId: "24ga-pf",
    gauges: [
      { id: "28ga-pf", label: "28 Gauge", value: "28", priceMultiplier: 0.70 },
      { id: "26ga-pf", label: "26 Gauge", value: "26", priceMultiplier: 0.80 },
      { id: "24ga-pf", label: "24 Gauge", value: "24", priceMultiplier: 1.00 },
      { id: "22ga-pf", label: "22 Gauge", value: "22", priceMultiplier: 1.25 },
      { id: "20ga-pf", label: "20 Gauge", value: "20", priceMultiplier: 1.55 },
      { id: "18ga-pf", label: "18 Gauge", value: "18", priceMultiplier: 2.00 },
      { id: "16ga-pf", label: "16 Gauge", value: "16", priceMultiplier: 2.60 },
    ],
  },
  {
    id: "aluminum",
    name: "Aluminum",
    basePricePerLF: 4.25,
    defaultGaugeId: "040",
    gauges: [
      { id: "032", label: '.032"', value: ".032", priceMultiplier: 0.85 },
      { id: "040", label: '.040"', value: ".040", priceMultiplier: 1.00 },
      { id: "050", label: '.050"', value: ".050", priceMultiplier: 1.30 },
      { id: "063", label: '.063"', value: ".063", priceMultiplier: 1.65 },
    ],
  },
  {
    id: "stainless-steel",
    name: "Stainless Steel",
    basePricePerLF: 8.50,
    defaultGaugeId: "24ga-ss",
    gauges: [
      { id: "26ga-ss", label: "26 Gauge", value: "26", priceMultiplier: 0.85 },
      { id: "24ga-ss", label: "24 Gauge", value: "24", priceMultiplier: 1.00 },
      { id: "22ga-ss", label: "22 Gauge", value: "22", priceMultiplier: 1.30 },
      { id: "20ga-ss", label: "20 Gauge", value: "20", priceMultiplier: 1.65 },
    ],
  },
  {
    id: "copper",
    name: "Copper",
    basePricePerLF: 14.00,
    defaultGaugeId: "20oz",
    gauges: [
      { id: "16oz", label: "16 oz", value: "16", priceMultiplier: 0.80 },
      { id: "20oz", label: "20 oz", value: "20", priceMultiplier: 1.00 },
      { id: "24oz", label: "24 oz", value: "24", priceMultiplier: 1.25 },
    ],
  },
  {
    id: "galvalume",
    name: "Galvalume",
    basePricePerLF: 4.00,
    defaultGaugeId: "24ga-gv",
    gauges: [
      { id: "26ga-gv", label: "26 Gauge", value: "26", priceMultiplier: 0.85 },
      { id: "24ga-gv", label: "24 Gauge", value: "24", priceMultiplier: 1.00 },
      { id: "22ga-gv", label: "22 Gauge", value: "22", priceMultiplier: 1.30 },
    ],
  },
];

// ── Flashing Profiles ─────────────────────────────────────

export const FLASHING_PROFILES: FlashingProfile[] = [
  {
    id: "drip-edge",
    name: "Drip Edge",
    description: "Roof edge drip flashing — directs water away from fascia",
    icon: "ArrowDownRight",
    unit: "LF",
    defaultDevelopedWidth: 4,
    laborMinutesPerLF: 0.5,
  },
  {
    id: "gravel-stop",
    name: "Gravel Stop",
    description: "Edge flashing with gravel guard — retains ballast and sheds water",
    icon: "AlignVerticalJustifyEnd",
    unit: "LF",
    defaultDevelopedWidth: 6,
    laborMinutesPerLF: 0.6,
  },
  {
    id: "coping-cap",
    name: "Coping Cap",
    description: "Parapet wall cap — covers and protects the top of parapet walls",
    icon: "Minus",
    unit: "LF",
    defaultDevelopedWidth: 12,
    laborMinutesPerLF: 0.8,
  },
  {
    id: "counter-flashing",
    name: "Counter Flashing (Receiver)",
    description: "Wall-to-roof transition — covers the top edge of base flashing",
    icon: "CornerLeftDown",
    unit: "LF",
    defaultDevelopedWidth: 6,
    laborMinutesPerLF: 0.6,
  },
  {
    id: "edge-metal",
    name: "Edge Metal / Fascia",
    description: "Roof edge trim — finished metal fascia along roof perimeter",
    icon: "Ruler",
    unit: "LF",
    defaultDevelopedWidth: 8,
    laborMinutesPerLF: 0.7,
  },
  {
    id: "reglet-flashing",
    name: "Reglet Flashing",
    description: "Masonry wall flashing — inserts into reglet cut in brick or block",
    icon: "CornerRightDown",
    unit: "LF",
    defaultDevelopedWidth: 4,
    laborMinutesPerLF: 0.8,
  },
  {
    id: "through-wall",
    name: "Through-Wall Flashing",
    description: "Embedded wall flashing — diverts moisture within masonry walls",
    icon: "ArrowRightFromLine",
    unit: "LF",
    defaultDevelopedWidth: 10,
    laborMinutesPerLF: 1.0,
  },
  {
    id: "parapet-cap",
    name: "Parapet Cap",
    description: "Full parapet wall capping — wraps over and down both sides",
    icon: "Minus",
    unit: "LF",
    defaultDevelopedWidth: 16,
    laborMinutesPerLF: 1.0,
  },
  {
    id: "valley-flashing",
    name: "Valley Flashing",
    description: "Roof valley lining — channels water in roof valley intersections",
    icon: "ChevronDown",
    unit: "LF",
    defaultDevelopedWidth: 20,
    laborMinutesPerLF: 0.8,
  },
  {
    id: "step-flashing",
    name: "Step Flashing",
    description: "Stepped wall-to-slope transition — individual pieces at each course",
    icon: "Stairs",
    unit: "LF",
    defaultDevelopedWidth: 8,
    laborMinutesPerLF: 1.2,
  },
  {
    id: "custom-flashing",
    name: "Custom Flashing",
    description: "Custom-fabricated flashing — specify linear feet for any profile",
    icon: "Wrench",
    unit: "LF",
    defaultDevelopedWidth: 8,
    laborMinutesPerLF: 0.8,
  },
];

// ── Calculation Helpers ───────────────────────────────────

/**
 * Get the price per linear foot for a given metal type, gauge, and flashing profile.
 * Price scales with the developed width of the profile relative to a standard 8" width.
 */
export function getFlashingPricePerLF(
  metalTypeId: string,
  gaugeId: string,
  flashingProfile: FlashingProfile,
): number {
  const metal = METAL_TYPES.find((m) => m.id === metalTypeId);
  if (!metal) return 0;

  const gauge = metal.gauges.find((g) => g.id === gaugeId);
  if (!gauge) return 0;

  // Scale price by developed width (wider profiles use more material)
  // Base price assumes ~8" developed width
  const widthFactor = flashingProfile.defaultDevelopedWidth / 8;

  return Math.round(metal.basePricePerLF * gauge.priceMultiplier * widthFactor * 100) / 100;
}

/**
 * Calculate the full sheet metal flashing estimate from current state.
 */
export function calculateSheetMetalEstimate(
  state: SheetMetalFlashingState,
): SheetMetalFlashingEstimate {
  const metal = METAL_TYPES.find((m) => m.id === state.metalTypeId);
  const gauge = metal?.gauges.find((g) => g.id === state.gaugeId);

  const lineItems: FlashingLineItem[] = [];
  let totalMaterialCost = 0;
  let totalLaborMinutes = 0;

  for (const [flashingId, quantity] of Object.entries(state.lineItems)) {
    if (quantity <= 0) continue;

    const profile = FLASHING_PROFILES.find((p) => p.id === flashingId);
    if (!profile) continue;

    const unitPrice = getFlashingPricePerLF(state.metalTypeId, state.gaugeId, profile);
    const totalCost = Math.round(unitPrice * quantity * 100) / 100;

    lineItems.push({
      flashingId,
      name: profile.name,
      quantity,
      metalTypeId: state.metalTypeId,
      gaugeId: state.gaugeId,
      unitPrice,
      totalCost,
    });

    totalMaterialCost += totalCost;
    totalLaborMinutes += Math.round(profile.laborMinutesPerLF * quantity);
  }

  // Sort by total cost descending
  lineItems.sort((a, b) => b.totalCost - a.totalCost);

  return {
    lineItems,
    totalMaterialCost: Math.round(totalMaterialCost * 100) / 100,
    totalLaborMinutes,
    metalType: metal?.name ?? "",
    gauge: gauge?.label ?? "",
  };
}

/**
 * Get the default state for sheet metal flashing.
 */
export function getDefaultSheetMetalState(): SheetMetalFlashingState {
  return {
    metalTypeId: "galvanized-steel",
    gaugeId: "24ga",
    lineItems: {},
  };
}

/**
 * Get a metal type by ID.
 */
export function getMetalType(id: string): MetalType | undefined {
  return METAL_TYPES.find((m) => m.id === id);
}

/**
 * Get the gauge options for a metal type.
 */
export function getGaugesForMetal(metalTypeId: string): MetalGauge[] {
  return METAL_TYPES.find((m) => m.id === metalTypeId)?.gauges ?? [];
}
