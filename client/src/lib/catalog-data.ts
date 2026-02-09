/**
 * Roofing Systems Catalog — Data model for all system types and manufacturers
 *
 * Categories:
 * 1. Acrylic Coatings
 * 2. Silicone Coatings
 * 3. Polyurethane / SPF Coatings
 * 4. Asphaltic / Built-Up Roofing (BUR)
 * 5. Single-Ply Membrane (TPO / PVC / EPDM)
 * 6. Metal Roofing Systems
 */

export type SystemStatus = "available" | "coming_soon";

export interface RoofingSystem {
  id: string;
  name: string;
  manufacturer: string;
  manufacturerLogo?: string;
  category: string;
  categorySlug: string;
  substrate: string;
  description: string;
  features: string[];
  status: SystemStatus;
  route?: string; // only for available systems
  imageUrl: string;
}

export interface SystemCategory {
  slug: string;
  name: string;
  description: string;
  icon: string; // lucide icon name
  color: string; // tailwind color class
  imageUrl: string;
}

export const SYSTEM_CATEGORIES: SystemCategory[] = [
  {
    slug: "acrylic-coatings",
    name: "Acrylic Coatings",
    description:
      "Water-based reflective roof coatings for metal, modified bitumen, BUR, and single-ply substrates. High solar reflectivity and UV resistance.",
    icon: "Droplets",
    color: "bg-blue-500",
    imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80",
  },
  {
    slug: "silicone-coatings",
    name: "Silicone Coatings",
    description:
      "Moisture-cure silicone coatings ideal for ponding water areas. Superior weathering resistance and long-term flexibility.",
    icon: "Shield",
    color: "bg-teal-500",
    imageUrl: "https://images.unsplash.com/photo-1590496793929-36417d3117de?w=600&q=80",
  },
  {
    slug: "polyurethane-spf",
    name: "Polyurethane / SPF",
    description:
      "Spray polyurethane foam and polyurethane coating systems providing insulation and waterproofing in a single application.",
    icon: "Layers",
    color: "bg-purple-500",
    imageUrl: "https://images.unsplash.com/photo-1632759145351-1d592919f522?w=600&q=80",
  },
  {
    slug: "built-up-roofing",
    name: "Built-Up Roofing (BUR)",
    description:
      "Multi-ply asphaltic roofing systems with alternating layers of bitumen and reinforcing fabrics for proven long-term performance.",
    icon: "Brick",
    color: "bg-amber-600",
    imageUrl: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&q=80",
  },
  {
    slug: "single-ply-membrane",
    name: "Single-Ply Membrane",
    description:
      "TPO, PVC, and EPDM membrane systems for commercial flat roofs. Factory-manufactured sheets with heat-welded or adhesive seams.",
    icon: "SquareStack",
    color: "bg-slate-600",
    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80",
  },
  {
    slug: "metal-roofing",
    name: "Metal Roofing Systems",
    description:
      "Standing seam, corrugated, and architectural metal panel systems. Includes coatings and restoration for existing metal roofs.",
    icon: "Factory",
    color: "bg-zinc-600",
    imageUrl: "https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=600&q=80",
  },
];

