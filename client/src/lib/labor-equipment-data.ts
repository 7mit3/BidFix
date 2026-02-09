/**
 * Labor & Equipment Data Model
 *
 * Provides configurable labor and equipment line items
 * for a complete Karnak roof coating project estimate.
 */

export interface LaborLineItem {
  id: string;
  label: string;
  description: string;
  rateType: "per_sqft" | "per_hour" | "flat";
  defaultRate: number;
  defaultQuantity: number; // hours or 1 for flat/per_sqft
  enabled: boolean;
}

export interface EquipmentLineItem {
  id: string;
  label: string;
  description: string;
  rateType: "per_day" | "flat";
  defaultRate: number;
  defaultQuantity: number; // days or 1 for flat
  enabled: boolean;
}

export const DEFAULT_LABOR_ITEMS: LaborLineItem[] = [
  {
    id: "labor-crew",
    label: "Crew Labor",
    description: "Roof coating application crew (per sq. ft. rate)",
    rateType: "per_sqft",
    defaultRate: 0.75,
    defaultQuantity: 1,
    enabled: true,
  },
  {
    id: "labor-foreman",
    label: "Foreman / Supervisor",
    description: "On-site project supervision",
    rateType: "per_hour",
    defaultRate: 65.00,
    defaultQuantity: 16,
    enabled: true,
  },
  {
    id: "labor-prep",
    label: "Surface Prep Labor",
    description: "Power washing, cleaning, and surface preparation crew",
    rateType: "per_sqft",
    defaultRate: 0.15,
    defaultQuantity: 1,
    enabled: true,
  },
  {
    id: "labor-seam",
    label: "Seam Treatment Labor",
    description: "Mastic application and fabric reinforcement crew",
    rateType: "per_hour",
    defaultRate: 55.00,
    defaultQuantity: 8,
    enabled: false,
  },
];

export const DEFAULT_EQUIPMENT_ITEMS: EquipmentLineItem[] = [
  {
    id: "equip-sprayer",
    label: "Airless Sprayer",
    description: "Airless spray rig for coating application",
    rateType: "per_day",
    defaultRate: 250.00,
    defaultQuantity: 3,
    enabled: true,
  },
  {
    id: "equip-washer",
    label: "Pressure Washer",
    description: "Pressure washer for surface preparation",
    rateType: "per_day",
    defaultRate: 150.00,
    defaultQuantity: 1,
    enabled: true,
  },
  {
    id: "equip-lift",
    label: "Boom Lift / Scaffolding",
    description: "Aerial access equipment for multi-story buildings",
    rateType: "per_day",
    defaultRate: 350.00,
    defaultQuantity: 3,
    enabled: false,
  },
  {
    id: "equip-safety",
    label: "Safety Equipment",
    description: "Harnesses, guardrails, and fall protection",
    rateType: "flat",
    defaultRate: 500.00,
    defaultQuantity: 1,
    enabled: true,
  },
  {
    id: "equip-misc",
    label: "Misc. Tools & Supplies",
    description: "Rollers, brushes, tape, caulk guns, mixing paddles",
    rateType: "flat",
    defaultRate: 300.00,
    defaultQuantity: 1,
    enabled: true,
  },
];

export interface LaborEquipmentState {
  laborItems: Array<LaborLineItem & { rate: number; quantity: number }>;
  equipmentItems: Array<EquipmentLineItem & { rate: number; quantity: number }>;
}

export interface LaborEquipmentTotals {
  laborTotal: number;
  equipmentTotal: number;
  laborBreakdown: Array<{ label: string; cost: number; detail: string }>;
  equipmentBreakdown: Array<{ label: string; cost: number; detail: string }>;
}

export function calculateLaborEquipmentTotals(
  state: LaborEquipmentState,
  squareFootage: number
): LaborEquipmentTotals {
  const laborBreakdown = state.laborItems
    .filter((item) => item.enabled)
    .map((item) => {
      let cost = 0;
      let detail = "";
      if (item.rateType === "per_sqft") {
        cost = item.rate * squareFootage;
        detail = `${squareFootage.toLocaleString()} sq. ft. × $${item.rate.toFixed(2)}/sq. ft.`;
      } else if (item.rateType === "per_hour") {
        cost = item.rate * item.quantity;
        detail = `${item.quantity} hrs × $${item.rate.toFixed(2)}/hr`;
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
