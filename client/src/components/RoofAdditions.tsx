/**
 * RoofAdditions — Universal Roof Penetrations & Additions Component
 *
 * Design: Collapsible card with categorized penetration types
 * and a Sheet Metal Flashing section with metal type / gauge selection.
 * Users add penetrations by quantity and flashing by linear feet,
 * and materials auto-calculate.
 * Integrates into any estimator via props.
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  PENETRATION_TYPES,
  PENETRATION_CATEGORIES,
  getPenetrationsByCategory,
  calculatePenetrationEstimate,
  formatLaborTime,
  type PenetrationLineItem,
  type PenetrationEstimate,
} from "@/lib/penetrations-data";
import {
  METAL_TYPES,
  FLASHING_PROFILES,
  calculateSheetMetalEstimate,
  getDefaultSheetMetalState,
  type SheetMetalFlashingState,
} from "@/lib/sheet-metal-flashing-data";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Wrench,
  CircleDot,
  Circle,
  Square,
  BoxSelect,
  Fan,
  ArrowDownCircle,
  ArrowRightFromLine,
  Sun,
  Cable,
  Flame,
  Radio,
  ArrowUp,
  RotateCcw,
  Clock,
  Package,
  Layers,
} from "lucide-react";

// Icon mapping for penetration types
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  CircleDot,
  Circle,
  Square,
  BoxSelect,
  Fan,
  ArrowDownCircle,
  ArrowRightFromLine,
  Sun,
  Cable,
  Flame,
  Radio,
  ArrowUp,
};

interface RoofAdditionsProps {
  onEstimateChange?: (estimate: PenetrationEstimate) => void;
  accentColor?: string; // tailwind color class e.g. "blue" "red"
}

export default function RoofAdditions({
  onEstimateChange,
  accentColor = "blue",
}: RoofAdditionsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [lineItems, setLineItems] = useState<Record<string, number>>({});
  const [showMaterials, setShowMaterials] = useState(false);

  // Sheet Metal Flashing state
  const [sheetMetalState, setSheetMetalState] = useState<SheetMetalFlashingState>(
    getDefaultSheetMetalState()
  );
  const [sheetMetalExpanded, setSheetMetalExpanded] = useState(true);

  const grouped = useMemo(() => getPenetrationsByCategory(), []);

  const activeItems: PenetrationLineItem[] = useMemo(() => {
    return Object.entries(lineItems)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const pen = PENETRATION_TYPES.find((p) => p.id === id);
        return {
          penetrationId: id,
          name: pen?.name ?? id,
          category: pen?.category ?? "",
          quantity: qty,
        };
      });
  }, [lineItems]);

  const penetrationEstimate = useMemo(() => {
    return calculatePenetrationEstimate(activeItems);
  }, [activeItems]);

  const sheetMetalEstimate = useMemo(() => {
    return calculateSheetMetalEstimate(sheetMetalState);
  }, [sheetMetalState]);

  // Combine penetration + sheet metal into a single estimate for the parent
  const combinedEstimate: PenetrationEstimate = useMemo(() => {
    return {
      ...penetrationEstimate,
      totalMaterialCost:
        penetrationEstimate.totalMaterialCost + sheetMetalEstimate.totalMaterialCost,
      totalLaborMinutes:
        penetrationEstimate.totalLaborMinutes + sheetMetalEstimate.totalLaborMinutes,
      sheetMetalItems: sheetMetalEstimate.lineItems.map((item) => ({
        flashingId: item.flashingId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalCost: item.totalCost,
      })),
      sheetMetalCost: sheetMetalEstimate.totalMaterialCost,
      sheetMetalLaborMinutes: sheetMetalEstimate.totalLaborMinutes,
      sheetMetalType: sheetMetalEstimate.metalType,
      sheetMetalGauge: sheetMetalEstimate.gauge,
    };
  }, [penetrationEstimate, sheetMetalEstimate]);

  // Notify parent when combined estimate changes
  useEffect(() => {
    onEstimateChange?.(combinedEstimate);
  }, [combinedEstimate, onEstimateChange]);

  const updateQuantity = useCallback((id: string, delta: number) => {
    setLineItems((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: next };
    });
  }, []);

  const setQuantity = useCallback((id: string, value: number) => {
    setLineItems((prev) => {
      const next = Math.max(0, value);
      if (next === 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: next };
    });
  }, []);

  // Sheet metal flashing helpers
  const updateFlashingQuantity = useCallback((flashingId: string, delta: number) => {
    setSheetMetalState((prev) => {
      const current = prev.lineItems[flashingId] || 0;
      const next = Math.max(0, current + delta);
      const newItems = { ...prev.lineItems };
      if (next === 0) {
        delete newItems[flashingId];
      } else {
        newItems[flashingId] = next;
      }
      return { ...prev, lineItems: newItems };
    });
  }, []);

  const setFlashingQuantity = useCallback((flashingId: string, value: number) => {
    setSheetMetalState((prev) => {
      const next = Math.max(0, value);
      const newItems = { ...prev.lineItems };
      if (next === 0) {
        delete newItems[flashingId];
      } else {
        newItems[flashingId] = next;
      }
      return { ...prev, lineItems: newItems };
    });
  }, []);

  const setMetalType = useCallback((metalTypeId: string) => {
    setSheetMetalState((prev) => {
      const metal = METAL_TYPES.find((m) => m.id === metalTypeId);
      return {
        ...prev,
        metalTypeId,
        gaugeId: metal?.defaultGaugeId ?? prev.gaugeId,
      };
    });
  }, []);

  const setGauge = useCallback((gaugeId: string) => {
    setSheetMetalState((prev) => ({ ...prev, gaugeId }));
  }, []);

  const resetAll = useCallback(() => {
    setLineItems({});
    setSheetMetalState(getDefaultSheetMetalState());
  }, []);

  const totalPenetrations = activeItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalFlashingLF = Object.values(sheetMetalState.lineItems).reduce(
    (sum, lf) => sum + lf,
    0
  );
  const totalItems = totalPenetrations + (totalFlashingLF > 0 ? 1 : 0);

  const selectedMetal = METAL_TYPES.find((m) => m.id === sheetMetalState.metalTypeId);
  const selectedGauge = selectedMetal?.gauges.find((g) => g.id === sheetMetalState.gaugeId);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 bg-${accentColor}-50 rounded-lg`}>
            <Wrench className={`w-5 h-5 text-${accentColor}-600`} />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 text-lg">
              Roof Penetrations & Additions
            </h3>
            <p className="text-sm text-gray-500">
              {totalPenetrations > 0 || totalFlashingLF > 0
                ? `${totalPenetrations > 0 ? `${totalPenetrations} penetration${totalPenetrations !== 1 ? "s" : ""}` : ""}${totalPenetrations > 0 && totalFlashingLF > 0 ? " · " : ""}${totalFlashingLF > 0 ? `${totalFlashingLF.toLocaleString()} LF flashing` : ""} · $${combinedEstimate.totalMaterialCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                : "Add pipe flashings, curbs, fans, drains, sheet metal, and more"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(totalPenetrations > 0 || totalFlashingLF > 0) && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                resetAll();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  resetAll();
                }
              }}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          {/* Penetration Categories */}
          <div className="p-5 space-y-6">
            {PENETRATION_CATEGORIES.map((category) => {
              const items = grouped[category];
              if (!items) return null;

              return (
                <div key={category}>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                    {category}
                  </h4>
                  <div className="space-y-2">
                    {items.map((pen) => {
                      const qty = lineItems[pen.id] || 0;
                      const IconComp = ICON_MAP[pen.icon] || CircleDot;
                      const isActive = qty > 0;

                      return (
                        <div
                          key={pen.id}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                            isActive
                              ? `border-${accentColor}-200 bg-${accentColor}-50/30`
                              : "border-gray-100 bg-gray-50/50 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <IconComp
                              className={`w-4 h-4 shrink-0 ${
                                isActive ? `text-${accentColor}-600` : "text-gray-400"
                              }`}
                            />
                            <div className="min-w-0">
                              <p
                                className={`text-sm font-medium truncate ${
                                  isActive ? "text-gray-900" : "text-gray-700"
                                }`}
                              >
                                {pen.name}
                              </p>
                              <p className="text-xs text-gray-400 truncate">
                                {pen.description}
                                {pen.sizeLabel && ` · ${pen.sizeLabel}`}
                              </p>
                            </div>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-1 shrink-0 ml-3">
                            <button
                              onClick={() => updateQuantity(pen.id, -1)}
                              disabled={qty === 0}
                              className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min={0}
                              value={qty || ""}
                              placeholder="0"
                              onChange={(e) =>
                                setQuantity(pen.id, parseInt(e.target.value) || 0)
                              }
                              className={`w-12 h-7 text-center text-sm font-medium border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-${accentColor}-400 ${
                                isActive
                                  ? `border-${accentColor}-300 text-gray-900`
                                  : "border-gray-200 text-gray-400"
                              }`}
                            />
                            <button
                              onClick={() => updateQuantity(pen.id, 1)}
                              className={`w-7 h-7 flex items-center justify-center rounded-md border bg-white hover:bg-gray-100 transition-colors ${
                                isActive
                                  ? `border-${accentColor}-300 text-${accentColor}-600`
                                  : "border-gray-200 text-gray-500"
                              }`}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* ── Sheet Metal Flashing Section ──────────────────── */}
            <div>
              <button
                onClick={() => setSheetMetalExpanded(!sheetMetalExpanded)}
                className="w-full flex items-center justify-between mb-3"
              >
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Sheet Metal Flashing
                  </h4>
                  {totalFlashingLF > 0 && (
                    <span className={`text-xs font-medium text-${accentColor}-600 bg-${accentColor}-50 px-2 py-0.5 rounded-full`}>
                      {totalFlashingLF.toLocaleString()} LF · ${sheetMetalEstimate.totalMaterialCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
                {sheetMetalExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {sheetMetalExpanded && (
                <div className="space-y-4">
                  {/* Metal Type & Gauge Selectors */}
                  <div className={`p-4 rounded-lg border border-${accentColor}-100 bg-${accentColor}-50/20`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Layers className={`w-4 h-4 text-${accentColor}-600`} />
                      <span className="text-sm font-semibold text-gray-800">Metal Selection</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Metal Type */}
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Metal Type
                        </label>
                        <select
                          value={sheetMetalState.metalTypeId}
                          onChange={(e) => setMetalType(e.target.value)}
                          className="w-full h-9 text-sm border border-gray-200 rounded-md bg-white px-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        >
                          {METAL_TYPES.map((metal) => (
                            <option key={metal.id} value={metal.id}>
                              {metal.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {/* Gauge / Thickness */}
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          {sheetMetalState.metalTypeId === "copper"
                            ? "Weight"
                            : sheetMetalState.metalTypeId === "aluminum"
                            ? "Thickness"
                            : "Gauge"}
                        </label>
                        <select
                          value={sheetMetalState.gaugeId}
                          onChange={(e) => setGauge(e.target.value)}
                          className="w-full h-9 text-sm border border-gray-200 rounded-md bg-white px-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        >
                          {selectedMetal?.gauges.map((gauge) => (
                            <option key={gauge.id} value={gauge.id}>
                              {gauge.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {selectedMetal?.name} {selectedGauge?.label} — Base: ${selectedMetal?.basePricePerLF.toFixed(2)}/LF
                      {selectedGauge && selectedGauge.priceMultiplier !== 1
                        ? ` × ${selectedGauge.priceMultiplier.toFixed(2)} gauge factor`
                        : ""}
                    </p>
                  </div>

                  {/* Flashing Profile Items */}
                  <div className="space-y-2">
                    {FLASHING_PROFILES.map((profile) => {
                      const qty = sheetMetalState.lineItems[profile.id] || 0;
                      const isActive = qty > 0;

                      return (
                        <div
                          key={profile.id}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                            isActive
                              ? `border-${accentColor}-200 bg-${accentColor}-50/30`
                              : "border-gray-100 bg-gray-50/50 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <Layers
                              className={`w-4 h-4 shrink-0 ${
                                isActive ? `text-${accentColor}-600` : "text-gray-400"
                              }`}
                            />
                            <div className="min-w-0">
                              <p
                                className={`text-sm font-medium truncate ${
                                  isActive ? "text-gray-900" : "text-gray-700"
                                }`}
                              >
                                {profile.name}
                              </p>
                              <p className="text-xs text-gray-400 truncate">
                                {profile.description}
                              </p>
                            </div>
                          </div>

                          {/* LF Input Controls */}
                          <div className="flex items-center gap-1 shrink-0 ml-3">
                            <button
                              onClick={() => updateFlashingQuantity(profile.id, -10)}
                              disabled={qty === 0}
                              className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <div className="relative">
                              <input
                                type="number"
                                min={0}
                                value={qty || ""}
                                placeholder="0"
                                onChange={(e) =>
                                  setFlashingQuantity(
                                    profile.id,
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className={`w-16 h-7 text-center text-sm font-medium border rounded-md bg-white pr-6 focus:outline-none focus:ring-1 focus:ring-${accentColor}-400 ${
                                  isActive
                                    ? `border-${accentColor}-300 text-gray-900`
                                    : "border-gray-200 text-gray-400"
                                }`}
                              />
                              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">
                                LF
                              </span>
                            </div>
                            <button
                              onClick={() => updateFlashingQuantity(profile.id, 10)}
                              className={`w-7 h-7 flex items-center justify-center rounded-md border bg-white hover:bg-gray-100 transition-colors ${
                                isActive
                                  ? `border-${accentColor}-300 text-${accentColor}-600`
                                  : "border-gray-200 text-gray-500"
                              }`}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Summary & Materials */}
          {(totalPenetrations > 0 || totalFlashingLF > 0) && (
            <div className="border-t border-gray-200 bg-gray-50">
              {/* Quick Summary */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">
                    Penetrations & Flashing Summary
                  </h4>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="flex items-center gap-1 text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      Est. {formatLaborTime(combinedEstimate.totalLaborMinutes)}
                    </span>
                    <span className={`font-bold text-${accentColor}-700`}>
                      ${combinedEstimate.totalMaterialCost.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>

                {/* Active Penetrations List */}
                {totalPenetrations > 0 && (
                  <div className="space-y-1.5 mb-3">
                    {activeItems.map((item) => {
                      const pen = PENETRATION_TYPES.find(
                        (p) => p.id === item.penetrationId
                      );
                      const itemCost = pen
                        ? pen.materials.reduce(
                            (sum, m) =>
                              sum +
                              Math.ceil(m.qtyPerUnit * item.quantity) *
                                m.unitPrice,
                            0
                          )
                        : 0;

                      return (
                        <div
                          key={item.penetrationId}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-600">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="text-gray-900 font-medium">
                            ${itemCost.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Active Sheet Metal Flashing List */}
                {totalFlashingLF > 0 && (
                  <div className="space-y-1.5 mb-3">
                    {totalPenetrations > 0 && (
                      <div className="border-t border-gray-200 pt-2 mt-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                          Sheet Metal Flashing ({selectedMetal?.name} {selectedGauge?.label})
                        </p>
                      </div>
                    )}
                    {!totalPenetrations && (
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                        Sheet Metal Flashing ({selectedMetal?.name} {selectedGauge?.label})
                      </p>
                    )}
                    {sheetMetalEstimate.lineItems.map((item) => (
                      <div
                        key={item.flashingId}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-600">
                          {item.quantity.toLocaleString()} LF {item.name}
                        </span>
                        <span className="text-gray-900 font-medium">
                          ${item.totalCost.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Toggle Materials Detail */}
                <button
                  onClick={() => setShowMaterials(!showMaterials)}
                  className={`flex items-center gap-2 text-sm font-medium text-${accentColor}-600 hover:text-${accentColor}-800 transition-colors`}
                >
                  <Package className="w-4 h-4" />
                  {showMaterials
                    ? "Hide Material Breakdown"
                    : "Show Material Breakdown"}
                  {showMaterials ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Detailed Materials Table */}
              {showMaterials && (
                <div className="border-t border-gray-200 px-5 pb-5">
                  <div className="overflow-x-auto mt-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wider text-gray-400 border-b border-gray-200">
                          <th className="pb-2 pr-4">Material</th>
                          <th className="pb-2 pr-4 text-right">Qty</th>
                          <th className="pb-2 pr-4">Unit</th>
                          <th className="pb-2 pr-4 text-right">Unit Price</th>
                          <th className="pb-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {/* Penetration materials */}
                        {penetrationEstimate.materials.map((mat, i) => (
                          <tr key={`pen-${i}`} className="text-gray-700">
                            <td className="py-2 pr-4">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {mat.materialName}
                                </p>
                                <p className="text-xs text-gray-400">
                                  For: {mat.fromPenetration}
                                </p>
                              </div>
                            </td>
                            <td className="py-2 pr-4 text-right font-medium">
                              {mat.quantity}
                            </td>
                            <td className="py-2 pr-4 text-gray-500">
                              {mat.unit}
                            </td>
                            <td className="py-2 pr-4 text-right">
                              ${mat.unitPrice.toFixed(2)}
                            </td>
                            <td className="py-2 text-right font-medium">
                              ${mat.totalPrice.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                        ))}
                        {/* Sheet metal flashing materials */}
                        {sheetMetalEstimate.lineItems.length > 0 && (
                          <tr>
                            <td colSpan={5} className="pt-3 pb-1">
                              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                Sheet Metal Flashing — {selectedMetal?.name} {selectedGauge?.label}
                              </p>
                            </td>
                          </tr>
                        )}
                        {sheetMetalEstimate.lineItems.map((item, i) => (
                          <tr key={`sm-${i}`} className="text-gray-700">
                            <td className="py-2 pr-4">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {item.name}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {selectedMetal?.name} {selectedGauge?.label}
                                </p>
                              </div>
                            </td>
                            <td className="py-2 pr-4 text-right font-medium">
                              {item.quantity.toLocaleString()}
                            </td>
                            <td className="py-2 pr-4 text-gray-500">LF</td>
                            <td className="py-2 pr-4 text-right">
                              ${item.unitPrice.toFixed(2)}
                            </td>
                            <td className="py-2 text-right font-medium">
                              ${item.totalCost.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-300">
                          <td
                            colSpan={4}
                            className="pt-3 font-bold text-gray-900"
                          >
                            Penetrations & Flashing Total
                          </td>
                          <td className={`pt-3 text-right font-bold text-${accentColor}-700`}>
                            ${combinedEstimate.totalMaterialCost.toLocaleString(
                              "en-US",
                              { minimumFractionDigits: 2 }
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
