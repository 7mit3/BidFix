/**
 * CostSummary — Total cost display with step-by-step breakdown
 * Design: Prominent total with category breakdowns
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp } from "lucide-react";
import { type EstimateResult, formatCurrency } from "@/lib/karnak-data";
import { motion, AnimatePresence } from "framer-motion";

interface CostSummaryProps {
  estimate: EstimateResult | null;
}

export function CostSummary({ estimate }: CostSummaryProps) {
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
            see a detailed material cost estimate.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group costs by application step
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

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="summary"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-2 border-karnak-red/20 shadow-md overflow-hidden">
          {/* Total cost header */}
          <div className="bg-gradient-to-r from-karnak-dark to-warm-800 px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-warm-400 text-sm font-medium uppercase tracking-wider mb-1">
                  Estimated Material Cost
                </p>
                <p className="text-white font-heading text-3xl sm:text-4xl font-bold font-mono-nums tracking-tight">
                  {formatCurrency(estimate.totalMaterialCost)}
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-karnak-red/20 flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-karnak-red-light" />
              </div>
            </div>
          </div>

          <CardHeader className="pb-3 pt-5">
            <CardTitle className="font-heading text-base font-semibold text-foreground">
              Cost by Application Step
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="space-y-3">
              {stepOrder.map((step) => {
                const cost = stepCosts[step] || 0;
                if (cost === 0) return null;
                const percentage =
                  estimate.totalMaterialCost > 0
                    ? (cost / estimate.totalMaterialCost) * 100
                    : 0;

                return (
                  <div key={step} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-foreground">
                        {step}
                      </span>
                      <span className="text-sm font-mono-nums font-semibold text-foreground">
                        {formatCurrency(cost)}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
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
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
