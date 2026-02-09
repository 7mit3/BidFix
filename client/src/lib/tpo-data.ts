// Carlisle TPO Single-Ply Membrane System - Data Model & Calculation Engine
// =========================================================================
// Design: Industrial Estimator for Carlisle Sure-Weld TPO roofing systems
// All prices are editable defaults based on industry research (QXO, BestMaterials, etc.)

// ---- TYPES ----

export interface InsulationLayer {
  thickness: string; // e.g. "1.0", "2.5", "none"
  enabled: boolean;
}

export interface AssemblyConfig {
  deckType: string;
  vaporBarrier: string;
  insulationLayers: InsulationLayer[]; // up to 4 layers
  coverBoard: string;
  membraneThickness: string;
  attachmentMethod: string;
}

export interface TPOMeasurements {
  roofArea: number;       // sq ft
  wallLinearFt: number;   // linear feet of wall perimeter
  wallHeight: number;     // feet - height of walls for wall flashing
  baseFlashingLF: number; // linear feet of base flashing (18" standard height)
}

export interface TPOProduct {
  id: string;
  name: string;
  category: string;
  unit: string;
  coveragePerUnit: number;  // sq ft or lin ft per unit
  coverageUnit: string;     // "sq ft" or "lin ft"
  defaultPrice: number;
  description: string;
}

export interface TPOLineItem {
  product: TPOProduct;
  quantityNeeded: number;   // raw calculation
  unitsToOrder: number;     // rounded up to whole units
  unitPrice: number;
  totalCost: number;
  note: string;
}

export interface TPOEstimate {
  assembly: AssemblyConfig;
  measurements: TPOMeasurements;
  lineItems: TPOLineItem[];
  totalMaterialCost: number;
  wallSqFt: number;
  baseFlashingSqFt: number;
}

// ---- ASSEMBLY OPTIONS ----

export const DECK_TYPES = [
  { value: "steel-22ga", label: "22 Gauge Steel Deck" },
  { value: "steel-20ga", label: "20 Gauge Steel Deck" },
  { value: "concrete", label: "Structural Concrete" },
  { value: "plywood", label: "Plywood" },
  { value: "osb", label: "OSB" },
  { value: "lwic", label: "Lightweight Insulating Concrete (LWIC)" },
];

export const VAPOR_BARRIERS = [
  { value: "none", label: "None" },
  { value: "vapair-725tr", label: "VapAir Seal 725TR (Self-Adhering Sheet)" },
  { value: "vapair-md", label: "VapAir Seal MD (Metal Deck)" },
  { value: "barritech-vp", label: "Barritech VP (Spray-Applied)" },
];

export const INSULATION_THICKNESSES = [
  { value: "1.0", label: '1.0" Polyiso (R-5.7)', rValue: 5.7, price: 32 },
  { value: "1.5", label: '1.5" Polyiso (R-8.6)', rValue: 8.6, price: 42 },
  { value: "1.6", label: '1.6" Polyiso (R-9.1)', rValue: 9.1, price: 44 },
  { value: "2.0", label: '2.0" Polyiso (R-11.4)', rValue: 11.4, price: 52 },
  { value: "2.2", label: '2.2" Polyiso (R-12.5)', rValue: 12.5, price: 56 },
  { value: "2.5", label: '2.5" Polyiso (R-14.3)', rValue: 14.3, price: 62 },
  { value: "3.0", label: '3.0" Polyiso (R-17.1)', rValue: 17.1, price: 72 },
  { value: "3.1", label: '3.1" Polyiso (R-17.7)', rValue: 17.7, price: 74 },
  { value: "3.3", label: '3.3" Polyiso (R-18.8)', rValue: 18.8, price: 78 },
  { value: "3.5", label: '3.5" Polyiso (R-20.0)', rValue: 20.0, price: 82 },
  { value: "4.0", label: '4.0" Polyiso (R-22.8)', rValue: 22.8, price: 92 },
  { value: "4.3", label: '4.3" Polyiso (R-24.5)', rValue: 24.5, price: 98 },
  { value: "4.5", label: '4.5" Polyiso (R-25.7)', rValue: 25.7, price: 102 },
  { value: "5.0", label: '5.0" Polyiso (R-28.5)', rValue: 28.5, price: 112 },
  { value: "5.5", label: '5.5" Polyiso (R-31.4)', rValue: 31.4, price: 122 },
  { value: "6.0", label: '6.0" Polyiso (R-34.2)', rValue: 34.2, price: 132 },
];

