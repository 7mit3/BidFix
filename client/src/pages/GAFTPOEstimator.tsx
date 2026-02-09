// GAF EverGuard TPO Estimator Page
// Design: Clean construction dashboard with GAF red/charcoal branding
// Layout: Two-column — left: assembly config + measurements, right: results

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
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
  X,
  HardHat,
  FileSpreadsheet,
  Save,
  FolderOpen,
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
import RoofAdditions, { type RoofAdditionsHandle } from "@/components/RoofAdditions";
import { type PenetrationEstimate } from "@/lib/penetrations-data";
import { usePricingDB } from "@/hooks/usePricingDB";
import { TPOLaborEquipmentSection } from "@/components/TPOLaborEquipmentSection";
import {
  DEFAULT_TPO_LABOR_ITEMS,
  DEFAULT_TPO_EQUIPMENT_ITEMS,
  calculateTPOLaborEquipmentTotals,
  type TPOLaborEquipmentState,
  type TPOLaborEquipmentTotals,
} from "@/lib/tpo-labor-equipment-data";
import {
  type AssemblyConfig,
  type TPOMeasurements,
  DECK_TYPES,
  INSULATION_THICKNESSES,
  getInsulationSummary,
  FIELD_ZONE_RATIO,
  PERIMETER_ZONE_RATIO,
  CORNER_ZONE_RATIO,
  INSULATION_PLATE_TYPES,
  MEMBRANE_PLATE_TYPES,
  getResolvedFastenerLength,
  getResolvedMembraneFastenerLength,
} from "@/lib/tpo-data";
import {
  GAF_VAPOR_BARRIERS,
  GAF_COVER_BOARDS,
  GAF_INSULATION_SCREW_TYPES,
  GAF_INSULATION_SCREW_LENGTHS,
  GAF_MEMBRANE_SCREW_LENGTHS,
  GAF_MEMBRANE_THICKNESSES,
  GAF_ATTACHMENT_METHODS,
  GAF_TPO_PRODUCTS,
  calculateGAFTPOEstimate,
  exportGAFTPOEstimateCSV,
} from "@/lib/gaf-tpo-data";
import { storeBreakdownData, storeEstimateContext, storeBreakdownSaveState, deserializeBreakdownState } from "@/lib/estimate-breakdown";
import { serializeTPOBreakdown } from "@/lib/breakdown-serializers";
import { SaveEstimateDialog } from "@/components/SaveEstimateDialog";
import { serializeTPOState, deserializeTPOState } from "@/lib/estimate-state-serializers";
import { toast } from "sonner";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function GAFTPOEstimator() {
  const [, navigate] = useLocation();
  const searchString = useSearch();

  // Save/Load state
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadedEstimateId, setLoadedEstimateId] = useState<number | null>(null);
  const [loadedEstimateName, setLoadedEstimateName] = useState<string>("");
  const [savedBreakdownStateJson, setSavedBreakdownStateJson] = useState<string | null>(null);

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
    fastenerType: "gaf-drilltec-14",
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
  const dbPrices = useMemo(() => getPriceMap("gaf-tpo"), [getPriceMap, isFromDB]);
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
    () => calculateGAFTPOEstimate(assembly, measurements, customPrices),
    [assembly, measurements, customPrices]
  );

  // Labor & Equipment state
  const [laborEquipment, setLaborEquipment] = useState<TPOLaborEquipmentState>(() => ({
    laborItems: DEFAULT_TPO_LABOR_ITEMS.map((item) => ({
      ...item,
      rate: item.defaultRate,
      quantity: item.defaultQuantity,
    })),
    equipmentItems: DEFAULT_TPO_EQUIPMENT_ITEMS.map((item) => ({
      ...item,
      rate: item.defaultRate,
      quantity: item.defaultQuantity,
    })),
  }));

  const updateLaborItem = useCallback(
    (id: string, field: "rate" | "quantity" | "enabled", value: number | boolean) => {
      setLaborEquipment((prev) => ({
        ...prev,
        laborItems: prev.laborItems.map((item) =>
          item.id === id ? { ...item, [field]: value } : item
        ),
      }));
    },
    []
  );

  const updateEquipmentItem = useCallback(
    (id: string, field: "rate" | "quantity" | "enabled", value: number | boolean) => {
      setLaborEquipment((prev) => ({
        ...prev,
        equipmentItems: prev.equipmentItems.map((item) =>
          item.id === id ? { ...item, [field]: value } : item
        ),
      }));
    },
    []
  );

  const resetLaborEquipment = useCallback(() => {
    setLaborEquipment({
      laborItems: DEFAULT_TPO_LABOR_ITEMS.map((item) => ({
        ...item,
        rate: item.defaultRate,
        quantity: item.defaultQuantity,
      })),
      equipmentItems: DEFAULT_TPO_EQUIPMENT_ITEMS.map((item) => ({
        ...item,
        rate: item.defaultRate,
        quantity: item.defaultQuantity,
      })),
    });
  }, []);

  // Penetrations state
  const [penetrationEstimate, setPenetrationEstimate] = useState<PenetrationEstimate | null>(null);
  const penetrationCost = penetrationEstimate?.totalMaterialCost ?? 0;
  const roofAdditionsRef = useRef<RoofAdditionsHandle>(null);
  const [roofAdditionsInitialState, setRoofAdditionsInitialState] = useState<
    { lineItems: Record<string, number>; sheetMetal: import("@/lib/sheet-metal-flashing-data").SheetMetalFlashingState } | undefined
  >(undefined);

  // Labor & equipment totals
  const laborEquipmentTotals: TPOLaborEquipmentTotals | null = useMemo(() => {
    if (measurements.roofArea <= 0) return null;
    const flashingLF = measurements.baseFlashingLF + measurements.wallLinearFt;
    return calculateTPOLaborEquipmentTotals(laborEquipment, measurements.roofArea, flashingLF);
  }, [laborEquipment, measurements.roofArea, measurements.baseFlashingLF, measurements.wallLinearFt]);

  const laborCost = laborEquipmentTotals?.laborTotal ?? 0;
  const equipmentCost = laborEquipmentTotals?.equipmentTotal ?? 0;
  const grandTotal = estimate.totalMaterialCost + penetrationCost + laborCost + equipmentCost;

  // Derived wall sq ft
  const wallSqFt = measurements.wallLinearFt * measurements.wallHeight;

  // Insulation summary
  const insulationSummary = useMemo(
    () =>
      assembly.insulationEnabled
        ? getInsulationSummary(assembly.insulationLayers)
        : { totalThickness: 0, totalRValue: 0, activeLayers: [] },
    [assembly.insulationLayers, assembly.insulationEnabled]
  );

  const enabledLayerCount = assembly.insulationLayers.filter(
    (l) => l.enabled
  ).length;

  const toggleInsulation = useCallback(() => {
    setAssembly((prev) => ({
      ...prev,
      insulationEnabled: !prev.insulationEnabled,
    }));
  }, []);

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
    const reset: Record<string, number> = {};
    Array.from(dbPrices.entries()).forEach(([id, price]) => {
      reset[id] = price;
    });
    setCustomPrices(reset);
  }, [dbPrices]);

  const handleExportCSV = useCallback(() => {
    const csv = exportGAFTPOEstimateCSV(estimate);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gaf-tpo-estimate-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [estimate]);

  const handlePrint = useCallback(() => window.print(), []);

  // Load saved estimate from URL param
  const loadEstimateId = new URLSearchParams(searchString).get("loadEstimate");
  const { data: savedEstimate } = trpc.estimates.get.useQuery(
    { id: Number(loadEstimateId) },
    { enabled: !!loadEstimateId },
  );

  useEffect(() => {
    if (!savedEstimate) return;
    const state = deserializeTPOState(savedEstimate.data);
    if (!state || state.system !== "gaf-tpo") {
      toast.error("Could not load this estimate — incompatible format.");
      return;
    }
    // Restore measurements
    setMeasurements({
      roofArea: parseFloat(state.measurements.totalRoofArea) || 0,
      wallLinearFt: 0,
      wallHeight: 0,
      baseFlashingLF: parseFloat(state.measurements.baseFlashing) || 0,
    });
    // Restore custom prices
    Object.entries(state.customPrices).forEach(([id, price]) => {
      userEditedPrices.current.add(id);
      setCustomPrices((prev) => ({ ...prev, [id]: price }));
    });
    // Restore labor/equipment
    if (state.laborEquipment) {
      setLaborEquipment(state.laborEquipment);
    }
    // Restore penetrations & sheet metal flashing
    if (state.penetrationsState) {
      if (roofAdditionsRef.current) {
        roofAdditionsRef.current.setState(state.penetrationsState);
      } else {
        setRoofAdditionsInitialState(state.penetrationsState);
      }
    }
    // Restore wall measurements (v2)
    if (state.measurements.wallLinearFt) {
      setMeasurements((prev) => ({
        ...prev,
        wallLinearFt: parseFloat(state.measurements.wallLinearFt!) || 0,
        wallHeight: parseFloat(state.measurements.wallHeight ?? "0") || 0,
      }));
    }
    // Restore roof assembly configuration (v3)
    if (state.assemblyConfig) {
      setAssembly(state.assemblyConfig);
    }
    setLoadedEstimateId(savedEstimate.id);
    setLoadedEstimateName(savedEstimate.name);
    // Store breakdown state from DB if available
    if (savedEstimate.breakdownState) {
      setSavedBreakdownStateJson(savedEstimate.breakdownState);
    }
    toast.success(`Loaded estimate: "${savedEstimate.name}"`);
    window.history.replaceState({}, "", "/estimator/gaf-tpo");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedEstimate]);

  const getEstimateData = useCallback(() => {
    return serializeTPOState("gaf-tpo", {
      measurements: {
        totalRoofArea: String(measurements.roofArea),
        baseFlashing: String(measurements.baseFlashingLF),
        wallLinearFt: String(measurements.wallLinearFt),
        wallHeight: String(measurements.wallHeight),
      },
      customPrices,
      laborEquipment,
      assemblyConfig: assembly,
      penetrationsState: roofAdditionsRef.current?.getState(),
    });
  }, [measurements, customPrices, laborEquipment, assembly, penetrationEstimate]);

  const handleViewBreakdown = useCallback(() => {
    const breakdownData = serializeTPOBreakdown(
      estimate,
      laborEquipment,
      penetrationEstimate,
      "GAF EverGuard TPO System",
      "gaf-tpo",
      "emerald",
    );
    storeBreakdownData(breakdownData);
    // Store estimate context so breakdown page can save and navigate back
    storeEstimateContext({
      estimateId: loadedEstimateId,
      estimateName: loadedEstimateName,
      system: "gaf-tpo",
      systemLabel: "GAF EverGuard TPO",
      estimatorStateJson: getEstimateData(),
      grandTotal,
      roofArea: measurements.roofArea,
    });
    // If there's a saved breakdown state from DB, store it so the breakdown page can restore edits
    if (savedBreakdownStateJson) {
      const parsed = deserializeBreakdownState(savedBreakdownStateJson);
      if (parsed) storeBreakdownSaveState(parsed);
    }
    navigate("/breakdown");
  }, [estimate, laborEquipment, penetrationEstimate, navigate, loadedEstimateId, loadedEstimateName, getEstimateData, grandTotal, measurements.roofArea, savedBreakdownStateJson]);

  // Group line items by category
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

  const usedProductIds = useMemo(() => {
    const ids = new Set<string>();
    estimate.lineItems.forEach((item) => ids.add(item.product.id));
    return Array.from(ids);
  }, [estimate.lineItems]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header — GAF Red/Charcoal branding */}
      <div
        className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-red-950"
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
            className="inline-flex items-center gap-2 text-red-200 hover:text-foreground transition-colors text-sm mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Catalog
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-destructive/70" />
            </div>
            <div>
              <p className="text-destructive/70 text-xs font-medium tracking-wider uppercase">
                GAF Commercial
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-white font-display">
                EverGuard TPO Estimator
              </h1>
            </div>
          </div>
          <p className="text-slate-text text-sm max-w-2xl">
            Configure your roof assembly, enter measurements, and get a complete
            material order list with pricing for GAF EverGuard TPO single-ply
            membrane systems.
          </p>
        </div>
      </div>

      {/* Loaded estimate banner */}
      {loadedEstimateName && (
        <div className="bg-orange/10 border-b border-orange/30 py-2">
          <div className="container flex items-center justify-between text-sm">
            <span className="text-orange">
              <FolderOpen className="inline h-4 w-4 mr-1" />
              Loaded: <strong>{loadedEstimateName}</strong>
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-orange hover:text-amber-900"
              onClick={() => {
                setLoadedEstimateId(null);
                setLoadedEstimateName("");
              }}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Config + Measurements */}
          <div className="lg:col-span-5 space-y-6" data-print-hide>
            {/* Assembly Configuration */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Layers className="w-5 h-5 text-destructive" />
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
                    <SquareStack className="w-4 h-4 text-muted-foreground" />
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
                    <Shield className="w-4 h-4 text-muted-foreground" />
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
                      {GAF_VAPOR_BARRIERS.map((vb) => (
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
                      <Thermometer className="w-4 h-4 text-muted-foreground" />
                      Insulation (Polyiso)
                    </Label>
                    <div className="flex items-center gap-2">
                      {assembly.insulationEnabled &&
                        insulationSummary.totalThickness > 0 && (
                          <span className="text-xs font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                            {insulationSummary.totalThickness.toFixed(1)}" total
                            · R-{insulationSummary.totalRValue.toFixed(1)}
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
                        {/* Layer 1 */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-14 shrink-0">
                            Layer 1
                          </span>
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
                              <span className="text-xs text-muted-foreground w-14 shrink-0">
                                Layer {realIdx + 1}
                              </span>
                              <Select
                                value={layer.thickness}
                                onValueChange={(v) =>
                                  updateInsulationLayer(realIdx, v)
                                }
                              >
                                <SelectTrigger className="flex-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {INSULATION_THICKNESSES.map((ins) => (
                                    <SelectItem
                                      key={ins.value}
                                      value={ins.value}
                                    >
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
                    <Layers className="w-4 h-4 text-muted-foreground" />
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
                      {GAF_COVER_BOARDS.map((cb) => (
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
                    <Package className="w-4 h-4 text-muted-foreground" />
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
                      {GAF_MEMBRANE_THICKNESSES.map((m) => (
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
                    <Wrench className="w-4 h-4 text-muted-foreground" />
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
                      {GAF_ATTACHMENT_METHODS.map((am) => (
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
                        <p className="text-xs font-semibold uppercase tracking-wider text-orange flex items-center gap-1.5">
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
                              {GAF_INSULATION_SCREW_TYPES.map((st) => (
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
                              <span className="ml-2 text-[10px] font-medium text-orange bg-orange/10 px-1.5 py-0.5 rounded">
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
                              {GAF_INSULATION_SCREW_LENGTHS.map((sl) => (
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

                        <div className="border-t border-dashed border-border pt-3 mt-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-destructive mb-3">Membrane Fasteners</p>
                        </div>

                        {/* Membrane Screw Length */}
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">
                            Membrane Screw Length
                            {assembly.membraneFastenerLength === "auto" && (
                              <span className="ml-2 text-[10px] font-medium text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
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
                              {GAF_MEMBRANE_SCREW_LENGTHS.map((sl) => (
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
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Ruler className="w-5 h-5 text-destructive" />
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
                <div className="p-4 bg-muted/30 rounded-lg space-y-4">
                  <p className="text-sm font-medium text-foreground">
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
                      className="text-xs text-destructive font-medium"
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
            <Collapsible
              open={priceEditorOpen}
              onOpenChange={setPriceEditorOpen}
            >
              <Card className="border-border shadow-sm">
                <CollapsibleTrigger asChild>
                  <CardHeader className="pb-4 cursor-pointer hover:bg-muted/30 transition-colors">
                    <CardTitle className="flex items-center justify-between text-lg">
                      <span className="flex items-center gap-2">
                        <PencilLine className="w-5 h-5 text-destructive" />
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
                        const product = GAF_TPO_PRODUCTS[id];
                        if (!product) return null;
                        const currentPrice =
                          customPrices[id] ?? product.defaultPrice;
                        return (
                          <div
                            key={id}
                            className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0"
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
                                onChange={(e) =>
                                  updatePrice(id, e.target.value)
                                }
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

            {/* Labor & Equipment */}
            <TPOLaborEquipmentSection
              laborEquipment={laborEquipment}
              updateLaborItem={updateLaborItem}
              updateEquipmentItem={updateEquipmentItem}
              resetLaborEquipment={resetLaborEquipment}
              accentColor="emerald"
            />
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-7 space-y-6">
            {/* Roof Penetrations & Additions */}
            <div data-print-hide>
              <RoofAdditions
                ref={roofAdditionsRef}
                onEstimateChange={setPenetrationEstimate}
                accentColor="red"
                initialState={roofAdditionsInitialState}
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
                  <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-red-950 text-white border-0 shadow-lg">
                    <CardContent className="py-6">
                      <p className="text-destructive/70 text-xs font-semibold tracking-wider uppercase mb-1">
                        Total Project Estimate
                      </p>
                      <p className="text-4xl font-bold font-display tracking-tight">
                        {fmt(grandTotal)}
                      </p>
                      <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3 text-sm">
                        <span className="text-slate-text">
                          <Package className="w-3.5 h-3.5 inline mr-1" />
                          Materials: {fmt(estimate.totalMaterialCost)}
                        </span>
                        {laborCost > 0 && (
                          <span className="text-slate-text">
                            <HardHat className="w-3.5 h-3.5 inline mr-1" />
                            Labor: {fmt(laborCost)}
                          </span>
                        )}
                        {equipmentCost > 0 && (
                          <span className="text-slate-text">
                            <Wrench className="w-3.5 h-3.5 inline mr-1" />
                            Equipment: {fmt(equipmentCost)}
                          </span>
                        )}
                        {penetrationCost > 0 && (
                          <span className="text-destructive/70">
                            Penetrations: {fmt(penetrationCost)}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm">
                        <span className="text-red-200">
                          <DollarSign className="w-3.5 h-3.5 inline mr-1" />
                          {measurements.roofArea > 0
                            ? `${(grandTotal / measurements.roofArea).toFixed(2)} / sq ft`
                            : "—"}
                        </span>
                        <span className="text-slate-text">
                          <Ruler className="w-3.5 h-3.5 inline mr-1" />
                          {measurements.roofArea.toLocaleString()} sq ft roof
                        </span>
                      </div>
                      {/* Assembly Summary */}
                      <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-slate-text">
                        <span>
                          Deck:{" "}
                          {DECK_TYPES.find(
                            (d) => d.value === assembly.deckType
                          )?.label || "—"}
                        </span>
                        <span>
                          Insulation:{" "}
                          {assembly.insulationEnabled &&
                          insulationSummary.activeLayers.length > 0
                            ? `${insulationSummary.totalThickness.toFixed(1)}" Polyiso (${insulationSummary.activeLayers.length} layer${insulationSummary.activeLayers.length !== 1 ? "s" : ""}) · R-${insulationSummary.totalRValue.toFixed(1)}`
                            : "None"}
                        </span>
                        <span>
                          Membrane:{" "}
                          {GAF_MEMBRANE_THICKNESSES.find(
                            (m) => m.value === assembly.membraneThickness
                          )?.label || "—"}
                        </span>
                        <span>
                          Cover:{" "}
                          {GAF_COVER_BOARDS.find(
                            (c) => c.value === assembly.coverBoard
                          )?.label || "—"}
                        </span>
                        <span>
                          Attach:{" "}
                          {GAF_ATTACHMENT_METHODS.find(
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
              <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                {categoryOrder.map((category) => {
                  const items = groupedItems[category];
                  if (!items || items.length === 0) return null;

                  const isFastenersCategory =
                    category === "Fasteners & Plates";

                  return (
                    <Card
                      key={category}
                      className={`shadow-sm overflow-hidden ${
                        isFastenersCategory
                          ? "border-orange/30 ring-1 ring-amber-100"
                          : "border-border"
                      }`}
                    >
                      <CardHeader
                        className={`py-3 ${
                          isFastenersCategory ? "bg-orange/10" : "bg-muted/30"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <CardTitle
                            className={`text-sm font-semibold uppercase tracking-wider ${
                              isFastenersCategory
                                ? "text-orange"
                                : "text-foreground"
                            }`}
                          >
                            {category}
                          </CardTitle>
                          {isFastenersCategory && (
                            <span className="text-[10px] font-medium text-orange bg-orange/20 px-2 py-0.5 rounded-full">
                              {assembly.attachmentMethod ===
                              "mechanically-attached"
                                ? "Mechanically Attached"
                                : "Fully Adhered"}
                              {" · "}
                              {items
                                .reduce((s, it) => s + it.totalCost, 0)
                                .toLocaleString("en-US", {
                                  style: "currency",
                                  currency: "USD",
                                })}
                            </span>
                          )}
                        </div>
                        {isFastenersCategory && (
                          <p className="text-[10px] text-orange/80 mt-1">
                            Zone layout: Field{" "}
                            {(FIELD_ZONE_RATIO * 100).toFixed(0)}% · Perimeter{" "}
                            {(PERIMETER_ZONE_RATIO * 100).toFixed(0)}% · Corner{" "}
                            {(CORNER_ZONE_RATIO * 100).toFixed(0)}% — Screw
                            length auto-selected for{" "}
                            {getInsulationSummary(
                              assembly.insulationLayers
                            ).totalThickness.toFixed(1)}
                            " insulation assembly
                          </p>
                        )}
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border">
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
                                  className="border-b border-slate-50 hover:bg-muted/30/50 transition-colors"
                                >
                                  <td className="py-3 px-4">
                                    <p className="font-medium text-foreground">
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
                                  <td className="py-3 px-4 text-right font-semibold tabular-nums text-foreground">
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
                <Card className="border-destructive/30 bg-destructive/10/50">
                  <CardContent className="py-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Roofing Materials</span>
                        <span className="tabular-nums">{fmt(estimate.totalMaterialCost)}</span>
                      </div>
                      {penetrationCost > 0 && (
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Penetrations & Additions</span>
                          <span className="tabular-nums">{fmt(penetrationCost)}</span>
                        </div>
                      )}
                      {laborCost > 0 && (
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Labor</span>
                          <span className="tabular-nums">{fmt(laborCost)}</span>
                        </div>
                      )}
                      {equipmentCost > 0 && (
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Equipment</span>
                          <span className="tabular-nums">{fmt(equipmentCost)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-destructive/30">
                      <span className="text-lg font-semibold text-foreground">
                        Grand Total
                      </span>
                      <span className="text-2xl font-bold text-foreground tabular-nums">
                        {fmt(grandTotal)}
                      </span>
                    </div>
                    {measurements.roofArea > 0 && (
                      <p className="text-sm text-destructive mt-1">
                        {(
                          grandTotal / measurements.roofArea
                        ).toFixed(2)}{" "}
                        per sq ft (all-in)
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Save & View Full Breakdown Buttons */}
              <div className="flex flex-wrap justify-center gap-3 mt-4">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setSaveDialogOpen(true)}
                  className="gap-2"
                >
                  <Save className="w-5 h-5" />
                  {loadedEstimateId ? "Save / Update" : "Save Estimate"}
                </Button>
                <Button
                  size="lg"
                  onClick={handleViewBreakdown}
                  className="bg-success hover:bg-success/80 text-white gap-2"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  View Full Breakdown
                </Button>
              </div>
              </>
            ) : (
              <Card className="border-dashed border-2 border-border">
                <CardContent className="py-16 text-center">
                  <Ruler className="w-12 h-12 text-slate-text mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">
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

      <SaveEstimateDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        system="gaf-tpo"
        systemLabel="GAF EverGuard TPO"
        getEstimateData={getEstimateData}
        grandTotal={grandTotal}
        roofArea={measurements.roofArea}
        existingId={loadedEstimateId}
        existingName={loadedEstimateName}
        onSaved={(id, name) => {
          setLoadedEstimateId(id);
          setLoadedEstimateName(name);
        }}
      />

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6 bg-muted/30">
        <div className="container">
          <p className="text-xs text-muted-foreground text-center">
            GAF EverGuard TPO Estimator — Pricing based on industry research
            and may vary. All prices are editable. Consult your distributor for
            current pricing.
          </p>
        </div>
      </footer>
    </div>
  );
}
