/**
 * EstimateBreakdown — Full editable estimate breakdown page.
 *
 * Shows all materials, penetrations, labor, and equipment with:
 * - Toggle on/off for each item
 * - Editable quantities and prices for ALL items
 * - "Add Item" button in every section for custom line items
 * - Tax & Profit per section with toggles
 * - Grand total with section subtotals
 * - Excel export and print
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  FileSpreadsheet,
  Printer,
  Package,
  Wrench,
  HardHat,
  Settings,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Percent,
  Plus,
  Trash2,
  Save,
} from "lucide-react";
import {
  loadBreakdownData,
  loadEstimateContext,
  storeEstimateContext,
  serializeBreakdownState,
  loadBreakdownSaveState,
  clearBreakdownSaveState,
  fmt,
  getRateLabel,
  type EstimateBreakdownData,
  type EstimateContext,
  type BreakdownMaterialItem,
  type BreakdownPenetrationItem,
  type BreakdownLaborItem,
  type BreakdownEquipmentItem,
  type TaxProfitState,
} from "@/lib/estimate-breakdown";
import { SaveEstimateDialog } from "@/components/SaveEstimateDialog";

const DEFAULT_TAX_PROFIT: TaxProfitState = {
  taxEnabled: false,
  taxPercent: 8.25,
  profitEnabled: false,
  profitPercent: 20,
};

// ── Section collapse state ─────────────────────────────────────

interface SectionState {
  materials: boolean;
  penetrations: boolean;
  labor: boolean;
  equipment: boolean;
}

// ── Unique ID counter for custom items ─────────────────────────

let customIdCounter = 0;
function nextCustomId(prefix: string) {
  customIdCounter += 1;
  return `${prefix}-custom-${customIdCounter}-${Date.now()}`;
}

// ── Main component ─────────────────────────────────────────────

export default function EstimateBreakdown() {
  const [, navigate] = useLocation();
  const [data, setData] = useState<EstimateBreakdownData | null>(null);
  const [estimateCtx, setEstimateCtx] = useState<EstimateContext | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

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

    // Check for saved breakdown state (from DB) — restores all edits
    const savedState = loadBreakdownSaveState();
    if (savedState) {
      // Restore the saved breakdown state (items, toggles, tax/profit, custom items)
      setMaterials(savedState.materials);
      setPenetrations(savedState.penetrations);
      setLabor(savedState.labor);
      setEquipment(savedState.equipment);
      if (savedState.materialsTaxProfit) setMaterialsTaxProfit(savedState.materialsTaxProfit);
      if (savedState.penetrationsTaxProfit) setPenetrationsTaxProfit(savedState.penetrationsTaxProfit);
      if (savedState.laborTaxProfit) setLaborTaxProfit(savedState.laborTaxProfit);
      if (savedState.equipmentTaxProfit) setEquipmentTaxProfit(savedState.equipmentTaxProfit);
      // Clear the saved state so it doesn't interfere with future navigations
      clearBreakdownSaveState();
    } else {
      // No saved state — use the fresh breakdown data from the estimator
      setMaterials(loaded.materials);
      setPenetrations(loaded.penetrations);
      setLabor(loaded.labor);
      setEquipment(loaded.equipment);
    }

    // Load estimate context for save/back navigation
    const ctx = loadEstimateContext();
    if (ctx) setEstimateCtx(ctx);
  }, [navigate]);

  // ── Material handlers ──────────────────────────────────────

  const updateMaterial = useCallback(
    (id: string, field: "quantity" | "unitPrice" | "enabled" | "name", value: number | boolean | string) => {
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

  const addMaterial = useCallback(() => {
    const newItem: BreakdownMaterialItem = {
      id: nextCustomId("mat"),
      name: "New Item",
      description: "",
      category: "Custom",
      unit: "each",
      quantityNeeded: 0,
      quantity: 1,
      unitPrice: 0,
      totalCost: 0,
      enabled: true,
    };
    setMaterials((prev) => [...prev, newItem]);
  }, []);

  const removeMaterial = useCallback((id: string) => {
    setMaterials((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // ── Penetration handlers ───────────────────────────────────

  const updatePenetration = useCallback(
    (id: string, field: "quantity" | "unitPrice" | "enabled" | "name", value: number | boolean | string) => {
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

  const addPenetration = useCallback(() => {
    const newItem: BreakdownPenetrationItem = {
      id: nextCustomId("pen"),
      name: "New Penetration",
      description: "",
      unit: "each",
      quantity: 1,
      unitPrice: 0,
      totalCost: 0,
      enabled: true,
    };
    setPenetrations((prev) => [...prev, newItem]);
  }, []);

  const removePenetration = useCallback((id: string) => {
    setPenetrations((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // ── Labor handlers ─────────────────────────────────────────

  const updateLabor = useCallback(
    (id: string, field: "rate" | "quantity" | "enabled" | "label", value: number | boolean | string) => {
      setLabor((prev) =>
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

  const addLabor = useCallback(() => {
    const newItem: BreakdownLaborItem = {
      id: nextCustomId("lab"),
      label: "New Labor Item",
      description: "",
      rateType: "flat",
      rate: 0,
      quantity: 1,
      computedCost: 0,
      enabled: true,
    };
    setLabor((prev) => [...prev, newItem]);
  }, []);

  const removeLabor = useCallback((id: string) => {
    setLabor((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // ── Equipment handlers ─────────────────────────────────────

  const updateEquipment = useCallback(
    (id: string, field: "rate" | "quantity" | "enabled" | "label", value: number | boolean | string) => {
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

  const addEquipment = useCallback(() => {
    const newItem: BreakdownEquipmentItem = {
      id: nextCustomId("eq"),
      label: "New Equipment Item",
      description: "",
      rateType: "flat",
      rate: 0,
      quantity: 1,
      computedCost: 0,
      enabled: true,
    };
    setEquipment((prev) => [...prev, newItem]);
  }, []);

  const removeEquipment = useCallback((id: string) => {
    setEquipment((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // ── Compute base totals (before tax/profit) ────────────────

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

  // ── Compute tax & profit amounts per section ───────────────

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

  // ── Save from breakdown ────────────────────────────────────

  const getEstimateData = useCallback(() => {
    // Return the original estimator state JSON (from the estimator page)
    return estimateCtx?.estimatorStateJson ?? "{}";
  }, [estimateCtx]);

  /** Serialize the current breakdown editing state for DB persistence */
  const breakdownStateJson = useMemo(() => {
    return serializeBreakdownState({
      materials,
      penetrations,
      labor,
      equipment,
      materialsTaxProfit,
      penetrationsTaxProfit,
      laborTaxProfit,
      equipmentTaxProfit,
    });
  }, [materials, penetrations, labor, equipment, materialsTaxProfit, penetrationsTaxProfit, laborTaxProfit, equipmentTaxProfit]);

  const handleBackToEstimator = useCallback(() => {
    if (!data) return;
    if (estimateCtx?.estimateId) {
      // Navigate back to the estimator with the loaded estimate
      navigate(`/estimator/${data.systemSlug}?loadEstimate=${estimateCtx.estimateId}`);
    } else {
      navigate(`/estimator/${data.systemSlug}`);
    }
  }, [data, estimateCtx, navigate]);

  const handleSaved = useCallback((id: number, name: string) => {
    // Update the context so subsequent saves use the new ID
    setEstimateCtx((prev) => prev ? { ...prev, estimateId: id, estimateName: name } : prev);
    // Also update sessionStorage so Back to Estimator works
    if (estimateCtx) {
      storeEstimateContext({ ...estimateCtx, estimateId: id, estimateName: name });
    }
  }, [estimateCtx]);

  // ── Section toggle ─────────────────────────────────────────

  const toggleSection = useCallback((section: keyof SectionState) => {
    setSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  // ── Excel Export ───────────────────────────────────────────

  const exportExcel = useCallback(() => {
    if (!data) return;
    import("xlsx").then((XLSX) => {
      const wb = XLSX.utils.book_new();

      // ── Materials sheet
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
      const matSummary: any[] = [];
      matSummary.push({} as any);
      matSummary.push({ Category: "", Item: "", Description: "", Unit: "", Quantity: "", "Unit Price": "Materials (Base)", Total: materialBase, Included: "" } as any);
      if (materialsTaxProfit.taxEnabled) matSummary.push({ Category: "", Item: "", Description: "", Unit: "", Quantity: "", "Unit Price": `Tax (${materialsTaxProfit.taxPercent}%)`, Total: matTP.taxAmount, Included: "Yes" } as any);
      if (materialsTaxProfit.profitEnabled) matSummary.push({ Category: "", Item: "", Description: "", Unit: "", Quantity: "", "Unit Price": `Profit (${materialsTaxProfit.profitPercent}%)`, Total: matTP.profitAmount, Included: "Yes" } as any);
      matSummary.push({ Category: "", Item: "", Description: "", Unit: "", Quantity: "", "Unit Price": "Materials Total", Total: matTP.sectionTotal, Included: "" } as any);
      const matWs = XLSX.utils.json_to_sheet([...matRows, ...matSummary]);
      matWs["!cols"] = [{ wch: 16 }, { wch: 40 }, { wch: 30 }, { wch: 18 }, { wch: 10 }, { wch: 28 }, { wch: 14 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, matWs, "Materials");

      // ── Penetrations sheet
      if (penetrations.length > 0) {
        const penRows: any[] = penetrations.map((p) => ({
          Item: p.name, Description: p.description, Unit: p.unit,
          Quantity: p.quantity, "Unit Price": p.unitPrice, Total: p.totalCost,
          Included: p.enabled ? "Yes" : "No",
        }));
        penRows.push({} as any);
        penRows.push({ Item: "", Description: "", Unit: "", Quantity: "", "Unit Price": "Penetrations (Base)", Total: penetrationBase, Included: "" } as any);
        if (penetrationsTaxProfit.taxEnabled) penRows.push({ Item: "", Description: "", Unit: "", Quantity: "", "Unit Price": `Tax (${penetrationsTaxProfit.taxPercent}%)`, Total: penTP.taxAmount, Included: "Yes" } as any);
        if (penetrationsTaxProfit.profitEnabled) penRows.push({ Item: "", Description: "", Unit: "", Quantity: "", "Unit Price": `Profit (${penetrationsTaxProfit.profitPercent}%)`, Total: penTP.profitAmount, Included: "Yes" } as any);
        penRows.push({ Item: "", Description: "", Unit: "", Quantity: "", "Unit Price": "Penetrations Total", Total: penTP.sectionTotal, Included: "" } as any);
        const penWs = XLSX.utils.json_to_sheet(penRows);
        penWs["!cols"] = [{ wch: 30 }, { wch: 30 }, { wch: 12 }, { wch: 10 }, { wch: 28 }, { wch: 14 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(wb, penWs, "Penetrations");
      }

      // ── Labor sheet
      if (labor.length > 0) {
        const labRows: any[] = labor.map((l) => ({
          Item: l.label, Description: l.description, "Rate Type": getRateLabel(l.rateType),
          Rate: l.rate, Quantity: l.quantity,
          Total: l.computedCost, Included: l.enabled ? "Yes" : "No",
        }));
        labRows.push({} as any);
        labRows.push({ Item: "", Description: "", "Rate Type": "", Rate: "", Quantity: "Labor (Base)", Total: laborBase, Included: "" } as any);
        if (laborTaxProfit.taxEnabled) labRows.push({ Item: "", Description: "", "Rate Type": "", Rate: "", Quantity: `Tax (${laborTaxProfit.taxPercent}%)`, Total: labTP.taxAmount, Included: "Yes" } as any);
        if (laborTaxProfit.profitEnabled) labRows.push({ Item: "", Description: "", "Rate Type": "", Rate: "", Quantity: `Profit (${laborTaxProfit.profitPercent}%)`, Total: labTP.profitAmount, Included: "Yes" } as any);
        labRows.push({ Item: "", Description: "", "Rate Type": "", Rate: "", Quantity: "Labor Total", Total: labTP.sectionTotal, Included: "" } as any);
        const labWs = XLSX.utils.json_to_sheet(labRows);
        labWs["!cols"] = [{ wch: 30 }, { wch: 30 }, { wch: 14 }, { wch: 12 }, { wch: 28 }, { wch: 14 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(wb, labWs, "Labor");
      }

      // ── Equipment sheet
      if (equipment.length > 0) {
        const eqRows: any[] = equipment.map((e) => ({
          Item: e.label, Description: e.description, "Rate Type": getRateLabel(e.rateType),
          Rate: e.rate, Quantity: e.quantity,
          Total: e.computedCost, Included: e.enabled ? "Yes" : "No",
        }));
        eqRows.push({} as any);
        eqRows.push({ Item: "", Description: "", "Rate Type": "", Rate: "", Quantity: "Equipment (Base)", Total: equipmentBase, Included: "" } as any);
        if (equipmentTaxProfit.taxEnabled) eqRows.push({ Item: "", Description: "", "Rate Type": "", Rate: "", Quantity: `Tax (${equipmentTaxProfit.taxPercent}%)`, Total: eqTP.taxAmount, Included: "Yes" } as any);
        if (equipmentTaxProfit.profitEnabled) eqRows.push({ Item: "", Description: "", "Rate Type": "", Rate: "", Quantity: `Profit (${equipmentTaxProfit.profitPercent}%)`, Total: eqTP.profitAmount, Included: "Yes" } as any);
        eqRows.push({ Item: "", Description: "", "Rate Type": "", Rate: "", Quantity: "Equipment Total", Total: eqTP.sectionTotal, Included: "" } as any);
        const eqWs = XLSX.utils.json_to_sheet(eqRows);
        eqWs["!cols"] = [{ wch: 30 }, { wch: 30 }, { wch: 14 }, { wch: 12 }, { wch: 28 }, { wch: 14 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(wb, eqWs, "Equipment");
      }

      // ── Summary sheet
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

  // ── Print ──────────────────────────────────────────────────

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // ── Accent color classes ───────────────────────────────────

  const accentMap: Record<string, { bg: string; text: string; border: string; light: string }> = {
    red: { bg: "bg-destructive", text: "text-destructive", border: "border-destructive/30", light: "bg-destructive/10" },
    blue: { bg: "bg-cyan", text: "text-cyan", border: "border-cyan/30", light: "bg-cyan/10" },
    emerald: { bg: "bg-success", text: "text-success", border: "border-success/30", light: "bg-success/10" },
  };

  const accent = accentMap[data?.accentColor ?? "red"] ?? accentMap.red;

  // ── Loading / no data ──────────────────────────────────────

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-border border-t-slate-600 rounded-full mx-auto" />
          <p className="text-muted-foreground">Loading estimate data...</p>
        </div>
      </div>
    );
  }

  // ── Group materials by category ────────────────────────────

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

  const isCustomItem = (id: string) => id.includes("-custom-");

  return (
    <div className="min-h-screen bg-background print:bg-card">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className={`${accent.bg} text-white`}>
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToEstimator}
                className="text-white/80 hover:text-foreground hover:bg-card/10 print:hidden"
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
                className="text-white/80 hover:text-foreground hover:bg-card/10 text-xs"
              >
                {showDisabled ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                {showDisabled ? "Hide Disabled" : "Show All"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={exportExcel}
                className="text-white/80 hover:text-foreground hover:bg-card/10 text-xs"
              >
                <FileSpreadsheet className="w-4 h-4 mr-1" />
                Export Excel
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrint}
                className="text-white/80 hover:text-foreground hover:bg-card/10 text-xs"
              >
                <Printer className="w-4 h-4 mr-1" />
                Print
              </Button>
              {estimateCtx && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSaveDialogOpen(true)}
                  className="text-white/80 hover:text-foreground hover:bg-card/10 text-xs"
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
              )}
            </div>
          </div>
          {/* Measurements */}
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-sm text-white/80">
            {Object.entries(data.measurements).map(([key, val]) => (
              <div key={key}>
                <span className="text-white/60">{key}:</span>{" "}
                <span className="font-medium text-white">{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sticky summary bar ────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border shadow-sm print:hidden">
        <div className="container py-2 flex items-center justify-between text-sm">
          <div className="flex flex-wrap gap-x-6 gap-y-1">
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
          <div className="text-right flex items-baseline gap-3">
            <div>
              <span className="text-sm text-muted-foreground mr-2">Grand Total</span>
              <span className={`text-xl font-bold ${accent.text} tabular-nums`}>
                {fmt(grandTotal)}
              </span>
            </div>
            {data.roofArea > 0 && (
              <div className="text-sm text-muted-foreground tabular-nums">
                {fmt(grandTotal / data.roofArea)}/sq.ft.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────── */}
      <div className="container py-6 space-y-6">
        {/* ── Materials Section ────────────────────────────────── */}
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
          onAddItem={addMaterial}
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
                    isCustom={isCustomItem(item.id)}
                    onRemove={removeMaterial}
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

        {/* ── Penetrations Section ────────────────────────────── */}
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
          onAddItem={addPenetration}
        >
          <div className="space-y-1">
            {filteredPenetrations.map((item) => (
              <PenetrationRow
                key={item.id}
                item={item}
                onUpdate={updatePenetration}
                isCustom={isCustomItem(item.id)}
                onRemove={removePenetration}
              />
            ))}
          </div>
          {filteredPenetrations.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No penetration items to display
            </p>
          )}
        </SectionCard>

        {/* ── Labor Section ───────────────────────────────────── */}
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
          onAddItem={addLabor}
        >
          <div className="space-y-1">
            {filteredLabor.map((item) => (
              <LaborRow
                key={item.id}
                item={item}
                onUpdate={updateLabor}
                isCustom={isCustomItem(item.id)}
                onRemove={removeLabor}
              />
            ))}
          </div>
          {filteredLabor.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No labor items to display
            </p>
          )}
        </SectionCard>

        {/* ── Equipment Section ────────────────────────────────── */}
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
          onAddItem={addEquipment}
        >
          <div className="space-y-1">
            {filteredEquipment.map((item) => (
              <EquipmentRow
                key={item.id}
                item={item}
                onUpdate={updateEquipment}
                isCustom={isCustomItem(item.id)}
                onRemove={removeEquipment}
              />
            ))}
          </div>
          {filteredEquipment.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No equipment items to display
            </p>
          )}
        </SectionCard>

        {/* ── Grand Total Summary ─────────────────────────────── */}
        <Card className="border-border shadow-md">
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
                      <span className="font-medium tabular-nums text-orange">{fmt(totalTax)}</span>
                    </div>
                  )}
                  {totalProfit > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Percent className="w-3 h-3" /> Total Profit
                      </span>
                      <span className="font-medium tabular-nums text-success">{fmt(totalProfit)}</span>
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
              {data.roofArea > 0 && (
                <div className="flex justify-between items-center pt-1">
                  <span className="text-sm text-muted-foreground">Price Per Square Foot</span>
                  <span className={`text-lg font-semibold ${accent.text} tabular-nums`}>
                    {fmt(grandTotal / data.roofArea)}/sq.ft.
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>        {/* ── Footer ──────────────────────────────────────────────── */}
        <div className="flex justify-center items-center gap-3 py-4 print:hidden">
          <Button
            variant="outline"
            onClick={handleBackToEstimator}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Estimator
          </Button>
          <Button onClick={exportExcel}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          {estimateCtx && (
            <Button
              onClick={() => setSaveDialogOpen(true)}
              variant="default"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Estimate
            </Button>
          )}
        </div>
      </div>

      {/* Save Estimate Dialog */}
      {estimateCtx && (
        <SaveEstimateDialog
          open={saveDialogOpen}
          onOpenChange={setSaveDialogOpen}
          system={estimateCtx.system}
          systemLabel={estimateCtx.systemLabel}
          getEstimateData={getEstimateData}
          grandTotal={grandTotal}
          roofArea={data.roofArea}
          existingId={estimateCtx.estimateId}
          existingName={estimateCtx.estimateName}
          onSaved={handleSaved}
          breakdownState={breakdownStateJson}
        />
      )}
    </div>
  );
}

// ── Section Card wrapper ───────────────────────────────────────

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
  onAddItem: () => void;
  children: React.ReactNode;
}

function SectionCard({
  title, icon, count, total, baseSubtotal, sectionTotal,
  taxProfit, onTaxProfitChange, isOpen, onToggle, accent, onAddItem, children,
}: SectionCardProps) {
  const taxAmount = taxProfit.taxEnabled ? baseSubtotal * (taxProfit.taxPercent / 100) : 0;
  const profitAmount = taxProfit.profitEnabled ? baseSubtotal * (taxProfit.profitPercent / 100) : 0;

  return (
    <Card className="border-border shadow-sm overflow-hidden">
      <CardHeader
        className="pb-3 cursor-pointer select-none hover:bg-muted/30 transition-colors"
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
          <div className="grid grid-cols-[auto_1fr_100px_100px_100px_auto] gap-2 px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border mb-2 print:grid-cols-[auto_1fr_80px_80px_80px_auto]">
            <div className="w-10 print:hidden"></div>
            <div>Item</div>
            <div className="text-right">Qty</div>
            <div className="text-right">Unit Price</div>
            <div className="text-right">Total</div>
            <div className="w-10"></div>
          </div>
          {children}

          {/* ── Add Item button ─────────────────────────────── */}
          <div className="mt-3 mb-2 print:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onAddItem();
              }}
              className="w-full border-dashed border-border text-muted-foreground hover:text-foreground hover:border-slate-400"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Item
            </Button>
          </div>

          {/* ── Tax & Profit Footer ────────────────────────── */}
          <div className="mt-4 pt-3 border-t border-border space-y-2">
            {/* Base subtotal */}
            <div className="flex justify-between items-center px-2 text-sm">
              <span className="text-muted-foreground font-medium">{title} Subtotal</span>
              <span className="font-semibold tabular-nums">{fmt(baseSubtotal)}</span>
            </div>

            {/* Tax row */}
            <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-orange/10 border border-orange/20">
              <div className="flex items-center gap-3">
                <Switch
                  checked={taxProfit.taxEnabled}
                  onCheckedChange={(checked) =>
                    onTaxProfitChange({ ...taxProfit, taxEnabled: checked })
                  }
                  className="scale-75"
                />
                <span className="text-sm font-medium text-orange">Tax</span>
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
              <span className={`text-sm font-semibold tabular-nums ${taxProfit.taxEnabled ? "text-orange" : "text-muted-foreground"}`}>
                {taxProfit.taxEnabled ? fmt(taxAmount) : "—"}
              </span>
            </div>

            {/* Profit row */}
            <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-success/10 border border-success/20">
              <div className="flex items-center gap-3">
                <Switch
                  checked={taxProfit.profitEnabled}
                  onCheckedChange={(checked) =>
                    onTaxProfitChange({ ...taxProfit, profitEnabled: checked })
                  }
                  className="scale-75"
                />
                <span className="text-sm font-medium text-success">Profit</span>
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
              <span className={`text-sm font-semibold tabular-nums ${taxProfit.profitEnabled ? "text-success" : "text-muted-foreground"}`}>
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

// ── Material Row ───────────────────────────────────────────────

interface MaterialRowProps {
  item: BreakdownMaterialItem;
  onUpdate: (id: string, field: "quantity" | "unitPrice" | "enabled" | "name", value: number | boolean | string) => void;
  isCustom: boolean;
  onRemove: (id: string) => void;
}

function MaterialRow({ item, onUpdate, isCustom, onRemove }: MaterialRowProps) {
  return (
    <div
      className={`grid grid-cols-[auto_1fr_100px_100px_100px_auto] gap-2 items-center px-2 py-2 rounded-md transition-colors ${
        item.enabled ? "hover:bg-background" : "opacity-50 bg-muted/30"
      } print:grid-cols-[auto_1fr_80px_80px_80px_auto]`}
    >
      <div className="w-10 print:hidden">
        <Switch
          checked={item.enabled}
          onCheckedChange={(checked) => onUpdate(item.id, "enabled", checked)}
          className="scale-75"
        />
      </div>
      <div className="min-w-0">
        {isCustom ? (
          <Input
            value={item.name}
            onChange={(e) => onUpdate(item.id, "name", e.target.value)}
            className="h-7 text-sm font-medium w-full"
            placeholder="Item name"
          />
        ) : (
          <>
            <p className="text-sm font-medium truncate">{item.name}</p>
            <p className="text-xs text-muted-foreground truncate">{item.unit}</p>
          </>
        )}
      </div>
      <div className="text-right">
        <Input
          type="number"
          min="0"
          step="1"
          value={item.quantity}
          onChange={(e) => onUpdate(item.id, "quantity", parseInt(e.target.value) || 0)}
          className="h-7 text-xs text-right tabular-nums w-full print:border-none print:bg-transparent"
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
          />
        </div>
      </div>
      <div className="text-right">
        <span className={`text-sm font-medium tabular-nums ${item.enabled ? "" : "text-muted-foreground"}`}>
          {fmt(item.enabled ? item.totalCost : 0)}
        </span>
      </div>
      <div className="w-10 flex justify-center print:hidden">
        {isCustom && (
          <button
            onClick={() => onRemove(item.id)}
            className="text-muted-foreground hover:text-destructive transition-colors p-1"
            title="Remove item"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Penetration Row ────────────────────────────────────────────

interface PenetrationRowProps {
  item: BreakdownPenetrationItem;
  onUpdate: (id: string, field: "quantity" | "unitPrice" | "enabled" | "name", value: number | boolean | string) => void;
  isCustom: boolean;
  onRemove: (id: string) => void;
}

function PenetrationRow({ item, onUpdate, isCustom, onRemove }: PenetrationRowProps) {
  return (
    <div
      className={`grid grid-cols-[auto_1fr_100px_100px_100px_auto] gap-2 items-center px-2 py-2 rounded-md transition-colors ${
        item.enabled ? "hover:bg-background" : "opacity-50 bg-muted/30"
      } print:grid-cols-[auto_1fr_80px_80px_80px_auto]`}
    >
      <div className="w-10 print:hidden">
        <Switch
          checked={item.enabled}
          onCheckedChange={(checked) => onUpdate(item.id, "enabled", checked)}
          className="scale-75"
        />
      </div>
      <div className="min-w-0">
        {isCustom ? (
          <Input
            value={item.name}
            onChange={(e) => onUpdate(item.id, "name", e.target.value)}
            className="h-7 text-sm font-medium w-full"
            placeholder="Item name"
          />
        ) : (
          <>
            <p className="text-sm font-medium truncate">{item.name}</p>
            <p className="text-xs text-muted-foreground truncate">{item.unit}</p>
          </>
        )}
      </div>
      <div className="text-right">
        <Input
          type="number"
          min="0"
          step="1"
          value={item.quantity}
          onChange={(e) => onUpdate(item.id, "quantity", parseInt(e.target.value) || 0)}
          className="h-7 text-xs text-right tabular-nums w-full print:border-none print:bg-transparent"
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
          />
        </div>
      </div>
      <div className="text-right">
        <span className={`text-sm font-medium tabular-nums ${item.enabled ? "" : "text-muted-foreground"}`}>
          {fmt(item.enabled ? item.totalCost : 0)}
        </span>
      </div>
      <div className="w-10 flex justify-center print:hidden">
        {isCustom && (
          <button
            onClick={() => onRemove(item.id)}
            className="text-muted-foreground hover:text-destructive transition-colors p-1"
            title="Remove item"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Labor Row ──────────────────────────────────────────────────

interface LaborRowProps {
  item: BreakdownLaborItem;
  onUpdate: (id: string, field: "rate" | "quantity" | "enabled" | "label", value: number | boolean | string) => void;
  isCustom: boolean;
  onRemove: (id: string) => void;
}

function LaborRow({ item, onUpdate, isCustom, onRemove }: LaborRowProps) {
  return (
    <div
      className={`grid grid-cols-[auto_1fr_100px_100px_100px_auto] gap-2 items-center px-2 py-2 rounded-md transition-colors ${
        item.enabled ? "hover:bg-background" : "opacity-50 bg-muted/30"
      } print:grid-cols-[auto_1fr_80px_80px_80px_auto]`}
    >
      <div className="w-10 print:hidden">
        <Switch
          checked={item.enabled}
          onCheckedChange={(checked) => onUpdate(item.id, "enabled", checked)}
          className="scale-75"
        />
      </div>
      <div className="min-w-0">
        {isCustom ? (
          <Input
            value={item.label}
            onChange={(e) => onUpdate(item.id, "label", e.target.value)}
            className="h-7 text-sm font-medium w-full"
            placeholder="Item name"
          />
        ) : (
          <>
            <p className="text-sm font-medium truncate">{item.label}</p>
            <p className="text-xs text-muted-foreground truncate">{getRateLabel(item.rateType)}</p>
          </>
        )}
      </div>
      <div className="text-right">
        <Input
          type="number"
          min="0"
          step="1"
          value={item.quantity}
          onChange={(e) => onUpdate(item.id, "quantity", parseFloat(e.target.value) || 0)}
          className="h-7 text-xs text-right tabular-nums w-full print:border-none print:bg-transparent"
        />
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
          />
        </div>
      </div>
      <div className="text-right">
        <span className={`text-sm font-medium tabular-nums ${item.enabled ? "" : "text-muted-foreground"}`}>
          {fmt(item.enabled ? item.computedCost : 0)}
        </span>
      </div>
      <div className="w-10 flex justify-center print:hidden">
        {isCustom && (
          <button
            onClick={() => onRemove(item.id)}
            className="text-muted-foreground hover:text-destructive transition-colors p-1"
            title="Remove item"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Equipment Row ──────────────────────────────────────────────

interface EquipmentRowProps {
  item: BreakdownEquipmentItem;
  onUpdate: (id: string, field: "rate" | "quantity" | "enabled" | "label", value: number | boolean | string) => void;
  isCustom: boolean;
  onRemove: (id: string) => void;
}

function EquipmentRow({ item, onUpdate, isCustom, onRemove }: EquipmentRowProps) {
  return (
    <div
      className={`grid grid-cols-[auto_1fr_100px_100px_100px_auto] gap-2 items-center px-2 py-2 rounded-md transition-colors ${
        item.enabled ? "hover:bg-background" : "opacity-50 bg-muted/30"
      } print:grid-cols-[auto_1fr_80px_80px_80px_auto]`}
    >
      <div className="w-10 print:hidden">
        <Switch
          checked={item.enabled}
          onCheckedChange={(checked) => onUpdate(item.id, "enabled", checked)}
          className="scale-75"
        />
      </div>
      <div className="min-w-0">
        {isCustom ? (
          <Input
            value={item.label}
            onChange={(e) => onUpdate(item.id, "label", e.target.value)}
            className="h-7 text-sm font-medium w-full"
            placeholder="Item name"
          />
        ) : (
          <>
            <p className="text-sm font-medium truncate">{item.label}</p>
            <p className="text-xs text-muted-foreground truncate">{getRateLabel(item.rateType)}</p>
          </>
        )}
      </div>
      <div className="text-right">
        <Input
          type="number"
          min="0"
          step="1"
          value={item.quantity}
          onChange={(e) => onUpdate(item.id, "quantity", parseFloat(e.target.value) || 0)}
          className="h-7 text-xs text-right tabular-nums w-full print:border-none print:bg-transparent"
        />
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
          />
        </div>
      </div>
      <div className="text-right">
        <span className={`text-sm font-medium tabular-nums ${item.enabled ? "" : "text-muted-foreground"}`}>
          {fmt(item.enabled ? item.computedCost : 0)}
        </span>
      </div>
      <div className="w-10 flex justify-center print:hidden">
        {isCustom && (
          <button
            onClick={() => onRemove(item.id)}
            className="text-muted-foreground hover:text-destructive transition-colors p-1"
            title="Remove item"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
