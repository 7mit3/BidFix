// TPO Estimator Page - Carlisle Sure-Weld TPO Single-Ply Membrane System
// Design: Clean construction dashboard with warm neutrals, Carlisle blue accent
// Layout: Two-column — left: assembly config + measurements, right: results

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Layers,
  Ruler,
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Package,
  Shield,
  Thermometer,
  SquareStack,
  Wrench,
  PencilLine,
  RotateCcw,
  Plus,
  Minus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import RoofAdditions from "@/components/RoofAdditions";
import { type PenetrationEstimate } from "@/lib/penetrations-data";
import { usePricingDB } from "@/hooks/usePricingDB";
import {
  type AssemblyConfig,
  type TPOMeasurements,
  type InsulationLayer,
  DECK_TYPES,
  VAPOR_BARRIERS,
  INSULATION_THICKNESSES,
  COVER_BOARDS,
  MEMBRANE_THICKNESSES,
  ATTACHMENT_METHODS,
  TPO_PRODUCTS,
  calculateTPOEstimate,
  exportTPOEstimateCSV,
  getInsulationSummary,
  FIELD_ZONE_RATIO,
  PERIMETER_ZONE_RATIO,
  CORNER_ZONE_RATIO,
  INSULATION_SCREW_TYPES,
  INSULATION_SCREW_LENGTHS,
  MEMBRANE_SCREW_LENGTHS,
  INSULATION_PLATE_TYPES,
  MEMBRANE_PLATE_TYPES,
  getResolvedFastenerLength,
  getResolvedMembraneFastenerLength,
} from "@/lib/tpo-data";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function TPOEstimator() {
  // Assembly config state
  const [assembly, setAssembly] = useState<AssemblyConfig>({
    deckType: "steel-22ga",
    vaporBarrier: "none",
    insulationEnabled: true,
    insulationLayers: [
      { thickness: "2.0", enabled: true },
      { thickness: "none", enabled: false },
      { thickness: "none", enabled: false },
      { thickness: "none", enabled: false },
    ],
    coverBoard: "densdeck-prime-half",
    membraneThickness: "60mil",
    attachmentMethod: "fully-adhered",
    fastenerType: "sfs-dekfast",
    fastenerLength: "auto",
    membraneFastenerLength: "auto",
    plateType: "3in-round",
    membranePlateType: "barbed",
  });

  // Measurements state
  const [measurements, setMeasurements] = useState<TPOMeasurements>({
    roofArea: 0,
    wallLinearFt: 0,
    wallHeight: 0,
    baseFlashingLF: 0,
  });

  // Pricing DB integration — sync DB prices reactively
  const { getPriceMap, isFromDB } = usePricingDB();
  const dbPrices = useMemo(() => getPriceMap("carlisle-tpo"), [getPriceMap, isFromDB]);
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});
  const userEditedPrices = useRef<Set<string>>(new Set());
  const [priceEditorOpen, setPriceEditorOpen] = useState(false);

  // Sync DB prices into local state when they arrive
  useEffect(() => {
    if (dbPrices.size > 0) {
      setCustomPrices((prev) => {
        const next = { ...prev };
        let changed = false;
        Array.from(dbPrices.entries()).forEach(([id, price]) => {
          if (!userEditedPrices.current.has(id) && next[id] !== price) {
            next[id] = price;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }
  }, [dbPrices]);

  // Calculate estimate
  const estimate = useMemo(
    () => calculateTPOEstimate(assembly, measurements, customPrices),
    [assembly, measurements, customPrices]
  );

  // Penetrations state
  const [penetrationEstimate, setPenetrationEstimate] = useState<PenetrationEstimate | null>(null);
  const penetrationCost = penetrationEstimate?.totalMaterialCost ?? 0;
  const grandTotal = estimate.totalMaterialCost + penetrationCost;

  // Derived wall sq ft
  const wallSqFt = measurements.wallLinearFt * measurements.wallHeight;

  // Insulation summary
  const insulationSummary = useMemo(
    () => assembly.insulationEnabled
      ? getInsulationSummary(assembly.insulationLayers)
      : { totalThickness: 0, totalRValue: 0, activeLayers: [] },
    [assembly.insulationLayers, assembly.insulationEnabled]
  );

  // Count how many layers are enabled
  const enabledLayerCount = assembly.insulationLayers.filter((l) => l.enabled).length;

  // Toggle insulation on/off
  const toggleInsulation = useCallback(() => {
    setAssembly((prev) => ({ ...prev, insulationEnabled: !prev.insulationEnabled }));
  }, []);

  // Handlers
  const updateAssembly = useCallback(
    (key: keyof AssemblyConfig, value: string) => {
      setAssembly((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const updateInsulationLayer = useCallback(
    (index: number, thickness: string) => {
      setAssembly((prev) => {
        const layers = [...prev.insulationLayers];
        layers[index] = { ...layers[index], thickness };
        return { ...prev, insulationLayers: layers };
      });
    },
    []
  );

  const addInsulationLayer = useCallback(() => {
    setAssembly((prev) => {
      const layers = [...prev.insulationLayers];
      // Find the first disabled layer and enable it
      const idx = layers.findIndex((l) => !l.enabled);
      if (idx !== -1) {
        layers[idx] = { thickness: "1.5", enabled: true };
      }
      return { ...prev, insulationLayers: layers };
    });
  }, []);

  const removeInsulationLayer = useCallback((index: number) => {
    setAssembly((prev) => {
      const layers = [...prev.insulationLayers];
      layers[index] = { thickness: "none", enabled: false };
      return { ...prev, insulationLayers: layers };
    });
  }, []);

  const updateMeasurement = useCallback(
    (key: keyof TPOMeasurements, value: string) => {
      const num = parseFloat(value) || 0;
      setMeasurements((prev) => ({ ...prev, [key]: num }));
    },
    []
  );

  const updatePrice = useCallback((productId: string, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      userEditedPrices.current.add(productId);
      setCustomPrices((prev) => ({ ...prev, [productId]: num }));
    }
  }, []);

  const resetPrices = useCallback(() => {
    userEditedPrices.current.clear();
    // Reset to DB prices if available, otherwise empty (falls back to defaults)
    const reset: Record<string, number> = {};
    Array.from(dbPrices.entries()).forEach(([id, price]) => {
      reset[id] = price;
    });
    setCustomPrices(reset);
  }, [dbPrices]);

  const handleExportCSV = useCallback(() => {
    const csv = exportTPOEstimateCSV(estimate);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `carlisle-tpo-estimate-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [estimate]);

  const handlePrint = useCallback(() => window.print(), []);

  // Group line items by category for display
  const groupedItems = useMemo(() => {
    const groups: Record<string, typeof estimate.lineItems> = {};
    for (const item of estimate.lineItems) {
      const cat = item.product.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }
    return groups;
  }, [estimate.lineItems]);

  const categoryOrder = [
    "Vapor Barrier",
    "Insulation",
    "Cover Board",
    "Membrane",
    "Adhesive",
    "Fasteners & Plates",
    "Flashing",
    "Accessories",
  ];

  const hasResults = measurements.roofArea > 0;

  // Get unique product IDs used in estimate for price editor
  const usedProductIds = useMemo(() => {
    const ids = new Set<string>();
    estimate.lineItems.forEach((item) => ids.add(item.product.id));
    return Array.from(ids);
  }, [estimate.lineItems]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div
        className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-700 to-blue-900"
        data-print-hide
      >
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.03) 35px, rgba(255,255,255,0.03) 70px)",
            }}
          />
        </div>
        <div className="container py-8 relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-200 hover:text-white transition-colors text-sm mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Catalog
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <p className="text-blue-300 text-xs font-medium tracking-wider uppercase">
                Carlisle SynTec
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-white font-display">
                Sure-Weld TPO Estimator
              </h1>
            </div>
          </div>
          <p className="text-slate-300 text-sm max-w-2xl">
            Configure your roof assembly, enter measurements, and get a complete
            material order list with pricing for Carlisle Sure-Weld TPO
            single-ply membrane systems.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Config + Measurements */}
          <div className="lg:col-span-5 space-y-6" data-print-hide>
            {/* Assembly Configuration */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Layers className="w-5 h-5 text-blue-600" />
                  Roof Assembly
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure the layers of your TPO roof system
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Deck Type */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <SquareStack className="w-4 h-4 text-slate-500" />
                    Substrate / Deck Type
                  </Label>
                  <Select
                    value={assembly.deckType}
                    onValueChange={(v) => updateAssembly("deckType", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DECK_TYPES.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Vapor Barrier */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Shield className="w-4 h-4 text-slate-500" />
                    Vapor Barrier
                  </Label>
                  <Select
                    value={assembly.vaporBarrier}
                    onValueChange={(v) => updateAssembly("vaporBarrier", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VAPOR_BARRIERS.map((vb) => (
                        <SelectItem key={vb.value} value={vb.value}>
                          {vb.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Insulation Layers (Optional) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <Thermometer className="w-4 h-4 text-slate-500" />
                      Insulation (Polyiso)
                    </Label>
                    <div className="flex items-center gap-2">
                      {assembly.insulationEnabled && insulationSummary.totalThickness > 0 && (
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          {insulationSummary.totalThickness.toFixed(1)}" total · R-{insulationSummary.totalRValue.toFixed(1)}
                        </span>
                      )}
                      <Switch
                        checked={assembly.insulationEnabled}
                        onCheckedChange={toggleInsulation}
                        aria-label="Toggle insulation"
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {assembly.insulationEnabled ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-2"
                      >
                        {/* Layer 1 - always visible when insulation is enabled */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-14 shrink-0">Layer 1</span>
                          <Select
                            value={assembly.insulationLayers[0].thickness}
                            onValueChange={(v) => updateInsulationLayer(0, v)}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {INSULATION_THICKNESSES.map((ins) => (
                                <SelectItem key={ins.value} value={ins.value}>
                                  {ins.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Additional layers */}
                        {assembly.insulationLayers.slice(1).map((layer, idx) => {
                          const realIdx = idx + 1;
                          if (!layer.enabled) return null;
                          return (
                            <motion.div
                              key={realIdx}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="flex items-center gap-2"
                            >
                              <span className="text-xs text-muted-foreground w-14 shrink-0">Layer {realIdx + 1}</span>
                              <Select
                                value={layer.thickness}
                                onValueChange={(v) => updateInsulationLayer(realIdx, v)}
                              >
                                <SelectTrigger className="flex-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {INSULATION_THICKNESSES.map((ins) => (
                                    <SelectItem key={ins.value} value={ins.value}>
                                      {ins.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                                onClick={() => removeInsulationLayer(realIdx)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </motion.div>
                          );
                        })}

                        {/* Add layer button */}
                        {enabledLayerCount < 4 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={addInsulationLayer}
                            className="w-full gap-2 text-xs border-dashed"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add Insulation Layer ({enabledLayerCount}/4)
                          </Button>
                        )}
                      </motion.div>
                    ) : (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-muted-foreground italic py-1"
                      >
                        No insulation — membrane over deck/cover board only
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Cover Board */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Layers className="w-4 h-4 text-slate-500" />
                    Cover Board
                  </Label>
                  <Select
                    value={assembly.coverBoard}
                    onValueChange={(v) => updateAssembly("coverBoard", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COVER_BOARDS.map((cb) => (
                        <SelectItem key={cb.value} value={cb.value}>
                          {cb.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Membrane Thickness */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Package className="w-4 h-4 text-slate-500" />
                    Membrane Thickness
                  </Label>
                  <Select
                    value={assembly.membraneThickness}
                    onValueChange={(v) =>
                      updateAssembly("membraneThickness", v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEMBRANE_THICKNESSES.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Attachment Method */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Wrench className="w-4 h-4 text-slate-500" />
                    Attachment Method
                  </Label>
                  <Select
                    value={assembly.attachmentMethod}
                    onValueChange={(v) =>
                      updateAssembly("attachmentMethod", v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ATTACHMENT_METHODS.map((am) => (
                        <SelectItem key={am.value} value={am.value}>
                          {am.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Fastener & Plate Selection — only visible when Mechanically Attached */}
                <AnimatePresence>
                  {assembly.attachmentMethod === "mechanically-attached" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t border-dashed border-amber-300 space-y-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5" />
                          Membrane Securement
                        </p>

                        {/* Insulation Screw Type */}
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Insulation Screw Type</Label>
                          <Select
                            value={assembly.fastenerType}
                            onValueChange={(v) => updateAssembly("fastenerType", v)}
                          >
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {INSULATION_SCREW_TYPES.map((st) => (
                                <SelectItem key={st.value} value={st.value}>
                                  {st.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Insulation Screw Length */}
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">
                            Insulation Screw Length
                            {assembly.fastenerLength === "auto" && (
                              <span className="ml-2 text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                → {getResolvedFastenerLength(assembly).replace("in", '"')}
                              </span>
                            )}
                          </Label>
                          <Select
                            value={assembly.fastenerLength}
                            onValueChange={(v) => updateAssembly("fastenerLength", v)}
                          >
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {INSULATION_SCREW_LENGTHS.map((sl) => (
                                <SelectItem key={sl.value} value={sl.value}>
                                  {sl.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Insulation Plate Type */}
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Insulation Plate Type</Label>
                          <Select
                            value={assembly.plateType}
                            onValueChange={(v) => updateAssembly("plateType", v)}
                          >
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {INSULATION_PLATE_TYPES.map((pt) => (
                                <SelectItem key={pt.value} value={pt.value}>
                                  {pt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="border-t border-dashed border-slate-200 pt-3 mt-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 mb-3">Membrane Fasteners</p>
                        </div>

                        {/* Membrane Screw Length */}
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">
                            Membrane Screw Length
                            {assembly.membraneFastenerLength === "auto" && (
                              <span className="ml-2 text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                → {getResolvedMembraneFastenerLength(assembly).replace("in", '"')}
                              </span>
                            )}
                          </Label>
                          <Select
                            value={assembly.membraneFastenerLength}
                            onValueChange={(v) => updateAssembly("membraneFastenerLength", v)}
                          >
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {MEMBRANE_SCREW_LENGTHS.map((sl) => (
                                <SelectItem key={sl.value} value={sl.value}>
                                  {sl.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Membrane Plate Type */}
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Membrane Plate Type</Label>
                          <Select
                            value={assembly.membranePlateType}
                            onValueChange={(v) => updateAssembly("membranePlateType", v)}
                          >
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {MEMBRANE_PLATE_TYPES.map((pt) => (
                                <SelectItem key={pt.value} value={pt.value}>
                                  {pt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Measurements */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Ruler className="w-5 h-5 text-blue-600" />
                  Measurements
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Enter roof and wall dimensions
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Roof Area */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Total Roof Area</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={measurements.roofArea || ""}
                      onChange={(e) =>
                        updateMeasurement("roofArea", e.target.value)
                      }
                      className="pr-14"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      sq. ft.
                    </span>
                  </div>
                </div>

                {/* Wall Dimensions */}
                <div className="p-4 bg-slate-50 rounded-lg space-y-4">
                  <p className="text-sm font-medium text-slate-700">
                    Wall Perimeter & Height
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Wall Linear Footage
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={measurements.wallLinearFt || ""}
                          onChange={(e) =>
                            updateMeasurement("wallLinearFt", e.target.value)
                          }
                          className="pr-10"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          LF
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Wall Height
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder="0"
                          value={measurements.wallHeight || ""}
                          onChange={(e) =>
                            updateMeasurement("wallHeight", e.target.value)
                          }
                          className="pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          ft
                        </span>
                      </div>
                    </div>
                  </div>
                  {wallSqFt > 0 && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-blue-600 font-medium"
                    >
                      = {wallSqFt.toLocaleString()} sq ft wall area
                    </motion.p>
                  )}
                </div>

                {/* Base Flashing */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Base Flashing Linear Footage
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={measurements.baseFlashingLF || ""}
                      onChange={(e) =>
                        updateMeasurement("baseFlashingLF", e.target.value)
                      }
                      className="pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      LF
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Standard 18" height. Auto-calculates to{" "}
                    {measurements.baseFlashingLF > 0
                      ? `${(measurements.baseFlashingLF * 1.5).toFixed(0)} sq ft`
                      : "0 sq ft"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Price Editor */}
            <Collapsible open={priceEditorOpen} onOpenChange={setPriceEditorOpen}>
              <Card className="border-slate-200 shadow-sm">
                <CollapsibleTrigger asChild>
                  <CardHeader className="pb-4 cursor-pointer hover:bg-slate-50 transition-colors">
                    <CardTitle className="flex items-center justify-between text-lg">
                      <span className="flex items-center gap-2">
                        <PencilLine className="w-5 h-5 text-blue-600" />
                        Edit Pricing
                      </span>
                      <div className="flex items-center gap-2">
                        {Object.keys(customPrices).length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              resetPrices();
                            }}
                            className="text-xs h-7"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Reset
                          </Button>
                        )}
                        {priceEditorOpen ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-3 max-h-[400px] overflow-y-auto">
                    {usedProductIds.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        Enter measurements to see editable prices
                      </p>
                    ) : (
                      usedProductIds.map((id) => {
                        const product = TPO_PRODUCTS[id];
                        if (!product) return null;
                        const currentPrice =
                          customPrices[id] ?? product.defaultPrice;
                        return (
                          <div
                            key={id}
                            className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-0"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {product.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                per {product.unit}
                              </p>
                            </div>
                            <div className="relative w-28 shrink-0">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                $
                              </span>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={currentPrice}
                                onChange={(e) => updatePrice(id, e.target.value)}
                                className="pl-7 text-right h-8 text-sm"
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-7 space-y-6">
            {/* Roof Penetrations & Additions */}
            <div data-print-hide>
              <RoofAdditions
                onEstimateChange={setPenetrationEstimate}
                accentColor="blue"
              />
            </div>
            {/* Total Cost Header */}
            <AnimatePresence mode="wait">
              {hasResults && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-gradient-to-br from-slate-800 via-slate-700 to-blue-900 text-white border-0 shadow-lg">
                    <CardContent className="py-6">
                      <p className="text-blue-300 text-xs font-semibold tracking-wider uppercase mb-1">
                        Total Material Estimate
                      </p>
                      <p className="text-4xl font-bold font-display tracking-tight">
                        {fmt(grandTotal)}
                      </p>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-sm">
                        <span className="text-slate-300">
                          <DollarSign className="w-3.5 h-3.5 inline mr-1" />
                          {measurements.roofArea > 0
                            ? `${(grandTotal / measurements.roofArea).toFixed(2)} / sq ft`
                            : "—"}
                        </span>
                        <span className="text-slate-300">
                          <Package className="w-3.5 h-3.5 inline mr-1" />
                          {estimate.lineItems.length} line items
                        </span>
                        {penetrationCost > 0 && (
                          <span className="text-blue-300">
                            Penetrations: {fmt(penetrationCost)}
                          </span>
                        )}
                        <span className="text-slate-300">
                          <Layers className="w-3.5 h-3.5 inline mr-1" />
                          {measurements.roofArea.toLocaleString()} sq ft roof
                        </span>
                      </div>
                      {/* Assembly Summary */}
                      <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-slate-300">
                        <span>
                          Deck:{" "}
                          {DECK_TYPES.find((d) => d.value === assembly.deckType)
                            ?.label || "—"}
                        </span>
                        <span>
                          Insulation:{" "}
                          {assembly.insulationEnabled && insulationSummary.activeLayers.length > 0
                            ? `${insulationSummary.totalThickness.toFixed(1)}" Polyiso (${insulationSummary.activeLayers.length} layer${insulationSummary.activeLayers.length !== 1 ? "s" : ""}) · R-${insulationSummary.totalRValue.toFixed(1)}`
                            : "None"}
                        </span>
                        <span>
                          Membrane:{" "}
                          {MEMBRANE_THICKNESSES.find(
                            (m) => m.value === assembly.membraneThickness
                          )?.label || "—"}
                        </span>
                        <span>
                          Cover:{" "}
                          {COVER_BOARDS.find(
                            (c) => c.value === assembly.coverBoard
                          )?.label || "—"}
                        </span>
                        <span>
                          Attach:{" "}
                          {ATTACHMENT_METHODS.find(
                            (a) => a.value === assembly.attachmentMethod
                          )?.label || "—"}
                        </span>
                        {wallSqFt > 0 && (
                          <span>
                            Wall: {wallSqFt.toLocaleString()} sq ft
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            {hasResults && (
              <div className="flex gap-3" data-print-hide>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </Button>
              </div>
            )}

            {/* Material Order List */}
            {hasResults ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                {categoryOrder.map((category) => {
                  const items = groupedItems[category];
                  if (!items || items.length === 0) return null;

                  const isFastenersCategory = category === "Fasteners & Plates";

                  return (
                    <Card
                      key={category}
                      className={`shadow-sm overflow-hidden ${
                        isFastenersCategory
                          ? "border-amber-200 ring-1 ring-amber-100"
                          : "border-slate-200"
                      }`}
                    >
                      <CardHeader
                        className={`py-3 ${
                          isFastenersCategory ? "bg-amber-50" : "bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <CardTitle
                            className={`text-sm font-semibold uppercase tracking-wider ${
                              isFastenersCategory
                                ? "text-amber-800"
                                : "text-slate-700"
                            }`}
                          >
                            {category}
                          </CardTitle>
                          {isFastenersCategory && (
                            <span className="text-[10px] font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                              {assembly.attachmentMethod === "mechanically-attached"
                                ? "Mechanically Attached"
                                : "Fully Adhered"}
                              {" · "}
                              {items.reduce((s, it) => s + it.totalCost, 0).toLocaleString("en-US", { style: "currency", currency: "USD" })}
                            </span>
                          )}
                        </div>
                        {isFastenersCategory && (
                          <p className="text-[10px] text-amber-600/80 mt-1">
                            Zone layout: Field {(FIELD_ZONE_RATIO * 100).toFixed(0)}% · Perimeter {(PERIMETER_ZONE_RATIO * 100).toFixed(0)}% · Corner {(CORNER_ZONE_RATIO * 100).toFixed(0)}% — Screw length auto-selected for {getInsulationSummary(assembly.insulationLayers).totalThickness.toFixed(1)}" insulation assembly
                          </p>
                        )}
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-slate-100">
                                <th className="text-left py-2 px-4 font-medium text-muted-foreground text-xs">
                                  Product
                                </th>
                                <th className="text-right py-2 px-4 font-medium text-muted-foreground text-xs">
                                  Qty
                                </th>
                                <th className="text-left py-2 px-4 font-medium text-muted-foreground text-xs">
                                  Unit
                                </th>
                                <th className="text-right py-2 px-4 font-medium text-muted-foreground text-xs">
                                  Unit Price
                                </th>
                                <th className="text-right py-2 px-4 font-medium text-muted-foreground text-xs">
                                  Total
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((item, i) => (
                                <tr
                                  key={i}
                                  className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                                >
                                  <td className="py-3 px-4">
                                    <p className="font-medium text-slate-800">
                                      {item.product.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {item.note}
                                    </p>
                                  </td>
                                  <td className="py-3 px-4 text-right font-semibold tabular-nums">
                                    {item.unitsToOrder}
                                  </td>
                                  <td className="py-3 px-4 text-xs text-muted-foreground">
                                    {item.product.unit}
                                  </td>
                                  <td className="py-3 px-4 text-right tabular-nums">
                                    {fmt(item.unitPrice)}
                                  </td>
                                  <td className="py-3 px-4 text-right font-semibold tabular-nums text-slate-800">
                                    {fmt(item.totalCost)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Grand Total Footer */}
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardContent className="py-4">
                    {penetrationCost > 0 && (
                      <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                        <span>Roofing Materials</span>
                        <span className="tabular-nums">{fmt(estimate.totalMaterialCost)}</span>
                      </div>
                    )}
                    {penetrationCost > 0 && (
                      <div className="flex items-center justify-between text-sm text-slate-600 mb-3 pb-3 border-b border-blue-200">
                        <span>Penetrations & Additions</span>
                        <span className="tabular-nums">{fmt(penetrationCost)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-slate-700">
                        Grand Total
                      </span>
                      <span className="text-2xl font-bold text-slate-900 tabular-nums">
                        {fmt(grandTotal)}
                      </span>
                    </div>
                    {measurements.roofArea > 0 && (
                      <p className="text-sm text-blue-600 mt-1">
                        {(
                          grandTotal / measurements.roofArea
                        ).toFixed(2)}{" "}
                        per sq ft (all materials)
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <Card className="border-dashed border-2 border-slate-200">
                <CardContent className="py-16 text-center">
                  <Ruler className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-500 mb-2">
                    Configure & Measure
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Select your roof assembly components on the left, then enter
                    your roof area and wall measurements to generate a complete
                    material order list with pricing.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-12 py-6 bg-slate-50">
        <div className="container">
          <p className="text-xs text-muted-foreground text-center">
            Carlisle Sure-Weld TPO Estimator — Pricing based on industry
            research and may vary. All prices are editable. Consult your
            distributor for current pricing.
          </p>
        </div>
      </footer>
    </div>
  );
}
