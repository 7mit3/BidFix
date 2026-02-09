/**
 * Karnak Metal Kynar Estimator — Home Page
 *
 * Design: BidFix AI Dark Theme (RooFix-aligned)
 * - Dark navy with cyan accent
 * - Card-based sections with generous padding
 * - Reactive real-time calculations
 * - Progressive disclosure: Input → Summary → Detail
 */

import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { useEstimator } from "@/hooks/useEstimator";
import { HeroSection } from "@/components/HeroSection";
import { InputSection } from "@/components/InputSection";
import { CostSummary } from "@/components/CostSummary";
import { OrderList } from "@/components/OrderList";
import { PricingEditor } from "@/components/PricingEditor";
import { LaborEquipmentSection } from "@/components/LaborEquipmentSection";
import { SystemInfo } from "@/components/SystemInfo";
import { Footer } from "@/components/Footer";
import RoofAdditions, { type RoofAdditionsHandle } from "@/components/RoofAdditions";
import { type PenetrationEstimate } from "@/lib/penetrations-data";
import { SaveEstimateDialog } from "@/components/SaveEstimateDialog";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Save, FolderOpen } from "lucide-react";
import { storeBreakdownData, storeEstimateContext, storeBreakdownSaveState, deserializeBreakdownState } from "@/lib/estimate-breakdown";
import { serializeKarnakBreakdown } from "@/lib/breakdown-serializers";
import {
  serializeKarnakState,
  deserializeKarnakState,
} from "@/lib/estimate-state-serializers";
import { toast } from "sonner";

