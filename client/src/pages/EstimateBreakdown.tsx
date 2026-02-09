/**
 * EstimateBreakdown — Full editable estimate breakdown page
 *
 * Shows all materials, penetrations, labor, and equipment in a single view.
 * Every line item can be toggled on/off and has editable quantities and prices.
 * Each section has adjustable Tax % and Profit % with toggles.
 * Grand total updates reactively.
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Package,
  Wrench,
  HardHat,
  Settings,
  Printer,
  FileSpreadsheet,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Percent,
} from "lucide-react";
import {
  loadBreakdownData,
  fmt,
  fmtNum,
  getRateLabel,
  getQuantityLabel,
  type EstimateBreakdownData,
  type BreakdownMaterialItem,
  type BreakdownPenetrationItem,
  type BreakdownLaborItem,
  type BreakdownEquipmentItem,
} from "@/lib/estimate-breakdown";

// ── Tax & Profit state per section ──────────────────────────

interface TaxProfitState {
  taxEnabled: boolean;
  taxPercent: number;
  profitEnabled: boolean;
  profitPercent: number;
}

const DEFAULT_TAX_PROFIT: TaxProfitState = {
  taxEnabled: false,
  taxPercent: 8.25,
  profitEnabled: false,
  profitPercent: 20,
};

// ── Section collapse state ──────────────────────────────────

interface SectionState {
  materials: boolean;
  penetrations: boolean;
  labor: boolean;
  equipment: boolean;
}

// ── Main component ──────────────────────────────────────────

export default function EstimateBreakdown() {
  const [, navigate] = useLocation();
  const [data, setData] = useState<EstimateBreakdownData | null>(null);

  // Editable copies of each section
  const [materials, setMaterials] = useState<BreakdownMaterialItem[]>([]);
  const [penetrations, setPenetrations] = useState<BreakdownPenetrationItem[]>([]);
  const [labor, setLabor] = useState<BreakdownLaborItem[]>([]);
  const [equipment, setEquipment] = useState<BreakdownEquipmentItem[]>([]);

  const [sections, setSections] = useState<SectionState>({
    materials: true,
    penetrations: true,
    labor: true,
    equipment: true,
  });

  const [showDisabled, setShowDisabled] = useState(true);

  // Tax & Profit per section
  const [materialsTaxProfit, setMaterialsTaxProfit] = useState<TaxProfitState>({ ...DEFAULT_TAX_PROFIT });
  const [penetrationsTaxProfit, setPenetrationsTaxProfit] = useState<TaxProfitState>({ ...DEFAULT_TAX_PROFIT });
  const [laborTaxProfit, setLaborTaxProfit] = useState<TaxProfitState>({ ...DEFAULT_TAX_PROFIT });
  const [equipmentTaxProfit, setEquipmentTaxProfit] = useState<TaxProfitState>({ ...DEFAULT_TAX_PROFIT });

  // Load data from sessionStorage on mount
  useEffect(() => {
    const loaded = loadBreakdownData();
    if (!loaded) {
      navigate("/");
      return;
    }
    setData(loaded);
    setMaterials(loaded.materials);
    setPenetrations(loaded.penetrations);
    setLabor(loaded.labor);
    setEquipment(loaded.equipment);
  }, [navigate]);

  // ── Material handlers ───────────────────────────────────

  const updateMaterial = useCallback(
    (id: string, field: "quantity" | "unitPrice" | "enabled", value: number | boolean) => {
      setMaterials((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const updated = { ...item, [field]: value };
          if (field === "quantity" || field === "unitPrice") {
            const qty = field === "quantity" ? (value as number) : item.quantity;
            const price = field === "unitPrice" ? (value as number) : item.unitPrice;
            updated.totalCost = qty * price;
          }
          return updated;
        })
      );
    },
    []
  );

  // ── Penetration handlers ────────────────────────────────

  const updatePenetration = useCallback(
    (id: string, field: "quantity" | "unitPrice" | "enabled", value: number | boolean) => {
      setPenetrations((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const updated = { ...item, [field]: value };
          if (field === "quantity" || field === "unitPrice") {
            const qty = field === "quantity" ? (value as number) : item.quantity;
            const price = field === "unitPrice" ? (value as number) : item.unitPrice;
            updated.totalCost = qty * price;
          }
          return updated;
        })
      );
    },
    []
  );

  // ── Labor handlers ──────────────────────────────────────

  const updateLabor = useCallback(
    (id: string, field: "rate" | "quantity" | "enabled", value: number | boolean) => {
      setLabor((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const updated = { ...item, [field]: value };
          if (field === "rate" || field === "quantity") {
            const rate = field === "rate" ? (value as number) : item.rate;
            const qty = field === "quantity" ? (value as number) : item.quantity;
            if (item.rateType === "per_sqft" || item.rateType === "per_lf") {
              if (item.rate > 0) {
                updated.computedCost = (rate / item.rate) * item.computedCost;
              } else {
                updated.computedCost = 0;
              }
              updated.rate = rate;
            } else {
              updated.computedCost = rate * qty;
            }
          }
          return updated;
        })
      );
    },
    []
  );

  // ── Equipment handlers ──────────────────────────────────

  const updateEquipment = useCallback(
    (id: string, field: "rate" | "quantity" | "enabled", value: number | boolean) => {
      setEquipment((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const updated = { ...item, [field]: value };
          if (field === "rate" || field === "quantity") {
            const rate = field === "rate" ? (value as number) : item.rate;
            const qty = field === "quantity" ? (value as number) : item.quantity;
            updated.computedCost = rate * qty;
          }
          return updated;
        })
      );
    },
    []
  );

  // ── Compute base totals (before tax/profit) ─────────────

  const materialBase = useMemo(
    () => materials.filter((m) => m.enabled).reduce((sum, m) => sum + m.totalCost, 0),
    [materials]
  );

  const penetrationBase = useMemo(
    () => penetrations.filter((p) => p.enabled).reduce((sum, p) => sum + p.totalCost, 0),
    [penetrations]
  );

  const laborBase = useMemo(
    () => labor.filter((l) => l.enabled).reduce((sum, l) => sum + l.computedCost, 0),
    [labor]
  );

  const equipmentBase = useMemo(
    () => equipment.filter((e) => e.enabled).reduce((sum, e) => sum + e.computedCost, 0),
    [equipment]
  );

  // ── Compute tax & profit amounts per section ────────────

  const computeTaxProfit = (base: number, tp: TaxProfitState) => {
    const taxAmount = tp.taxEnabled ? base * (tp.taxPercent / 100) : 0;
    const profitAmount = tp.profitEnabled ? base * (tp.profitPercent / 100) : 0;
    return { taxAmount, profitAmount, sectionTotal: base + taxAmount + profitAmount };
  };

  const matTP = useMemo(() => computeTaxProfit(materialBase, materialsTaxProfit), [materialBase, materialsTaxProfit]);
  const penTP = useMemo(() => computeTaxProfit(penetrationBase, penetrationsTaxProfit), [penetrationBase, penetrationsTaxProfit]);
  const labTP = useMemo(() => computeTaxProfit(laborBase, laborTaxProfit), [laborBase, laborTaxProfit]);
  const eqTP = useMemo(() => computeTaxProfit(equipmentBase, equipmentTaxProfit), [equipmentBase, equipmentTaxProfit]);

  const grandTotal = matTP.sectionTotal + penTP.sectionTotal + labTP.sectionTotal + eqTP.sectionTotal;

  // Total tax and profit across all sections
  const totalTax = matTP.taxAmount + penTP.taxAmount + labTP.taxAmount + eqTP.taxAmount;
  const totalProfit = matTP.profitAmount + penTP.profitAmount + labTP.profitAmount + eqTP.profitAmount;

  // ── Section toggle ──────────────────────────────────────

  const toggleSection = useCallback((section: keyof SectionState) => {
    setSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  // ── Excel Export ────────────────────────────────────────

  const exportExcel = useCallback(() => {
    if (!data) return;
    import("xlsx").then((XLSX) => {
      const wb = XLSX.utils.book_new();

      // Helper to add tax/profit rows to a sheet data array
      const addTaxProfitRows = (rows: any[], base: number, tp: TaxProfitState, totalLabel: string) => {
        const { taxAmount, profitAmount, sectionTotal } = computeTaxProfit(base, tp);
        rows.push({} as any);
        rows.push({ Item: "", Description: "", Unit: "", Quantity: "", "Unit Price": totalLabel + " (Base)", Total: base, Included: "" } as any);
        if (tp.taxEnabled) {
          rows.push({ Item: "", Description: "", Unit: "", Quantity: "", "Unit Price": `Tax (${tp.taxPercent}%)`, Total: taxAmount, Included: "Yes" } as any);
        }
        if (tp.profitEnabled) {
          rows.push({ Item: "", Description: "", Unit: "", Quantity: "", "Unit Price": `Profit (${tp.profitPercent}%)`, Total: profitAmount, Included: "Yes" } as any);
        }
        if (tp.taxEnabled || tp.profitEnabled) {
          rows.push({ Item: "", Description: "", Unit: "", Quantity: "", "Unit Price": totalLabel + " (w/ Tax & Profit)", Total: sectionTotal, Included: "" } as any);
        }
      };

      // ── Materials sheet ──────────────────────────────────
      const matRows = materials.map((m) => ({
        Category: m.category,
        Item: m.name,
        Description: m.description,
        Unit: m.unit,
        Quantity: m.quantity,
        "Unit Price": m.unitPrice,
        Total: m.totalCost,
        Included: m.enabled ? "Yes" : "No",
      }));
      // Remap for addTaxProfitRows compatibility
      const matSummary: any[] = [];
      matSummary.push({} as any);
      matSummary.push({ Category: "", Item: "", Description: "", Unit: "", Quantity: "", "Unit Price": "Materials (Base)", Total: materialBase, Included: "" } as any);
      if (materialsTaxProfit.taxEnabled) {
        matSummary.push({ Category: "", Item: "", Description: "", Unit: "", Quantity: "", "Unit Price": `Tax (${materialsTaxProfit.taxPercent}%)`, Total: matTP.taxAmount, Included: "Yes" } as any);
      }
      if (materialsTaxProfit.profitEnabled) {
        matSummary.push({ Category: "", Item: "", Description: "", Unit: "", Quantity: "", "Unit Price": `Profit (${materialsTaxProfit.profitPercent}%)`, Total: matTP.profitAmount, Included: "Yes" } as any);
      }
      if (materialsTaxProfit.taxEnabled || materialsTaxProfit.profitEnabled) {
        matSummary.push({ Category: "", Item: "", Description: "", Unit: "", Quantity: "", "Unit Price": "Materials Total", Total: matTP.sectionTotal, Included: "" } as any);
      } else {
        matSummary.push({ Category: "", Item: "", Description: "", Unit: "", Quantity: "", "Unit Price": "Materials Total", Total: materialBase, Included: "" } as any);
      }
      const matWs = XLSX.utils.json_to_sheet([...matRows, ...matSummary]);
      matWs["!cols"] = [
        { wch: 16 }, { wch: 40 }, { wch: 30 }, { wch: 18 },
        { wch: 10 }, { wch: 28 }, { wch: 14 }, { wch: 10 },
      ];
      XLSX.utils.book_append_sheet(wb, matWs, "Materials");

      // ── Penetrations sheet ──────────────────────────────
      if (penetrations.length > 0) {
        const penRows: any[] = penetrations.map((p) => ({
          Item: p.name, Description: p.description, Unit: p.unit,
          Quantity: p.quantity, "Unit Price": p.unitPrice, Total: p.totalCost,
          Included: p.enabled ? "Yes" : "No",
        }));
        penRows.push({} as any);
        penRows.push({ Item: "", Description: "", Unit: "", Quantity: "", "Unit Price": "Penetrations (Base)", Total: penetrationBase, Included: "" } as any);
        if (penetrationsTaxProfit.taxEnabled) {
          penRows.push({ Item: "", Description: "", Unit: "", Quantity: "", "Unit Price": `Tax (${penetrationsTaxProfit.taxPercent}%)`, Total: penTP.taxAmount, Included: "Yes" } as any);
        }
        if (penetrationsTaxProfit.profitEnabled) {
          penRows.push({ Item: "", Description: "", Unit: "", Quantity: "", "Unit Price": `Profit (${penetrationsTaxProfit.profitPercent}%)`, Total: penTP.profitAmount, Included: "Yes" } as any);
        }
        if (penetrationsTaxProfit.taxEnabled || penetrationsTaxProfit.profitEnabled) {
          penRows.push({ Item: "", Description: "", Unit: "", Quantity: "", "Unit Price": "Penetrations Total", Total: penTP.sectionTotal, Included: "" } as any);
        } else {
          penRows.push({ Item: "", Description: "", Unit: "", Quantity: "", "Unit Price": "Penetrations Total", Total: penetrationBase, Included: "" } as any);
        }
        const penWs = XLSX.utils.json_to_sheet(penRows);
        penWs["!cols"] = [{ wch: 30 }, { wch: 30 }, { wch: 12 }, { wch: 10 }, { wch: 28 }, { wch: 14 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(wb, penWs, "Penetrations");
      }

      // ── Labor sheet ─────────────────────────────────────
      if (labor.length > 0) {
        const labRows: any[] = labor.map((l) => ({
          Item: l.label, Description: l.description, "Rate Type": getRateLabel(l.rateType),
          Rate: l.rate, Quantity: l.rateType === "per_sqft" || l.rateType === "per_lf" ? "—" : l.quantity,
          Total: l.computedCost, Included: l.enabled ? "Yes" : "No",
        }));
        labRows.push({} as any);
        labRows.push({ Item: "", Description: "", "Rate Type": "", Rate: "", Quantity: "Labor (Base)", Total: laborBase, Included: "" } as any);
        if (laborTaxProfit.taxEnabled) {
          labRows.push({ Item: "", Description: "", "Rate Type": "", Rate: "", Quantity: `Tax (${laborTaxProfit.taxPercent}%)`, Total: labTP.taxAmount, Included: "Yes" } as any);
        }
        if (laborTaxProfit.profitEnabled) {
          labRows.push({ Item: "", Description: "", "Rate Type": "", Rate: "", Quantity: `Profit (${laborTaxProfit.profitPercent}%)`, Total: labTP.profitAmount, Included: "Yes" } as any);
        }
        if (laborTaxProfit.taxEnabled || laborTaxProfit.profitEnabled) {
          labRows.push({ Item: "", Description: "", "Rate Type": "", Rate: "", Quantity: "Labor Total", Total: labTP.sectionTotal, Included: "" } as any);
        } else {
          labRows.push({ Item: "", Description: "", "Rate Type": "", Rate: "", Quantity: "Labor Total", Total: laborBase, Included: "" } as any);
        }
        const labWs = XLSX.utils.json_to_sheet(labRows);
        labWs["!cols"] = [{ wch: 30 }, { wch: 30 }, { wch: 14 }, { wch: 12 }, { wch: 28 }, { wch: 14 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(wb, labWs, "Labor");
      }

      // ── Equipment sheet ─────────────────────────────────
      if (equipment.length > 0) {
        const eqRows: any[] = equipment.map((e) => ({
          Item: e.label, Description: e.description, "Rate Type": getRateLabel(e.rateType),
          Rate: e.rate, Quantity: e.rateType === "flat" ? "—" : e.quantity,
          Total: e.computedCost, Included: e.enabled ? "Yes" : "No",
        }));
        eqRows.push({} as any);
        eqRows.push({ Item: "", Description: "", "Rate Type": "", Rate: "", Quantity: "Equipment (Base)", Total: equipmentBase, Included: "" } as any);
        if (equipmentTaxProfit.taxEnabled) {
          eqRows.push({ Item: "", Description: "", "Rate Type": "", Rate: "", Quantity: `Tax (${equipmentTaxProfit.taxPercent}%)`, Total: eqTP.taxAmount, Included: "Yes" } as any);
        }
        if (equipmentTaxProfit.profitEnabled) {
          eqRows.push({ Item: "", Description: "", "Rate Type": "", Rate: "", Quantity: `Profit (${equipmentTaxProfit.profitPercent}%)`, Total: eqTP.profitAmount, Included: "Yes" } as any);
        }
        if (equipmentTaxProfit.taxEnabled || equipmentTaxProfit.profitEnabled) {
          eqRows.push({ Item: "", Description: "", "Rate Type": "", Rate: "", Quantity: "Equipment Total", Total: eqTP.sectionTotal, Included: "" } as any);
        } else {
          eqRows.push({ Item: "", Description: "", "Rate Type": "", Rate: "", Quantity: "Equipment Total", Total: equipmentBase, Included: "" } as any);
        }
        const eqWs = XLSX.utils.json_to_sheet(eqRows);
        eqWs["!cols"] = [{ wch: 30 }, { wch: 30 }, { wch: 14 }, { wch: 12 }, { wch: 28 }, { wch: 14 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(wb, eqWs, "Equipment");
      }

      // ── Summary sheet ───────────────────────────────────
      const summaryRows: any[] = [
        { Section: "Materials (Base)", Items: materials.filter((m) => m.enabled).length, Total: materialBase },
      ];
      if (materialsTaxProfit.taxEnabled) summaryRows.push({ Section: `  Tax (${materialsTaxProfit.taxPercent}%)`, Items: "", Total: matTP.taxAmount });
      if (materialsTaxProfit.profitEnabled) summaryRows.push({ Section: `  Profit (${materialsTaxProfit.profitPercent}%)`, Items: "", Total: matTP.profitAmount });
      if (materialsTaxProfit.taxEnabled || materialsTaxProfit.profitEnabled) summaryRows.push({ Section: "Materials Total", Items: "", Total: matTP.sectionTotal });

      if (penetrations.length > 0) {
        summaryRows.push({ Section: "Penetrations (Base)", Items: penetrations.filter((p) => p.enabled).length, Total: penetrationBase });
        if (penetrationsTaxProfit.taxEnabled) summaryRows.push({ Section: `  Tax (${penetrationsTaxProfit.taxPercent}%)`, Items: "", Total: penTP.taxAmount });
        if (penetrationsTaxProfit.profitEnabled) summaryRows.push({ Section: `  Profit (${penetrationsTaxProfit.profitPercent}%)`, Items: "", Total: penTP.profitAmount });
        if (penetrationsTaxProfit.taxEnabled || penetrationsTaxProfit.profitEnabled) summaryRows.push({ Section: "Penetrations Total", Items: "", Total: penTP.sectionTotal });
      }

      if (labor.length > 0) {
        summaryRows.push({ Section: "Labor (Base)", Items: labor.filter((l) => l.enabled).length, Total: laborBase });
        if (laborTaxProfit.taxEnabled) summaryRows.push({ Section: `  Tax (${laborTaxProfit.taxPercent}%)`, Items: "", Total: labTP.taxAmount });
        if (laborTaxProfit.profitEnabled) summaryRows.push({ Section: `  Profit (${laborTaxProfit.profitPercent}%)`, Items: "", Total: labTP.profitAmount });
        if (laborTaxProfit.taxEnabled || laborTaxProfit.profitEnabled) summaryRows.push({ Section: "Labor Total", Items: "", Total: labTP.sectionTotal });
      }

      if (equipment.length > 0) {
        summaryRows.push({ Section: "Equipment (Base)", Items: equipment.filter((e) => e.enabled).length, Total: equipmentBase });
        if (equipmentTaxProfit.taxEnabled) summaryRows.push({ Section: `  Tax (${equipmentTaxProfit.taxPercent}%)`, Items: "", Total: eqTP.taxAmount });
        if (equipmentTaxProfit.profitEnabled) summaryRows.push({ Section: `  Profit (${equipmentTaxProfit.profitPercent}%)`, Items: "", Total: eqTP.profitAmount });
        if (equipmentTaxProfit.taxEnabled || equipmentTaxProfit.profitEnabled) summaryRows.push({ Section: "Equipment Total", Items: "", Total: eqTP.sectionTotal });
      }

      summaryRows.push({} as any);
      if (totalTax > 0) summaryRows.push({ Section: "Total Tax", Items: "", Total: totalTax });
      if (totalProfit > 0) summaryRows.push({ Section: "Total Profit", Items: "", Total: totalProfit });
      summaryRows.push({ Section: "GRAND TOTAL", Items: "", Total: grandTotal });

      const summaryWs = XLSX.utils.json_to_sheet(summaryRows);
      summaryWs["!cols"] = [{ wch: 28 }, { wch: 10 }, { wch: 16 }];
      XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");
      const idx = wb.SheetNames.indexOf("Summary");
      if (idx > 0) {
        wb.SheetNames.splice(idx, 1);
        wb.SheetNames.unshift("Summary");
      }

      XLSX.writeFile(wb, `${data.systemSlug}-estimate-${Date.now()}.xlsx`);
    });
  }, [data, materials, penetrations, labor, equipment, materialBase, penetrationBase, laborBase, equipmentBase, materialsTaxProfit, penetrationsTaxProfit, laborTaxProfit, equipmentTaxProfit, matTP, penTP, labTP, eqTP, grandTotal, totalTax, totalProfit]);

  // ── Print ───────────────────────────────────────────────

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // ── Accent color classes ────────────────────────────────

  const accentMap: Record<string, { bg: string; text: string; border: string; light: string }> = {
    red: { bg: "bg-red-600", text: "text-red-600", border: "border-red-200", light: "bg-red-50" },
    blue: { bg: "bg-blue-600", text: "text-blue-600", border: "border-blue-200", light: "bg-blue-50" },
    emerald: { bg: "bg-emerald-600", text: "text-emerald-600", border: "border-emerald-200", light: "bg-emerald-50" },
  };

  const accent = accentMap[data?.accentColor ?? "red"] ?? accentMap.red;

  // ── Loading / no data ───────────────────────────────────

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-muted-foreground">Loading estimate data...</p>
      </div>
    );
  }

  // ── Group materials by category ─────────────────────────

  const materialsByCategory: Record<string, BreakdownMaterialItem[]> = {};
  materials.forEach((m) => {
    if (!showDisabled && !m.enabled) return;
    if (!materialsByCategory[m.category]) materialsByCategory[m.category] = [];
    materialsByCategory[m.category].push(m);
  });

  const filteredPenetrations = showDisabled ? penetrations : penetrations.filter((p) => p.enabled);
  const filteredLabor = showDisabled ? labor : labor.filter((l) => l.enabled);
  const filteredEquipment = showDisabled ? equipment : equipment.filter((e) => e.enabled);

  const enabledMaterialCount = materials.filter((m) => m.enabled).length;
  const enabledPenetrationCount = penetrations.filter((p) => p.enabled).length;
  const enabledLaborCount = labor.filter((l) => l.enabled).length;
  const enabledEquipmentCount = equipment.filter((e) => e.enabled).length;

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className={`${accent.bg} text-white`}>
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/estimator/${data.systemSlug}`)}
                className="text-white/80 hover:text-white hover:bg-white/10 print:hidden"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <p className="text-sm text-white/70 font-medium uppercase tracking-wider">
                  Full Estimate Breakdown
                </p>
                <h1 className="text-2xl font-bold">{data.systemName}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDisabled(!showDisabled)}
                className="text-white/80 hover:text-white hover:bg-white/10 text-xs"
              >
                {showDisabled ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                {showDisabled ? "Hide Disabled" : "Show All"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={exportExcel}
                className="text-white/80 hover:text-white hover:bg-white/10 text-xs"
              >
                <FileSpreadsheet className="w-4 h-4 mr-1" />
                Export Excel
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrint}
                className="text-white/80 hover:text-white hover:bg-white/10 text-xs"
              >
                <Printer className="w-4 h-4 mr-1" />
                Print
              </Button>
            </div>
          </div>

          {/* Measurements summary */}
          {Object.keys(data.measurements).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/80">
              {Object.entries(data.measurements).map(([key, value]) => (
                <span key={key}>
                  <span className="text-white/60">{key}:</span> {value}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Grand Total Sticky Bar ─────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm print:static print:shadow-none">
        <div className="container py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm flex-wrap">
              <div>
                <span className="text-muted-foreground">Materials</span>
                <span className="ml-2 font-semibold tabular-nums">{fmt(matTP.sectionTotal)}</span>
              </div>
              {penetrations.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Penetrations</span>
                  <span className="ml-2 font-semibold tabular-nums">{fmt(penTP.sectionTotal)}</span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Labor</span>
                <span className="ml-2 font-semibold tabular-nums">{fmt(labTP.sectionTotal)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Equipment</span>
                <span className="ml-2 font-semibold tabular-nums">{fmt(eqTP.sectionTotal)}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm text-muted-foreground mr-2">Grand Total</span>
              <span className={`text-xl font-bold ${accent.text} tabular-nums`}>
                {fmt(grandTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────── */}
      <div className="container py-6 space-y-6">
        {/* ── Materials Section ─────────────────────────────── */}
        <SectionCard
          title="Materials"
          icon={<Package className={`w-5 h-5 ${accent.text}`} />}
          count={enabledMaterialCount}
          total={materials.length}
          baseSubtotal={materialBase}
          sectionTotal={matTP.sectionTotal}
          taxProfit={materialsTaxProfit}
          onTaxProfitChange={setMaterialsTaxProfit}
          isOpen={sections.materials}
          onToggle={() => toggleSection("materials")}
          accent={accent}
        >
          {Object.entries(materialsByCategory).map(([category, items]) => (
            <div key={category} className="mb-4 last:mb-0">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                {category}
              </h4>
              <div className="space-y-1">
                {items.map((item) => (
                  <MaterialRow
                    key={item.id}
                    item={item}
                    onUpdate={updateMaterial}
                  />
                ))}
              </div>
            </div>
          ))}
          {Object.keys(materialsByCategory).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No material items to display
            </p>
          )}
        </SectionCard>

        {/* ── Penetrations Section ─────────────────────────── */}
        {penetrations.length > 0 && (
          <SectionCard
            title="Roof Penetrations"
            icon={<Wrench className={`w-5 h-5 ${accent.text}`} />}
            count={enabledPenetrationCount}
            total={penetrations.length}
            baseSubtotal={penetrationBase}
            sectionTotal={penTP.sectionTotal}
            taxProfit={penetrationsTaxProfit}
            onTaxProfitChange={setPenetrationsTaxProfit}
            isOpen={sections.penetrations}
            onToggle={() => toggleSection("penetrations")}
            accent={accent}
          >
            <div className="space-y-1">
              {filteredPenetrations.map((item) => (
                <PenetrationRow
                  key={item.id}
                  item={item}
                  onUpdate={updatePenetration}
                />
              ))}
            </div>
            {filteredPenetrations.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No penetration items to display
              </p>
            )}
          </SectionCard>
        )}

        {/* ── Labor Section ────────────────────────────────── */}
        <SectionCard
          title="Labor"
          icon={<HardHat className={`w-5 h-5 ${accent.text}`} />}
          count={enabledLaborCount}
          total={labor.length}
          baseSubtotal={laborBase}
          sectionTotal={labTP.sectionTotal}
          taxProfit={laborTaxProfit}
          onTaxProfitChange={setLaborTaxProfit}
          isOpen={sections.labor}
          onToggle={() => toggleSection("labor")}
          accent={accent}
        >
          <div className="space-y-1">
            {filteredLabor.map((item) => (
              <LaborRow
                key={item.id}
                item={item}
                onUpdate={updateLabor}
              />
            ))}
          </div>
          {filteredLabor.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No labor items to display
            </p>
          )}
        </SectionCard>

        {/* ── Equipment Section ─────────────────────────────── */}
        <SectionCard
          title="Equipment"
          icon={<Settings className={`w-5 h-5 ${accent.text}`} />}
          count={enabledEquipmentCount}
          total={equipment.length}
          baseSubtotal={equipmentBase}
          sectionTotal={eqTP.sectionTotal}
          taxProfit={equipmentTaxProfit}
          onTaxProfitChange={setEquipmentTaxProfit}
          isOpen={sections.equipment}
          onToggle={() => toggleSection("equipment")}
          accent={accent}
        >
          <div className="space-y-1">
            {filteredEquipment.map((item) => (
              <EquipmentRow
                key={item.id}
                item={item}
                onUpdate={updateEquipment}
              />
            ))}
          </div>
          {filteredEquipment.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No equipment items to display
            </p>
          )}
        </SectionCard>

        {/* ── Grand Total Summary ──────────────────────────── */}
        <Card className="border-slate-300 shadow-md">
          <CardContent className="py-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Materials ({enabledMaterialCount} items)</span>
                <span className="font-medium tabular-nums">{fmt(materialBase)}</span>
              </div>
              {penetrations.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Penetrations ({enabledPenetrationCount} items)</span>
                  <span className="font-medium tabular-nums">{fmt(penetrationBase)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Labor ({enabledLaborCount} items)</span>
                <span className="font-medium tabular-nums">{fmt(laborBase)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Equipment ({enabledEquipmentCount} items)</span>
                <span className="font-medium tabular-nums">{fmt(equipmentBase)}</span>
              </div>

              {/* Tax & Profit summary */}
              {(totalTax > 0 || totalProfit > 0) && (
                <>
                  <Separator className="my-2" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Subtotal (before Tax & Profit)</span>
                    <span className="font-medium tabular-nums">{fmt(materialBase + penetrationBase + laborBase + equipmentBase)}</span>
                  </div>
                  {totalTax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Percent className="w-3 h-3" /> Total Tax
                      </span>
                      <span className="font-medium tabular-nums text-amber-600">{fmt(totalTax)}</span>
                    </div>
                  )}
                  {totalProfit > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Percent className="w-3 h-3" /> Total Profit
                      </span>
                      <span className="font-medium tabular-nums text-emerald-600">{fmt(totalProfit)}</span>
                    </div>
                  )}
                </>
              )}

              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">Grand Total</span>
                <span className={`text-2xl font-bold ${accent.text} tabular-nums`}>
                  {fmt(grandTotal)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Footer ───────────────────────────────────────── */}
        <div className="text-center py-4 print:hidden">
          <Button
            variant="outline"
            onClick={() => navigate(`/estimator/${data.systemSlug}`)}
            className="mr-3"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Estimator
          </Button>
          <Button onClick={exportExcel}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Section Card wrapper ────────────────────────────────────

interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  count: number;
  total: number;
  baseSubtotal: number;
  sectionTotal: number;
  taxProfit: TaxProfitState;
  onTaxProfitChange: (tp: TaxProfitState) => void;
  isOpen: boolean;
  onToggle: () => void;
  accent: { bg: string; text: string; border: string; light: string };
  children: React.ReactNode;
}

function SectionCard({
  title, icon, count, total, baseSubtotal, sectionTotal,
  taxProfit, onTaxProfitChange, isOpen, onToggle, accent, children,
}: SectionCardProps) {
  const taxAmount = taxProfit.taxEnabled ? baseSubtotal * (taxProfit.taxPercent / 100) : 0;
  const profitAmount = taxProfit.profitEnabled ? baseSubtotal * (taxProfit.profitPercent / 100) : 0;

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <CardHeader
        className="pb-3 cursor-pointer select-none hover:bg-slate-50/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            {icon}
            {title}
            <span className="text-sm font-normal text-muted-foreground ml-1">
              {count}/{total} included
            </span>
          </CardTitle>
          <div className="flex items-center gap-3">
            <span className={`text-lg font-bold tabular-nums ${accent.text}`}>
              {fmt(sectionTotal)}
            </span>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent className="pt-0">
          {/* Table header */}
          <div className="grid grid-cols-[auto_1fr_100px_100px_100px_100px] gap-2 px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-slate-100 mb-2 print:grid-cols-[auto_1fr_80px_80px_80px_80px]">
            <div className="w-10 print:hidden"></div>
            <div>Item</div>
            <div className="text-right">Qty</div>
            <div className="text-right">Unit Price</div>
            <div className="text-right">Total</div>
            <div className="w-10"></div>
          </div>
          {children}

          {/* ── Tax & Profit Footer ──────────────────────────── */}
          <div className="mt-4 pt-3 border-t border-slate-200 space-y-2">
            {/* Base subtotal */}
            <div className="flex justify-between items-center px-2 text-sm">
              <span className="text-muted-foreground font-medium">{title} Subtotal</span>
              <span className="font-semibold tabular-nums">{fmt(baseSubtotal)}</span>
            </div>

            {/* Tax row */}
            <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-amber-50/60 border border-amber-100">
              <div className="flex items-center gap-3">
                <Switch
                  checked={taxProfit.taxEnabled}
                  onCheckedChange={(checked) =>
                    onTaxProfitChange({ ...taxProfit, taxEnabled: checked })
                  }
                  className="scale-75"
                />
                <span className="text-sm font-medium text-amber-800">Tax</span>
                <div className="relative w-20">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={taxProfit.taxPercent}
                    onChange={(e) =>
                      onTaxProfitChange({ ...taxProfit, taxPercent: parseFloat(e.target.value) || 0 })
                    }
                    className="h-7 text-xs text-right tabular-nums pr-6 w-full"
                    disabled={!taxProfit.taxEnabled}
                  />
                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
              </div>
              <span className={`text-sm font-semibold tabular-nums ${taxProfit.taxEnabled ? "text-amber-700" : "text-muted-foreground"}`}>
                {taxProfit.taxEnabled ? fmt(taxAmount) : "—"}
              </span>
            </div>

            {/* Profit row */}
            <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-emerald-50/60 border border-emerald-100">
              <div className="flex items-center gap-3">
                <Switch
                  checked={taxProfit.profitEnabled}
                  onCheckedChange={(checked) =>
                    onTaxProfitChange({ ...taxProfit, profitEnabled: checked })
                  }
                  className="scale-75"
                />
                <span className="text-sm font-medium text-emerald-800">Profit</span>
                <div className="relative w-20">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={taxProfit.profitPercent}
                    onChange={(e) =>
                      onTaxProfitChange({ ...taxProfit, profitPercent: parseFloat(e.target.value) || 0 })
                    }
                    className="h-7 text-xs text-right tabular-nums pr-6 w-full"
                    disabled={!taxProfit.profitEnabled}
                  />
                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
              </div>
              <span className={`text-sm font-semibold tabular-nums ${taxProfit.profitEnabled ? "text-emerald-700" : "text-muted-foreground"}`}>
                {taxProfit.profitEnabled ? fmt(profitAmount) : "—"}
              </span>
            </div>

            {/* Section total with tax & profit */}
            {(taxProfit.taxEnabled || taxProfit.profitEnabled) && (
              <div className="flex justify-between items-center px-2 pt-1 text-sm">
                <span className="font-bold">{title} Total (incl. Tax & Profit)</span>
                <span className={`font-bold tabular-nums ${accent.text}`}>{fmt(sectionTotal)}</span>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ── Material Row ────────────────────────────────────────────

interface MaterialRowProps {
  item: BreakdownMaterialItem;
  onUpdate: (id: string, field: "quantity" | "unitPrice" | "enabled", value: number | boolean) => void;
}

function MaterialRow({ item, onUpdate }: MaterialRowProps) {
  return (
    <div
      className={`grid grid-cols-[auto_1fr_100px_100px_100px_100px] gap-2 items-center px-2 py-2 rounded-md transition-colors ${
        item.enabled ? "hover:bg-slate-50" : "opacity-50 bg-slate-50/50"
      } print:grid-cols-[auto_1fr_80px_80px_80px_80px]`}
    >
      <div className="w-10 print:hidden">
        <Switch
          checked={item.enabled}
          onCheckedChange={(checked) => onUpdate(item.id, "enabled", checked)}
          className="scale-75"
        />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{item.name}</p>
        <p className="text-xs text-muted-foreground truncate">{item.unit}</p>
      </div>
      <div className="text-right">
        <Input
          type="number"
          min="0"
          step="1"
          value={item.quantity}
          onChange={(e) => onUpdate(item.id, "quantity", parseInt(e.target.value) || 0)}
          className="h-7 text-xs text-right tabular-nums w-full print:border-none print:bg-transparent"
          disabled={!item.enabled}
        />
      </div>
      <div className="text-right">
        <div className="relative">
          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={item.unitPrice}
            onChange={(e) => onUpdate(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
            className="h-7 text-xs text-right tabular-nums pl-4 w-full print:border-none print:bg-transparent"
            disabled={!item.enabled}
          />
        </div>
      </div>
      <div className="text-right">
        <span className={`text-sm font-medium tabular-nums ${item.enabled ? "" : "text-muted-foreground"}`}>
          {fmt(item.enabled ? item.totalCost : 0)}
        </span>
      </div>
      <div className="w-10"></div>
    </div>
  );
}

// ── Penetration Row ─────────────────────────────────────────

interface PenetrationRowProps {
  item: BreakdownPenetrationItem;
  onUpdate: (id: string, field: "quantity" | "unitPrice" | "enabled", value: number | boolean) => void;
}

function PenetrationRow({ item, onUpdate }: PenetrationRowProps) {
  return (
    <div
      className={`grid grid-cols-[auto_1fr_100px_100px_100px_100px] gap-2 items-center px-2 py-2 rounded-md transition-colors ${
        item.enabled ? "hover:bg-slate-50" : "opacity-50 bg-slate-50/50"
      } print:grid-cols-[auto_1fr_80px_80px_80px_80px]`}
    >
      <div className="w-10 print:hidden">
        <Switch
          checked={item.enabled}
          onCheckedChange={(checked) => onUpdate(item.id, "enabled", checked)}
          className="scale-75"
        />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{item.name}</p>
        <p className="text-xs text-muted-foreground truncate">{item.unit}</p>
      </div>
      <div className="text-right">
        <Input
          type="number"
          min="0"
          step="1"
          value={item.quantity}
          onChange={(e) => onUpdate(item.id, "quantity", parseInt(e.target.value) || 0)}
          className="h-7 text-xs text-right tabular-nums w-full print:border-none print:bg-transparent"
          disabled={!item.enabled}
        />
      </div>
      <div className="text-right">
        <div className="relative">
          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={item.unitPrice}
            onChange={(e) => onUpdate(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
            className="h-7 text-xs text-right tabular-nums pl-4 w-full print:border-none print:bg-transparent"
            disabled={!item.enabled}
          />
        </div>
      </div>
      <div className="text-right">
        <span className={`text-sm font-medium tabular-nums ${item.enabled ? "" : "text-muted-foreground"}`}>
          {fmt(item.enabled ? item.totalCost : 0)}
        </span>
      </div>
      <div className="w-10"></div>
    </div>
  );
}

// ── Labor Row ───────────────────────────────────────────────

interface LaborRowProps {
  item: BreakdownLaborItem;
  onUpdate: (id: string, field: "rate" | "quantity" | "enabled", value: number | boolean) => void;
}

function LaborRow({ item, onUpdate }: LaborRowProps) {
  const showQuantity = item.rateType === "per_hour" || item.rateType === "per_day";
  return (
    <div
      className={`grid grid-cols-[auto_1fr_100px_100px_100px_100px] gap-2 items-center px-2 py-2 rounded-md transition-colors ${
        item.enabled ? "hover:bg-slate-50" : "opacity-50 bg-slate-50/50"
      } print:grid-cols-[auto_1fr_80px_80px_80px_80px]`}
    >
      <div className="w-10 print:hidden">
        <Switch
          checked={item.enabled}
          onCheckedChange={(checked) => onUpdate(item.id, "enabled", checked)}
          className="scale-75"
        />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{item.label}</p>
        <p className="text-xs text-muted-foreground truncate">{getRateLabel(item.rateType)}</p>
      </div>
      <div className="text-right">
        {showQuantity ? (
          <Input
            type="number"
            min="0"
            step="1"
            value={item.quantity}
            onChange={(e) => onUpdate(item.id, "quantity", parseFloat(e.target.value) || 0)}
            className="h-7 text-xs text-right tabular-nums w-full print:border-none print:bg-transparent"
            disabled={!item.enabled}
          />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>
      <div className="text-right">
        <div className="relative">
          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
          <Input
            type="number"
            min="0"
            step={item.rateType === "per_sqft" || item.rateType === "per_lf" ? "0.01" : "1"}
            value={item.rate}
            onChange={(e) => onUpdate(item.id, "rate", parseFloat(e.target.value) || 0)}
            className="h-7 text-xs text-right tabular-nums pl-4 w-full print:border-none print:bg-transparent"
            disabled={!item.enabled}
          />
        </div>
      </div>
      <div className="text-right">
        <span className={`text-sm font-medium tabular-nums ${item.enabled ? "" : "text-muted-foreground"}`}>
          {fmt(item.enabled ? item.computedCost : 0)}
        </span>
      </div>
      <div className="w-10"></div>
    </div>
  );
}

// ── Equipment Row ───────────────────────────────────────────

interface EquipmentRowProps {
  item: BreakdownEquipmentItem;
  onUpdate: (id: string, field: "rate" | "quantity" | "enabled", value: number | boolean) => void;
}

function EquipmentRow({ item, onUpdate }: EquipmentRowProps) {
  const showQuantity = item.rateType === "per_day";
  return (
    <div
      className={`grid grid-cols-[auto_1fr_100px_100px_100px_100px] gap-2 items-center px-2 py-2 rounded-md transition-colors ${
        item.enabled ? "hover:bg-slate-50" : "opacity-50 bg-slate-50/50"
      } print:grid-cols-[auto_1fr_80px_80px_80px_80px]`}
    >
      <div className="w-10 print:hidden">
        <Switch
          checked={item.enabled}
          onCheckedChange={(checked) => onUpdate(item.id, "enabled", checked)}
          className="scale-75"
        />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{item.label}</p>
        <p className="text-xs text-muted-foreground truncate">{getRateLabel(item.rateType)}</p>
      </div>
      <div className="text-right">
        {showQuantity ? (
          <Input
            type="number"
            min="0"
            step="1"
            value={item.quantity}
            onChange={(e) => onUpdate(item.id, "quantity", parseFloat(e.target.value) || 0)}
            className="h-7 text-xs text-right tabular-nums w-full print:border-none print:bg-transparent"
            disabled={!item.enabled}
          />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>
      <div className="text-right">
        <div className="relative">
          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
          <Input
            type="number"
            min="0"
            step="1"
            value={item.rate}
            onChange={(e) => onUpdate(item.id, "rate", parseFloat(e.target.value) || 0)}
            className="h-7 text-xs text-right tabular-nums pl-4 w-full print:border-none print:bg-transparent"
            disabled={!item.enabled}
          />
        </div>
      </div>
      <div className="text-right">
        <span className={`text-sm font-medium tabular-nums ${item.enabled ? "" : "text-muted-foreground"}`}>
          {fmt(item.enabled ? item.computedCost : 0)}
        </span>
      </div>
      <div className="w-10"></div>
    </div>
  );
}