/** Helper: get total insulation thickness and R-value from layers */
export function getInsulationSummary(layers: InsulationLayer[]): {
  totalThickness: number;
  totalRValue: number;
  activeLayers: { thickness: string; rValue: number; label: string }[];
} {
  const activeLayers: { thickness: string; rValue: number; label: string }[] = [];
  let totalThickness = 0;
  let totalRValue = 0;
  for (const layer of layers) {
    if (!layer.enabled || layer.thickness === "none") continue;
    const found = INSULATION_THICKNESSES.find((t) => t.value === layer.thickness);
    if (found) {
      activeLayers.push({ thickness: found.value, rValue: found.rValue, label: found.label });
      totalThickness += parseFloat(found.value);
      totalRValue += found.rValue;
    }
  }
  return { totalThickness, totalRValue, activeLayers };
}

export const COVER_BOARDS = [
  { value: "densdeck-prime-half", label: 'DensDeck Prime 1/2"' },
  { value: "densdeck-prime-quarter", label: 'DensDeck Prime 1/4"' },
  { value: "securshield-hd", label: 'SecurShield HD 1/2" Polyiso' },
  { value: "perlite", label: 'Perlite 1/2"' },
  { value: "none", label: "None" },
];

export const MEMBRANE_THICKNESSES = [
  { value: "45mil", label: "45 mil TPO" },
  { value: "60mil", label: "60 mil TPO" },
  { value: "80mil", label: "80 mil TPO" },
];

export const ATTACHMENT_METHODS = [
  { value: "fully-adhered", label: "Fully Adhered" },
  { value: "mechanically-attached", label: "Mechanically Attached" },
];

// ---- PRODUCT CATALOG ----