export default function Home() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const estimator = useEstimator();
  const [penetrationEstimate, setPenetrationEstimate] = useState<PenetrationEstimate | null>(null);
  const penetrationCost = penetrationEstimate?.totalMaterialCost ?? 0;
  const roofAdditionsRef = useRef<RoofAdditionsHandle>(null);
  const [roofAdditionsInitialState, setRoofAdditionsInitialState] = useState<
    { lineItems: Record<string, number>; sheetMetal: import("@/lib/sheet-metal-flashing-data").SheetMetalFlashingState } | undefined
  >(undefined);

  // Save dialog state
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadedEstimateId, setLoadedEstimateId] = useState<number | null>(null);
  const [loadedEstimateName, setLoadedEstimateName] = useState<string>("");
  const [savedBreakdownStateJson, setSavedBreakdownStateJson] = useState<string | null>(null);

  // Load estimate from URL param
  const loadEstimateId = new URLSearchParams(searchString).get("loadEstimate");
  const { data: savedEstimate } = trpc.estimates.get.useQuery(
    { id: Number(loadEstimateId) },
    { enabled: !!loadEstimateId },
  );

  // Apply loaded estimate data
  useEffect(() => {
    if (!savedEstimate) return;
    const state = deserializeKarnakState(savedEstimate.data);
    if (!state) {
      toast.error("Could not load this estimate — incompatible format.");
      return;
    }

    // Restore inputs
    estimator.setSquareFootage(state.squareFootage);
    estimator.setVerticalSeamsLF(state.verticalSeamsLF);
    estimator.setHorizontalSeamsLF(state.horizontalSeamsLF);

    // Restore custom prices
    Object.entries(state.customPrices).forEach(([id, price]) => {
      estimator.updatePrice(id, price);
    });

    // Restore labor/equipment
    if (state.laborEquipment) {
      state.laborEquipment.laborItems.forEach((item) => {
        estimator.updateLaborItem(item.id, "rate", item.rate);
        estimator.updateLaborItem(item.id, "quantity", item.quantity);
        estimator.updateLaborItem(item.id, "enabled", item.enabled);
      });
      state.laborEquipment.equipmentItems.forEach((item) => {
        estimator.updateEquipmentItem(item.id, "rate", item.rate);
        estimator.updateEquipmentItem(item.id, "quantity", item.quantity);
        estimator.updateEquipmentItem(item.id, "enabled", item.enabled);
      });
    }

    // Restore penetrations & sheet metal flashing
    if (state.penetrationsState) {
      if (roofAdditionsRef.current) {
        roofAdditionsRef.current.setState(state.penetrationsState);
      } else {
        // Component not mounted yet — set initial state for first render
        setRoofAdditionsInitialState(state.penetrationsState);
      }
    }

    setLoadedEstimateId(savedEstimate.id);
    setLoadedEstimateName(savedEstimate.name);
    // Store breakdown state from DB if available
    if (savedEstimate.breakdownState) {
      setSavedBreakdownStateJson(savedEstimate.breakdownState);
    }
    toast.success(`Loaded estimate: "${savedEstimate.name}"`);

    // Clean URL
    window.history.replaceState({}, "", "/estimator/karnak-metal-kynar");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedEstimate]);

  const getEstimateData = useCallback(() => {
    return serializeKarnakState({
      squareFootage: estimator.squareFootage,
      verticalSeamsLF: estimator.verticalSeamsLF,
      horizontalSeamsLF: estimator.horizontalSeamsLF,
      customPrices: estimator.customPrices,
      laborEquipment: estimator.laborEquipment,
      penetrationsState: roofAdditionsRef.current?.getState(),
    });
  }, [
    estimator.squareFootage,
    estimator.verticalSeamsLF,
    estimator.horizontalSeamsLF,
    estimator.customPrices,
    estimator.laborEquipment,
    penetrationEstimate,
  ]);

  const handleViewBreakdown = useCallback(() => {
    if (!estimator.estimate) return;
    const breakdownData = serializeKarnakBreakdown(
      estimator.estimate,
      estimator.laborEquipment,
      penetrationEstimate,
    );
    storeBreakdownData(breakdownData);
    // Store estimate context so breakdown page can save and navigate back
    storeEstimateContext({
      estimateId: loadedEstimateId,
      estimateName: loadedEstimateName,
      system: "karnak-metal-kynar",
      systemLabel: "Karnak Metal Kynar",
      estimatorStateJson: getEstimateData(),
      grandTotal: estimator.projectTotal,
      roofArea: Number(estimator.squareFootage) || 0,
    });
    // If there's a saved breakdown state from DB, store it so the breakdown page can restore edits
    if (savedBreakdownStateJson) {
      const parsed = deserializeBreakdownState(savedBreakdownStateJson);
      if (parsed) storeBreakdownSaveState(parsed);
    }
    navigate("/breakdown");
  }, [estimator.estimate, estimator.laborEquipment, penetrationEstimate, navigate, loadedEstimateId, loadedEstimateName, getEstimateData, estimator.projectTotal, estimator.squareFootage, savedBreakdownStateJson]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HeroSection />

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

      <main className="flex-1 container py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Inputs + Labor/Equipment + Pricing */}
          <div className="lg:col-span-5 space-y-6" data-print-hide>
            <InputSection
              squareFootage={estimator.squareFootage}
              setSquareFootage={estimator.setSquareFootage}
              verticalSeamsLF={estimator.verticalSeamsLF}
              setVerticalSeamsLF={estimator.setVerticalSeamsLF}
              horizontalSeamsLF={estimator.horizontalSeamsLF}
              setHorizontalSeamsLF={estimator.setHorizontalSeamsLF}
              onClear={estimator.clearAll}
              hasInputs={estimator.hasInputs}
            />
            <LaborEquipmentSection
              laborEquipment={estimator.laborEquipment}
              updateLaborItem={estimator.updateLaborItem}
              updateEquipmentItem={estimator.updateEquipmentItem}
              resetLaborEquipment={estimator.resetLaborEquipment}
            />
            <PricingEditor
              customPrices={estimator.customPrices}
              updatePrice={estimator.updatePrice}
              resetPrices={estimator.resetPrices}
            />
            <RoofAdditions
              ref={roofAdditionsRef}
              onEstimateChange={setPenetrationEstimate}
              accentColor="red"
              initialState={roofAdditionsInitialState}
            />
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-7 space-y-6">
            <CostSummary
              estimate={estimator.estimate}
              laborEquipmentTotals={estimator.laborEquipmentTotals}
              projectTotal={estimator.projectTotal}
            />
            <OrderList
              estimate={estimator.estimate}
              laborEquipmentTotals={estimator.laborEquipmentTotals}
              projectTotal={estimator.projectTotal}
            />
            {estimator.estimate && (
              <div className="flex flex-wrap justify-center gap-3">
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
                  className="bg-cyan hover:bg-cyan/90 text-white gap-2"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  View Full Breakdown
                </Button>
              </div>
            )}
          </div>
        </div>

        <SystemInfo />
      </main>

      <Footer />

      <SaveEstimateDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        system="karnak-metal-kynar"
        systemLabel="Karnak Metal Kynar"
        getEstimateData={getEstimateData}
        grandTotal={estimator.projectTotal}
        roofArea={parseFloat(estimator.squareFootage) || 0}
        existingId={loadedEstimateId}
        existingName={loadedEstimateName}
        onSaved={(id, name) => {
          setLoadedEstimateId(id);
          setLoadedEstimateName(name);
        }}
      />
    </div>
  );
}
