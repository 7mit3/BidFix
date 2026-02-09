/**
 * Aggregates all products from all estimator data models
 * into a single flat list for the pricing database.
 */

import { KARNAK_PRODUCTS, type KarnakProduct } from "./karnak-data";
import { TPO_PRODUCTS } from "./tpo-data";
import { GAF_TPO_PRODUCTS } from "./gaf-tpo-data";
import { METAL_TYPES, FLASHING_PROFILES, getFlashingPricePerLF } from "./sheet-metal-flashing-data";

export interface PricingProduct {
  productId: string;
  system: string;
  manufacturer: string;
  category: string;
  name: string;
  unit: string;
  unitPrice: number;
}

function mapKarnakProducts(): PricingProduct[] {
  return KARNAK_PRODUCTS.map((p) => ({
    productId: `karnak-${p.id}`,
    system: "karnak-metal-kynar",
    manufacturer: "Karnak",
    category: p.step,
    name: p.name,
    unit: p.unitLabel,
    unitPrice: p.defaultPrice,
  }));
}

function mapTPOProducts(
  products: Record<string, any>,
  system: string,
  manufacturer: string,
): PricingProduct[] {
  return Object.entries(products).map(([id, p]) => ({
    productId: `${system}-${id}`,
    system,
    manufacturer,
    category: p.category || "General",
    name: p.name,
    unit: p.unit || "each",
    unitPrice: p.defaultPrice || 0,
  }));
}

function mapSheetMetalProducts(): PricingProduct[] {
  const products: PricingProduct[] = [];
  for (const metal of METAL_TYPES) {
    for (const gauge of metal.gauges) {
      for (const profile of FLASHING_PROFILES) {
        const pricePerLF = getFlashingPricePerLF(metal.id, gauge.id, profile);
        products.push({
          productId: `sm-${metal.id}-${gauge.id}-${profile.id}`,
          system: "sheet-metal-flashing",
          manufacturer: "Sheet Metal",
          category: `${metal.name} (${gauge.label})`,
          name: `${profile.name} — ${metal.name} ${gauge.label}`,
          unit: "per LF",
          unitPrice: pricePerLF,
        });
      }
    }
  }
  return products;
}

export function getAllProducts(): PricingProduct[] {
  const all: PricingProduct[] = [];

  // Karnak products
  all.push(...mapKarnakProducts());

  // Carlisle TPO products
  all.push(...mapTPOProducts(TPO_PRODUCTS, "carlisle-tpo", "Carlisle SynTec"));

  // GAF TPO products
  all.push(...mapTPOProducts(GAF_TPO_PRODUCTS, "gaf-tpo", "GAF"));

  // Sheet Metal Flashing products
  all.push(...mapSheetMetalProducts());

  return all;
}

export function getProductsBySystem(system: string): PricingProduct[] {
  return getAllProducts().filter((p) => p.system === system);
}

export const SYSTEM_OPTIONS = [
  { value: "all", label: "All Systems" },
  { value: "karnak-metal-kynar", label: "Karnak Metal Kynar" },
  { value: "carlisle-tpo", label: "Carlisle TPO" },
  { value: "gaf-tpo", label: "GAF TPO" },
  { value: "sheet-metal-flashing", label: "Sheet Metal Flashing" },
];
