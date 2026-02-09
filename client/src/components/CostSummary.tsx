/**
 * CostSummary — Total project cost with material, labor, and equipment breakdown
 * Design: Prominent grand total with three-category breakdown bars
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Package, HardHat, Wrench, Ruler } from "lucide-react";
import { type EstimateResult, formatCurrency } from "@/lib/karnak-data";
import type { LaborEquipmentTotals } from "@/lib/labor-equipment-data";
import { motion, AnimatePresence } from "framer-motion";

interface CostSummaryProps {
  estimate: EstimateResult | null;
  laborEquipmentTotals: LaborEquipmentTotals | null;
  projectTotal: number;
}

export function CostSummary({
  estimate,
  laborEquipmentTotals,
  projectTotal,
}: CostSummaryProps) {
  if (!estimate) {
    return (
      <Card className="border-2 border-dashed border-border/60 shadow-none">
        <CardContent className="py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <DollarSign className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
            Enter Measurements to Begin
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Input your roof square footage and seam measurements on the left to
            see a detailed project cost estimate.
          </p>
        </CardContent>
      </Card>
    );
  }

  const materialCost = estimate.totalMaterialCost;
  const laborCost = laborEquipmentTotals?.laborTotal ?? 0;
  const equipmentCost = laborEquipmentTotals?.equipmentTotal ?? 0;
  const sqft = estimate.inputs.squareFootage;
  const pricePerSqFt = sqft > 0 ? projectTotal / sqft : 0;

  // Group material costs by application step
  const stepCosts = estimate.lineItems.reduce(
    (acc, item) => {
      const step = item.product.step;
      if (!acc[step]) acc[step] = 0;
      acc[step] += item.totalCost;
      return acc;
    },
    {} as Record<string, number>
  );

  const stepOrder = [
    "Preparation",
    "Primer",
    "Horizontal Seam Sealing",
    "Vertical Seam Sealing",
    "Base Coat",
    "Finish Coat",
  ];

  const stepColors: Record<string, string> = {
    Preparation: "bg-warm-400",
    Primer: "bg-blue-500",
    "Horizontal Seam Sealing": "bg-amber-500",
    "Vertical Seam Sealing": "bg-orange-500",
    "Base Coat": "bg-emerald-500",
    "Finish Coat": "bg-karnak-red",
  };

  // Category bar widths (proportional to project total)
  const catBarMax = projectTotal > 0 ? projectTotal : 1;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="summary"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-2 border-karnak-red/20 shadow-md overflow-hidden">
          {/* Grand total header */}
          <div className="bg-gradient-to-r from-karnak-dark to-warm-800 px-6 py-6">
            <p className="text-warm-400 text-xs font-medium uppercase tracking-wider mb-1">
              Total Project Estimate
            </p>
            <p className="text-white font-heading text-3xl sm:text-4xl font-bold font-mono-nums tracking-tight">
              {formatCurrency(projectTotal)}
            </p>

            {/* Three-category summary row */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-warm-300" />
                <span className="text-warm-300 text-xs uppercase tracking-wide">
                  Materials
                </span>
                <span className="text-white font-mono-nums text-sm font-semibold">
                  {formatCurrency(materialCost)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <HardHat className="w-4 h-4 text-warm-300" />
                <span className="text-warm-300 text-xs uppercase tracking-wide">
                  Labor
                </span>
                <span className="text-white font-mono-nums text-sm font-semibold">
                  {formatCurrency(laborCost)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-warm-300" />
                <span className="text-warm-300 text-xs uppercase tracking-wide">
                  Equipment
                </span>
                <span className="text-white font-mono-nums text-sm font-semibold">
                  {formatCurrency(equipmentCost)}
                </span>
              </div>
            </div>

            {/* Price per square foot */}
            {sqft > 0 && (
              <div className="mt-4 pt-4 border-t border-white/15 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                  <Ruler className="w-4 h-4 text-warm-300" />
                </div>
                <div>
                  <p className="text-warm-400 text-xs uppercase tracking-wide">
                    Price per Square Foot
                  </p>
                  <p className="text-white font-heading text-xl font-bold font-mono-nums">
                    {formatCurrency(pricePerSqFt)}
                    <span className="text-warm-400 text-sm font-normal ml-1">
                      / sq. ft.
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Category proportion bar */}
          <div className="h-2 flex">
            <motion.div
              className="bg-karnak-red h-full"
              initial={{ width: 0 }}
              animate={{
                width: `${(materialCost / catBarMax) * 100}%`,
              }}
              transition={{ duration: 0.5 }}
            />
            <motion.div
              className="bg-blue-500 h-full"
              initial={{ width: 0 }}
              animate={{
                width: `${(laborCost / catBarMax) * 100}%`,
              }}
              transition={{ duration: 0.5, delay: 0.1 }}
            />
            <motion.div
              className="bg-amber-500 h-full"
              initial={{ width: 0 }}
              animate={{
                width: `${(equipmentCost / catBarMax) * 100}%`,
              }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
          </div>

          {/* Material breakdown */}
          <CardHeader className="pb-3 pt-5">
            <CardTitle className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
              <Package className="w-4 h-4 text-karnak-red" />
              Material Cost by Step
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-2.5">
              {stepOrder.map((step) => {
                const cost = stepCosts[step] || 0;
                if (cost === 0) return null;
                const percentage =
                  materialCost > 0 ? (cost / materialCost) * 100 : 0;

                return (
                  <div key={step}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-foreground">{step}</span>
                      <span className="text-sm font-mono-nums font-semibold text-foreground">
                        {formatCurrency(cost)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${stepColors[step] || "bg-warm-500"}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>

          {/* Labor breakdown */}
          {laborEquipmentTotals &&
            laborEquipmentTotals.laborBreakdown.length > 0 && (
              <>
                <Separator />
                <CardHeader className="pb-3 pt-4">
                  <CardTitle className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
                    <HardHat className="w-4 h-4 text-blue-500" />
                    Labor Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="space-y-2">
                    {laborEquipmentTotals.laborBreakdown.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <span className="text-sm text-foreground">
                            {item.label}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {item.detail}
                          </span>
                        </div>
                        <span className="text-sm font-mono-nums font-semibold text-foreground">
                          {formatCurrency(item.cost)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </>
            )}

          {/* Equipment breakdown */}
          {laborEquipmentTotals &&
            laborEquipmentTotals.equipmentBreakdown.length > 0 && (
              <>
                <Separator />
                <CardHeader className="pb-3 pt-4">
                  <CardTitle className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-amber-500" />
                    Equipment Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-6">
                  <div className="space-y-2">
                    {laborEquipmentTotals.equipmentBreakdown.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <span className="text-sm text-foreground">
                            {item.label}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {item.detail}
                          </span>
                        </div>
                        <span className="text-sm font-mono-nums font-semibold text-foreground">
                          {formatCurrency(item.cost)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </>
            )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
