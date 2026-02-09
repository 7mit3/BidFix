/**
 * TPO Labor & Equipment Data Model
 *
 * Provides configurable labor and equipment line items
 * for a complete TPO single-ply membrane roofing project estimate.
 * Shared between Carlisle TPO and GAF TPO estimators.
 */

export interface TPOLaborLineItem {
  id: string;
  label: string;
  description: string;
  rateType: "per_sqft" | "per_hour" | "per_lf" | "flat";
  defaultRate: number;
  defaultQuantity: number; // hours, 1 for flat/per_sqft/per_lf
  enabled: boolean;
}

export interface TPOEquipmentLineItem {
  id: string;
  label: string;
  description: string;
  rateType: "per_day" | "flat";
  defaultRate: number;
  defaultQuantity: number; // days or 1 for flat
  enabled: boolean;
}

export const DEFAULT_TPO_LABOR_ITEMS: TPOLaborLineItem[] = [
  {
    id: "tpo-labor-membrane",
    label: "Membrane Installation Crew",
    description: "TPO membrane installation, welding, and seaming crew (per sq. ft.)",
    rateType: "per_sqft",
    defaultRate: 1.25,
    defaultQuantity: 1,
    enabled: true,
  },
  {
    id: "tpo-labor-insulation",
    label: "Insulation Installation",
    description: "Insulation board and cover board installation crew (per sq. ft.)",
    rateType: "per_sqft",
    defaultRate: 0.45,
    defaultQuantity: 1,
    enabled: true,
  },
  {
    id: "tpo-labor-foreman",
    label: "Foreman / Supervisor",
    description: "On-site project supervision and quality control",
    rateType: "per_hour",
    defaultRate: 75.00,
    defaultQuantity: 24,
    enabled: true,
  },
  {
    id: "tpo-labor-tearoff",
    label: "Tear-Off / Deck Prep",
    description: "Existing roof removal and deck preparation (per sq. ft.)",
    rateType: "per_sqft",
    defaultRate: 0.65,
    defaultQuantity: 1,
    enabled: false,
  },
  {
    id: "tpo-labor-flashing",
    label: "Flashing & Detail Work",
    description: "Base flashing, wall flashing, and penetration detailing (per LF)",
    rateType: "per_lf",
    defaultRate: 12.00,
    defaultQuantity: 1,
    enabled: true,
  },
  {
    id: "tpo-labor-cleanup",
    label: "Cleanup & Disposal",
    description: "Job site cleanup and debris disposal",
    rateType: "flat",
    defaultRate: 1500.00,
    defaultQuantity: 1,
    enabled: false,
  },
];

export const DEFAULT_TPO_EQUIPMENT_ITEMS: TPOEquipmentLineItem[] = [
  {
    id: "tpo-equip-welder",
    label: "Hot-Air Welder",
    description: "Automatic hot-air welding machine for TPO membrane seams",
    rateType: "per_day",
    defaultRate: 200.00,
    defaultQuantity: 3,
    enabled: true,
  },
  {
    id: "tpo-equip-hand-welder",
    label: "Hand Welder / Detail Gun",
    description: "Handheld heat gun for flashing and detail welding",
    rateType: "per_day",
    defaultRate: 75.00,
    defaultQuantity: 3,
    enabled: true,
  },
  {
    id: "tpo-equip-screw-gun",
    label: "Fastening Equipment",
    description: "Screw guns and fastening tools for mechanical attachment",
    rateType: "per_day",
    defaultRate: 100.00,
    defaultQuantity: 3,
    enabled: true,
  },
  {
    id: "tpo-equip-crane",
    label: "Crane / Material Hoist",
    description: "Crane or hoist for lifting materials to roof level",
    rateType: "per_day",
    defaultRate: 800.00,
    defaultQuantity: 2,
    enabled: false,
  },
  {
    id: "tpo-equip-lift",
    label: "Boom Lift / Scaffolding",
    description: "Aerial access equipment for wall flashing and multi-story work",
    rateType: "per_day",
    defaultRate: 400.00,
    defaultQuantity: 3,
    enabled: false,
  },
  {
    id: "tpo-equip-safety",
    label: "Safety Equipment",
    description: "Harnesses, guardrails, warning lines, and fall protection",
    rateType: "flat",
    defaultRate: 750.00,
    defaultQuantity: 1,
    enabled: true,
  },
  {
    id: "tpo-equip-misc",
    label: "Misc. Tools & Supplies",
    description: "Rollers, probes, chalk lines, utility knives, caulk guns",
    rateType: "flat",
    defaultRate: 400.00,
    defaultQuantity: 1,
    enabled: true,
  },
];

export interface TPOLaborEquipmentState {
  laborItems: Array<TPOLaborLineItem & { rate: number; quantity: number }>;
  equipmentItems: Array<TPOEquipmentLineItem & { rate: number; quantity: number }>;
}

export interface TPOLaborEquipmentTotals {
  laborTotal: number;
  equipmentTotal: number;
  laborBreakdown: Array<{ label: string; cost: number; detail: string }>;
  equipmentBreakdown: Array<{ label: string; cost: number; detail: string }>;
}

/**
 * Calculate labor and equipment totals for a TPO project.
 *
 * @param state - Current labor/equipment configuration
 * @param roofArea - Total roof area in sq. ft.
 * @param flashingLF - Total flashing linear footage (for per_lf items)
 */
export function calculateTPOLaborEquipmentTotals(
  state: TPOLaborEquipmentState,
  roofArea: number,
  flashingLF: number = 0,
): TPOLaborEquipmentTotals {
  const laborBreakdown = state.laborItems
    .filter((item) => item.enabled)
    .map((item) => {
      let cost = 0;
      let detail = "";
      if (item.rateType === "per_sqft") {
        cost = item.rate * roofArea;
        detail = `${roofArea.toLocaleString()} sq. ft. × $${item.rate.toFixed(2)}/sq. ft.`;
      } else if (item.rateType === "per_hour") {
        cost = item.rate * item.quantity;
        detail = `${item.quantity} hrs × $${item.rate.toFixed(2)}/hr`;
      } else if (item.rateType === "per_lf") {
        cost = item.rate * flashingLF;
        detail = `${flashingLF.toLocaleString()} LF × $${item.rate.toFixed(2)}/LF`;
      } else {
        cost = item.rate * item.quantity;
        detail = `Flat rate`;
      }
      return { label: item.label, cost, detail };
    });

  const equipmentBreakdown = state.equipmentItems
    .filter((item) => item.enabled)
    .map((item) => {
      let cost = 0;
      let detail = "";
      if (item.rateType === "per_day") {
        cost = item.rate * item.quantity;
        detail = `${item.quantity} day${item.quantity !== 1 ? "s" : ""} × $${item.rate.toFixed(2)}/day`;
      } else {
        cost = item.rate * item.quantity;
        detail = `Flat rate`;
      }
      return { label: item.label, cost, detail };
    });

  return {
    laborTotal: laborBreakdown.reduce((sum, item) => sum + item.cost, 0),
    equipmentTotal: equipmentBreakdown.reduce((sum, item) => sum + item.cost, 0),
    laborBreakdown,
    equipmentBreakdown,
  };
}