export const TPO_PRODUCTS: Record<string, TPOProduct> = {
  // Membranes
  "membrane-45mil": {
    id: "membrane-45mil",
    name: "Sure-Weld TPO 45 mil Membrane",
    category: "Membrane",
    unit: "Roll (10' x 100')",
    coveragePerUnit: 1000,
    coverageUnit: "sq ft",
    defaultPrice: 750,
    description: "Carlisle Sure-Weld 45 mil reinforced TPO membrane, White",
  },
  "membrane-60mil": {
    id: "membrane-60mil",
    name: "Sure-Weld TPO 60 mil Membrane",
    category: "Membrane",
    unit: "Roll (10' x 100')",
    coveragePerUnit: 1000,
    coverageUnit: "sq ft",
    defaultPrice: 987,
    description: "Carlisle Sure-Weld 60 mil reinforced TPO membrane, White",
  },
  "membrane-80mil": {
    id: "membrane-80mil",
    name: "Sure-Weld TPO 80 mil Membrane",
    category: "Membrane",
    unit: "Roll (10' x 100')",
    coveragePerUnit: 1000,
    coverageUnit: "sq ft",
    defaultPrice: 1350,
    description: "Carlisle Sure-Weld 80 mil reinforced TPO membrane, White",
  },

  // Flashing membrane
  "flash-membrane-24": {
    id: "flash-membrane-24",
    name: 'TPO Non-Reinforced Flashing (24" x 50\')',
    category: "Flashing",
    unit: "Roll (24\" x 50')",
    coveragePerUnit: 50,
    coverageUnit: "lin ft",
    defaultPrice: 175,
    description: "Carlisle Sure-Weld TPO non-reinforced flashing for base/wall details",
  },
  "flash-membrane-12": {
    id: "flash-membrane-12",
    name: 'TPO Non-Reinforced Flashing (12" x 50\')',
    category: "Flashing",
    unit: "Roll (12\" x 50')",
    coveragePerUnit: 50,
    coverageUnit: "lin ft",
    defaultPrice: 110,
    description: "Carlisle Sure-Weld TPO non-reinforced flashing for smaller details",
  },

  // Insulation
  "insulation-1.0": {
    id: "insulation-1.0",
    name: '1.0" Polyiso Insulation (R-5.7)',
    category: "Insulation",
    unit: "Board (4' x 8')",
    coveragePerUnit: 32,
    coverageUnit: "sq ft",
    defaultPrice: 32,
    description: "Carlisle InsulBase polyiso rigid roof insulation, 20 PSI",
  },
  "insulation-1.5": {
    id: "insulation-1.5",
    name: '1.5" Polyiso Insulation (R-8.6)',
    category: "Insulation",
    unit: "Board (4' x 8')",
    coveragePerUnit: 32,
    coverageUnit: "sq ft",
    defaultPrice: 42,
    description: "Carlisle InsulBase polyiso rigid roof insulation, 20 PSI",
  },
  "insulation-2.0": {
    id: "insulation-2.0",
    name: '2.0" Polyiso Insulation (R-11.4)',
    category: "Insulation",
    unit: "Board (4' x 8')",
    coveragePerUnit: 32,
    coverageUnit: "sq ft",
    defaultPrice: 52,
    description: "Carlisle InsulBase polyiso rigid roof insulation, 20 PSI",
  },
  "insulation-2.5": {
    id: "insulation-2.5",
    name: '2.5" Polyiso Insulation (R-14.3)',
    category: "Insulation",
    unit: "Board (4' x 8')",
    coveragePerUnit: 32,
    coverageUnit: "sq ft",
    defaultPrice: 62,
    description: "Carlisle InsulBase polyiso rigid roof insulation, 20 PSI",
  },
  "insulation-3.0": {
    id: "insulation-3.0",
    name: '3.0" Polyiso Insulation (R-17.1)',
    category: "Insulation",
    unit: "Board (4' x 8')",
    coveragePerUnit: 32,
    coverageUnit: "sq ft",
    defaultPrice: 72,
    description: "Carlisle InsulBase polyiso rigid roof insulation, 20 PSI",
  },
  "insulation-3.5": {
    id: "insulation-3.5",
    name: '3.5" Polyiso Insulation (R-20.0)',
    category: "Insulation",
    unit: "Board (4' x 8')",
    coveragePerUnit: 32,
    coverageUnit: "sq ft",
    defaultPrice: 82,
    description: "Carlisle InsulBase polyiso rigid roof insulation, 20 PSI",
  },
  "insulation-4.0": {
    id: "insulation-4.0",
    name: '4.0" Polyiso Insulation (R-22.8)',
    category: "Insulation",
    unit: "Board (4' x 8')",
    coveragePerUnit: 32,
    coverageUnit: "sq ft",
    defaultPrice: 92,
    description: "Carlisle InsulBase polyiso rigid roof insulation, 20 PSI",
  },
  "insulation-1.6": {
    id: "insulation-1.6",
    name: '1.6" Polyiso Insulation (R-9.1)',
    category: "Insulation",
    unit: "Board (4' x 8')",
    coveragePerUnit: 32,
    coverageUnit: "sq ft",
    defaultPrice: 44,
    description: "Carlisle InsulBase polyiso rigid roof insulation, 20 PSI",
  },
  "insulation-2.2": {
    id: "insulation-2.2",
    name: '2.2" Polyiso Insulation (R-12.5)',
    category: "Insulation",
    unit: "Board (4' x 8')",
    coveragePerUnit: 32,
    coverageUnit: "sq ft",
    defaultPrice: 56,
    description: "Carlisle InsulBase polyiso rigid roof insulation, 20 PSI",
  },
  "insulation-3.1": {
    id: "insulation-3.1",
    name: '3.1" Polyiso Insulation (R-17.7)',
    category: "Insulation",
    unit: "Board (4' x 8')",
    coveragePerUnit: 32,
    coverageUnit: "sq ft",
    defaultPrice: 74,
    description: "Carlisle InsulBase polyiso rigid roof insulation, 20 PSI",
  },
  "insulation-3.3": {
    id: "insulation-3.3",
    name: '3.3" Polyiso Insulation (R-18.8)',
    category: "Insulation",
    unit: "Board (4' x 8')",
    coveragePerUnit: 32,
    coverageUnit: "sq ft",
    defaultPrice: 78,
    description: "Carlisle InsulBase polyiso rigid roof insulation, 20 PSI",
  },
  "insulation-4.3": {
    id: "insulation-4.3",
    name: '4.3" Polyiso Insulation (R-24.5)',
    category: "Insulation",
    unit: "Board (4' x 8')",
    coveragePerUnit: 32,
    coverageUnit: "sq ft",
    defaultPrice: 98,
    description: "Carlisle InsulBase polyiso rigid roof insulation, 20 PSI",
  },
  "insulation-4.5": {
    id: "insulation-4.5",
    name: '4.5" Polyiso Insulation (R-25.7)',
    category: "Insulation",
    unit: "Board (4' x 8')",
    coveragePerUnit: 32,
    coverageUnit: "sq ft",
    defaultPrice: 102,
    description: "Carlisle InsulBase polyiso rigid roof insulation, 20 PSI",
  },
  "insulation-5.0": {
    id: "insulation-5.0",
    name: '5.0" Polyiso Insulation (R-28.5)',
    category: "Insulation",
    unit: "Board (4' x 8')",
    coveragePerUnit: 32,
    coverageUnit: "sq ft",
    defaultPrice: 112,
    description: "Carlisle InsulBase polyiso rigid roof insulation, 20 PSI",
  },
  "insulation-5.5": {
    id: "insulation-5.5",
    name: '5.5" Polyiso Insulation (R-31.4)',
    category: "Insulation",
    unit: "Board (4' x 8')",
    coveragePerUnit: 32,
    coverageUnit: "sq ft",
    defaultPrice: 122,
    description: "Carlisle InsulBase polyiso rigid roof insulation, 20 PSI",
  },
  "insulation-6.0": {
    id: "insulation-6.0",
    name: '6.0" Polyiso Insulation (R-34.2)',
    category: "Insulation",
    unit: "Board (4' x 8')",
    coveragePerUnit: 32,
    coverageUnit: "sq ft",
    defaultPrice: 132,
    description: "Carlisle InsulBase polyiso rigid roof insulation, 20 PSI",
  },

  // Cover Boards
  "cover-densdeck-half": {
    id: "cover-densdeck-half",
    name: 'DensDeck Prime 1/2" Roof Board',
    category: "Cover Board",
    unit: "Board (4' x 8')",
    coveragePerUnit: 32,
    coverageUnit: "sq ft",
    defaultPrice: 40,
    description: "Georgia-Pacific DensDeck Prime gypsum cover board",
  },
  "cover-densdeck-quarter": {
    id: "cover-densdeck-quarter",
    name: 'DensDeck Prime 1/4" Roof Board',
    category: "Cover Board",
    unit: "Board (4' x 8')",
    coveragePerUnit: 32,
    coverageUnit: "sq ft",
    defaultPrice: 28,
    description: "Georgia-Pacific DensDeck Prime gypsum cover board",
  },
  "cover-securshield": {
    id: "cover-securshield",
    name: 'SecurShield HD 1/2" Polyiso Cover Board',
    category: "Cover Board",
    unit: "Board (4' x 8')",
    coveragePerUnit: 32,
    coverageUnit: "sq ft",
    defaultPrice: 28,
    description: "Carlisle SecurShield HD high-density polyiso cover board, 100 PSI",
  },
  "cover-perlite": {
    id: "cover-perlite",
    name: 'Perlite 1/2" Cover Board',
    category: "Cover Board",
    unit: "Board (4' x 8')",
    coveragePerUnit: 32,
    coverageUnit: "sq ft",
    defaultPrice: 22,
    description: "Perlite-based cover board for roof assemblies",
  },

  // Vapor Barriers
  "vb-725tr": {
    id: "vb-725tr",
    name: "VapAir Seal 725TR (Self-Adhering)",
    category: "Vapor Barrier",
    unit: "Roll (36\" x 100')",
    coveragePerUnit: 300,
    coverageUnit: "sq ft",
    defaultPrice: 300,
    description: "Carlisle VapAir Seal 725TR self-adhering air & vapor barrier",
  },
  "vb-md": {
    id: "vb-md",
    name: "VapAir Seal MD (Metal Deck)",
    category: "Vapor Barrier",
    unit: "Roll (36\" x 167')",
    coveragePerUnit: 500,
    coverageUnit: "sq ft",
    defaultPrice: 350,
    description: "Carlisle VapAir Seal MD for direct application over metal decks",
  },
  "vb-barritech": {
    id: "vb-barritech",
    name: "Barritech VP (Spray-Applied)",
    category: "Vapor Barrier",
    unit: "5 Gallon Pail",
    coveragePerUnit: 500,
    coverageUnit: "sq ft",
    defaultPrice: 250,
    description: "Carlisle Barritech VP spray-applied air & vapor barrier",
  },

  // Adhesives
  "adhesive-bonding": {
    id: "adhesive-bonding",
    name: "Sure-Weld TPO Bonding Adhesive",
    category: "Adhesive",
    unit: "5 Gallon Pail",
    coveragePerUnit: 300,
    coverageUnit: "sq ft",
    defaultPrice: 235,
    description: "High-strength solvent-based contact adhesive for TPO membrane, ~60 sq ft/gal",
  },
  "adhesive-insulation": {
    id: "adhesive-insulation",
    name: "FAST 100 Insulation Adhesive",
    category: "Adhesive",
    unit: "5 Gallon Jug",
    coveragePerUnit: 240,
    coverageUnit: "sq ft",
    defaultPrice: 225,
    description: "Two-component low-rise foam adhesive for insulation attachment, ~48 sq ft/gal",
  },
  "adhesive-primer": {
    id: "adhesive-primer",
    name: "Sure-Weld TPO Primer",
    category: "Adhesive",
    unit: "5 Gallon Pail",
    coveragePerUnit: 500,
    coverageUnit: "sq ft",
    defaultPrice: 175,
    description: "TPO primer for non-porous substrates, ~100 sq ft/gal",
  },

  // Fasteners & Plates
  "fastener-screws-short": {
    id: "fastener-screws-short",
    name: '#12 x 2" Roofing Screws',
    category: "Fasteners",
    unit: "Box (1,000)",
    coveragePerUnit: 1000,
    coverageUnit: "pieces",
    defaultPrice: 67,
    description: "SFS Dekfast #12 Phillips head roofing screws for thin assemblies",
  },
  "fastener-screws-long": {
    id: "fastener-screws-long",
    name: '#14 x 4" Roofing Screws',
    category: "Fasteners",
    unit: "Box (1,000)",
    coveragePerUnit: 1000,
    coverageUnit: "pieces",
    defaultPrice: 95,
    description: "Heavy-duty roofing screws for thicker insulation assemblies",
  },
  "fastener-plates-3in": {
    id: "fastener-plates-3in",
    name: '3" Round Insulation Plates',
    category: "Fasteners",
    unit: "Box (1,000)",
    coveragePerUnit: 1000,
    coverageUnit: "pieces",
    defaultPrice: 232,
    description: "Galvalume coated steel insulation attachment plates",
  },
  "fastener-plates-barbed": {
    id: "fastener-plates-barbed",
    name: '2" Barbed Membrane Plates',
    category: "Fasteners",
    unit: "Box (1,000)",
    coveragePerUnit: 1000,
    coverageUnit: "pieces",
    defaultPrice: 198,
    description: "Barbed stress plates for membrane attachment",
  },

  // Accessories
  "acc-coverstrip": {
    id: "acc-coverstrip",
    name: 'TPO Pressure-Sensitive Coverstrip (6")',
    category: "Accessories",
    unit: "Roll (100')",
    coveragePerUnit: 100,
    coverageUnit: "lin ft",
    defaultPrice: 85,
    description: "Self-adhering TPO coverstrip for detail work",
  },
  "acc-termbar": {
    id: "acc-termbar",
    name: "Termination Bar",
    category: "Accessories",
    unit: "Piece (10')",
    coveragePerUnit: 10,
    coverageUnit: "lin ft",
    defaultPrice: 15,
    description: "Aluminum termination bar for securing membrane at walls",
  },
  "acc-caulk": {
    id: "acc-caulk",
    name: "Caulk / Sealant",
    category: "Accessories",
    unit: "Tube (10.1 oz)",
    coveragePerUnit: 25,
    coverageUnit: "lin ft",
    defaultPrice: 8,
    description: "Polyurethane sealant for termination bar and detail sealing",
  },
  "acc-corners": {
    id: "acc-corners",
    name: "TPO Universal Corners",
    category: "Accessories",
    unit: "Each",
    coveragePerUnit: 1,
    coverageUnit: "each",
    defaultPrice: 12,
    description: "Pre-formed TPO corners for inside/outside corner details",
  },
  "acc-pipe-boot": {
    id: "acc-pipe-boot",
    name: "TPO Pipe Boot",
    category: "Accessories",
    unit: "Each",
    coveragePerUnit: 1,
    coverageUnit: "each",
    defaultPrice: 35,
    description: "Pre-formed TPO pipe boot for roof penetrations",
  },
};

