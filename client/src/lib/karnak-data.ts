/**
 * Karnak Metal Kynar 702-404-501 System
 * White Reflective Coating System - Product Data & Calculation Logic
 *
 * Coverage rates sourced from METAL-KYNAR 702-404-501-210915.1 spec sheet
 * Section 2.9 - Material List & Coverage Rates
 */

export interface KarnakProduct {
  id: string;
  name: string;
  shortName: string;
  description: string;
  step: string;
  unitSize: string;
  unitLabel: string;
  defaultPrice: number;
  coverageType: "area" | "horizontal_seam" | "vertical_seam" | "horizontal_seam_fabric";
  coverageRate: number; // units of coverage per purchase unit
  coverageUnit: string;
}

export const KARNAK_PRODUCTS: KarnakProduct[] = [
  {
    id: "799",
    name: "799 Wash-N-Prep",
    shortName: "Wash-N-Prep",
    description: "Concentrated liquid TSP substitute for cleaning roof surfaces prior to applying coatings.",
    step: "Preparation",
    unitSize: "1 Quart",
    unitLabel: "quart",
    defaultPrice: 10.65,
    coverageType: "area",
    coverageRate: 1600, // 1 quart per 1,600 sq.ft.
    coverageUnit: "sq. ft. per quart",
  },
  {
    id: "702",
    name: "702 K-Prep",
    shortName: "K-Prep Primer",
    description: "Acrylic elastomeric primer specifically designed for improving adhesion to weathered Kynar® coated metal roofing.",
    step: "Primer",
    unitSize: "5 Gallon Pail",
    unitLabel: "pail",
    defaultPrice: 175.00,
    coverageType: "area",
    coverageRate: 1000, // 0.5 gal per 100 sq.ft. → 5 gal covers 1,000 sq.ft.
    coverageUnit: "sq. ft. per 5-gal pail",
  },
  {
    id: "505ms-h",
    name: "505MS Karna-Flex WB",
    shortName: "Karna-Flex (Horiz.)",
    description: "Acrylic elastomeric mastic for sealing horizontal seams, penetrations, and cracks — applied with 6\" Resat-Mat reinforcement.",
    step: "Horizontal Seam Sealing",
    unitSize: "5 Gallon Pail",
    unitLabel: "pail",
    defaultPrice: 175.00,
    coverageType: "horizontal_seam",
    coverageRate: 100, // 20 LF/gal × 5 gal = 100 LF per pail
    coverageUnit: "lin. ft. per 5-gal pail",
  },
  {
    id: "505ms-v",
    name: "505MS Karna-Flex WB",
    shortName: "Karna-Flex (Vert.)",
    description: "Acrylic elastomeric mastic for sealing vertical seams — applied as a 2\" wide bead along the seam.",
    step: "Vertical Seam Sealing",
    unitSize: "5 Gallon Pail",
    unitLabel: "pail",
    defaultPrice: 175.00,
    coverageType: "vertical_seam",
    coverageRate: 800, // 160 LF/gal × 5 gal = 800 LF per pail
    coverageUnit: "lin. ft. per 5-gal pail",
  },
  {
    id: "5540",
    name: "5540 Resat-Mat",
    shortName: "Resat-Mat Fabric",
    description: "Spunlaced polyester fabric (6\" wide) for reinforcing mastics over horizontal seams, penetrations, and rough surfaces.",
    step: "Horizontal Seam Sealing",
    unitSize: "6\" × 300' Roll",
    unitLabel: "roll",
    defaultPrice: 65.00,
    coverageType: "horizontal_seam_fabric",
    coverageRate: 300, // 300 lineal feet per roll
    coverageUnit: "lin. ft. per roll",
  },
  {
    id: "404",
    name: "404 Corrosion Proof Base Coat",
    shortName: "Base Coat",
    description: "Self-priming, modified acrylic base coat for metal surfaces to prevent development of new rust.",
    step: "Base Coat",
    unitSize: "5 Gallon Pail",
    unitLabel: "pail",
    defaultPrice: 186.00,
    coverageType: "area",
    coverageRate: 333, // 1.5 gal per 100 sq.ft. → 5 gal covers ~333 sq.ft.
    coverageUnit: "sq. ft. per 5-gal pail",
  },
  {
    id: "501",
    name: "501 Elasto-Brite White",
    shortName: "Finish Coat",
    description: "Highly reflective, elastomeric roof coating exhibiting outstanding color stability, flexibility, mildew resistance, and weatherability.",
    step: "Finish Coat",
    unitSize: "5 Gallon Pail",
    unitLabel: "pail",
    defaultPrice: 186.00,
    coverageType: "area",
    coverageRate: 333, // 1.5 gal per 100 sq.ft. → 5 gal covers ~333 sq.ft.
    coverageUnit: "sq. ft. per 5-gal pail",
  },
];

export interface EstimateInput {
  squareFootage: number;
  verticalSeamsLF: number;
  horizontalSeamsLF: number;
}

export interface MaterialLineItem {
  product: KarnakProduct;
  quantityNeeded: number; // exact fractional quantity
  quantityToOrder: number; // rounded up to whole units
  unitPrice: number;
  totalCost: number;
}

export interface EstimateResult {
  lineItems: MaterialLineItem[];
  totalMaterialCost: number;
  inputs: EstimateInput;
}

export function calculateEstimate(
  inputs: EstimateInput,
  customPrices: Record<string, number>
): EstimateResult {
  const { squareFootage, verticalSeamsLF, horizontalSeamsLF } = inputs;

  const lineItems: MaterialLineItem[] = KARNAK_PRODUCTS.map((product) => {
    const unitPrice = customPrices[product.id] ?? product.defaultPrice;
    let quantityNeeded = 0;

    switch (product.coverageType) {
      case "area":
        quantityNeeded = squareFootage / product.coverageRate;
        break;
      case "horizontal_seam":
        quantityNeeded = horizontalSeamsLF / product.coverageRate;
        break;
      case "vertical_seam":
        quantityNeeded = verticalSeamsLF / product.coverageRate;
        break;
      case "horizontal_seam_fabric":
        quantityNeeded = horizontalSeamsLF / product.coverageRate;
        break;
    }

    const quantityToOrder = Math.ceil(quantityNeeded);
    const totalCost = quantityToOrder * unitPrice;

    return {
      product,
      quantityNeeded,
      quantityToOrder,
      unitPrice,
      totalCost,
    };
  });

  const totalMaterialCost = lineItems.reduce(
    (sum, item) => sum + item.totalCost,
    0
  );

  return {
    lineItems,
    totalMaterialCost,
    inputs,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number, decimals = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}
