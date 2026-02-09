// GAF EverGuard TPO Single-Ply Membrane System - Data Model & Calculation Engine
// =========================================================================
// Design: Industrial Estimator for GAF EverGuard TPO roofing systems
// All prices are editable defaults based on industry research (BuildersWarehouse, BestMaterials, QXO, etc.)

// Re-export shared types from Carlisle module (identical structure)
export type {
  InsulationLayer,
  AssemblyConfig,
  TPOMeasurements,
  TPOProduct,
  TPOLineItem,
  TPOEstimate,
} from "./tpo-data";

import type {
  AssemblyConfig,
  TPOMeasurements,
  TPOProduct,
  TPOLineItem,
  TPOEstimate,
  InsulationLayer,
} from "./tpo-data";

// Re-export shared assembly options that are identical across manufacturers
export {
  DECK_TYPES,
  INSULATION_THICKNESSES,
  getInsulationSummary,
  FIELD_ZONE_RATIO,
  PERIMETER_ZONE_RATIO,
  CORNER_ZONE_RATIO,
} from "./tpo-data";

import { getInsulationSummary, FIELD_ZONE_RATIO, PERIMETER_ZONE_RATIO, CORNER_ZONE_RATIO } from "./tpo-data";

// ---- GAF-SPECIFIC ASSEMBLY OPTIONS ----

export const GAF_VAPOR_BARRIERS = [
  { value: "none", label: "None" },
  { value: "gaf-vb-sa", label: "GAF EverGuard VaporGuard SA (Self-Adhering)" },
  { value: "gaf-vb-spray", label: "GAF Spray Vapor Barrier" },
  { value: "bitec-vs", label: "Bitec Vapor-Stop SA" },
];

export const GAF_COVER_BOARDS = [
  { value: "densdeck-prime-half", label: 'DensDeck Prime 1/2"' },
  { value: "densdeck-prime-quarter", label: 'DensDeck Prime 1/4"' },
  { value: "securock-half", label: 'USG Securock 1/2"' },
  { value: "perlite", label: 'Perlite 1/2"' },
  { value: "none", label: "None" },
];

export const GAF_MEMBRANE_THICKNESSES = [
  { value: "45mil", label: "EverGuard TPO 45 mil" },
  { value: "60mil", label: "EverGuard TPO 60 mil" },
  { value: "80mil", label: "EverGuard TPO 80 mil" },
];

export const GAF_ATTACHMENT_METHODS = [
  { value: "fully-adhered", label: "Fully Adhered (SBA 1121)" },
  { value: "mechanically-attached", label: "Mechanically Attached" },
];

// ---- PRODUCT CATALOG ----