// ---- CALCULATION ENGINE ----

// Fastener density: field = 1 per 4 sq ft, perimeter = 1 per 2 sq ft
// Assume ~15% of area is perimeter zone for fastener calculation
const FIELD_FASTENER_RATE = 1 / 4;    // 1 fastener per 4 sq ft
const PERIMETER_FASTENER_RATE = 1 / 2; // 1 fastener per 2 sq ft
const PERIMETER_ZONE_RATIO = 0.15;     // 15% of roof is perimeter zone

// Membrane overlap: ~6" side lap = ~5% waste
const MEMBRANE_WASTE_FACTOR = 1.05;

// Insulation/cover board waste: ~3% for cuts
const BOARD_WASTE_FACTOR = 1.03;

// Base flashing standard height
const BASE_FLASHING_HEIGHT_INCHES = 18;

export function calculateTPOEstimate(
  assembly: AssemblyConfig,
  measurements: TPOMeasurements,
  customPrices: Record<string, number>
): TPOEstimate {
  const { roofArea, wallLinearFt, wallHeight, baseFlashingLF } = measurements;
  const lineItems: TPOLineItem[] = [];

  // Helper to get price (custom or default)
  const getPrice = (productId: string): number => {
    return customPrices[productId] ?? TPO_PRODUCTS[productId]?.defaultPrice ?? 0;
  };

  // Helper to add a line item
  const addItem = (productId: string, rawQty: number, note: string) => {
    const product = TPO_PRODUCTS[productId];
    if (!product) return;
    const unitsToOrder = Math.ceil(rawQty);
    const unitPrice = getPrice(productId);
    lineItems.push({
      product,
      quantityNeeded: rawQty,
      unitsToOrder: Math.max(unitsToOrder, 0),
      unitPrice,
      totalCost: Math.max(unitsToOrder, 0) * unitPrice,
      note,
    });
  };

  // Calculate derived measurements
  const wallSqFt = wallLinearFt * wallHeight;
  const baseFlashingSqFt = baseFlashingLF * (BASE_FLASHING_HEIGHT_INCHES / 12);

  if (roofArea <= 0) {
    return { assembly, measurements, lineItems: [], totalMaterialCost: 0, wallSqFt, baseFlashingSqFt };
  }

  // ---- 1. VAPOR BARRIER ----
  if (assembly.vaporBarrier !== "none") {
    const vbProductMap: Record<string, string> = {
      "vapair-725tr": "vb-725tr",
      "vapair-md": "vb-md",
      "barritech-vp": "vb-barritech",
    };
    const vbId = vbProductMap[assembly.vaporBarrier];
    if (vbId) {
      const vbProduct = TPO_PRODUCTS[vbId];
      const rawQty = (roofArea * BOARD_WASTE_FACTOR) / vbProduct.coveragePerUnit;
      addItem(vbId, rawQty, `Covers ${roofArea.toLocaleString()} sq ft roof area`);
    }
  }

  // ---- 2. INSULATION (multi-layer) ----
  const { totalThickness: totalInsThickness, activeLayers } = getInsulationSummary(assembly.insulationLayers);
  for (let i = 0; i < activeLayers.length; i++) {
    const layer = activeLayers[i];
    const insId = `insulation-${layer.thickness}`;
    if (TPO_PRODUCTS[insId]) {
      const insProduct = TPO_PRODUCTS[insId];
      const rawQty = (roofArea * BOARD_WASTE_FACTOR) / insProduct.coveragePerUnit;
      const layerLabel = activeLayers.length > 1 ? `Layer ${i + 1}: ` : "";
      addItem(insId, rawQty, `${layerLabel}${rawQty.toFixed(0)} boards for ${roofArea.toLocaleString()} sq ft`);
    }
  }

  // ---- 3. INSULATION ATTACHMENT ----
  if (totalInsThickness > 0) {
    if (assembly.attachmentMethod === "mechanically-attached") {
      // Mechanically attached: fasteners + plates for insulation
      const fieldArea = roofArea * (1 - PERIMETER_ZONE_RATIO);
      const perimeterArea = roofArea * PERIMETER_ZONE_RATIO;
      const totalFasteners = Math.ceil(
        fieldArea * FIELD_FASTENER_RATE + perimeterArea * PERIMETER_FASTENER_RATE
      );

      // Select screw length based on total insulation thickness
      const screwId = totalInsThickness > 2.0 ? "fastener-screws-long" : "fastener-screws-short";
      const screwBoxes = totalFasteners / 1000;
      addItem(screwId, screwBoxes, `${totalFasteners.toLocaleString()} fasteners for ${totalInsThickness.toFixed(1)}" total insulation`);

      const plateBoxes = totalFasteners / 1000;
      addItem("fastener-plates-3in", plateBoxes, `${totalFasteners.toLocaleString()} plates for insulation`);
    } else {
      // Fully adhered: insulation adhesive (one application per layer)
      const numLayers = activeLayers.length;
      const rawQty = (roofArea * BOARD_WASTE_FACTOR * numLayers) / TPO_PRODUCTS["adhesive-insulation"].coveragePerUnit;
      addItem("adhesive-insulation", rawQty, `Adhering ${numLayers} insulation layer${numLayers > 1 ? "s" : ""} over ${roofArea.toLocaleString()} sq ft`);
    }
  }

  // ---- 4. COVER BOARD ----
  if (assembly.coverBoard !== "none") {
    const cbProductMap: Record<string, string> = {
      "densdeck-prime-half": "cover-densdeck-half",
      "densdeck-prime-quarter": "cover-densdeck-quarter",
      "securshield-hd": "cover-securshield",
      "perlite": "cover-perlite",
    };
    const cbId = cbProductMap[assembly.coverBoard];
    if (cbId) {
      const cbProduct = TPO_PRODUCTS[cbId];
      const rawQty = (roofArea * BOARD_WASTE_FACTOR) / cbProduct.coveragePerUnit;
      addItem(cbId, rawQty, `${rawQty.toFixed(0)} boards for ${roofArea.toLocaleString()} sq ft`);
    }
  }

  // ---- 5. MEMBRANE ----
  const memId = `membrane-${assembly.membraneThickness}`;
  if (TPO_PRODUCTS[memId]) {
    const memProduct = TPO_PRODUCTS[memId];
    const rawQty = (roofArea * MEMBRANE_WASTE_FACTOR) / memProduct.coveragePerUnit;
    addItem(memId, rawQty, `Includes 5% for side-lap overlap waste`);
  }

  // ---- 6. MEMBRANE ATTACHMENT ----
  if (assembly.attachmentMethod === "fully-adhered") {
    // Bonding adhesive for membrane
    const rawQty = (roofArea * MEMBRANE_WASTE_FACTOR) / TPO_PRODUCTS["adhesive-bonding"].coveragePerUnit;
    addItem("adhesive-bonding", rawQty, `Adhering membrane over ${roofArea.toLocaleString()} sq ft`);
  } else {
    // Mechanically attached: barbed plates in seam rows
    // Approx 1 fastener per linear foot of seam, seams every 10' (membrane width)
    const seamRows = Math.ceil(Math.sqrt(roofArea) / 10);
    const seamLength = Math.sqrt(roofArea);
    const memFasteners = Math.ceil(seamRows * seamLength);
    const memScrewBoxes = memFasteners / 1000;

    addItem("fastener-screws-short", memScrewBoxes, `${memFasteners.toLocaleString()} fasteners for membrane seam rows`);
    addItem("fastener-plates-barbed", memScrewBoxes, `${memFasteners.toLocaleString()} barbed plates for membrane`);
  }

  // ---- 7. BASE FLASHING ----
  if (baseFlashingLF > 0) {
    // 24" wide flashing for 18" base flash height
    const flashProduct = TPO_PRODUCTS["flash-membrane-24"];
    const rawQty = baseFlashingLF / flashProduct.coveragePerUnit;
    addItem("flash-membrane-24", rawQty, `${baseFlashingLF.toLocaleString()} lin ft at 18" height`);

    // Primer for flashing substrate
    const flashSqFt = baseFlashingSqFt;
    const primerQty = flashSqFt / TPO_PRODUCTS["adhesive-primer"].coveragePerUnit;
    addItem("adhesive-primer", primerQty, `Primer for ${flashSqFt.toFixed(0)} sq ft of base flashing area`);
  }

  // ---- 8. WALL FLASHING ----
  if (wallLinearFt > 0 && wallHeight > 0) {
    // Use 12" flashing for wall termination above base flashing
    const wallFlashProduct = TPO_PRODUCTS["flash-membrane-12"];
    const rawQty = wallLinearFt / wallFlashProduct.coveragePerUnit;
    addItem("flash-membrane-12", rawQty, `${wallLinearFt.toLocaleString()} lin ft wall termination`);

    // Termination bar at top of wall flashing
    const termBarQty = wallLinearFt / TPO_PRODUCTS["acc-termbar"].coveragePerUnit;
    addItem("acc-termbar", termBarQty, `Securing membrane at wall termination`);

    // Caulk for termination bar
    const caulkQty = wallLinearFt / TPO_PRODUCTS["acc-caulk"].coveragePerUnit;
    addItem("acc-caulk", caulkQty, `Sealing termination bar at ${wallLinearFt.toLocaleString()} lin ft`);
  }

  // ---- 9. ACCESSORIES ----
  // Coverstrip for all flashing laps
  const totalFlashingLF = baseFlashingLF + wallLinearFt;
  if (totalFlashingLF > 0) {
    const csQty = totalFlashingLF / TPO_PRODUCTS["acc-coverstrip"].coveragePerUnit;
    addItem("acc-coverstrip", csQty, `Detail work for ${totalFlashingLF.toLocaleString()} lin ft of flashing`);
  }

  // Corners: estimate 4 outside + 4 inside per typical building
  if (wallLinearFt > 0) {
    const estimatedCorners = Math.max(8, Math.ceil(wallLinearFt / 50));
    addItem("acc-corners", estimatedCorners, `Estimated ${estimatedCorners} inside/outside corners`);
  }

  // Calculate total
  const totalMaterialCost = lineItems.reduce((sum, item) => sum + item.totalCost, 0);

  return {
    assembly,
    measurements,
    lineItems,
    totalMaterialCost,
    wallSqFt,
    baseFlashingSqFt,
  };
}

