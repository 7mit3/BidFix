/**
 * Roof Penetrations & Additions — Universal data model
 *
 * Supports common roof penetrations with auto-calculated materials:
 * - Pipe Flashings (various diameters)
 * - Pitch Pans (round & rectangular)
 * - Roof Curbs (small, medium, large for HVAC/fans)
 * - Exhaust Fan Curbs
 * - Roof Drains
 * - Skylights
 * - Conduit/Cable Penetrations
 * - Gas Line Penetrations
 *
 * Each penetration type defines the materials needed for proper
 * TPO flashing and sealing installation.
 */

// ── Types ──────────────────────────────────────────────────

export interface PenetrationMaterial {
  name: string;
  unit: string;
  qtyPerUnit: number; // quantity needed per 1 penetration
  unitPrice: number;
}

export interface PenetrationType {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string; // lucide icon name
  sizeLabel?: string;
  materials: PenetrationMaterial[];
  laborMinutes: number; // estimated labor minutes per unit
}

export interface PenetrationLineItem {
  penetrationId: string;
  name: string;
  category: string;
  quantity: number;
}

export interface PenetrationMaterialResult {
  materialName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  fromPenetration: string;
}

export interface PenetrationEstimate {
  lineItems: PenetrationLineItem[];
  materials: PenetrationMaterialResult[];
  totalMaterialCost: number;
  totalLaborMinutes: number;
  /** Sheet metal flashing items (if any) */
  sheetMetalItems?: SheetMetalFlashingLineItem[];
  sheetMetalCost?: number;
  sheetMetalLaborMinutes?: number;
  sheetMetalType?: string;
  sheetMetalGauge?: string;
}

/** Lightweight line item for sheet metal flashing within the penetration estimate */
export interface SheetMetalFlashingLineItem {
  flashingId: string;
  name: string;
  quantity: number; // linear feet
  unitPrice: number;
  totalCost: number;
}

// ── Penetration Type Definitions ───────────────────────────

export const PENETRATION_CATEGORIES = [
  "Pipe Flashings",
  "Pitch Pans",
  "Roof Curbs",
  "Exhaust Fans",
  "Drains & Scuppers",
  "Skylights",
  "Miscellaneous",
] as const;