export const ROOFING_SYSTEMS: RoofingSystem[] = [
  // ── Acrylic Coatings ──────────────────────────────────────
  {
    id: "karnak-metal-kynar-702-404-501",
    name: "Metal Kynar White Reflective System",
    manufacturer: "Karnak",
    category: "Acrylic Coatings",
    categorySlug: "acrylic-coatings",
    substrate: "Metal – Kynar® Finish",
    description:
      "White reflective coating system (702-404-501) for metal roofs with weathered Kynar® finish. Includes wash, primer, mastic, base coat, and finish coat.",
    features: [
      "High solar reflectivity",
      "Corrosion-proof base coat",
      "Elasto-Brite white finish",
      "Seam reinforcement with Resat-Mat",
    ],
    status: "available",
    route: "/estimator/karnak-metal-kynar",
    imageUrl: "https://images.unsplash.com/photo-1590496793929-36417d3117de?w=400&q=80",
  },
  {
    id: "karnak-acrylic-590",
    name: "590 Kool-Top Aluminum Coating",
    manufacturer: "Karnak",
    category: "Acrylic Coatings",
    categorySlug: "acrylic-coatings",
    substrate: "BUR / Modified Bitumen / Metal",
    description:
      "Fibered aluminum acrylic roof coating providing reflective protection for asphaltic and metal roofs.",
    features: [
      "Fibered aluminum finish",
      "UV reflective",
      "Asphaltic substrate compatible",
    ],
    status: "coming_soon",
    imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80",
  },
  {
    id: "gaf-unisil-553",
    name: "UniSil 553 Acrylic Coating",
    manufacturer: "GAF",
    category: "Acrylic Coatings",
    categorySlug: "acrylic-coatings",
    substrate: "Metal / SPF / BUR / Single-Ply",
    description:
      "Premium acrylic elastomeric roof coating with high reflectivity and elongation for multiple substrates.",
    features: [
      "High elongation",
      "ENERGY STAR rated",
      "Multi-substrate compatible",
    ],
    status: "coming_soon",
    imageUrl: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&q=80",
  },
  {
    id: "henry-887t",
    name: "Tropi-Cool 887T Silicone Coating",
    manufacturer: "Henry",
    category: "Acrylic Coatings",
    categorySlug: "acrylic-coatings",
    substrate: "Metal / BUR / Modified Bitumen / SPF",
    description:
      "High-solids silicone roof coating with excellent ponding water resistance and long-term weatherability.",
    features: [
      "Ponding water resistant",
      "High solids content",
      "Cool roof rated",
    ],
    status: "coming_soon",
    imageUrl: "https://images.unsplash.com/photo-1632759145351-1d592919f522?w=400&q=80",
  },

  // ── Silicone Coatings ──────────────────────────────────────
  {
    id: "gaf-unisil-8650",
    name: "UniSil 8650 High-Solids Silicone",
    manufacturer: "GAF",
    category: "Silicone Coatings",
    categorySlug: "silicone-coatings",
    substrate: "Metal / BUR / Modified Bitumen / SPF / Single-Ply",
    description:
      "High-solids silicone roof coating providing superior resistance to ponding water and UV degradation.",
    features: [
      "90%+ solids by weight",
      "Ponding water resistant",
      "Single-coat application",
    ],
    status: "coming_soon",
    imageUrl: "https://images.unsplash.com/photo-1590496793929-36417d3117de?w=400&q=80",
  },
  {
    id: "karnak-silicone-520",
    name: "520 Karna-Sil Silicone Coating",
    manufacturer: "Karnak",
    category: "Silicone Coatings",
    categorySlug: "silicone-coatings",
    substrate: "Metal / BUR / SPF",
    description:
      "High-solids moisture-cure silicone coating for commercial roof restoration with excellent ponding water resistance.",
    features: [
      "Moisture-cure technology",
      "Ponding water resistant",
      "High reflectivity",
    ],
    status: "coming_soon",
    imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80",
  },

  // ── Polyurethane / SPF ──────────────────────────────────────
  {
    id: "basf-spraytite",
    name: "Spraytite SPF System",
    manufacturer: "BASF",
    category: "Polyurethane / SPF",
    categorySlug: "polyurethane-spf",
    substrate: "Various – New & Re-Roof",
    description:
      "Closed-cell spray polyurethane foam roofing system providing seamless insulation and waterproofing.",
    features: [
      "Seamless application",
      "High R-value insulation",
      "Self-flashing",
    ],
    status: "coming_soon",
    imageUrl: "https://images.unsplash.com/photo-1632759145351-1d592919f522?w=400&q=80",
  },

  // ── Built-Up Roofing ──────────────────────────────────────
  {
    id: "johns-manville-bur",
    name: "DynaFlex BUR System",
    manufacturer: "Johns Manville",
    category: "Built-Up Roofing (BUR)",
    categorySlug: "built-up-roofing",
    substrate: "Concrete / Steel Deck",
    description:
      "Multi-ply built-up roofing system with fiberglass reinforcement and hot-applied asphalt for proven long-term performance.",
    features: [
      "Multi-ply redundancy",
      "Fire resistant",
      "Proven 30+ year track record",
    ],
    status: "coming_soon",
    imageUrl: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&q=80",
  },

  // ── Single-Ply Membrane ──────────────────────────────────────
  {
    id: "carlisle-tpo-sure-weld",
    name: "Sure-Weld TPO Membrane",
    manufacturer: "Carlisle SynTec",
    category: "Single-Ply Membrane",
    categorySlug: "single-ply-membrane",
    substrate: "Commercial Flat Roof",
    description:
      "Thermoplastic polyolefin single-ply roofing membrane with heat-welded seams for superior watertight performance.",
    features: [
      "Heat-welded seams",
      "ENERGY STAR rated",
      "Chemical resistant",
    ],
    status: "coming_soon",
    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80",
  },
  {
    id: "firestone-epdm",
    name: "RubberGard EPDM Membrane",
    manufacturer: "Firestone",
    category: "Single-Ply Membrane",
    categorySlug: "single-ply-membrane",
    substrate: "Commercial Flat Roof",
    description:
      "EPDM rubber roofing membrane with proven performance in all climates. Available in black and white.",
    features: [
      "50+ year track record",
      "Ozone resistant",
      "Low lifecycle cost",
    ],
    status: "coming_soon",
    imageUrl: "https://images.unsplash.com/photo-1590496793929-36417d3117de?w=400&q=80",
  },

  // ── Metal Roofing ──────────────────────────────────────
  {
    id: "mbci-standing-seam",
    name: "BattenLok HS Standing Seam",
    manufacturer: "MBCI",
    category: "Metal Roofing Systems",
    categorySlug: "metal-roofing",
    substrate: "Steel / Aluminum Panels",
    description:
      "Structural standing seam metal roof panel system with concealed fasteners and high wind uplift resistance.",
    features: [
      "Concealed fasteners",
      "High wind uplift rated",
      "Multiple gauge options",
    ],
    status: "coming_soon",
    imageUrl: "https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=400&q=80",
  },
];

/**
 * Get systems grouped by category
 */
export function getSystemsByCategory(): Record<string, RoofingSystem[]> {
  const grouped: Record<string, RoofingSystem[]> = {};
  for (const system of ROOFING_SYSTEMS) {
    if (!grouped[system.categorySlug]) {
      grouped[system.categorySlug] = [];
    }
    grouped[system.categorySlug].push(system);
  }
  return grouped;
}

/**
 * Get a single system by its ID
 */
export function getSystemById(id: string): RoofingSystem | undefined {
  return ROOFING_SYSTEMS.find((s) => s.id === id);
}