export const GAF_TPO_PRODUCTS: Record<string, TPOProduct> = {
  // Membranes — GAF EverGuard TPO
  "membrane-45mil": {
    id: "membrane-45mil",
    name: "EverGuard TPO 45 mil Membrane",
    category: "Membrane",
    unit: "Roll (10' x 100')",
    coveragePerUnit: 1000,
    coverageUnit: "sq ft",
    defaultPrice: 680,
    description: "GAF EverGuard 45 mil reinforced TPO membrane, White",
  },
  "membrane-60mil": {
    id: "membrane-60mil",
    name: "EverGuard TPO 60 mil Membrane",
    category: "Membrane",
    unit: "Roll (10' x 100')",
    coveragePerUnit: 1000,
    coverageUnit: "sq ft",
    defaultPrice: 972,
    description: "GAF EverGuard 60 mil reinforced TPO membrane, White",
  },
  "membrane-80mil": {
    id: "membrane-80mil",
    name: "EverGuard TPO 80 mil Membrane",
    category: "Membrane",
    unit: "Roll (10' x 100')",
    coveragePerUnit: 1000,
    coverageUnit: "sq ft",
    defaultPrice: 1515,
    description: "GAF EverGuard 80 mil reinforced TPO membrane, White",
  },

  // Flashing membrane — GAF EverGuard
  "flash-membrane-24": {
    id: "flash-membrane-24",
    name: 'EverGuard TPO Detailing Membrane (24" x 50\')',
    category: "Flashing",
    unit: "Roll (24\" x 50')",
    coveragePerUnit: 50,
    coverageUnit: "lin ft",
    defaultPrice: 350,
    description: "GAF EverGuard 55 mil non-reinforced TPO for base/wall flashing details",
  },
  "flash-membrane-12": {
    id: "flash-membrane-12",
    name: 'EverGuard TPO Flashing Strip (8" x 100\')',
    category: "Flashing",
    unit: "Roll (8\" x 100')",
    coveragePerUnit: 100,
    coverageUnit: "lin ft",
    defaultPrice: 288,
    description: "GAF EverGuard TPO reinforced flashing strip for wall termination",
  },

  // Insulation — same boards, GAF-branded pricing
  "insulation-1.0": {
    id: "insulation-1.0",
    name: '1.0" Polyiso Insulation (R-5.7)',
    category: "Insulation",
    unit: "Board (4' x 8')",
    coveragePerUnit: 32,
    coverageUnit: "sq ft",
    defaultPrice: 32,
    description: "Polyiso rigid roof insulation, 20 PSI",
  },
  "insulation-1.5": {
    id: "insulation-1.5",
    name: '1.5" Polyiso Insulation (R-8.6)',
    category: "Insulation",
    unit: "Board (4' x 8')",
    coveragePerUnit: 32,
    coverageUnit: "sq ft",
    defaultPrice: 42,
    description: "Polyiso rigid roof insulation, 20 PSI",
  },
  "insulation-1.6": {
    id: "insulation-1.6",
    name: '1.6" Polyiso Insulation (R-9.1)',
    category: "Insulation",
    unit: "Board (4' x 8')",
    coveragePerUnit: 32,
    coverageUnit: "sq ft",
    defaultPrice: 44,
    description: "Polyiso rigid roof insulation, 20 PSI",
  },
  "insulation-2.0": {
    id: "insulation-2.0",
    name: '2.0" Polyiso Insulation (R-11.4)',
    category: "Insulation",
    unit: "Board (4' x 8')",
    coveragePerUnit: 32,
    coverageUnit: "sq ft",
    defaultPrice: 52,
    description: "Polyiso rigid roof insulation, 20 PSI",
  },
  "insulation-2.2": {
    id: "insulation-2.2",
    name: '2.2" Polyiso Insulation (R-12.5)',
    category: "Insulation",
    unit: "Board (4' x 8')",
    coveragePerUnit: 32,
    coverageUnit: "sq ft",
    defaultPrice: 56,
    description: "Polyiso rigid roof insulation, 20 PSI",
  },
  "insulation-2.5": {
    id: "insulation-2.5",
    name: '2.5" Polyiso Insulation (R-14.3)',
    category: "Insulation",
    unit: "Board (4' x 8')",
    coveragePerUnit: 32,
    coverageUnit: "sq ft",
    defaultPrice: 62,
    description: "Polyiso rigid roof insulation, 20 PSI",
  },
  "insulation-3.0": {
    id: "insulation-3.0",
    name: '3.0" Polyiso Insulation (R-17.1)',
    category: "Insulation",
    unit: "Board (4' x 8')",
    coveragePerUnit: 32,
    coverageUnit: "sq ft",
    defaultPrice: 72,
    description: "Polyiso rigid roof insulation, 20 PSI",
  },
  "insulation-3.1": {
    id: "insulation-3.1",
    name: '3.1" Polyiso Insulation (R-17.7)',
    category: "Insulation",
    unit: "Board (4' x 8')",
    coveragePerUnit: 32,
    coverageUnit: "sq ft",
    defaultPrice: 74,
    description: "Polyiso rigid roof insulation, 20 PSI",
  },
  "insulation-3.3": {
    id: "insulation-3.3",
    name: '3.3" Polyiso Insulation (R-18.8)',
    category: "Insulation",
    unit: "Board (4' x 8')",
    coveragePerUnit: 32,
    coverageUnit: "sq ft",
    defaultPrice: 78,
    description: "Polyiso rigid roof insulation, 20 PSI",
  },
  "insulation-3.5": {
    id: "insulation-3.5",
    name: '3.5" Polyiso Insulation (R-20.0)',
    category: "Insulation",
    unit: "Board (4' x 8')",
    coveragePerUnit: 32,
    coverageUnit: "sq ft",
    defaultPrice: 82,
    description: "Polyiso rigid roof insulation, 20 PSI",
  },
  "insulation-4.0": {
    id: "insulation-4.0",
    name: '4.0" Polyiso Insulation (R-22.8)',
    category: "Insulation",
    unit: "Board (4' x 8')",
    coveragePerUnit: 32,
    coverageUnit: "sq ft",
    defaultPrice: 92,
    description: "Polyiso rigid roof insulation, 20 PSI",
  },
  "insulation-4.3": {
    id: "insulation-4.3",
    name: '4.3" Polyiso Insulation (R-24.5)',
    category: "Insulation",
    unit: "Board (4' x 8')",
    coveragePerUnit: 32,
    coverageUnit: "sq ft",
    defaultPrice: 98,
    description: "Polyiso rigid roof insulation, 20 PSI",
  },
  "insulation-4.5": {
    id: "insulation-4.5",
    name: '4.5" Polyiso Insulation (R-25.7)',
    category: "Insulation",
    unit: "Board (4' x 8')",
    coveragePerUnit: 32,
    coverageUnit: "sq ft",
    defaultPrice: 102,
    description: "Polyiso rigid roof insulation, 20 PSI",
  },
  "insulation-5.0": {
    id: "insulation-5.0",
    name: '5.0" Polyiso Insulation (R-28.5)',
    category: "Insulation",
    unit: "Board (4' x 8')",
    coveragePerUnit: 32,
    coverageUnit: "sq ft",
    defaultPrice: 112,
    description: "Polyiso rigid roof insulation, 20 PSI",
  },
  "insulation-5.5": {
    id: "insulation-5.5",
    name: '5.5" Polyiso Insulation (R-31.4)',
    category: "Insulation",
    unit: "Board (4' x 8')",
    coveragePerUnit: 32,
    coverageUnit: "sq ft",
    defaultPrice: 122,
    description: "Polyiso rigid roof insulation, 20 PSI",
  },
  "insulation-6.0": {
    id: "insulation-6.0",
    name: '6.0" Polyiso Insulation (R-34.2)',
    category: "Insulation",
    unit: "Board (4' x 8')",
    coveragePerUnit: 32,
    coverageUnit: "sq ft",
    defaultPrice: 132,
    description: "Polyiso rigid roof insulation, 20 PSI",
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
  "cover-securock": {
    id: "cover-securock",
    name: 'USG Securock 1/2" Roof Board',
    category: "Cover Board",
    unit: "Board (4' x 8')",
    coveragePerUnit: 32,
    coverageUnit: "sq ft",
    defaultPrice: 36,
    description: "USG Securock gypsum-fiber roof board",
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

  // Vapor Barriers — GAF
  "vb-gaf-sa": {
    id: "vb-gaf-sa",
    name: "GAF EverGuard VaporGuard SA",
    category: "Vapor Barrier",
    unit: "Roll (36\" x 100')",
    coveragePerUnit: 300,
    coverageUnit: "sq ft",
    defaultPrice: 310,
    description: "GAF self-adhering air & vapor barrier sheet",
  },
  "vb-gaf-spray": {
    id: "vb-gaf-spray",
    name: "GAF Spray Vapor Barrier",
    category: "Vapor Barrier",
    unit: "5 Gallon Pail",
    coveragePerUnit: 500,
    coverageUnit: "sq ft",
    defaultPrice: 260,
    description: "GAF spray-applied vapor barrier coating",
  },
  "vb-bitec": {
    id: "vb-bitec",
    name: "Bitec Vapor-Stop SA",
    category: "Vapor Barrier",
    unit: "Roll (39\" x 64')",
    coveragePerUnit: 208,
    coverageUnit: "sq ft",
    defaultPrice: 195,
    description: "Bitec Vapor-Stop self-adhering vapor barrier membrane",
  },

  // Adhesives — GAF
  "adhesive-bonding": {
    id: "adhesive-bonding",
    name: "EverGuard SBA 1121 Bonding Adhesive",
    category: "Adhesive",
    unit: "5 Gallon Pail",
    coveragePerUnit: 300,
    coverageUnit: "sq ft",
    defaultPrice: 179,
    description: "GAF solvent-based contact adhesive for TPO membrane, 50-70 sq ft/gal",
  },
  "adhesive-insulation": {
    id: "adhesive-insulation",
    name: "GAF LRF Adhesive XF (Canister Kit)",
    category: "Adhesive",
    unit: "Canister Kit (Part A + B)",
    coveragePerUnit: 2400,
    coverageUnit: "sq ft",
    defaultPrice: 1140,
    description: "GAF two-component low-rise foam adhesive for insulation, ~24 squares per kit",
  },
  "adhesive-primer": {
    id: "adhesive-primer",
    name: "EverGuard TPO Primer",
    category: "Adhesive",
    unit: "1 Gallon Can",
    coveragePerUnit: 225,
    coverageUnit: "sq ft",
    defaultPrice: 65,
    description: "GAF TPO primer for non-porous substrates, 200-250 sq ft/gal",
  },

  // Fasteners — Screws (various lengths)
  "fastener-screws-2in": {
    id: "fastener-screws-2in",
    name: '#12 x 2" HD Roofing Screws',
    category: "Fasteners & Plates",
    unit: "Box (1,000)",
    coveragePerUnit: 1000,
    coverageUnit: "pieces",
    defaultPrice: 67,
    description: "SFS Dekfast #12 roofing screws — for assemblies up to 1\" insulation",
  },
  "fastener-screws-3in": {
    id: "fastener-screws-3in",
    name: '#14 x 3" HD Roofing Screws',
    category: "Fasteners & Plates",
    unit: "Box (1,000)",
    coveragePerUnit: 1000,
    coverageUnit: "pieces",
    defaultPrice: 78,
    description: "SFS Dekfast #14 roofing screws — for assemblies 1\"–2\" insulation",
  },
  "fastener-screws-4in": {
    id: "fastener-screws-4in",
    name: '#14 x 4" HD Roofing Screws',
    category: "Fasteners & Plates",
    unit: "Box (1,000)",
    coveragePerUnit: 1000,
    coverageUnit: "pieces",
    defaultPrice: 95,
    description: "SFS Dekfast #14 roofing screws — for assemblies 2\"–3\" insulation",
  },
  "fastener-screws-5in": {
    id: "fastener-screws-5in",
    name: '#14 x 5" HD Roofing Screws',
    category: "Fasteners & Plates",
    unit: "Box (1,000)",
    coveragePerUnit: 1000,
    coverageUnit: "pieces",
    defaultPrice: 110,
    description: "SFS Dekfast #14 roofing screws — for assemblies 3\"–4\" insulation",
  },
  "fastener-screws-6in": {
    id: "fastener-screws-6in",
    name: '#14 x 6" HD Roofing Screws',
    category: "Fasteners & Plates",
    unit: "Box (1,000)",
    coveragePerUnit: 1000,
    coverageUnit: "pieces",
    defaultPrice: 125,
    description: "SFS Dekfast #14 roofing screws — for assemblies 4\"–5\" insulation",
  },
  "fastener-screws-7in": {
    id: "fastener-screws-7in",
    name: '#14 x 7" HD Roofing Screws',
    category: "Fasteners & Plates",
    unit: "Box (1,000)",
    coveragePerUnit: 1000,
    coverageUnit: "pieces",
    defaultPrice: 140,
    description: "SFS Dekfast #14 roofing screws — for assemblies 5\"–6\" insulation",
  },
  "fastener-screws-8in": {
    id: "fastener-screws-8in",
    name: '#14 x 8" HD Roofing Screws',
    category: "Fasteners & Plates",
    unit: "Box (1,000)",
    coveragePerUnit: 1000,
    coverageUnit: "pieces",
    defaultPrice: 158,
    description: "SFS Dekfast #14 roofing screws — for assemblies 6\"+ insulation",
  },
  "fastener-screws-membrane-2in": {
    id: "fastener-screws-membrane-2in",
    name: '#15 x 2" Membrane Attachment Screws',
    category: "Fasteners & Plates",
    unit: "Box (1,000)",
    coveragePerUnit: 1000,
    coverageUnit: "pieces",
    defaultPrice: 72,
    description: "Coarse-thread screws for mechanically attaching TPO membrane in seam rows",
  },

  // Plates
  "fastener-plates-3in": {
    id: "fastener-plates-3in",
    name: '3" Round Insulation Stress Plates',
    category: "Fasteners & Plates",
    unit: "Box (1,000)",
    coveragePerUnit: 1000,
    coverageUnit: "pieces",
    defaultPrice: 232,
    description: "Galvalume coated steel stress plates for insulation attachment",
  },
  "fastener-plates-barbed": {
    id: "fastener-plates-barbed",
    name: '2" Barbed Seam Plates',
    category: "Fasteners & Plates",
    unit: "Box (1,000)",
    coveragePerUnit: 1000,
    coverageUnit: "pieces",
    defaultPrice: 198,
    description: "Barbed stress plates for mechanically attached membrane seam rows",
  },
  "fastener-plates-perimeter": {
    id: "fastener-plates-perimeter",
    name: '3" Heavy-Duty Perimeter Plates',
    category: "Fasteners & Plates",
    unit: "Box (500)",
    coveragePerUnit: 500,
    coverageUnit: "pieces",
    defaultPrice: 165,
    description: "Heavy-duty galvalume stress plates for high wind perimeter/corner zones",
  },

  // Accessories — GAF
  "acc-coverstrip": {
    id: "acc-coverstrip",
    name: 'EverGuard TPO Cover Tape PS (6")',
    category: "Accessories",
    unit: "Roll (100')",
    coveragePerUnit: 100,
    coverageUnit: "lin ft",
    defaultPrice: 379,
    description: "GAF self-adhering TPO 6\" cover tape with butyl adhesive backing",
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
    name: "GAF Ultra Clear Thermoplastic Sealant",
    category: "Accessories",
    unit: "Tube (10 oz)",
    coveragePerUnit: 25,
    coverageUnit: "lin ft",
    defaultPrice: 13,
    description: "GAF sealant for termination bar and detail sealing",
  },
  "acc-corners": {
    id: "acc-corners",
    name: "EverGuard TPO Universal Corners",
    category: "Accessories",
    unit: "Each",
    coveragePerUnit: 1,
    coverageUnit: "each",
    defaultPrice: 14,
    description: "GAF pre-formed TPO corners for inside/outside corner details",
  },
  "acc-pipe-boot": {
    id: "acc-pipe-boot",
    name: "EverGuard TPO Pipe Boot",
    category: "Accessories",
    unit: "Each",
    coveragePerUnit: 1,
    coverageUnit: "each",
    defaultPrice: 38,
    description: "GAF pre-formed TPO pipe boot for roof penetrations",
  },
};

// ---- CALCULATION ENGINE ----

// Fastener zone constants (same as Carlisle — FM/UL standard)
const INSULATION_FASTENERS_PER_BOARD_FIELD = 4;
const INSULATION_FASTENERS_PER_BOARD_PERIMETER = 8;
const INSULATION_FASTENERS_PER_BOARD_CORNER = 12;
const BOARD_AREA = 32;

const MEMBRANE_FASTENERS_PER_LF_FIELD = 1;
const MEMBRANE_FASTENERS_PER_LF_PERIMETER = 1.5;
const MEMBRANE_FASTENERS_PER_LF_CORNER = 2;

const MEMBRANE_WASTE_FACTOR = 1.05;
const BOARD_WASTE_FACTOR = 1.03;
const BASE_FLASHING_HEIGHT_INCHES = 18;

const COVER_BOARD_THICKNESS: Record<string, number> = {
  "densdeck-prime-half": 0.5,
  "densdeck-prime-quarter": 0.25,
  "securock-half": 0.5,
  "perlite": 0.5,
  "none": 0,
};

const DECK_PENETRATION = 1.0;

function selectScrewForAssembly(totalInsulationInches: number, coverBoardInches: number): string {
  const totalThickness = totalInsulationInches + coverBoardInches + DECK_PENETRATION;
  if (totalThickness <= 2) return "fastener-screws-2in";
  if (totalThickness <= 3) return "fastener-screws-3in";
  if (totalThickness <= 4) return "fastener-screws-4in";
  if (totalThickness <= 5) return "fastener-screws-5in";
  if (totalThickness <= 6) return "fastener-screws-6in";
  if (totalThickness <= 7) return "fastener-screws-7in";
  return "fastener-screws-8in";
}

export function calculateGAFTPOEstimate(
  assembly: AssemblyConfig,
  measurements: TPOMeasurements,
  customPrices: Record<string, number>
): TPOEstimate {
  const { roofArea, wallLinearFt, wallHeight, baseFlashingLF } = measurements;
  const lineItems: TPOLineItem[] = [];

  const getPrice = (productId: string): number => {
    return customPrices[productId] ?? GAF_TPO_PRODUCTS[productId]?.defaultPrice ?? 0;
  };

  const addItem = (productId: string, rawQty: number, note: string) => {
    const product = GAF_TPO_PRODUCTS[productId];
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

  const wallSqFt = wallLinearFt * wallHeight;
  const baseFlashingSqFt = baseFlashingLF * (BASE_FLASHING_HEIGHT_INCHES / 12);

  if (roofArea <= 0) {
    return { assembly, measurements, lineItems: [], totalMaterialCost: 0, wallSqFt, baseFlashingSqFt };
  }

  // ---- 1. VAPOR BARRIER ----
  if (assembly.vaporBarrier !== "none") {
    const vbProductMap: Record<string, string> = {
      "gaf-vb-sa": "vb-gaf-sa",
      "gaf-vb-spray": "vb-gaf-spray",
      "bitec-vs": "vb-bitec",
    };
    const vbId = vbProductMap[assembly.vaporBarrier];
    if (vbId) {
      const vbProduct = GAF_TPO_PRODUCTS[vbId];
      const rawQty = (roofArea * BOARD_WASTE_FACTOR) / vbProduct.coveragePerUnit;
      addItem(vbId, rawQty, `Covers ${roofArea.toLocaleString()} sq ft roof area`);
    }
  }

  // ---- 2. INSULATION (multi-layer) ----
  const { totalThickness: totalInsThickness, activeLayers } = assembly.insulationEnabled
    ? getInsulationSummary(assembly.insulationLayers)
    : { totalThickness: 0, activeLayers: [] as { thickness: string; rValue: number; label: string }[] };
  for (let i = 0; i < activeLayers.length; i++) {
    const layer = activeLayers[i];
    const insId = `insulation-${layer.thickness}`;
    if (GAF_TPO_PRODUCTS[insId]) {
      const insProduct = GAF_TPO_PRODUCTS[insId];
      const rawQty = (roofArea * BOARD_WASTE_FACTOR) / insProduct.coveragePerUnit;
      const layerLabel = activeLayers.length > 1 ? `Layer ${i + 1}: ` : "";
      addItem(insId, rawQty, `${layerLabel}${rawQty.toFixed(0)} boards for ${roofArea.toLocaleString()} sq ft`);
    }
  }

  // ---- 3. INSULATION ATTACHMENT ----
  const coverBoardThickness = COVER_BOARD_THICKNESS[assembly.coverBoard] ?? 0;

  if (totalInsThickness > 0) {
    if (assembly.attachmentMethod === "mechanically-attached") {
      const fieldArea = roofArea * FIELD_ZONE_RATIO;
      const perimeterArea = roofArea * PERIMETER_ZONE_RATIO;
      const cornerArea = roofArea * CORNER_ZONE_RATIO;

      const fieldBoards = fieldArea / BOARD_AREA;
      const perimeterBoards = perimeterArea / BOARD_AREA;
      const cornerBoards = cornerArea / BOARD_AREA;

      const fieldFasteners = Math.ceil(fieldBoards * INSULATION_FASTENERS_PER_BOARD_FIELD);
      const perimeterFasteners = Math.ceil(perimeterBoards * INSULATION_FASTENERS_PER_BOARD_PERIMETER);
      const cornerFasteners = Math.ceil(cornerBoards * INSULATION_FASTENERS_PER_BOARD_CORNER);
      const totalInsFasteners = fieldFasteners + perimeterFasteners + cornerFasteners;

      const screwId = selectScrewForAssembly(totalInsThickness, coverBoardThickness);
      const screwProduct = GAF_TPO_PRODUCTS[screwId];
      const screwBoxes = totalInsFasteners / screwProduct.coveragePerUnit;
      addItem(
        screwId,
        screwBoxes,
        `${totalInsFasteners.toLocaleString()} screws for ${totalInsThickness.toFixed(1)}" insulation + ${coverBoardThickness}" cover board (Field: ${fieldFasteners.toLocaleString()} / Perim: ${perimeterFasteners.toLocaleString()} / Corner: ${cornerFasteners.toLocaleString()})`
      );

      const plateBoxes = totalInsFasteners / GAF_TPO_PRODUCTS["fastener-plates-3in"].coveragePerUnit;
      addItem(
        "fastener-plates-3in",
        plateBoxes,
        `${totalInsFasteners.toLocaleString()} insulation stress plates (1:1 with screws)`
      );

      const perimCornerFasteners = perimeterFasteners + cornerFasteners;
      if (perimCornerFasteners > 0) {
        const hdPlateBoxes = perimCornerFasteners / GAF_TPO_PRODUCTS["fastener-plates-perimeter"].coveragePerUnit;
        addItem(
          "fastener-plates-perimeter",
          hdPlateBoxes,
          `${perimCornerFasteners.toLocaleString()} heavy-duty plates for perimeter & corner zones`
        );
      }
    } else {
      const numLayers = activeLayers.length;
      const rawQty = (roofArea * BOARD_WASTE_FACTOR * numLayers) / GAF_TPO_PRODUCTS["adhesive-insulation"].coveragePerUnit;
      addItem("adhesive-insulation", rawQty, `Adhering ${numLayers} insulation layer${numLayers > 1 ? "s" : ""} over ${roofArea.toLocaleString()} sq ft`);
    }
  }

  // ---- 4. COVER BOARD ----
  if (assembly.coverBoard !== "none") {
    const cbProductMap: Record<string, string> = {
      "densdeck-prime-half": "cover-densdeck-half",
      "densdeck-prime-quarter": "cover-densdeck-quarter",
      "securock-half": "cover-securock",
      "perlite": "cover-perlite",
    };
    const cbId = cbProductMap[assembly.coverBoard];
    if (cbId) {
      const cbProduct = GAF_TPO_PRODUCTS[cbId];
      const rawQty = (roofArea * BOARD_WASTE_FACTOR) / cbProduct.coveragePerUnit;
      addItem(cbId, rawQty, `${rawQty.toFixed(0)} boards for ${roofArea.toLocaleString()} sq ft`);
    }
  }

  // ---- 5. MEMBRANE ----
  const memId = `membrane-${assembly.membraneThickness}`;
  if (GAF_TPO_PRODUCTS[memId]) {
    const memProduct = GAF_TPO_PRODUCTS[memId];
    const rawQty = (roofArea * MEMBRANE_WASTE_FACTOR) / memProduct.coveragePerUnit;
    addItem(memId, rawQty, `Includes 5% for side-lap overlap waste`);
  }

  // ---- 6. MEMBRANE ATTACHMENT ----
  if (assembly.attachmentMethod === "fully-adhered") {
    const rawQty = (roofArea * MEMBRANE_WASTE_FACTOR) / GAF_TPO_PRODUCTS["adhesive-bonding"].coveragePerUnit;
    addItem("adhesive-bonding", rawQty, `Adhering membrane over ${roofArea.toLocaleString()} sq ft`);
  } else {
    const roofWidth = Math.sqrt(roofArea);
    const roofLength = roofArea / roofWidth;
    const seamRows = Math.ceil(roofWidth / 10);

    const fieldSeamLF = roofLength * seamRows * FIELD_ZONE_RATIO;
    const perimeterSeamLF = roofLength * seamRows * PERIMETER_ZONE_RATIO;
    const cornerSeamLF = roofLength * seamRows * CORNER_ZONE_RATIO;

    const fieldMemFasteners = Math.ceil(fieldSeamLF * MEMBRANE_FASTENERS_PER_LF_FIELD);
    const perimMemFasteners = Math.ceil(perimeterSeamLF * MEMBRANE_FASTENERS_PER_LF_PERIMETER);
    const cornerMemFasteners = Math.ceil(cornerSeamLF * MEMBRANE_FASTENERS_PER_LF_CORNER);
    const totalMemFasteners = fieldMemFasteners + perimMemFasteners + cornerMemFasteners;

    const memScrewBoxes = totalMemFasteners / GAF_TPO_PRODUCTS["fastener-screws-membrane-2in"].coveragePerUnit;
    addItem(
      "fastener-screws-membrane-2in",
      memScrewBoxes,
      `${totalMemFasteners.toLocaleString()} membrane screws in ${seamRows} seam rows (Field: ${fieldMemFasteners.toLocaleString()} / Perim: ${perimMemFasteners.toLocaleString()} / Corner: ${cornerMemFasteners.toLocaleString()})`
    );

    const barbedBoxes = totalMemFasteners / GAF_TPO_PRODUCTS["fastener-plates-barbed"].coveragePerUnit;
    addItem(
      "fastener-plates-barbed",
      barbedBoxes,
      `${totalMemFasteners.toLocaleString()} barbed seam plates (1:1 with membrane screws)`
    );
  }

  // ---- 7. BASE FLASHING ----
  if (baseFlashingLF > 0) {
    const flashProduct = GAF_TPO_PRODUCTS["flash-membrane-24"];
    const rawQty = baseFlashingLF / flashProduct.coveragePerUnit;
    addItem("flash-membrane-24", rawQty, `${baseFlashingLF.toLocaleString()} lin ft at 18" height`);

    const flashSqFt = baseFlashingSqFt;
    const primerGallons = flashSqFt / GAF_TPO_PRODUCTS["adhesive-primer"].coveragePerUnit;
    addItem("adhesive-primer", primerGallons, `Primer for ${flashSqFt.toFixed(0)} sq ft of base flashing area`);
  }

  // ---- 8. WALL FLASHING ----
  if (wallLinearFt > 0 && wallHeight > 0) {
    const wallFlashProduct = GAF_TPO_PRODUCTS["flash-membrane-12"];
    const rawQty = wallLinearFt / wallFlashProduct.coveragePerUnit;
    addItem("flash-membrane-12", rawQty, `${wallLinearFt.toLocaleString()} lin ft wall termination`);

    const termBarQty = wallLinearFt / GAF_TPO_PRODUCTS["acc-termbar"].coveragePerUnit;
    addItem("acc-termbar", termBarQty, `Securing membrane at wall termination`);

    const caulkQty = wallLinearFt / GAF_TPO_PRODUCTS["acc-caulk"].coveragePerUnit;
    addItem("acc-caulk", caulkQty, `Sealing termination bar at ${wallLinearFt.toLocaleString()} lin ft`);
  }

  // ---- 9. ACCESSORIES ----
  const totalFlashingLF = baseFlashingLF + wallLinearFt;
  if (totalFlashingLF > 0) {
    const csQty = totalFlashingLF / GAF_TPO_PRODUCTS["acc-coverstrip"].coveragePerUnit;
    addItem("acc-coverstrip", csQty, `Detail work for ${totalFlashingLF.toLocaleString()} lin ft of flashing`);
  }

  if (wallLinearFt > 0) {
    const estimatedCorners = Math.max(8, Math.ceil(wallLinearFt / 50));
    addItem("acc-corners", estimatedCorners, `Estimated ${estimatedCorners} inside/outside corners`);
  }

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

export function exportGAFTPOEstimateCSV(estimate: TPOEstimate): string {
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

  rows.push(["", "", "", "", "", "TOTAL", `$${estimate.totalMaterialCost.toFixed(2)}`, ""]);

  const insSummary = getInsulationSummary(estimate.assembly.insulationLayers);
  const insDesc = insSummary.activeLayers.length > 0
    ? insSummary.activeLayers.map((l, i) => `Layer ${i + 1}: ${l.label}`).join(" + ")
    : "None";

  const csvContent = [
    `GAF EverGuard TPO Estimate - ${new Date().toLocaleDateString()}`,
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