export const PENETRATION_TYPES: PenetrationType[] = [
  // ── Pipe Flashings ──────────────────────────────────────
  {
    id: "pipe-1-3",
    name: 'Pipe Flashing (1"–3")',
    category: "Pipe Flashings",
    description: "Small pipe penetration — plumbing vents, conduits",
    icon: "CircleDot",
    sizeLabel: '1"–3" diameter',
    materials: [
      { name: "TPO Pipe Boot (1\"–6\")", unit: "Each", qtyPerUnit: 1, unitPrice: 28.00 },
      { name: "TPO Non-Reinforced Flashing (12\" x 12\")", unit: "Piece", qtyPerUnit: 1, unitPrice: 8.50 },
      { name: "TPO Primer", unit: "Quart", qtyPerUnit: 0.25, unitPrice: 32.00 },
      { name: "Sealant Caulk", unit: "Tube", qtyPerUnit: 0.5, unitPrice: 12.00 },
      { name: "Stainless Steel Clamp", unit: "Each", qtyPerUnit: 1, unitPrice: 4.50 },
    ],
    laborMinutes: 30,
  },
  {
    id: "pipe-4-6",
    name: 'Pipe Flashing (4"–6")',
    category: "Pipe Flashings",
    description: "Medium pipe penetration — larger vents, exhaust pipes",
    icon: "CircleDot",
    sizeLabel: '4"–6" diameter',
    materials: [
      { name: "TPO Pipe Boot (1\"–6\")", unit: "Each", qtyPerUnit: 1, unitPrice: 28.00 },
      { name: "TPO Non-Reinforced Flashing (18\" x 18\")", unit: "Piece", qtyPerUnit: 1, unitPrice: 14.00 },
      { name: "TPO Primer", unit: "Quart", qtyPerUnit: 0.5, unitPrice: 32.00 },
      { name: "Sealant Caulk", unit: "Tube", qtyPerUnit: 1, unitPrice: 12.00 },
      { name: "Stainless Steel Clamp", unit: "Each", qtyPerUnit: 1, unitPrice: 6.50 },
    ],
    laborMinutes: 45,
  },
  {
    id: "pipe-8-12",
    name: 'Pipe Flashing (8"–12")',
    category: "Pipe Flashings",
    description: "Large pipe penetration — HVAC ducts, large exhaust",
    icon: "CircleDot",
    sizeLabel: '8"–12" diameter',
    materials: [
      { name: "TPO Split Pipe Flashing (8\"–12\")", unit: "Each", qtyPerUnit: 1, unitPrice: 85.00 },
      { name: "TPO Non-Reinforced Flashing (24\" x 24\")", unit: "Piece", qtyPerUnit: 2, unitPrice: 18.00 },
      { name: "TPO Primer", unit: "Quart", qtyPerUnit: 0.75, unitPrice: 32.00 },
      { name: "Sealant Caulk", unit: "Tube", qtyPerUnit: 1.5, unitPrice: 12.00 },
      { name: "Stainless Steel Clamp", unit: "Each", qtyPerUnit: 1, unitPrice: 9.00 },
      { name: "TPO Cover Tape (6\")", unit: "Lin Ft", qtyPerUnit: 4, unitPrice: 3.80 },
    ],
    laborMinutes: 60,
  },

  // ── Pitch Pans ──────────────────────────────────────────
  {
    id: "pitch-pan-round-small",
    name: 'Round Pitch Pan (4")',
    category: "Pitch Pans",
    description: "Small round pitch pan for single conduit or pipe",
    icon: "Circle",
    sizeLabel: '4" round',
    materials: [
      { name: "Galvanized Pitch Pan (4\" Round)", unit: "Each", qtyPerUnit: 1, unitPrice: 22.00 },
      { name: "Pitch Pan Filler / Pourable Sealer", unit: "Quart", qtyPerUnit: 0.5, unitPrice: 28.00 },
      { name: "TPO Non-Reinforced Flashing (18\" x 18\")", unit: "Piece", qtyPerUnit: 1, unitPrice: 14.00 },
      { name: "TPO Primer", unit: "Quart", qtyPerUnit: 0.25, unitPrice: 32.00 },
      { name: "Sealant Caulk", unit: "Tube", qtyPerUnit: 0.5, unitPrice: 12.00 },
    ],
    laborMinutes: 45,
  },
  {
    id: "pitch-pan-round-large",
    name: 'Round Pitch Pan (8")',
    category: "Pitch Pans",
    description: "Large round pitch pan for larger penetrations",
    icon: "Circle",
    sizeLabel: '8" round',
    materials: [
      { name: "Galvanized Pitch Pan (8\" Round)", unit: "Each", qtyPerUnit: 1, unitPrice: 35.00 },
      { name: "Pitch Pan Filler / Pourable Sealer", unit: "Quart", qtyPerUnit: 1, unitPrice: 28.00 },
      { name: "TPO Non-Reinforced Flashing (24\" x 24\")", unit: "Piece", qtyPerUnit: 1, unitPrice: 18.00 },
      { name: "TPO Primer", unit: "Quart", qtyPerUnit: 0.5, unitPrice: 32.00 },
      { name: "Sealant Caulk", unit: "Tube", qtyPerUnit: 1, unitPrice: 12.00 },
    ],
    laborMinutes: 60,
  },
  {
    id: "pitch-pan-rect",
    name: 'Rectangular Pitch Pan (6"x12")',
    category: "Pitch Pans",
    description: "Rectangular pitch pan for multi-conduit or irregular penetrations",
    icon: "Square",
    sizeLabel: '6"x12"',
    materials: [
      { name: "Galvanized Pitch Pan (6\"x12\" Rect)", unit: "Each", qtyPerUnit: 1, unitPrice: 42.00 },
      { name: "Pitch Pan Filler / Pourable Sealer", unit: "Quart", qtyPerUnit: 1.5, unitPrice: 28.00 },
      { name: "TPO Non-Reinforced Flashing (24\" x 24\")", unit: "Piece", qtyPerUnit: 2, unitPrice: 18.00 },
      { name: "TPO Primer", unit: "Quart", qtyPerUnit: 0.5, unitPrice: 32.00 },
      { name: "Sealant Caulk", unit: "Tube", qtyPerUnit: 1, unitPrice: 12.00 },
      { name: "TPO Pre-Molded Inside Corner", unit: "Each", qtyPerUnit: 4, unitPrice: 14.00 },
    ],
    laborMinutes: 75,
  },

  // ── Roof Curbs ──────────────────────────────────────────
  {
    id: "curb-small",
    name: "Small Roof Curb (up to 24\"x24\")",
    category: "Roof Curbs",
    description: "Small equipment curb — exhaust fans, small RTUs",
    icon: "BoxSelect",
    sizeLabel: "Up to 24\"x24\"",
    materials: [
      { name: "Galvanized Roof Curb (Small)", unit: "Each", qtyPerUnit: 1, unitPrice: 185.00 },
      { name: "TPO Non-Reinforced Flashing (Roll)", unit: "Lin Ft", qtyPerUnit: 12, unitPrice: 4.50 },
      { name: "TPO Pre-Molded Inside Corner", unit: "Each", qtyPerUnit: 4, unitPrice: 14.00 },
      { name: "TPO Pre-Molded Outside Corner", unit: "Each", qtyPerUnit: 4, unitPrice: 14.00 },
      { name: "Termination Bar", unit: "Piece (10')", qtyPerUnit: 1, unitPrice: 15.00 },
      { name: "TPO Primer", unit: "Quart", qtyPerUnit: 0.5, unitPrice: 32.00 },
      { name: "Sealant Caulk", unit: "Tube", qtyPerUnit: 2, unitPrice: 12.00 },
      { name: "TPO Cover Tape (6\")", unit: "Lin Ft", qtyPerUnit: 10, unitPrice: 3.80 },
      { name: "Wood Nailer / Blocking", unit: "Lin Ft", qtyPerUnit: 8, unitPrice: 3.50 },
    ],
    laborMinutes: 120,
  },
  {
    id: "curb-medium",
    name: "Medium Roof Curb (24\"x48\" to 36\"x48\")",
    category: "Roof Curbs",
    description: "Medium equipment curb — RTUs up to 5 ton",
    icon: "BoxSelect",
    sizeLabel: "24\"x48\" to 36\"x48\"",
    materials: [
      { name: "Galvanized Roof Curb (Medium)", unit: "Each", qtyPerUnit: 1, unitPrice: 350.00 },
      { name: "TPO Non-Reinforced Flashing (Roll)", unit: "Lin Ft", qtyPerUnit: 20, unitPrice: 4.50 },
      { name: "TPO Pre-Molded Inside Corner", unit: "Each", qtyPerUnit: 4, unitPrice: 14.00 },
      { name: "TPO Pre-Molded Outside Corner", unit: "Each", qtyPerUnit: 4, unitPrice: 14.00 },
      { name: "Termination Bar", unit: "Piece (10')", qtyPerUnit: 2, unitPrice: 15.00 },
      { name: "TPO Primer", unit: "Quart", qtyPerUnit: 1, unitPrice: 32.00 },
      { name: "Sealant Caulk", unit: "Tube", qtyPerUnit: 3, unitPrice: 12.00 },
      { name: "TPO Cover Tape (6\")", unit: "Lin Ft", qtyPerUnit: 16, unitPrice: 3.80 },
      { name: "Wood Nailer / Blocking", unit: "Lin Ft", qtyPerUnit: 14, unitPrice: 3.50 },
      { name: "Polyiso Insulation (Curb Wrap)", unit: "Board", qtyPerUnit: 1, unitPrice: 52.00 },
    ],
    laborMinutes: 180,
  },
  {
    id: "curb-large",
    name: "Large Roof Curb (48\"x96\" and up)",
    category: "Roof Curbs",
    description: "Large equipment curb — RTUs 7.5+ ton, large HVAC",
    icon: "BoxSelect",
    sizeLabel: "48\"x96\"+",
    materials: [
      { name: "Galvanized Roof Curb (Large)", unit: "Each", qtyPerUnit: 1, unitPrice: 650.00 },
      { name: "TPO Non-Reinforced Flashing (Roll)", unit: "Lin Ft", qtyPerUnit: 32, unitPrice: 4.50 },
      { name: "TPO Pre-Molded Inside Corner", unit: "Each", qtyPerUnit: 4, unitPrice: 14.00 },
      { name: "TPO Pre-Molded Outside Corner", unit: "Each", qtyPerUnit: 4, unitPrice: 14.00 },
      { name: "Termination Bar", unit: "Piece (10')", qtyPerUnit: 3, unitPrice: 15.00 },
      { name: "TPO Primer", unit: "Quart", qtyPerUnit: 1.5, unitPrice: 32.00 },
      { name: "Sealant Caulk", unit: "Tube", qtyPerUnit: 4, unitPrice: 12.00 },
      { name: "TPO Cover Tape (6\")", unit: "Lin Ft", qtyPerUnit: 28, unitPrice: 3.80 },
      { name: "Wood Nailer / Blocking", unit: "Lin Ft", qtyPerUnit: 24, unitPrice: 3.50 },
      { name: "Polyiso Insulation (Curb Wrap)", unit: "Board", qtyPerUnit: 2, unitPrice: 52.00 },
    ],
    laborMinutes: 240,
  },

  // ── Exhaust Fans ──────────────────────────────────────
  {
    id: "exhaust-fan-small",
    name: "Exhaust Fan (up to 18\")",
    category: "Exhaust Fans",
    description: "Small restroom or utility exhaust fan",
    icon: "Fan",
    sizeLabel: "Up to 18\"",
    materials: [
      { name: "Galvanized Fan Curb (Small)", unit: "Each", qtyPerUnit: 1, unitPrice: 145.00 },
      { name: "TPO Non-Reinforced Flashing (Roll)", unit: "Lin Ft", qtyPerUnit: 8, unitPrice: 4.50 },
      { name: "TPO Pre-Molded Inside Corner", unit: "Each", qtyPerUnit: 4, unitPrice: 14.00 },
      { name: "TPO Pre-Molded Outside Corner", unit: "Each", qtyPerUnit: 4, unitPrice: 14.00 },
      { name: "TPO Primer", unit: "Quart", qtyPerUnit: 0.5, unitPrice: 32.00 },
      { name: "Sealant Caulk", unit: "Tube", qtyPerUnit: 1, unitPrice: 12.00 },
      { name: "TPO Cover Tape (6\")", unit: "Lin Ft", qtyPerUnit: 8, unitPrice: 3.80 },
      { name: "Wood Nailer / Blocking", unit: "Lin Ft", qtyPerUnit: 6, unitPrice: 3.50 },
    ],
    laborMinutes: 90,
  },
  {
    id: "exhaust-fan-medium",
    name: "Exhaust Fan (18\"–30\")",
    category: "Exhaust Fans",
    description: "Kitchen or commercial exhaust fan",
    icon: "Fan",
    sizeLabel: "18\"–30\"",
    materials: [
      { name: "Galvanized Fan Curb (Medium)", unit: "Each", qtyPerUnit: 1, unitPrice: 265.00 },
      { name: "TPO Non-Reinforced Flashing (Roll)", unit: "Lin Ft", qtyPerUnit: 14, unitPrice: 4.50 },
      { name: "TPO Pre-Molded Inside Corner", unit: "Each", qtyPerUnit: 4, unitPrice: 14.00 },
      { name: "TPO Pre-Molded Outside Corner", unit: "Each", qtyPerUnit: 4, unitPrice: 14.00 },
      { name: "Termination Bar", unit: "Piece (10')", qtyPerUnit: 1, unitPrice: 15.00 },
      { name: "TPO Primer", unit: "Quart", qtyPerUnit: 0.75, unitPrice: 32.00 },
      { name: "Sealant Caulk", unit: "Tube", qtyPerUnit: 2, unitPrice: 12.00 },
      { name: "TPO Cover Tape (6\")", unit: "Lin Ft", qtyPerUnit: 12, unitPrice: 3.80 },
      { name: "Wood Nailer / Blocking", unit: "Lin Ft", qtyPerUnit: 10, unitPrice: 3.50 },
    ],
    laborMinutes: 120,
  },
  {
    id: "exhaust-fan-large",
    name: "Exhaust Fan (30\"+)",
    category: "Exhaust Fans",
    description: "Large upblast or industrial exhaust fan",
    icon: "Fan",
    sizeLabel: "30\"+",
    materials: [
      { name: "Galvanized Fan Curb (Large)", unit: "Each", qtyPerUnit: 1, unitPrice: 420.00 },
      { name: "TPO Non-Reinforced Flashing (Roll)", unit: "Lin Ft", qtyPerUnit: 20, unitPrice: 4.50 },
      { name: "TPO Pre-Molded Inside Corner", unit: "Each", qtyPerUnit: 4, unitPrice: 14.00 },
      { name: "TPO Pre-Molded Outside Corner", unit: "Each", qtyPerUnit: 4, unitPrice: 14.00 },
      { name: "Termination Bar", unit: "Piece (10')", qtyPerUnit: 2, unitPrice: 15.00 },
      { name: "TPO Primer", unit: "Quart", qtyPerUnit: 1, unitPrice: 32.00 },
      { name: "Sealant Caulk", unit: "Tube", qtyPerUnit: 3, unitPrice: 12.00 },
      { name: "TPO Cover Tape (6\")", unit: "Lin Ft", qtyPerUnit: 18, unitPrice: 3.80 },
      { name: "Wood Nailer / Blocking", unit: "Lin Ft", qtyPerUnit: 16, unitPrice: 3.50 },
      { name: "Polyiso Insulation (Curb Wrap)", unit: "Board", qtyPerUnit: 1, unitPrice: 52.00 },
    ],
    laborMinutes: 180,
  },

  // ── Drains & Scuppers ──────────────────────────────────
  {
    id: "roof-drain",
    name: "Roof Drain",
    category: "Drains & Scuppers",
    description: "Interior roof drain with TPO flashing collar",
    icon: "ArrowDownCircle",
    materials: [
      { name: "TPO Drain Flashing / Retrofit Drain", unit: "Each", qtyPerUnit: 1, unitPrice: 95.00 },
      { name: "TPO Non-Reinforced Flashing (24\" x 24\")", unit: "Piece", qtyPerUnit: 1, unitPrice: 18.00 },
      { name: "TPO Primer", unit: "Quart", qtyPerUnit: 0.5, unitPrice: 32.00 },
      { name: "Sealant Caulk", unit: "Tube", qtyPerUnit: 1, unitPrice: 12.00 },
      { name: "Drain Clamping Ring", unit: "Each", qtyPerUnit: 1, unitPrice: 35.00 },
      { name: "Leaf Guard / Strainer", unit: "Each", qtyPerUnit: 1, unitPrice: 18.00 },
    ],
    laborMinutes: 60,
  },
  {
    id: "scupper",
    name: "Scupper (Through-Wall Drain)",
    category: "Drains & Scuppers",
    description: "Through-wall scupper drain with conductor head",
    icon: "ArrowRightFromLine",
    materials: [
      { name: "Galvanized Scupper Box", unit: "Each", qtyPerUnit: 1, unitPrice: 125.00 },
      { name: "TPO Non-Reinforced Flashing (Roll)", unit: "Lin Ft", qtyPerUnit: 6, unitPrice: 4.50 },
      { name: "TPO Pre-Molded Inside Corner", unit: "Each", qtyPerUnit: 2, unitPrice: 14.00 },
      { name: "TPO Primer", unit: "Quart", qtyPerUnit: 0.5, unitPrice: 32.00 },
      { name: "Sealant Caulk", unit: "Tube", qtyPerUnit: 2, unitPrice: 12.00 },
      { name: "Conductor Head / Collector Box", unit: "Each", qtyPerUnit: 1, unitPrice: 85.00 },
    ],
    laborMinutes: 90,
  },

  // ── Skylights ──────────────────────────────────────────
  {
    id: "skylight-small",
    name: "Skylight Curb (up to 2'x4')",
    category: "Skylights",
    description: "Small tubular or flat skylight on curb",
    icon: "Sun",
    sizeLabel: "Up to 2'x4'",
    materials: [
      { name: "TPO Non-Reinforced Flashing (Roll)", unit: "Lin Ft", qtyPerUnit: 16, unitPrice: 4.50 },
      { name: "TPO Pre-Molded Inside Corner", unit: "Each", qtyPerUnit: 4, unitPrice: 14.00 },
      { name: "TPO Pre-Molded Outside Corner", unit: "Each", qtyPerUnit: 4, unitPrice: 14.00 },
      { name: "Termination Bar", unit: "Piece (10')", qtyPerUnit: 2, unitPrice: 15.00 },
      { name: "TPO Primer", unit: "Quart", qtyPerUnit: 0.75, unitPrice: 32.00 },
      { name: "Sealant Caulk", unit: "Tube", qtyPerUnit: 2, unitPrice: 12.00 },
      { name: "TPO Cover Tape (6\")", unit: "Lin Ft", qtyPerUnit: 14, unitPrice: 3.80 },
      { name: "Wood Nailer / Blocking", unit: "Lin Ft", qtyPerUnit: 12, unitPrice: 3.50 },
    ],
    laborMinutes: 150,
  },
  {
    id: "skylight-large",
    name: "Skylight Curb (4'x8' and up)",
    category: "Skylights",
    description: "Large commercial skylight on curb",
    icon: "Sun",
    sizeLabel: "4'x8'+",
    materials: [
      { name: "TPO Non-Reinforced Flashing (Roll)", unit: "Lin Ft", qtyPerUnit: 28, unitPrice: 4.50 },
      { name: "TPO Pre-Molded Inside Corner", unit: "Each", qtyPerUnit: 4, unitPrice: 14.00 },
      { name: "TPO Pre-Molded Outside Corner", unit: "Each", qtyPerUnit: 4, unitPrice: 14.00 },
      { name: "Termination Bar", unit: "Piece (10')", qtyPerUnit: 3, unitPrice: 15.00 },
      { name: "TPO Primer", unit: "Quart", qtyPerUnit: 1.5, unitPrice: 32.00 },
      { name: "Sealant Caulk", unit: "Tube", qtyPerUnit: 3, unitPrice: 12.00 },
      { name: "TPO Cover Tape (6\")", unit: "Lin Ft", qtyPerUnit: 26, unitPrice: 3.80 },
      { name: "Wood Nailer / Blocking", unit: "Lin Ft", qtyPerUnit: 24, unitPrice: 3.50 },
      { name: "Polyiso Insulation (Curb Wrap)", unit: "Board", qtyPerUnit: 1, unitPrice: 52.00 },
    ],
    laborMinutes: 240,
  },

  // ── Miscellaneous ──────────────────────────────────────
  {
    id: "conduit-cluster",
    name: "Conduit / Cable Penetration",
    category: "Miscellaneous",
    description: "Electrical conduit or cable tray penetration",
    icon: "Cable",
    materials: [
      { name: "Galvanized Pitch Pan (4\" Round)", unit: "Each", qtyPerUnit: 1, unitPrice: 22.00 },
      { name: "Pitch Pan Filler / Pourable Sealer", unit: "Quart", qtyPerUnit: 0.5, unitPrice: 28.00 },
      { name: "TPO Non-Reinforced Flashing (12\" x 12\")", unit: "Piece", qtyPerUnit: 1, unitPrice: 8.50 },
      { name: "TPO Primer", unit: "Quart", qtyPerUnit: 0.25, unitPrice: 32.00 },
      { name: "Sealant Caulk", unit: "Tube", qtyPerUnit: 0.5, unitPrice: 12.00 },
    ],
    laborMinutes: 30,
  },
  {
    id: "gas-line",
    name: "Gas Line Penetration",
    category: "Miscellaneous",
    description: "Gas supply line roof penetration",
    icon: "Flame",
    materials: [
      { name: "TPO Pipe Boot (1\"–6\")", unit: "Each", qtyPerUnit: 1, unitPrice: 28.00 },
      { name: "TPO Non-Reinforced Flashing (18\" x 18\")", unit: "Piece", qtyPerUnit: 1, unitPrice: 14.00 },
      { name: "TPO Primer", unit: "Quart", qtyPerUnit: 0.25, unitPrice: 32.00 },
      { name: "Sealant Caulk", unit: "Tube", qtyPerUnit: 1, unitPrice: 12.00 },
      { name: "Stainless Steel Clamp", unit: "Each", qtyPerUnit: 1, unitPrice: 6.50 },
    ],
    laborMinutes: 45,
  },
  {
    id: "antenna-support",
    name: "Antenna / Equipment Support",
    category: "Miscellaneous",
    description: "Antenna mast, satellite dish, or equipment support stand",
    icon: "Radio",
    materials: [
      { name: "Galvanized Pitch Pan (6\"x12\" Rect)", unit: "Each", qtyPerUnit: 1, unitPrice: 42.00 },
      { name: "Pitch Pan Filler / Pourable Sealer", unit: "Quart", qtyPerUnit: 1, unitPrice: 28.00 },
      { name: "TPO Non-Reinforced Flashing (24\" x 24\")", unit: "Piece", qtyPerUnit: 1, unitPrice: 18.00 },
      { name: "TPO Primer", unit: "Quart", qtyPerUnit: 0.5, unitPrice: 32.00 },
      { name: "Sealant Caulk", unit: "Tube", qtyPerUnit: 1, unitPrice: 12.00 },
    ],
    laborMinutes: 60,
  },
  {
    id: "plumbing-vent-stack",
    name: "Plumbing Vent Stack",
    category: "Miscellaneous",
    description: "Standard plumbing vent stack penetration",
    icon: "ArrowUp",
    materials: [
      { name: "TPO Pipe Boot (1\"–6\")", unit: "Each", qtyPerUnit: 1, unitPrice: 28.00 },
      { name: "TPO Non-Reinforced Flashing (12\" x 12\")", unit: "Piece", qtyPerUnit: 1, unitPrice: 8.50 },
      { name: "TPO Primer", unit: "Quart", qtyPerUnit: 0.25, unitPrice: 32.00 },
      { name: "Sealant Caulk", unit: "Tube", qtyPerUnit: 0.5, unitPrice: 12.00 },
      { name: "Stainless Steel Clamp", unit: "Each", qtyPerUnit: 1, unitPrice: 4.50 },
    ],
    laborMinutes: 30,
  },
];