// ---- CSV EXPORT ----

export function exportTPOEstimateCSV(estimate: TPOEstimate): string {
  const headers = [
    "Category",
    "Product",
    "Unit",
    "Qty Needed",
    "Qty to Order",
    "Unit Price",
    "Total Cost",
    "Notes",
  ];

  const rows = estimate.lineItems.map((item) => [
    item.product.category,
    item.product.name,
    item.product.unit,
    item.quantityNeeded.toFixed(2),
    item.unitsToOrder.toString(),
    `$${item.unitPrice.toFixed(2)}`,
    `$${item.totalCost.toFixed(2)}`,
    item.note,
  ]);

  // Add total row
  rows.push([
    "",
    "",
    "",
    "",
    "",
    "TOTAL",
    `$${estimate.totalMaterialCost.toFixed(2)}`,
    "",
  ]);

  const insSummary = getInsulationSummary(estimate.assembly.insulationLayers);
  const insDesc = insSummary.activeLayers.length > 0
    ? insSummary.activeLayers.map((l, i) => `Layer ${i + 1}: ${l.label}`).join(" + ")
    : "None";

  const csvContent = [
    `Carlisle TPO Estimate - ${new Date().toLocaleDateString()}`,
    `Roof Area: ${estimate.measurements.roofArea.toLocaleString()} sq ft`,
    `Insulation: ${insDesc} (Total: ${insSummary.totalThickness.toFixed(1)}" / R-${insSummary.totalRValue.toFixed(1)})`,
    `Wall: ${estimate.measurements.wallLinearFt} LF x ${estimate.measurements.wallHeight} ft = ${estimate.wallSqFt.toLocaleString()} sq ft`,
    `Base Flashing: ${estimate.measurements.baseFlashingLF} LF at 18" height = ${estimate.baseFlashingSqFt.toFixed(0)} sq ft`,
    "",
    headers.join(","),
    ...rows.map((r) => r.map((c) => `"${c}"`).join(",")),
  ].join("\n");

  return csvContent;
}
