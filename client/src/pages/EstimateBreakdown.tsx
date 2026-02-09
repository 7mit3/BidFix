/**
 * EstimateBreakdown — Full editable estimate breakdown page
 *
 * Shows all materials, penetrations, labor, and equipment in a single view.
 * Every line item can be toggled on/off and has editable quantities and prices.
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
  Download,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
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

// ── Section collapse state ───────────────────────────────────

interface SectionState {
  materials: boolean;
  penetrations: boolean;
  labor: boolean;
  equipment: boolean;
}

// ── Main component ───────────────────────────────────────────

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

  // ── Material handlers ────────────────────────────────────

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

  // ── Penetration handlers ─────────────────────────────────

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

  // ── Labor handlers ───────────────────────────────────────

  const updateLabor = useCallback(
    (id: string, field: "rate" | "quantity" | "enabled", value: number | boolean) => {
      setLabor((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const updated = { ...item, [field]: value };
          if (field === "rate" || field === "quantity") {
            const rate = field === "rate" ? (value as number) : item.rate;
            const qty = field === "quantity" ? (value as number) : item.quantity;
            // For per_sqft and per_lf, computedCost was pre-calculated with area/LF
            // We need to recalculate proportionally
            if (item.rateType === "per_sqft" || item.rateType === "per_lf") {
              // The original computedCost = originalRate * area
              // New cost = newRate * area = (newRate / originalRate) * originalComputedCost
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

  // ── Equipment handlers ───────────────────────────────────

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

  // ── Totals ───────────────────────────────────────────────

  const materialTotal = useMemo(
    () => materials.filter((m) => m.enabled).reduce((sum, m) => sum + m.totalCost, 0),
    [materials]
  );

  const penetrationTotal = useMemo(
    () => penetrations.filter((p) => p.enabled).reduce((sum, p) => sum + p.totalCost, 0),
    [penetrations]
  );

  const laborTotal = useMemo(
    () => labor.filter((l) => l.enabled).reduce((sum, l) => sum + l.computedCost, 0),
    [labor]
  );

  const equipmentTotal = useMemo(
    () => equipment.filter((e) => e.enabled).reduce((sum, e) => sum + e.computedCost, 0),
    [equipment]
  );

  const grandTotal = materialTotal + penetrationTotal + laborTotal + equipmentTotal;

  // ── Section toggle ───────────────────────────────────────

  const toggleSection = useCallback((section: keyof SectionState) => {
    setSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  // ── CSV Export ───────────────────────────────────────────

  const exportCSV = useCallback(() => {
    if (!data) return;
    const rows: string[][] = [
      ["Category", "Item", "Description", "Unit", "Qty", "Unit Price", "Total", "Included"],
    ];

    materials.forEach((m) => {
      rows.push([
        "Material",
        m.name,
        m.description,
        m.unit,
        String(m.quantity),
        m.unitPrice.toFixed(2),
        m.totalCost.toFixed(2),
        m.enabled ? "Yes" : "No",
      ]);
    });

    penetrations.forEach((p) => {
      rows.push([
        "Penetration",
        p.name,
        p.description,
        p.unit,
        String(p.quantity),
        p.unitPrice.toFixed(2),
        p.totalCost.toFixed(2),
        p.enabled ? "Yes" : "No",
      ]);
    });

    labor.forEach((l) => {
      rows.push([
        "Labor",
        l.label,
        l.description,
        getRateLabel(l.rateType),
        l.rateType === "per_sqft" || l.rateType === "per_lf" ? "—" : String(l.quantity),
        l.rate.toFixed(2),
        l.computedCost.toFixed(2),
        l.enabled ? "Yes" : "No",
      ]);
    });

    equipment.forEach((e) => {
      rows.push([
        "Equipment",
        e.label,
        e.description,
        getRateLabel(e.rateType),
        e.rateType === "flat" ? "—" : String(e.quantity),
        e.rate.toFixed(2),
        e.computedCost.toFixed(2),
        e.enabled ? "Yes" : "No",
      ]);
    });

    // Summary rows
    rows.push([]);
    rows.push(["", "", "", "", "", "Materials Total", materialTotal.toFixed(2), ""]);
    rows.push(["", "", "", "", "", "Penetrations Total", penetrationTotal.toFixed(2), ""]);
    rows.push(["", "", "", "", "", "Labor Total", laborTotal.toFixed(2), ""]);
    rows.push(["", "", "", "", "", "Equipment Total", equipmentTotal.toFixed(2), ""]);
    rows.push(["", "", "", "", "", "GRAND TOTAL", grandTotal.toFixed(2), ""]);

    const csvContent = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.systemSlug}-breakdown-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data, materials, penetrations, labor, equipment, materialTotal, penetrationTotal, laborTotal, equipmentTotal, grandTotal]);

  // ── Print ────────────────────────────────────────────────

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // ── Accent color classes ─────────────────────────────────

  const accentMap: Record<string, { bg: string; text: string; border: string; light: string }> = {
    red: { bg: "bg-red-600", text: "text-red-600", border: "border-red-200", light: "bg-red-50" },
    blue: { bg: "bg-blue-600", text: "text-blue-600", border: "border-blue-200", light: "bg-blue-50" },
    emerald: { bg: "bg-emerald-600", text: "text-emerald-600", border: "border-emerald-200", light: "bg-emerald-50" },
  };

  const accent = accentMap[data?.accentColor ?? "red"] ?? accentMap.red;

  // ── Loading / no data ────────────────────────────────────

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-muted-foreground">Loading estimate data...</p>
      </div>
    );
  }

  // ── Group materials by category ──────────────────────────

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
      {/* ── Header ──────────────────────────────────────────── */}
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
                onClick={exportCSV}
                className="text-white/80 hover:text-white hover:bg-white/10 text-xs"
              >
                <Download className="w-4 h-4 mr-1" />
                Export CSV
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

      {/* ── Grand Total Sticky Bar ──────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm print:static print:shadow-none">
        <div className="container py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Materials</span>
                <span className="ml-2 font-semibold tabular-nums">{fmt(materialTotal)}</span>
              </div>
              {penetrations.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Penetrations</span>
                  <span className="ml-2 font-semibold tabular-nums">{fmt(penetrationTotal)}</span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Labor</span>
                <span className="ml-2 font-semibold tabular-nums">{fmt(laborTotal)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Equipment</span>
                <span className="ml-2 font-semibold tabular-nums">{fmt(equipmentTotal)}</span>
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

      {/* ── Content ─────────────────────────────────────────── */}
      <div className="container py-6 space-y-6">
        {/* ── Materials Section ──────────────────────────────── */}
        <SectionCard
          title="Materials"
          icon={<Package className={`w-5 h-5 ${accent.text}`} />}
          count={enabledMaterialCount}
          total={materials.length}
          subtotal={materialTotal}
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

        {/* ── Penetrations Section ──────────────────────────── */}
        {penetrations.length > 0 && (
          <SectionCard
            title="Roof Penetrations"
            icon={<Wrench className={`w-5 h-5 ${accent.text}`} />}
            count={enabledPenetrationCount}
            total={penetrations.length}
            subtotal={penetrationTotal}
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

        {/* ── Labor Section ─────────────────────────────────── */}
        <SectionCard
          title="Labor"
          icon={<HardHat className={`w-5 h-5 ${accent.text}`} />}
          count={enabledLaborCount}
          total={labor.length}
          subtotal={laborTotal}
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

        {/* ── Equipment Section ──────────────────────────────── */}
        <SectionCard
          title="Equipment"
          icon={<Settings className={`w-5 h-5 ${accent.text}`} />}
          count={enabledEquipmentCount}
          total={equipment.length}
          subtotal={equipmentTotal}
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

        {/* ── Grand Total Summary ───────────────────────────── */}
        <Card className="border-slate-300 shadow-md">
          <CardContent className="py-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Materials ({enabledMaterialCount} items)</span>
                <span className="font-medium tabular-nums">{fmt(materialTotal)}</span>
              </div>
              {penetrations.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Penetrations ({enabledPenetrationCount} items)</span>
                  <span className="font-medium tabular-nums">{fmt(penetrationTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Labor ({enabledLaborCount} items)</span>
                <span className="font-medium tabular-nums">{fmt(laborTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Equipment ({enabledEquipmentCount} items)</span>
                <span className="font-medium tabular-nums">{fmt(equipmentTotal)}</span>
              </div>
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

        {/* ── Footer ────────────────────────────────────────── */}
        <div className="text-center py-4 print:hidden">
          <Button
            variant="outline"
            onClick={() => navigate(`/estimator/${data.systemSlug}`)}
            className="mr-3"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Estimator
          </Button>
          <Button onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Section Card wrapper ─────────────────────────────────────

interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  count: number;
  total: number;
  subtotal: number;
  isOpen: boolean;
  onToggle: () => void;
  accent: { bg: string; text: string; border: string; light: string };
  children: React.ReactNode;
}

function SectionCard({ title, icon, count, total, subtotal, isOpen, onToggle, accent, children }: SectionCardProps) {
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
              {fmt(subtotal)}
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
        </CardContent>
      )}
    </Card>
  );
}

// ── Material Row ─────────────────────────────────────────────

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

// ── Penetration Row ──────────────────────────────────────────

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

// ── Labor Row ────────────────────────────────────────────────

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

// ── Equipment Row ────────────────────────────────────────────

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