// ── Calculation Engine ─────────────────────────────────────

/**
 * Calculate all materials needed for the selected penetrations
 */
export function calculatePenetrationEstimate(
  lineItems: PenetrationLineItem[]
): PenetrationEstimate {
  const materialMap = new Map<
    string,
    { unit: string; quantity: number; unitPrice: number; sources: Set<string> }
  >();
  let totalLaborMinutes = 0;

  for (const item of lineItems) {
    if (item.quantity <= 0) continue;

    const penType = PENETRATION_TYPES.find((p) => p.id === item.penetrationId);
    if (!penType) continue;

    totalLaborMinutes += penType.laborMinutes * item.quantity;

    for (const mat of penType.materials) {
      const key = mat.name;
      const existing = materialMap.get(key);
      const qty = mat.qtyPerUnit * item.quantity;

      if (existing) {
        existing.quantity += qty;
        existing.sources.add(item.name);
      } else {
        materialMap.set(key, {
          unit: mat.unit,
          quantity: qty,
          unitPrice: mat.unitPrice,
          sources: new Set([item.name]),
        });
      }
    }
  }

  const materials: PenetrationMaterialResult[] = [];
  let totalMaterialCost = 0;

  for (const [name, data] of Array.from(materialMap.entries())) {
    const roundedQty = Math.ceil(data.quantity);
    const total = roundedQty * data.unitPrice;
    totalMaterialCost += total;

    materials.push({
      materialName: name,
      unit: data.unit,
      quantity: roundedQty,
      unitPrice: data.unitPrice,
      totalPrice: total,
      fromPenetration: Array.from(data.sources).join(", "),
    });
  }

  // Sort materials by total price descending
  materials.sort((a, b) => b.totalPrice - a.totalPrice);

  return {
    lineItems,
    materials,
    totalMaterialCost,
    totalLaborMinutes,
  };
}

/**
 * Get penetration types grouped by category
 */
export function getPenetrationsByCategory(): Record<string, PenetrationType[]> {
  const grouped: Record<string, PenetrationType[]> = {};
  for (const pen of PENETRATION_TYPES) {
    if (!grouped[pen.category]) {
      grouped[pen.category] = [];
    }
    grouped[pen.category].push(pen);
  }
  return grouped;
}

/**
 * Format labor time from minutes
 */
export function formatLaborTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
}
